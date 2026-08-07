import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { htmlAppend, htmlClear } from "./helpers";
import { JsonPayload } from "../../../src/store/types";
import { processHtml } from "../../../src/store/html/process";

const jsonPayload = {
  model: {
    metadata: {
      variables: [
        { name: "S" },
        { name: "I" },
        { name: "R" },
      ],
      parameters: [
        { name: "beta" },
        { name: "sigma" },
      ],
    }
  }
} as JsonPayload;

describe("process html", () => {
  beforeEach(() => htmlAppend(`
    <div class="w-storeCfg"
         w-store="basic"
         w-sync="yrange"></div>
    
    <div class="w-graphCfg"
         w-id="1"
         w-store="basic"
         w-yrange="0,100"
         w-ylog
         w-vars="I"></div>

    <div class="w-parCfg"
         w-store="basic"
         w-par="beta"
         w-val="4"
         w-min="1"
         w-max="6"
         w-step="0.1"></div>

    <div class="w-par" w-store="basic" w-par="beta"></div>

    <div class="w-plot" w-store="basic" w-id="1"></div>
    <div class="w-plot" w-store="basic" w-id="1"></div>
    <div class="w-plot" w-store="basic" w-vars="S, I"></div>

    <div class="w-plot" w-store="basic:1" w-xrange="-1,2.3"></div>
  `));

  afterEach(htmlClear);

  test("parses correctly", () => {
    const { parsed: p1 } = processHtml("basic", jsonPayload);
    expect(p1).toStrictEqual({
      storeCfg: [{
        sync: ["yrange"],
      }],
      graphCfg: [{
        vars: ["I"],
        xrange: undefined,
        yrange: [0, 100],
        ylog: true,
      }],
      parCfg: [{
        par: "beta",
        val: 4,
        min: 1,
        max: 6,
        step: 0.1,
      }],
      par: [{ par: "beta" }],
      plot: [
        { id: "1" },
        { id: "1" },
        {
          vars: ["S", "I"],
          xrange: undefined,
          yrange: undefined,
          ylog: undefined,
        }
      ]
    });

    const { parsed: p2 } = processHtml("basic:1", jsonPayload);
    expect(p2).toStrictEqual({
      storeCfg: [],
      graphCfg: [],
      parCfg: [],
      par: [],
      plot: [{
        vars: undefined,
        xrange: [-1, 2.3],
        yrange: undefined,
        ylog: undefined,
      }]
    });
  });

  test("defaults to all vars if no w-vars", () => {
    const { processed: p1 } = processHtml("basic", jsonPayload);
    expect(p1.vars).toStrictEqual(["I", "S"]);

    const { processed: p2 } = processHtml("basic:1", jsonPayload);
    expect(p2.vars).toStrictEqual(["S", "I", "R"]);
  });

  test("plots get assigned store ids", () => {
    const { processed: p1 } = processHtml("basic", jsonPayload);
    // 3 plot tags but two have the same w-id
    expect(p1.plot).toHaveLength(2);
    const storeids = Array.from(document.querySelectorAll('.w-plot[w-store="basic"]'))
      .map(el => el.getAttribute("w-storeid")!);
    expect(storeids[0]).toBe(storeids[1]);
    expect(storeids[1]).not.toBe(storeids[2]);
  });
});
