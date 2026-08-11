import { System } from "@reside-ic/dust2";
import { DataWithRange, Fixed, GraphData } from "../types";
import { getXYRanges } from "./utils";
import { createSignal } from "solid-js";
import { Params, ParamValues } from "../../schemas/json/types";

export const calculateGraphData = (fixed: Fixed, params: ParamValues): DataWithRange => {
  const { startTime, endTime, particles, dt } = fixed.json.config;
  const sys = System.createODE(
    fixed.generator as any,
    params,
    startTime || 0,
    dt || 0.01,
    particles || 1,
  );

  sys.setStateInitial();

  const nPoints = 1000;
  const timeStep = (endTime - (startTime || 0)) / nPoints;
  const { vars } = fixed.html.processed;

  const data = sys.simulateByStateVarName(
    Array.from({ length: nPoints }).map((_, i) => i * timeStep),
    vars
  );
  const ranges = getXYRanges(data, vars);

  return { data, ...ranges }
};

export const recalculateGraphData = (fixed: Fixed, params: Params) => {
  const userParams = { ...params.user, ...params.static };
  const fixedParams = fixed.json.fixedParamSets.map(p => {
    return {
      id: p.id,
      params: { ...userParams, ...p.user, ...p.static },
    };
  });
  return {
    main: calculateGraphData(fixed, userParams),
    static: fixedParams.map(p => {
      return { id: p.id, ...calculateGraphData(fixed, p.params) }
    })
  };
};

export const getGraphDataStore = (fixed: Fixed, params: Params) => {
  const [graphData, setGraphData] = createSignal<GraphData>(
    recalculateGraphData(fixed, params)
  );
  return { graphData, setGraphData }
};
