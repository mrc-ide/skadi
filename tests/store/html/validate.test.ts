import { describe, expect, test } from "vitest";
import { validateHtml } from "../../../src/store/html/validate";
import { htmlAppend, htmlClear } from "./helpers";
import { JsonPayload } from "../../../src/store/types";

type Test = { html: string }
  & ({} | { errMsg: string[] })
type Tests = Test[]

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

const runValidateHtmlTests = (tests: Tests) => {
  tests.forEach(t => {
    htmlAppend(t.html);

    if ("errMsg" in t) {
      const lookAheads = t.errMsg.map(w => `(?=.*${w})`).join("");
      const errRegex = new RegExp(`^${lookAheads}.*`, "i");

      expect(() => validateHtml("basic", jsonPayload)).toThrow(errRegex);
    } else {
      expect(() => validateHtml("basic", jsonPayload)).not.toThrow();
    }

    htmlClear();
  });
};

// jsdom does not have scrollTo implemented
Element.prototype.scrollTo = () => {} 

describe("html validate", () => {
  test("store configs", () => {
    runValidateHtmlTests([
      {
        html: `
          <div class="w-storeCfg"
            w-store="basic"
            w-sync="xRange"></div>
          <div class="w-storeCfg"
            w-store="basic"
            w-sync="xRange"></div>
        `,
        errMsg: ["unique"]
      },
      {
        html: `
          <div class="w-storeCfg"
            w-store="basic"
            w-sync="x"></div>
        `,
        errMsg: ["type", "graphProp"]
      },
      {
        html: `
          <div class="w-storeCfg"
            w-store="basic"
            w-sync="xRange"></div>
        `,
      },
    ]);
  });

  test("graph configs", () => {
    runValidateHtmlTests([
      {
        html: `
          <div class="w-graphCfg"
               w-id="1"></div>
        `,
        errMsg: ["attribute", "store"]
      },
      {
        html: `
          <div class="w-graphCfg"
               w-id="1"
               w-store="basic"></div>
          <div class="w-graphCfg"
               w-id="1"
               w-store="basic"></div>
        `,
        errMsg: ["unique"]
      },
      {
        html: `
          <div class="w-graphCfg"
               w-id="1"
               w-store="basic"
               w-vars="R0"></div>
        `,
        errMsg: ["type", "variables"]
      },
      {
        html: `
          <div class="w-graphCfg"
               w-id="1"
               w-store="basic"
               w-vars="R, I"></div>
          <div class="w-graphCfg"
               w-id="1"
               w-store="basic:1"
               w-vars="R, I"></div>
        `
      },
    ]);
  });

  test("par configs", () => {
    runValidateHtmlTests([
      {
        html: `
          <div class="w-parCfg"
               w-store="basic"
               w-par="beta"
               w-val="4"
               w-step="0.1"></div>
        `,
        errMsg: ["attribute", "min"]
      },
      {
        html: `
          <div class="w-parCfg"
               w-store="basic"
               w-par="beta"
               w-val="four"
               w-min="1"
               w-max="6"
               w-step="0.1"></div>
        `,
        errMsg: ["type", "number"]
      },
      {
        html: `
          <div class="w-parCfg"
               w-store="basic"
               w-par="b"
               w-val="4"
               w-min="1"
               w-max="6"
               w-step="0.1"></div>
        `,
        errMsg: ["type", "parameter"]
      },
      {
        html: `
          <div class="w-parCfg"
               w-store="basic"
               w-par="beta"
               w-val="4"
               w-min="1"
               w-max="6"></div>
          <div class="w-parCfg"
               w-store="basic"
               w-par="beta"
               w-val="4"
               w-min="1"
               w-max="6"></div>
        `,
        errMsg: ["unique"]
      },
      {
        html: `
          <div class="w-parCfg"
               w-store="basic"
               w-par="beta"
               w-val="4"
               w-min="1"
               w-max="6"
               w-step="0.1"></div>
        `
      },
    ]);
  });

  test("pars", () => {
    const parCfg = `
      <div class="w-parCfg"
           w-store="basic"
           w-par="beta"
           w-val="4"
           w-min="1"
           w-max="6"
           w-step="0.1"></div>
    `;
    runValidateHtmlTests([
      {
        html: `
          ${parCfg}
          <div class="w-par" w-store="basic"></div>
        `,
        errMsg: ["attribute", "par"]
      },
      {
        html: `
          <div class="w-par" w-store="basic" w-par="beta"></div>
        `,
        errMsg: ["corresponding", "parCfg"]
      },
      {
        html: `
          ${parCfg}
          <div class="w-par" w-store="basic" w-par="b"></div>
        `,
        errMsg: ["type", "parameter"]
      },
      {
        html: `
          ${parCfg}
          <div class="w-par" w-store="basic" w-par="beta"></div>
        `
      },
    ]);
  });
  
  test("plot", () => {
    const graphCfg = `
      <div class="w-graphCfg"
           w-id="1"
           w-store="basic"
           w-vars="R, I"></div>
    `;
    runValidateHtmlTests([
      {
        html: `
          <div class="w-plot" w-vars="S, I"></div>
        `,
        errMsg: ["attribute", "store"]
      },
      {
        html: `
          <div class="w-plot" w-store="basic" w-vars="R0, S"></div>
        `,
        errMsg: ["type", "variable"]
      },
      {
        html: `
          <div class="w-plot" w-store="basic" w-id="1"></div>
        `,
        errMsg: ["corresponding", "graphCfg"]
      },
      {
        html: `
          ${graphCfg}
          <div class="w-plot" w-store="basic" w-id="1"></div>
          <div class="w-plot" w-store="basic" w-vars="S, I"></div>
        `
      },
    ]);
  });
});
