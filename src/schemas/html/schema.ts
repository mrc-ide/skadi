import { AttrSchemaSatisfies, HtmlSchemaSatisfies } from "./types";

export const graphConfigSchema = [
  { name: "vars", optional: true, type: "array", items: { type: "variable"} },
  { name: "xrange", optional: true, type: "range" },
  { name: "yrange", optional: true, type: "range" },
  { name: "ylog", optional: true, type: "boolean" },
  { name: "ylock", optional: true, type: "boolean" },
  { name: "xlock", optional: true, type: "boolean" },
] as const satisfies AttrSchemaSatisfies[];

export const htmlSchemas = [
  {
    class: "storeCfg",
    uniqueBy: ["store"],
    attrs: [
      { name: "store", type: "string" },
      { name: "sync", optional: true, type: "array", items: { type: "syncableKey" } },
    ]
  },
  {
    class: "graphCfg",
    uniqueBy: ["id", "store"],
    attrs: [
      { name: "store", type: "string" },
      { name: "id", type: "string" },
      ...graphConfigSchema,
      { name: "fixedid", optional: true, type: "array", items: { type: "fixedId" } },
    ]
  },
  {
    class: "parCfg",
    uniqueBy: ["store", "par"],
    attrs: [
      { name: "store", type: "string" },
      { name: "par", type: "parameter" },
      { name: "val", type: "number" },
      { name: "min", type: "number" },
      { name: "max", type: "number" },
      { name: "step", optional: true, type: "number" },
    ]
  },
  {
    class: "par",
    attrs: [
      { name: "store", type: "string" },
      { name: "par", type: "parameter" },
    ]
  },
  {
    class: "plot",
    oneOf: [
      {
        type: "ref",
        attrs: [
          { name: "store", type: "string" },
          { name: "id", type: "string" },
        ]
      },
      {
        type: "cfg",
        attrs: [
          { name: "store", type: "string" },
          ...graphConfigSchema,
          { name: "fixedid", optional: true, type: "array", items: { type: "fixedId" } },
        ]
      },
      {
        type: "diff",
        attrs: [
          { name: "store", type: "string" },
          ...graphConfigSchema,
          { name: "fixedid1", type: "fixedId" },
          { name: "fixedid2", type: "fixedId" },
        ]
      },
    ]
  },
  {
    class: "form",
    attrs: [
      { name: "store", type: "string" },
      { name: "formid", type: "formId" },
    ]
  },
] as const satisfies HtmlSchemaSatisfies[];
export type HtmlSchemas = typeof htmlSchemas;

export const classNames = htmlSchemas.map(s => s.class);
export type ClassName = (typeof classNames)[number]

export const attributes = htmlSchemas.flatMap(
  scheme => "attrs" in scheme
    ? scheme.attrs.map(a => a.name)
    : scheme.oneOf.flatMap(s => s.attrs.map(a => a.name))
);
export type Attribute =
  | (typeof attributes)[number]
  | "error"
  | "storeid"

export type AttrSchema = AttrSchemaSatisfies<Attribute>

export const graphConfigKeys = graphConfigSchema.map(g => g.name);

export const plotTypes = htmlSchemas
  .find(s => s.class === "plot")!.oneOf
  .map(s => s.type);
export type PlotType = (typeof plotTypes)[number];
