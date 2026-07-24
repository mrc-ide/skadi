import { createSignal } from "solid-js";
import { DataWithRange, Fixed, GraphConfig, graphConfigKeys, GraphData, GraphSignal, GraphState, Range } from "../types";
import { getXYRanges } from "./utils";
import { objAssignIfTruthy, objFilter, objKeys, objMergeAndAssignKey } from "../utils";

export const getGraphRanges = (dat: DataWithRange, vars: string[], fixed: Fixed) => {
    const { json, html } = fixed;
    const { xRange, yRange, data } = dat;

    // we want y range to be synced which means the range as to be the max of the
    // vars in *all* graphs, not just the current graph, x range will automatically
    // be synced at the start since they all share time values
    const ranges = html.sync.includes("yRange")
      ? { xRange, yRange }
      : getXYRanges(data, vars);

    // endTime is not optional in the config
    ranges.xRange = [
      json.config.startTime ?? ranges.xRange[0],
      json.config.endTime
    ] as Range;

    return ranges;
};

const createGraphStates = (
  fixed: Fixed,
  graphData: DataWithRange,
) => {
  return fixed.html.graphMetadata.map(g => {
    const [fullRerender, setFullRerender] = createSignal(false);
    const [rangeUpdated, setRangeUpdated] = createSignal(false);

    // default to all vars if not specified in html
    const vars = g.config.vars ?? fixed.html.vars;
    const { xRange, yRange } = getGraphRanges(graphData, vars, fixed);

    return {
      id: g.id,
      config: objAssignIfTruthy(
        graphConfigKeys, g.config,
        { vars, xRange, yRange, yLog: false }
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
      k => fixed.html.sync.includes(k)
    );

    const syncKeys = objKeys(propsToSync);
    const updateType: GraphSignal =
      syncKeys.includes("yRange") || syncKeys.includes("xRange")
        ? "rangeUpdated"
        : "fullRerender";

    graphStates.forEach(gState => objMergeAndAssignKey(gState, "config", propsToSync));
    triggerGraphUpdate(id, graphStates, updateType);
  };

  return { graphStates, getGraphState, setGraphConfig };
};
