import { syncableKeys } from "../../store/graph/class";
import { all, callIfDuplicate, isNullish, objFromVals, splitComma } from "../../utils";
import { JsonPayload } from "../json/types";
import { Attribute, AttrSchema, ClassName, htmlSchemas } from "./schema";
import { attrsEq, dataW, error, expectAttrs, expectDataAttr, expectSchema, findSchema, getAttr, getEl, getEls, w } from "./utils";

const isString = (s: string, _json: JsonPayload) => !!s
const isNumber = (s: string, _json: JsonPayload) => !isNaN(parseFloat(s));
const isBoolean = (s: string, _json: JsonPayload) =>
  s === "" || s.toLowerCase() === "true" || s.toLowerCase() === "false";
const isSyncableKey = (s: string, _json: JsonPayload) =>
  syncableKeys.includes(s as any);
const isVariable = (s: string, json: JsonPayload) =>
  json.model.metadata.variables.map(v => v.name).includes(s as any);
const isParameter = (s: string, json: JsonPayload) =>
  json.model.metadata.parameters.map(v => v.name).includes(s as any);
const isRange = (s: string, json: JsonPayload) => {
  const vals = splitComma(s);
  if (vals?.length !== 2) return false;
  return isNumber(vals[0], json) && isNumber(vals[1], json);
};
const isFormId = (s: string, json: JsonPayload) =>
  json.forms.map(f => f.id).includes(s as any);
const isFixedId = (s: string, json: JsonPayload) =>
  s === "main" || json.fixedParamSets.map(f => f.id).includes(s as any);

export const typeValidators = {
  string: isString,
  number: isNumber,
  boolean: isBoolean,
  syncableKey: isSyncableKey,
  variable: isVariable,
  parameter: isParameter,
  range: isRange,
  formId: isFormId,
  fixedId: isFixedId,
} as const;

const validateStoreAttr = () => {
  htmlSchemas.forEach(s => {
    getEls(s.class).forEach(el => expectAttrs(["store"], el));
  });
};

const validateSingleAttrs = (attrsSchema: AttrSchema[], el: Element, json: JsonPayload) => {
  attrsSchema.forEach(a => {
    const val = getAttr(a.name, el);
    if (a.optional && isNullish(val)) return;
    if (!a.optional && isNullish(val)) {
      error(el, elMsg =>
        `Missing attribute "${w(a.name)}" on ${elMsg}`
      );
    }

    const status = { valid: true, typeMsg: "" };
    if (a.type === "array") {
      const validator = typeValidators[a.items.type];
      status.valid = all(splitComma(val)!.map(v => validator(v, json)))
      if (!status.valid) status.typeMsg = `array of ${a.items.type}`;
    } else {
      const validator = typeValidators[a.type];
      status.valid = validator(val!, json);
      if (!status.valid) status.typeMsg = a.type;
    }

    if (!status.valid) {
      error(el, elMsg =>
        `Cannot parse "${w(a.name)}" on ${elMsg} into type ${status.typeMsg}`
      );
    }
  });
};

const validateStructure = (store: string, json: JsonPayload) => {
  htmlSchemas.forEach(schema => {
    const els = getEls(schema.class, { store });

    els.forEach(el => {
      let attrSchema: AttrSchema[];
      if ("attrs" in schema) {
        expectSchema(schema.attrs, el);
        attrSchema = schema.attrs;
      } else {
        expectDataAttr("type", el);
        const foundSchema = findSchema("type", el, schema);
        if (!foundSchema) {
          error(el, elMsg =>
            `Invalid "${dataW("type")}" for ${elMsg}, expected one of `
            + `${schema.oneOf.map(s => s.type).join(", ")}`
          );
          return;
        }
        expectSchema(foundSchema.attrs, el);
        attrSchema = foundSchema.attrs;
      }

      validateSingleAttrs(attrSchema, el, json);
    });

    if ("uniqueBy" in schema) {
      callIfDuplicate(els, attrsEq(schema.uniqueBy), el => {
        const uniqueMsg = schema.uniqueBy.map(w).join(", ");
        error(el, elMsg =>
          `All ${w(schema.class)} need to be unique by ${uniqueMsg} values but ${elMsg} was not`
        );
      });
    }
  });
};

const validateLink = (
  from: ClassName,
  to: ClassName,
  by: Attribute[],
  ifFn?: (el: Element) => boolean
) => {
  getEls(from).forEach(el => {
    if (ifFn && !ifFn(el)) return;

    const attrs = objFromVals(by, a => getAttr(a, el)!);

    if (!getEl(to, attrs)) {
      error(el, elMsg =>
        `The ${elMsg} does not have corresponding ${w(to)} element `
        + `(matched by ${by.map(w).join(", ")})`
      );
    }
  });
};

const validateAtLeastOnePlot = (store: string) => {
  if (getEls("plot", { store }).length < 1) {
    throw new Error(`Please use at least one plot with "${store}" store`);
  }
};

export const validateHtml = (store: string, json: JsonPayload) => {
  validateStoreAttr();
  validateStructure(store, json);
  validateLink("par", "parCfg", ["store", "par"]);
  validateLink("plot", "graphCfg", ["store", "id"], el => !!getAttr("id", el));
  validateAtLeastOnePlot(store);
};
