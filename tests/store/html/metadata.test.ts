import { afterEach, describe, expect, test } from "vitest";
import { htmlAppend, htmlClear } from "./helpers";
import { getHtmlMetadata, getStoresInPage } from "../../../src/store/html/metadata";
import { FixedJson } from "../../../src/store/types";
import { getAttr, getEl, getEls } from "../../../src/store/html/utils";

const fixedJson = {
  modelMetadata: {
    variables: [
      { name: "S" },
      { name: "I" },
      { name: "R" },
    ]
  }
} as any as FixedJson;

describe("html metadata", () => {
  afterEach(htmlClear);

  test("getStoresInPage", () => {
    htmlAppend(`
      <div w-store="foo"></div>
      <div w-store="foo:1"></div>
      <div w-store="bar"></div>
    `);
    expect(getStoresInPage()).toStrictEqual([
      "foo", "foo:1", "bar"
    ]);
  });

  test("resolves store attr from graph cfg", () => {
    htmlAppend(`
      <div class="w-graph-cfg"
           w-store="basic"
           w-id="1"></div>
      <div class="w-plot" w-id="1"></div>
    `);
    getHtmlMetadata("basic", fixedJson);
    expect(getAttr("store", getEl("plot")!)).toBe("basic")
  });
  
  test("generates store id attr", () => {
    htmlAppend(`
      <div class="w-graph-cfg"
           w-store="basic"
           w-id="1"></div>
      <div class="w-plot" w-id="1"></div>
      <div class="w-plot" w-id="1"></div>
      <div class="w-plot" w-store="basic"></div>
    `);
    getHtmlMetadata("basic", fixedJson);
    const [ p1, p2, p3 ] = getEls("plot");
    expect(getAttr("storeid", p1)).toBe(getAttr("storeid", p2));
    expect(getAttr("storeid", p1)).not.toBe(getAttr("storeid", p3));
  });

  test("aggregates sync", () => {
    htmlAppend(`
      <div class="w-store-cfg"
           w-store="basic"
           w-sync="x"></div>
      <div class="w-store-cfg"
           w-store="basic"
           w-sync="y, z"></div>
    `);
    const { sync } = getHtmlMetadata("basic", fixedJson);
    expect(sync).toStrictEqual(["x", "y", "z"]);
  });

  test("aggregates vars", () => {
    htmlAppend(`
      <div class="w-plot"
           w-store="basic"
           w-vars="x"></div>
      <div class="w-plot"
           w-store="basic"
           w-vars="y, z"></div>
    `);
    const { vars } = getHtmlMetadata("basic", fixedJson);
    expect(vars).toStrictEqual(["x", "y", "z"]);
  });

  test("defaults to all vars if not specified", () => {
    htmlAppend(`
      <div class="w-plot"
           w-store="basic"
           w-vars="S"></div>
      <div class="w-plot"
           w-store="basic"></div>
    `);
    const { vars } = getHtmlMetadata("basic", fixedJson);
    expect(vars).toStrictEqual(["S", "I", "R"]);
  });

  test("gets graph metadata", () => {
    htmlAppend(`
      <div class="w-graph-cfg"
           w-store="basic"
           w-id="1"
           w-vars="S"></div>
      <div class="w-plot" w-id="1"></div>
      <div class="w-plot" w-id="1"></div>
      <div class="w-plot" w-store="basic" w-vars="R"></div>
    `);
    const { graphMetadata } = getHtmlMetadata("basic", fixedJson);
    expect(graphMetadata).toHaveLength(2);
    expect(graphMetadata[0].config.vars).toStrictEqual(["S"]);
    expect(graphMetadata[1].config.vars).toStrictEqual(["R"]);
  });

  test("gets par config", () => {
    htmlAppend(`
      <div class="w-par-cfg"
           w-store="basic"
           w-par="sigma"
           w-val="2"
           w-min="0"
           w-max="2.5"
           w-step="0.1"></div>
      <div class="w-par-cfg"
           w-store="basic"
           w-par="beta"
           w-val="6"
           w-min="1"
           w-max="10"></div>
    `);
    const { pars } = getHtmlMetadata("basic", fixedJson);
    expect(pars).toStrictEqual({
      sigma: { val: 2, min: 0, max: 2.5, step: 0.1 },
      beta: { val: 6, min: 1, max: 10, step: undefined },
    });
  });
});
