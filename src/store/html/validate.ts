import { attrsEq, error, expectAttrs, expectSchema, findSchema, getAttr, getEl, getEls, w } from "./utils";
import { JsonPayload } from "../types";
import { all, callIfDuplicate, objFromVals, splitComma } from "../utils";
import { Attribute, AttrSchema, AttrType, ClassName, schemas, typeValidators } from "./schema";

const validateStoreAttr = () => {
  schemas.forEach(s => {
    getEls(s.class).forEach(el => expectAttrs(["store"], el));
  });
};

const validateSingleAttrs = (attrsSchema: AttrSchema[], el: Element, json: JsonPayload) => {
  attrsSchema.forEach(a => {
    const val = getAttr(a.name, el);

    // optional
    if (val === null) {
      if (!a.optional) {
        error(el, elMsg =>
          `Attribute "${w(a.name)}" missing from ${elMsg}`
        );
      }
      return;
    }

    // type
    const type: AttrType = a.type || "string";
    const validator = typeValidators[type];
    const isValid = a.isArray
      ? all(splitComma(val)!.map(v => validator(v, json)))
      : validator(val, json);
    if (!isValid) {
      const typeMsg = a.isArray
        ? `array of ${type}s`
        : type
      error(el, elMsg =>
        `Cannot parse "${w(a.name)}" on ${elMsg} into type ${typeMsg}`
      );
    }
  });
};


const validateStructure = (store: string, json: JsonPayload) => {
  schemas.forEach(scheme => {
    const els = getEls(scheme.class, { store });

    els.forEach(el => {
      let attrSchema: AttrSchema[];
      if ("attrs" in scheme) {
        expectSchema(scheme.attrs, el);
        attrSchema = scheme.attrs;
      } else {
        const foundS = findSchema(scheme, el);
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

    if ("uniqueBy" in scheme) {
      callIfDuplicate(els, attrsEq(scheme.uniqueBy), el => {
        const uniqueMsg = scheme.uniqueBy.map(w).join(", ");
        error(el, elMsg =>
          `All ${w(scheme.class)} need to be unique by ${uniqueMsg} values but ${elMsg} was not`
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

    const attrs = objFromVals(
      by,
      a => getAttr(a, el)!
    );

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
