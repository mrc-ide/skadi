import { all, callIfDuplicate, isNullish, objFromVals, splitComma } from "../../utils";
import { JsonPayload } from "../json/types";
import { Attribute, AttrSchema, ClassName, graphConfigKeys, htmlSchemas } from "./schema";
import { attrsEq, error, expectAttrs, expectSchema, findSchema, getAttr, getEl, getEls, w } from "./utils";

const isString = (s: string, _json: JsonPayload) => !!s
const isNumber = (s: string, _json: JsonPayload) => !isNaN(parseFloat(s));
const isBoolean = (s: string, _json: JsonPayload) =>
  s === "" || s.toLowerCase() === "true" || s.toLowerCase() === "false";
const isGraphProp = (s: string, _json: JsonPayload) =>
  graphConfigKeys.includes(s as any);
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

export const typeValidators = {
  string: isString,
  number: isNumber,
  boolean: isBoolean,
  graphProp: isGraphProp,
  variable: isVariable,
  parameter: isParameter,
  range: isRange,
  formId: isFormId,
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
        const foundS = findSchema(schema, el);
        if (!foundS) {
          error(el, elMsg =>
            `Unknown set of attributes for ${elMsg}`
          );
          return;
        } else {
          attrSchema = foundS;
        }
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

export const validateHtml = (store: string, json: JsonPayload) => {
  validateStoreAttr();
  validateStructure(store, json);
  validateLink("par", "parCfg", ["store", "par"]);
  validateLink("plot", "graphCfg", ["store", "id"], el => !!getAttr("id", el));
};
