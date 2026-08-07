import { GraphConfig, GraphHtmlMetadata, JsonPayload } from "../types";
import { concatIfNotIn, objFrom, splitComma, zip } from "../utils";
import { AttrSchema, AttrType, ParsedHtml, schemas, typeParsers } from "./schema";
import { findSchema, getAttr, getEls, setAttr } from "./utils";

const parseSingleAttrs = (attrsSchema: AttrSchema[], el: Element) => {
  return objFrom(
    attrsSchema.filter(a => a.name !== "store"),
    a => a.name,
    a => {
      const val = getAttr(a.name, el);
      if (val === null || val === undefined) return;

      const type: AttrType = a.type || "string";
      const parser = typeParsers[type];
      return a.isArray
        ? splitComma(val)!.map(v => parser(v))
        : parser(val);
    }
  );
};

export const processHtml = (store: string, json: JsonPayload) => {
  const parsed = objFrom(
    schemas,
    scheme => scheme.class,
    scheme => {
      return getEls(scheme.class, { store }).map(el => {
        const attrSchema = "attrs" in scheme
          ? scheme.attrs
          : findSchema(scheme, el)!;
        return parseSingleAttrs(attrSchema, el);
      });
    }
  ) as ParsedHtml;

  const plot = zip(parsed.plot, getEls("plot", { store }))
    .reduce((metadata, [cfg, el]) => {
      const storeid = getAttr("storeid", el);
      if (storeid) return metadata;

      // assign storeid to current graph or all graphs with matching
      // user id if provided
      const uuid = crypto.randomUUID();
      const id = getAttr("id", el);
      const elsWithId = id
        ? getEls("plot", { store, id })
        : [el]
      elsWithId.forEach(x => setAttr("storeid", uuid, x));

      // get config
      let config: Partial<GraphConfig>;
      if ("id" in cfg) {
        const foundCfg = parsed.graphCfg.find(g => g.id)!;
        // @ts-expect-error
        delete foundCfg.id;
        config = foundCfg;
      } else {
        config = cfg;
      }

      const m: GraphHtmlMetadata = { id: uuid, config };
      return [...metadata, m];
    }, [] as GraphHtmlMetadata[]);

  const allVars = json.model.metadata.variables.map(v => v.name);
  const vars = plot.reduce(
    (v, p) => p.config.vars ? concatIfNotIn(v, p.config.vars) : allVars,
    [] as string[]
  );

  return {
    parsed,
    processed: {
      plot, vars
    }
  };
};
