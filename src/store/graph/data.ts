import { ContinuousGeneratorODE, DiscreteGenerator, System } from "@reside-ic/dust2";
import { Fixed, ModelRunResult, PlotData, Range } from "../types";
import { BarStyle, BarStyles, LineStyle, LineStyles, Params, ParamValue, ParamValues, Stroke, Styles } from "../../schemas/json/types";
import { GraphHtmlMetadata } from "../../schemas/html/types";
import { objMap } from "../../utils";
import { supportedVariants } from "../../schemas/html/validate";

const runModel = (fixed: Fixed, params: ParamValues) => {
  const { startTime, endTime, particles, dt } = fixed.json.config;
  const sys = fixed.json.model.metadata.time === "discrete"
    ? System.createDiscrete(
      fixed.generator as DiscreteGenerator<any, any, any>,
      params,
      startTime || 0,
      dt || 0.01,
      particles || 1,
    )
    : System.createODE(
      fixed.generator as ContinuousGeneratorODE<any, any, any>,
      params,
      startTime || 0,
      dt || 0.01,
      particles || 1,
    )

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
    line.points.push({ x: [xs[i]], y: [ys[i]] });
  }

  if (style) {
    line.style.strokeColor = style.color;
    line.style.strokeWidth = style.width;
    line.style.strokeDasharray = style.stroke && strokeToStrokeDashArray[style.stroke];
  }

  return line;
}

const getBar = (
  v: string,
  ys: number[],
  style?: BarStyle | undefined
) => {
  const bar: PlotData["bars"][number] = {
    baseAxis: "xBottom",
    valueAxis: "yLeft",
    base: [v],
    stack: [{
      style: {},
      range: [0, ys.at(-1)!]
    }]
  };

  if (style) {
    bar.stack[0].style.color = style.color;
    bar.stack[0].style.opacity = style.opacity;
  }

  return bar;
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
    bars: [],
    extents: {
      x: [xs[0], xs[xs.length - 1]],
      y: defaultRange()
    },
  };

  const vars = g.config.vars || fixed.json.model.metadata.variables.map(v => v.name);
  const addLine = (
    v: string,
    val: Record<string, ParamValue[]>,
    styles: Styles | undefined
  ) => {
    const style = styles?.normal && styles.normal[v];
    plotData.lines.push(getLine(xs, val[v] as number[], style));
  };
  const addBar = (
    v: string,
    val: Record<string, ParamValue[]>,
    styles: Styles | undefined
  ) => {
    const style = styles?.bar && styles.bar[v];
    plotData.bars.push(getBar(v, val[v] as number[], style));
  };
  const variant = g.config.variant || supportedVariants[0];
  const addVisual = variant === supportedVariants[0] ? addLine : addBar;

  if (g.type === "cfg") {
    const ids = g.config.fixedid;
    vars.forEach(v => {
      if (!ids || (ids && ids.includes("main"))) {
        res.main.values.forEach(val => {
          const { styles } = fixed.json.config;
          addVisual(v, val, styles);
        });
      }

      res.static.forEach((s, i) => {
        if (!ids || (ids && ids.includes(s.id))) {
          s.data.values.forEach(val => {
            const { styles } = fixed.json.fixedParamSets[i];
            addVisual(v, val, styles);
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
      values.forEach(val => addVisual(v, val, styles));
    })
  }

  plotData.lines.forEach(l => {
    l.points.forEach(({ y }) => {
      if ((y[0] as number) < plotData.extents.y[0]) plotData.extents.y[0] = y[0] as number;
      if ((y[0] as number) > plotData.extents.y[1]) plotData.extents.y[1] = y[0] as number;
    });
  });

  plotData.bars.forEach(b => {
    b.stack.forEach(s => {
      const [ low, high ] = s.range;
      if (low < plotData.extents.y[0]) plotData.extents.y[0] = low;
      if (high > plotData.extents.y[1]) plotData.extents.y[1] = high;
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
