import { LineStyle, ParamValue, Stroke } from "../schemas/json/types";
import { PlotData } from "../store/types";

export const strokeToStrokeDashArray: Record<Stroke, string> = {
  solid: "",
  dash: "10 3",
  dot: "3 3",
  dotdash: "10 3 3 3",
};

export const getLine = (
  v: string,
  times: number[],
  particleValues: Record<string, ParamValue[]>,
  style?: LineStyle | undefined,
) => {
  const line: PlotData["lines"][number] = { points: [], style: {} };

  // data
  for (let i = 0; i < times.length; i++) {
    const x = times[i];
    const y = particleValues[v][i] as number;
    line.points.push({ x, y });
  }

  // styles
  if (style) {
    line.style.strokeColor = style.color;
    line.style.strokeWidth = style.width;
    line.style.strokeDasharray = style.stroke && strokeToStrokeDashArray[style.stroke];
  }

  return line;
};
