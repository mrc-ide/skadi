import { Attr, attrEq, attrsEq, ClassName, error, expectAttrs, expectAttrsFn, expectOneOfAttrs, getAttr, getEl, getEls, isStrNumber, schemas, splitComma, w } from "./utils";
import { GraphConfig, graphConfigKeys } from "../types";
import { callIfDuplicate } from "../utils";

const validateStructure = () => {
  schemas.forEach(scheme => {
    const els = getEls(scheme.class);
    els.forEach(el => {
      if ("attrs" in scheme) {
        const requiredAttrs =
          scheme.attrs.filter(a => !("optional" in a && a.optional));
          
      } else {
        scheme.oneOf
      }
    });
  });
};

const validateStoreConfigs = () => {
  const els = getEls("storeCfg");
  
  // check it has correct attrs
  els.forEach(el => expectAttrs(["store", "sync"], el));
  
  // check all are unique, cannot have two sync configs of same store inst
  callIfDuplicate(els, attrEq("store"), el => {
    error(el, elMsg =>
      `All ${w("store-cfg")} need to have a unique ${w("store")} value but ${elMsg} did not`
    );
  });

  // check sync values actually belong in config
  els.forEach(el => {
    const syncs = splitComma(getAttr("sync", el))!;
    syncs.forEach(s => {
      if (!graphConfigKeys.includes(s as keyof GraphConfig)) {
        error(el, elMsg =>
          `Unknown sync value "${s}" in ${elMsg}`
        );
      }
    });
  });
};

const validateGraphConfigs = () => {
  const els = getEls("graph-cfg");
  els.forEach(el => expectAttrs(["id", "store"], el));
  callIfDuplicate(els, attrEq("id"), el => {
    error(el, elMsg =>
      `All ${w("id")} attributes in ${w("graph-cfg")} must be globally unique `
      + `but ${elMsg} is a duplicate`
    );
  });
};

const validateParConfigs = () => {
  const els = getEls("par-cfg");
  els.forEach(el => {
    expectAttrs(["store", "par", "val", "min", "max"], el)

    // ensure types are nums
    const isNotNumErrMsg = (a: Attr, elMsg: string) =>
      `Cannot parse attribute ${w(a)} on ${elMsg} into a number`
    expectAttrsFn(["val", "min", "max"], el, isStrNumber, isNotNumErrMsg);
    if (getAttr("step", el)) {
      expectAttrsFn(["step"], el, isStrNumber, isNotNumErrMsg);
    }
  });
  callIfDuplicate(els, attrsEq(["store", "par"]), el => {
    error(el, elMsg =>
      `${w("par-cfg")} must be unique per ${w("store")} and ${w("par")} `
      + `but ${elMsg} is a duplicate`
    );
  });
};

const validatePars = () => {
  const els = getEls("par");
  els.forEach(el => {
    expectAttrs(["store", "par"], el);
    const store = getAttr("store", el)!;
    const par = getAttr("par", el)!;
    if (!getEl("par-cfg", { store, par })) {
      error(el, elMsg =>
        `The ${elMsg} does not have corresponding ${w("par-cfg")} element`
      );
    }
  });
};

const validatePlot = () => {
  const els = getEls("plot");
  els.forEach(el => expectOneOfAttrs([["id"], ["store"]], el));
  els.forEach(el => {
    const id = getAttr("id", el);
    // if id and no graph config with that id
    if (id && !getEl("graph-cfg", { id })) {
      error(el, elMsg =>
        `The ${elMsg} with ${w("id")}, "${id}" does not have corresponding `
        + `${w("graph-cfg")} element`
      );
    } 
  });
};

export const validateHtml = () => {
  validateStoreConfigs();
  validateGraphConfigs();
  validateParConfigs();
  validatePars();
  validatePlot();
};



const validateVar = (v: string | undefined, modelVars: string[], el: Element) => {
  if (v && !modelVars.includes(v)) {
    error(el, elMsg =>
      `Unknown model variable ${v} used in ${elMsg}`
    );
  }
};

const validateVarsFor = (className: ClassName, store: string, modelVars: string[]) => {
  const els = getEls(className, { store });
  els.forEach(el => {
    splitComma(getAttr("vars", el))?.forEach(v => {
      validateVar(v, modelVars, el);
    });
  });
};

export const validateVars = (store: string, modelVars: string[]) => {
  validateVarsFor("graph-cfg", store, modelVars);
  validateVarsFor("plot", store, modelVars);
};
