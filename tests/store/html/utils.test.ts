import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { attrEq, attrsEq, error, expectAttrs, getAttr, getEl, getEls, getStoresInPage, setAttr, w } from "../../../src/store/html/utils";
import { htmlAppend, htmlClear } from "./helpers";

describe("html utils", () => {
  beforeEach(() => htmlAppend(`
    <div class="w-parCfg"
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
  `));

  afterEach(htmlClear);

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
    expect(document.getElementsByClassName("error-overlay")).toBeDefined();
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

  test("getStoresInPage", () => {
    expect(getStoresInPage()).toStrictEqual([
      "basic", "basic:1"
    ]);
  });
});
