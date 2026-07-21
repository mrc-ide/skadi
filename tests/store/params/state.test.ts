import { describe, expect, test } from "vitest";
import { objMap } from "../../../src/store/utils";
import { Fixed } from "../../../src/store/types";
import { getParamsStore } from "../../../src/store/params/state";
import { renderHook } from "@solidjs/testing-library";

type Pars = Record<string, number>

const getFixed = (pars: Pars): Fixed => {
  return {
    html: {
      pars: objMap(
        pars,
        (_, v) => ({ val: v })
      )
    }
  } as any as Fixed;
};

const setupParamsTest = (pars: Pars) => {
  return renderHook(
    () => getParamsStore(getFixed(pars))
  ).result;
};

describe("params state", () => {
  test("initialises pars", () => {
    const { params } = setupParamsTest({
      beta: 4, sigma: 3
    });
    expect(params()).toStrictEqual({
      static: {},
      user: { beta: 4, sigma: 3 }
    })
  });

  test("producer interface", () => {
    const { params, setParams } = setupParamsTest({
      beta: 4, sigma: 3
    });
    setParams(p => p.user.beta = 100);
    expect(params()).toStrictEqual({
      static: {},
      user: { beta: 100, sigma: 3 }
    })
  });
});
