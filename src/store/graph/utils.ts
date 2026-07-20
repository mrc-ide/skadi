import { NamedResult } from "interfaces/System";
import { Range } from "../types";

export const getXYRanges = (dat: NamedResult, vars: string[]) => {
    const ranges = {
      xRange: [Infinity, -Infinity] as Range,
      yRange: [Infinity, -Infinity] as Range,
    };

    dat.times.forEach(t => {
      if (t < ranges.xRange[0]) ranges.xRange[0] = t;
      if (t > ranges.xRange[1]) ranges.xRange[1] = t;
    });
    vars.forEach(v => {
      dat.values.forEach(particle => {
        (particle[v] as number[]).forEach(y => {
          if (y < ranges.yRange[0]) ranges.yRange[0] = y;
          if (y > ranges.yRange[1]) ranges.yRange[1] = y;
        });
      });
    });

    return ranges;
};

