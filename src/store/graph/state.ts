import { createSignal } from "solid-js";
import { DataWithRange, Fixed, GraphData, GraphSignal, GraphState, Range } from "../types";
import { getXYRanges } from "./utils";
import { objAssignIfTruthy, objFilter, objKeys, objMergeAndAssignKey } from "../../utils";
import { graphConfigKeys } from "../../schemas/html/schema";
import { GraphConfig } from "../../schemas/html/types";

const getGraphRanges = (
  { xrange, yrange, data }: DataWithRange,
  vars: string[],
  { json, html }: Fixed
) => {
  // we want y range to be synced which means the range as to be the max of the
  // vars in *all* graphs, not just the current graph, x range will automatically
  // be synced at the start since they all share time values
  const ranges = html.parsed.storeCfg[0]?.sync?.includes("yrange")
    ? { xrange, yrange }
    : getXYRanges(data, vars);

  // endTime is not optional in the config
  ranges.xrange = [
    json.config.startTime ?? ranges.xrange[0],
    json.config.endTime
  ] as Range;

  return ranges;
};

const createGraphStates = (
  fixed: Fixed,
  graphData: DataWithRange,
) => {
  return fixed.html.processed.plot.map(g => {
    const [fullRerender, setFullRerender] = createSignal(false);
    const [rangeUpdated, setRangeUpdated] = createSignal(false);

    // default to all vars if not specified in html
    const allVars = fixed.json.model.metadata.variables.map(v => v.name);
    const vars = g.config.vars ?? allVars;
    const { xrange, yrange } = getGraphRanges(graphData, vars, fixed);

    return {
      id: g.id,
      config: objAssignIfTruthy(
        graphConfigKeys, g.config,
        { vars, xrange, yrange, ylog: false }
      ),
      signals: {
        fullRerender, setFullRerender,
        rangeUpdated, setRangeUpdated,
      }
    } as GraphState;
  });
};

const findGraphState = (graphStates: GraphState[], id: string) =>
  graphStates.find(g => g.id === id)!;

// TODO: need some mechanism of saying full rerender for all graphs or just
// this graph
const triggerGraphUpdate = (id: string, graphStates: GraphState[], type: GraphSignal) => {
  if (type === "fullRerender") {
    const gState = graphStates.find(g => g.id === id)!;
    gState.signals.setFullRerender(p => !p);
  } else if (type === "rangeUpdated") {
    graphStates.forEach(gState => gState.signals.setRangeUpdated(p => !p));
  }
};


export const getGraphStateStore = (fixed: Fixed, graphData: GraphData) => {
  const graphStates = createGraphStates(fixed, graphData.main);

  const getGraphState = (id: string) => findGraphState(graphStates, id);

  // TODO: changed props can only be of certain types, not as general as
  // partial graph config, e.g. we can't have an update with ranges and
  // y log at the same time, make this discriminated union and maybe use
  // that to do triggers
  const setGraphConfig = (
    id: string,
    changedProps: Partial<GraphConfig>,
  ) => {
    const gState = getGraphState(id);
    objMergeAndAssignKey(gState, "config", changedProps);

    const propsToSync = objFilter(
      changedProps,
      k => !!fixed.html.parsed.storeCfg[0]?.sync?.includes(k)
    );

    const syncKeys = objKeys(propsToSync);
    const updateType: GraphSignal =
      syncKeys.includes("yrange") || syncKeys.includes("xrange")
        ? "rangeUpdated"
        : "fullRerender";

    graphStates.forEach(gState => objMergeAndAssignKey(gState, "config", propsToSync));
    triggerGraphUpdate(id, graphStates, updateType);
  };

  return { graphStates, getGraphState, setGraphConfig };
};
