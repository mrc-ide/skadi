import { System } from "@reside-ic/dust2";
import { Fixed, ModelRunResult, PlotData, Range } from "../types";
import { LineStyle, LineStyles, Params, ParamValue, ParamValues, Stroke } from "../../schemas/json/types";
import { GraphHtmlMetadata } from "../../schemas/html/types";
import { objMap } from "../../utils";

const runModel = (fixed: Fixed, params: ParamValues) => {
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

  return data;
};

const strokeToStrokeDashArray: Record<Stroke, string> = {
  solid: "",
  dash: "10 3",
  dot: "3 3",
  dotdash: "10 3 3 3",
};

const getLine = (
  xs: number[],
  ys: number[],
  style?: LineStyle | undefined
) => {
  const line: PlotData["lines"][number] = { points: [], style: {} };

  for (let i = 0; i < xs.length; i++) {
    line.points.push({ x: xs[i], y: ys[i] });
  }

  if (style) {
    line.style.strokeColor = style.color;
    line.style.strokeWidth = style.width;
    line.style.strokeDasharray = style.stroke && strokeToStrokeDashArray[style.stroke];
  }

  return line;
}

export const defaultRange = (): Range => [Infinity, -Infinity];

const getPlotData = (
  fixed: Fixed,
  res: ModelRunResult,
  g: GraphHtmlMetadata,
): PlotData => {
  const xs = res.main.times;

  const plotData: PlotData = {
    lines: [],
    points: [],
    extents: {
      x: [xs[0], xs[xs.length - 1]],
      y: defaultRange()
    },
  };

  const vars = g.config.vars || fixed.json.model.metadata.variables.map(v => v.name);
  const addLine = (
    v: string,
    val: Record<string, ParamValue[]>,
    styles: LineStyles | undefined
  ) => {
    const style = styles && styles[v];
    plotData.lines.push(getLine(xs, val[v] as number[], style));
  };

  if (g.type === "cfg") {
    const ids = g.config.fixedid;
    vars.forEach(v => {
      if (!ids || (ids && ids.includes("main"))) {
        res.main.values.forEach(val => {
          const { styles } = fixed.json.config;
          addLine(v, val, styles);
        });
      }

      res.static.forEach((s, i) => {
        if (!ids || (ids && ids.includes(s.id))) {
          s.data.values.forEach(val => {
            const { styles } = fixed.json.fixedParamSets[i];
            addLine(v, val, styles);
          });
        }
      });
    });
  } else {
    const data1 = g.config.fixedid1 === "main"
      ? res.main
      : res.static.find(d => d.id === g.config.fixedid1)!.data;
    const data2 = g.config.fixedid2 === "main"
      ? res.main
      : res.static.find(d => d.id === g.config.fixedid2)!.data;
    const { styles } = fixed.json.config;
    vars.forEach(v => {
      const values = data1.values.map((v1, v1Idx) => objMap(
        v1,
        (k: string, y: number[]) => y.map(
          (y1, y1Idx) => y1 - (data2.values[v1Idx][k][y1Idx] as number)
        )
      ));
      values.forEach(val => addLine(v, val, styles));
    })
  }

  plotData.lines.forEach(l => {
    l.points.forEach(({ y }) => {
      if (y < plotData.extents.y[0]) plotData.extents.y[0] = y;
      if (y > plotData.extents.y[1]) plotData.extents.y[1] = y;
    });
  });

  return plotData;
};

export const getAllData = (fixed: Fixed, params: Params) => {
  const userParams = { ...params.user, ...params.static };
  const res: ModelRunResult = {
    main: runModel(fixed, userParams),
    static: fixed.json.fixedParamSets.map(p => {
      const params = { ...userParams, ...p.user, ... p.static };
      return { id: p.id, data: runModel(fixed, params) };
    })
  };

  return fixed.html.processed.plot.map(g => getPlotData(fixed, res, g));
};
