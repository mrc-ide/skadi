import { Accessor, createSignal } from "solid-js";
import { graphConfigKeys } from "../../schemas/html/schema";
import { GraphConfig, GraphHtmlMetadata } from "../../schemas/html/types";
import { Params } from "../../schemas/json/types";
import { objAssignIfTruthy, objFilter, objKeys } from "../../utils";
import { Fixed, PlotData } from "../types";
import { defaultRange, getAllData } from "./data";
import { Range, ReadOnly, Values } from "../../utils/types";

type GraphKey = keyof GraphConfig;

export class GraphConfigClass {
  private config: GraphConfig;
  private mutableKeys: GraphKey[];

  constructor(
    fixed: Fixed,
    data: PlotData,
    graphHtmlMetadata: GraphHtmlMetadata,
  ) {
    this.config = objAssignIfTruthy(
      graphConfigKeys, graphHtmlMetadata.config,
      {
        vars: fixed.json.model.metadata.variables.map(v => v.name),
        xrange: data.extents.x,
        yrange: data.extents.y,
        ylog: false,
        ylock: false,
        xlock: false,
      }
    );

    const fixedKeys: GraphKey[] = [];
    if (this.config.xlock) fixedKeys.push("xrange");
    if (this.config.ylock) fixedKeys.push("yrange");
    this.mutableKeys = graphConfigKeys.filter(k => !fixedKeys.includes(k))
  };

  get = () => this.config as ReadOnly<GraphConfig>;

  set = (changedProps: Partial<GraphConfig>) => {
    const propsToSync = objFilter(
      changedProps,
      k => this.mutableKeys.includes(k)
    );
    this.config = {
      ...this.config,
      ...propsToSync,
    };
  };
};

export type GraphState = {
  id: string,
  type: GraphHtmlMetadata["type"],
  config: GraphConfigClass,
  data: PlotData,
  signals: {
    fullRerender: { get: Accessor<boolean>, trigger: () => void },
    rangeUpdated: { get: Accessor<boolean>, trigger: () => void },
  },
}

type SetGraphTypeToSyncSatisfies = Record<string, {
  syncKeys: GraphKey[],
  signal: keyof GraphState["signals"]
}>;
const setGraphTypeToSync = {
  range: {
    syncKeys: ["xrange", "yrange"],
    signal: "rangeUpdated",
  },
  log: {
    syncKeys: ["ylog"],
    signal: "fullRerender",
  },
} as const satisfies SetGraphTypeToSyncSatisfies;
type SetGraphTypeToSync = typeof setGraphTypeToSync;

export const syncableKeys = objKeys(setGraphTypeToSync)
  .flatMap(k => setGraphTypeToSync[k].syncKeys)
export type SyncableKey = (typeof syncableKeys)[number]

const outerRange = (range1: Range, range2: Range): Range => [
  Math.min(range1[0], range2[0]),
  Math.max(range1[1], range2[1]),
];
const syncRange = (r: "xrange" | "yrange", graphStates: GraphState[]) => {
  // if sync is set for an axis, set all graph states to the same range along
  // that axis by calculating the outer range
  //
  // Note: locked axes do not contribute to outer range calculations
  const lockedKey = r === "xrange" ? "xlock" : "ylock";
  const axis = r === "xrange" ? "x" : "y";

  const states = graphStates.filter(g => !g.config.get()[lockedKey]);
  const outerR = states.reduce(
    (o, g) => outerRange(o, g.config.get()[r]),
    defaultRange()
  );
  states.forEach(g => g.config.set({ [r]: outerR }));
  const outerMaxR = states.reduce(
    (o, g) => outerRange(o, g.data.extents[axis]),
    defaultRange()
  );
  states.forEach(g => g.data.extents[axis] = outerMaxR);
};

type InitialSyncFn = (graphStates: GraphState[]) => void
const syncableKeyToInitialFn: Record<SyncableKey, InitialSyncFn> = {
  xrange: graphStates => syncRange("xrange", graphStates),
  yrange: graphStates => syncRange("yrange", graphStates),
  ylog: graphStates => {
    const ylog = graphStates.some(g => g.config.get().ylog);
    graphStates.forEach(g => g.config.set({ ylog }))
  },
};

type SetGraphPayload = Values<{
  [K in keyof SetGraphTypeToSync]: {
    type: K,
    changed: Partial<Pick<GraphConfig, SetGraphTypeToSync[K]["syncKeys"][number]>>
  }
}>

export class GraphStateClass {
  private graphStates: GraphState[];
  private syncKeys: SyncableKey[];

  constructor(
    private fixed: Fixed,
    private params: Params
  ) {
    const allData = this.getAllData();
    this.graphStates = fixed.html.processed.plot.map((g, i) => {
      const data = allData[i];
      const config = new GraphConfigClass(fixed, data, g);

      const [fullRerender, setFullRerender] = createSignal(false);
      const [rangeUpdated, setRangeUpdated] = createSignal(false);

      return {
        id: g.id, type: g.type, config, data,
        signals: {
          fullRerender: { get: fullRerender, trigger: () => setFullRerender(p => !p) },
          rangeUpdated: { get: rangeUpdated, trigger: () => setRangeUpdated(p => !p) },
        }
      };
    });

    this.syncKeys = fixed.html.parsed.storeCfg[0]?.sync || [];
    this.initialSync();
  };

  private initialSync = () => {
    this.syncKeys.forEach(s => syncableKeyToInitialFn[s](this.graphStates));
  };

  private getAllData = () => getAllData(this.fixed, this.params);

  getGraph = (id: string) => this.graphStates.find(g => g.id === id)!;

  setGraph = (id: string, payload: SetGraphPayload) => {
    const graph = this.getGraph(id);
    graph.config.set(payload.changed);
    this.syncKeys.forEach(s => {
      const value = graph.config.get()[s];
      this.graphStates.forEach(g => g.config.set({ [s]: value }));
    });

    objKeys(setGraphTypeToSync).forEach(t => {
      if (payload.type !== t) return;
      const { syncKeys, signal } = setGraphTypeToSync[t];
      if (this.syncKeys.some(s => (syncKeys as GraphKey[]).includes(s))) {
        this.graphStates.forEach(g => g.signals[signal].trigger());
      } else {
        graph.signals[signal].trigger();
      }
    });
  };

  updateParams = (params: Params) => {
    this.params = params;
    const allData = this.getAllData();
    this.graphStates.forEach((g, i) => {
      const data = allData[i];
      g.data = data;
      g.config.set({
        xrange: data.extents.x,
        yrange: data.extents.y,
      });
    });
    this.initialSync();
    this.graphStates.forEach(g => g.signals.fullRerender.trigger());
  };
};
