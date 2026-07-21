import { NamedResult } from "@reside-ic/dust2";
import { describe, expect, test } from "vitest";
import { getXYRanges } from "../../../src/store/graph/utils";

const dat: NamedResult = {
  times: [1, 2, 3],
  values: [
    { beta: [10, 20, 15], sigma: [50, 25, 30] },
    { beta: [15, 5, 10], sigma: [1000, 2000, 3000] },
  ]
};

describe("graph utils", () => {
  test("getXYRanges", () => {
    expect(getXYRanges(dat, ["beta"])).toStrictEqual({
      xRange: [1, 3],
      yRange: [5, 20],
    });
  });
});
