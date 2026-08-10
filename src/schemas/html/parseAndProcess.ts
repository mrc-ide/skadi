import { concatIfNotIn, objFrom, splitComma, zip } from "../../utils";
import { Range } from "../../utils/types";
import { JsonPayload } from "../json/types";
import { AttrSchema, graphConfigKeys, htmlSchemas } from "./schema";
import { GraphConfig, GraphHtmlMetadata, ParsedAndProcessedHtml, ParsedHtml } from "./types";
import { findSchema, getAttr, getEls, setAttr } from "./utils";

const parseNumber = (s: string) => parseFloat(s);
export const typeParsers = {
  string: (s: string) => s,
  number: parseNumber,
  boolean: (s: string) => s === "" || s.toLowerCase() === "true",
  graphProp: (s: string) => graphConfigKeys.find(g => g === s)!,
  variable: (s: string) => s,
  parameter: (s: string) => s,
  range: (s: string) => splitComma(s)!.map(parseNumber) as Range,
  formId: (s: string) => s,
} as const;

const parseSingleAttrs = (attrsSchema: AttrSchema[], el: Element) => {
  return objFrom(
    attrsSchema.filter(a => a.name !== "store"),
    a => a.name,
    a => {
      const val = getAttr(a.name, el);
      if (val === null || val === undefined) return;

      if (a.type === "array") {
        const parser = typeParsers[a.items.type];
        return splitComma(val)!.map(v => parser(v));
      } else {
        const parser = typeParsers[a.type];
        return parser(val);
      }
    }
  );
};

export const parseAndProcessHtml = (store: string, json: JsonPayload): ParsedAndProcessedHtml => {
  const parsed = objFrom(
    htmlSchemas,
    schema => schema.class,
    schema => {
      return getEls(schema.class, { store }).map(el => {
        const attrSchema = "attrs" in schema
          ? schema.attrs
          : findSchema(schema, el)!;
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
