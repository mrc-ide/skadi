import { describe, expect, test } from "vitest";
import { validateHtml, validateVars } from "../../../src/store/html/validate";

type Test = { html: string }
  & ({} | { errMsg: string })
type Tests = Test[]

type VarTest = Test & { vars: string[] }
type VarTests = VarTest[]

const htmlAppend = (html: string) => {
    const el = document.createElement("div");
    el.innerHTML = html;
    document.body.append(el);
}

const htmlClear = () => document.body.innerHTML = "";

const runValidateHtmlTests = (tests: Tests) => {
  tests.forEach(t => {
    htmlAppend(t.html);

    if ("errMsg" in t) {
      expect(validateHtml).toThrow(t.errMsg);
    } else {
      expect(validateHtml).not.toThrow();
    }

    htmlClear();
  });
};

const runValidateVarsTest = (tests: VarTests) => {
  tests.forEach(t => {
    htmlAppend(t.html);

    if ("errMsg" in t) {
      expect(() => validateVars("basic", t.vars)).toThrow(t.errMsg);
    } else {
      expect(() => validateVars("basic", t.vars)).not.toThrow();
    }

    htmlClear();
  });
};

describe("html validate", () => {
  test("store configs", () => {
    runValidateHtmlTests([
      {
        html: `
          <div class="w-store-cfg"
            w-store="basic"></div>
        `,
        errMsg: "sync"
      },
      {
        html: `
          <div class="w-store-cfg"
            w-store="basic"
            w-sync="xRange"></div>
          <div class="w-store-cfg"
            w-store="basic"
            w-sync="xRange"></div>
        `,
        errMsg: "unique"
      },
      {
        html: `
          <div class="w-store-cfg"
            w-store="basic"
            w-sync="x"></div>
        `,
        errMsg: "Unknown sync"
      },
      {
        html: `
          <div class="w-store-cfg"
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
          <div class="w-graph-cfg"
               w-id="1"></div>
        `,
        errMsg: "store"
      },
      {
        html: `
          <div class="w-graph-cfg"
               w-id="1"
               w-store="basic"></div>
          <div class="w-graph-cfg"
               w-id="1"
               w-store="basic"></div>
        `,
        errMsg: "unique"
      },
      {
        html: `
          <div class="w-graph-cfg"
               w-id="1"
               w-store="basic"
               w-vars="R, I"></div>
        `
      },
    ]);
  });

  test("par configs", () => {
    runValidateHtmlTests([
      {
        html: `
          <div class="w-par-cfg"
               w-store="basic"
               w-par="beta"
               w-val="4"
               w-step="0.1"></div>
        `,
        errMsg: "min"
      },
      {
        html: `
          <div class="w-par-cfg"
               w-store="basic"
               w-par="beta"
               w-val="four"
               w-min="1"
               w-max="6"
               w-step="0.1"></div>
        `,
        errMsg: "number"
      },
      {
        html: `
          <div class="w-par-cfg"
               w-store="basic"
               w-par="beta"
               w-val="4"
               w-min="1"
               w-max="6"></div>
          <div class="w-par-cfg"
               w-store="basic"
               w-par="beta"
               w-val="4"
               w-min="1"
               w-max="6"></div>
        `,
        errMsg: "unique"
      },
      {
        html: `
          <div class="w-par-cfg"
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
      <div class="w-par-cfg"
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
        errMsg: "par"
      },
      {
        html: `
          <div class="w-par" w-store="basic" w-par="beta"></div>
        `,
        errMsg: "par-cfg"
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
      <div class="w-graph-cfg"
           w-id="1"
           w-store="basic"
           w-vars="R, I"></div>
    `;
    runValidateHtmlTests([
      {
        html: `
          <div class="w-plot" w-vars="S, I"></div>
        `,
        errMsg: "attributes"
      },
      {
        html: `
          <div class="w-plot" w-id="1"></div>
        `,
        errMsg: "graph-cfg"
      },
      {
        html: `
          ${graphCfg}
          <div class="w-plot" w-id="1"></div>
          <div class="w-plot" w-store="basic" w-vars="S, I"></div>
        `
      },
    ]);
  });

  test("validateVars for graph cfg", () => {
    const graphCfg = `
      <div class="w-graph-cfg"
           w-id="1"
           w-store="basic"
           w-vars="R0, S"></div>
    `;
    runValidateVarsTest([
      {
        vars: ["S", "I"],
        html: graphCfg,
        errMsg: "model variable"
      },
      {
        vars: ["R0", "S", "I"],
        html: graphCfg,
      },
    ]);
  });

  test("validateVars for plot", () => {
    const plot = `
      <div class="w-plot" w-store="basic" w-vars="R0, S"></div>
    `;
    runValidateVarsTest([
      {
        vars: ["S", "I"],
        html: plot,
        errMsg: "model variable"
      },
      {
        vars: ["R0", "S", "I"],
        html: plot,
      },
    ]);
  });
});
