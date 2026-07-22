import { Stroke } from "../store/types";

export const strokeToStrokeDashArray: Record<Stroke, string> = {
  solid: "",
  dash: "10 3",
  dot: "3 3",
  dotdash: "10 3 3 3",
};
