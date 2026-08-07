import { System } from "@reside-ic/dust2";
import { DataWithRange, Fixed, GraphData, ParameterValue, Params } from "../types";
import { getXYRanges } from "./utils";
import { createSignal } from "solid-js";

export const calculateGraphData = (fixed: Fixed, params: Record<string, ParameterValue>): DataWithRange => {
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


export const getGraphDataStore = (fixed: Fixed, params: Params) => {
  const userParams = { ...params.user, ...params.static };
  const fixedParams = fixed.json.fixedParamSets.map(p => ({
    ...userParams, ...p.user, ...p.static,
  }));
  const [graphData, setGraphData] = createSignal<GraphData>({
    main: calculateGraphData(fixed, userParams),
    static: fixedParams.map(p => calculateGraphData(fixed, p))
  });
  return { graphData, setGraphData }
};
