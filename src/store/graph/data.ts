import { System } from "@reside-ic/dust2";
import { DataWithRange, Fixed, GraphData, Params } from "../types";
import { getXYRanges } from "./utils";
import { createSignal } from "solid-js";

export const calculateGraphData = (fixed: Fixed, params: Params): DataWithRange => {
  const { startTime, endTime, particles, dt } = fixed.json.config;
  const sys = System.createODE(
    fixed.generator as any,
    { ...params.static, ...params.user },
    startTime || 0,
    dt || 0.01,
    particles || 1,
  );

  sys.setStateInitial();

  const nPoints = 1000;
  const timeStep = (endTime - (startTime || 0)) / nPoints;
  const { vars } = fixed.html;

  const data = sys.simulateByStateVarName(
    Array.from({ length: nPoints }).map((_, i) => i * timeStep),
    vars
  );
  const ranges = getXYRanges(data, vars);

  return { data, ...ranges }
};


export const getGraphDataStore = (fixed: Fixed, params: Params) => {
  const [graphData, setGraphData] = createSignal<GraphData>({
    main: calculateGraphData(fixed, params),
    static: []
  });
  return { graphData, setGraphData }
};
