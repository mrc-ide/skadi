import { describe, expect, test } from "vitest";
import { LineStyle } from "../../src/store/types";
import { getLine } from "../../src/components/utils";

describe("component utils", () => {
  test("getLine", () => {
    const v = "S";
    const times = [1, 2];
    const particleValues = { S: [3, 4] };
    const style: LineStyle = {
      color: "red",
      width: 4,
      stroke: "dot",
    };

    expect(getLine(v, times, particleValues, style)).toStrictEqual({
      points: [
        { x: 1, y: 3 },
        { x: 2, y: 4 },
      ],
      style: {
        strokeColor: "red",
        // converted dot to stroke dash array
        strokeDasharray: "3 3",
        strokeWidth: 4,
      },
    });
  });
});
