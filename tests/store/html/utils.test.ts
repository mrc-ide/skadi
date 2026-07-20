import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { attrEq, attrsEq, error, expectAttrFn, expectAttrs, expectAttrsFn, expectOneOfAttrs, getAttr, getEl, getEls, isStrNumber, setAttr, splitComma, w } from "../../../src/store/html/utils";

describe("html utils", () => {
  beforeEach(() => {
    const el = document.createElement("div");
    el.innerHTML = `
      <div class="w-par-cfg"
           w-store="basic"
           w-par="sigma"
           w-val="2"
           w-min="1"
           w-max="3"
           w-step="0.1"></div>

      <div class="w-par" w-store="basic" w-par="beta"></div>
      <div class="w-par" w-store="basic" w-par="beta"></div>
      <div class="w-par" w-store="basic:1" w-par="sigma"></div>
      <div class="w-plot" w-store="basic" w-vars="S, I"></div>
    `;
    document.body.append(el);
  });

  afterEach(() => document.body.innerHTML = "");

  test("getAttr", () => {
    const el = document.createElement("div");
    el.setAttribute(w("id"), "foo");
    expect(getAttr("id", el)).toBe("foo");
  });

  test("setAttr", () => {
    const el = document.createElement("div");
    setAttr("id", "foo", el);
    expect(getAttr("id", el)).toBe("foo");
  });

  test("getEl", () => {
    const el = getEl("par", { store: "basic:1" })!;
    expect(getAttr("par", el)).toBe("sigma");
  });

  test("getEls", () => {
    const els = getEls("par", { store: "basic" });
    expect(els).toHaveLength(2);
    els.forEach(el => expect(getAttr("par", el)).toBe("beta"));
  });

  test("error", () => {
    const el = getEl("plot")!;
    expect(() => {
      error(el, x => x);
    }).toThrow("w-error");
    expect(getAttr("error", el)).toBe("");
  });

  test("expectAttrs", () => {
    const el = getEl("plot")!;
    expect(() => {
      expectAttrs(["store", "vars"], el);
    }).not.toThrow();

    expect(() => {
      expectAttrs(["store", "vars", "max"], el);
    }).toThrow("missing");
  });

  test("expectOneOfAttrs", () => {
    const el = getEl("plot")!;
    expect(() => {
      expectOneOfAttrs([["store", "vars"], ["max"]], el);
    }).not.toThrow();

    expect(() => {
      expectOneOfAttrs([["min"], ["max"]], el);
    }).toThrow("attributes");
  });

  test("expectAttrFn", () => {
    const el = getEl("par-cfg")!;
    expect(() => {
      expectAttrFn(
        "min",
        el,
        s => s === "1",
        errMsg => errMsg
      )
    }).not.toThrow();

    expect(() => {
      expectAttrFn(
        "min",
        el,
        s => s === "1.5",
        errMsg => errMsg
      )
    }).toThrow();
  });

  test("expectAttrsFn", () => {
    const el = getEl("par-cfg")!;
    expect(() => {
      expectAttrsFn(
        ["min", "max"],
        el,
        s => Number.isInteger(parseFloat(s!)),
        errMsg => errMsg
      )
    }).not.toThrow();

    expect(() => {
      expectAttrsFn(
        ["min", "par"],
        el,
        s => Number.isInteger(parseFloat(s!)),
        errMsg => errMsg
      )
    }).toThrow();
  });

  test("attrEq", () => {
    const [ el1, el2, el3 ] = getEls("par")!;
    expect(attrEq("par")(el1, el2)).toBe(true);
    expect(attrEq("par")(el2, el3)).toBe(false);
  });

  test("attrsEq", () => {
    const [ el1, el2, el3 ] = getEls("par")!;
    expect(attrsEq(["store", "par"])(el1, el2)).toBe(true);
    expect(attrsEq(["store", "par"])(el2, el3)).toBe(false);
  });

  test("splitComma", () => {
    expect(splitComma("1, 2, 3")).toStrictEqual(["1", "2", "3"]);
    expect(splitComma(null)).toBe(undefined);
    expect(splitComma(undefined)).toBe(undefined);
  });

  test("isStrNumber", () => {
    expect(isStrNumber("100")).toBe(true);
    expect(isStrNumber(null)).toBe(false);
    expect(isStrNumber(undefined)).toBe(false);
    expect(isStrNumber("three")).toBe(false);
  });
});
