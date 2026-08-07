import { NamedResult } from "@reside-ic/dust2";
import { Range } from "../types";

export const getXYRanges = (dat: NamedResult, vars: string[]) => {
    const ranges = {
      xrange: [Infinity, -Infinity] as Range,
      yrange: [Infinity, -Infinity] as Range,
    };

    dat.times.forEach(t => {
      if (t < ranges.xrange[0]) ranges.xrange[0] = t;
      if (t > ranges.xrange[1]) ranges.xrange[1] = t;
    });
    vars.forEach(v => {
      dat.values.forEach(particle => {
        (particle[v] as number[]).forEach(y => {
          if (y < ranges.yrange[0]) ranges.yrange[0] = y;
          if (y > ranges.yrange[1]) ranges.yrange[1] = y;
        });
      });
    });

    return ranges;
};

