import { describe, expect, test, vi } from "vitest";
import { Fixed, GraphData, GraphState, Range } from "../../../src/store/types";
import { getXYRanges } from "../../../src/store/graph/utils";
import { renderHook } from "@solidjs/testing-library";
import { getGraphStateStore } from "../../../src/store/graph/state";
import { objMap } from "../../../src/store/utils";

const allVars = ["S", "I", "R"];

const getDefaultFixed = (): Fixed => {
  return {
    json: {
      modelMetadata: {} as any,
      fixedParamSets: [],
      config: { startTime: 0, endTime: 100, particles: 1 },
    },
    html: {
      sync: [],
      vars: allVars,
      pars: {
        beta: { val: 4, min: 1, max: 10 }
      },
      graphMetadata: [],
    },
    generator: {} as any
  };
};

const getDefaultGraphData = (): GraphData => {
  const data = {
    times: [1, 2, 3],
    values: [
      { S: [4, 5, 6], I: [7, 8, 9], R: [1, 2, 3] }
    ]
  };
  return {
    main: { data, ...getXYRanges(data, allVars) },
    static: []
  };
};

const get1GraphConfig = () => [
  {
    id: "1",
    config: { vars: ["S", "I"] }
  },
];

const get2GraphConfigs = () => [
  ...get1GraphConfig(),
  {
    id: "2",
    config: { vars: ["R", "I"] }
  },
];

type ProduceFixedFn = (x: Fixed) => void
type ProduceGraphDataFn = (x: GraphData) => void
type Args = {
  fixed?: ProduceFixedFn,
  graphData?: ProduceGraphDataFn,
}

const setupGraphStateTest = (args: Args) => {
  const fixed = getDefaultFixed();
  args?.fixed && args.fixed(fixed);
  const graphData = getDefaultGraphData();
  args?.graphData && args.graphData(graphData);
  return renderHook(() => getGraphStateStore(fixed, graphData)).result;
};

describe("graph state", () => {
  test("graph config gets all vars if not specified", () => {
    const { graphStates } = setupGraphStateTest({
      fixed: f => f.html.graphMetadata = [{
        id: "1", config: { vars: undefined }
      }]
    });
    expect(graphStates[0].config.vars).toStrictEqual(allVars)
  });

  test("y range", () => {
    // S, I range is [4, 9] not [1, 9]
    const { graphStates: g2 } = setupGraphStateTest({
      fixed: f => f.html.graphMetadata = get1GraphConfig(),
    });
    expect(g2[0].config.yRange).toStrictEqual([4, 9])

    // however if y range synced, we take the full data range
    const { graphStates: g1 } = setupGraphStateTest({
      fixed: f => {
        f.html.sync = ["yRange"];
        f.html.graphMetadata = get1GraphConfig();
      },
    });
    expect(g1[0].config.yRange).toStrictEqual([1, 9])
  });

  test("x range respects json config", () => {
    const { graphStates: g1 } = setupGraphStateTest({
      fixed: f => f.html.graphMetadata = get1GraphConfig(),
    });
    expect(g1[0].config.xRange).toStrictEqual([0, 100]);

    const { graphStates: g2 } = setupGraphStateTest({
      fixed: f => {
        f.html.graphMetadata = get1GraphConfig();
        delete f.json.config.startTime;
      },
    });
    expect(g2[0].config.xRange).toStrictEqual([1, 100]);
  });

  test("getGraphState", () => {
    const { graphStates, getGraphState } = setupGraphStateTest({
      fixed: f => f.html.graphMetadata = get2GraphConfigs(),
    });
    expect(getGraphState("2")).toStrictEqual(graphStates[1]);
  });

  test("syncs correct graph config props", () => {
    const { graphStates, setGraphConfig } = setupGraphStateTest({
      fixed: f => {
        f.html.graphMetadata = get2GraphConfigs();
        f.html.sync = ["yLog"];
      },
    });

    const newXRange = [-1, -2] as Range;
    setGraphConfig("2", { xRange: newXRange, yLog: true });

    // does not sync x range
    expect(graphStates[0].config.xRange).not.toStrictEqual(newXRange);
    expect(graphStates[1].config.xRange).toStrictEqual(newXRange);

    // syncs y log
    expect(graphStates[0].config.yLog).toBe(true);
    expect(graphStates[1].config.yLog).toBe(true);
  });

  const getSignalSpies = (graphStates: GraphState[]) =>
    graphStates.map(g => objMap(
      g.signals,
      k => vi.spyOn(g.signals, k)
    ));

  test("dispatches range update", () => {
    const { graphStates, setGraphConfig } = setupGraphStateTest({
      fixed: f => {
        f.html.graphMetadata = get2GraphConfigs();
        f.html.sync = ["xRange"];
      },
    });

    const signalSpies = getSignalSpies(graphStates);

    const newXRange = [-1, -2] as Range;
    setGraphConfig("2", { xRange: newXRange });

    signalSpies.forEach(s => expect(s.setFullRerender).not.toHaveBeenCalledTimes(1));
    signalSpies.forEach(s => expect(s.setRangeUpdated).toHaveBeenCalled());
  });

  test("dispatches full rerender update", () => {
    const { graphStates, setGraphConfig } = setupGraphStateTest({
      fixed: f => f.html.graphMetadata = get2GraphConfigs(),
    });

    const signalSpies = getSignalSpies(graphStates);

    setGraphConfig("2", { yLog: true });

    signalSpies.forEach(s => expect(s.setRangeUpdated).not.toHaveBeenCalled());
    expect(signalSpies[0].setFullRerender).not.toHaveBeenCalled();
    expect(signalSpies[1].setFullRerender).toHaveBeenCalledTimes(1);
  });
});
