import { GraphConfig, graphConfigKeys, JsonPayload, Range } from "../types";
import { Prettify, splitComma } from "../utils";

const isString = (s: string, _json: JsonPayload) => !!s
const isNumber = (s: string, _json: JsonPayload) => !isNaN(parseFloat(s));
const isBoolean = (s: string, _json: JsonPayload) =>
  s === "" || s.toLowerCase() === "true" || s.toLowerCase() === "false";
const isGraphProp = (s: string, _json: JsonPayload) => graphConfigKeys.includes(s as any);
const isVariable = (s: string, json: JsonPayload) =>
  json.model.metadata.variables.map(v => v.name).includes(s as any);
const isParameter = (s: string, json: JsonPayload) =>
  json.model.metadata.parameters.map(v => v.name).includes(s as any);
const isRange = (s: string, json: JsonPayload) => {
  const vals = splitComma(s);
  if (vals?.length !== 2) return false;
  return isNumber(vals[0], json) && isNumber(vals[1], json);
};

export const typeValidators = {
  string: isString,
  number: isNumber,
  boolean: isBoolean,
  graphProp: isGraphProp,
  variable: isVariable,
  parameter: isParameter,
  range: isRange,
} as const;
export type AttrType = keyof typeof typeValidators

const parseString = (s: string) => s
const parseNumber = (s: string) => parseFloat(s);
const parseBoolean = (s: string) => s === "" || s.toLowerCase() === "true";
const parseGraphProp = (s: string) => graphConfigKeys.find(g => g === s)!;
const parseVariable = (s: string) => s
const parseParameter = (s: string) => s
const parseRange = (s: string) => splitComma(s)!.map(parseNumber) as Range;

export const typeParsers = {
  string: parseString,
  number: parseNumber,
  boolean: parseBoolean,
  graphProp: parseGraphProp,
  variable: parseVariable,
  parameter: parseParameter,
  range: parseRange,
} as const;

// We automatically add a `w-` prefix to these attr names,
// e.g. `w-store`
type AttrSchemaSatisfies = {
  name: string,
  optional?: boolean,
  type?: AttrType,
  isArray?: boolean,
}

type GraphConfigSchemaSatisfies = {
  name: keyof GraphConfig,
  optional?: true,
  type?: AttrType,
  isArray?: true,
}

// We automatically add a `w-` prefix to these classes,
// e.g. `w-storeCfg`
type Schema = {
  class: string,
  uniqueBy?: string[],
} & ({ attrs: AttrSchemaSatisfies[] } | { oneOf: AttrSchemaSatisfies[][] })

const graphConfigSchema = [
  { name: "vars", optional: true, type: "variable", isArray: true },
  { name: "xrange", optional: true, type: "range" },
  { name: "yrange", optional: true, type: "range" },
  { name: "ylog", optional: true, type: "boolean" },
] as const satisfies GraphConfigSchemaSatisfies[];

export const schemas = [
  {
    class: "storeCfg",
    uniqueBy: ["store"],
    attrs: [
      { name: "store" },
      { name: "sync", optional: true, type: "graphProp", isArray: true },
    ]
  },
  {
    class: "graphCfg",
    uniqueBy: ["id", "store"],
    attrs: [
      { name: "store" },
      { name: "id" },
      ...graphConfigSchema,
    ]
  },
  {
    class: "parCfg",
    uniqueBy: ["store", "par"],
    attrs: [
      { name: "store" },
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
      { name: "store" },
      { name: "par", type: "parameter" },
    ]
  },
  {
    class: "plot",
    oneOf: [
      [
        { name: "store" },
        { name: "id" },
      ],
      [
        { name: "store" },
        ...graphConfigSchema,
      ]
    ]
  },
] as const satisfies Schema[];
export type Schemas = typeof schemas;

export const classNames = schemas.map(s => s.class);
export type ClassName = (typeof classNames)[number]

export const attributes = schemas.flatMap(
  scheme =>
    "attrs" in scheme
      ? scheme.attrs.map(a => a.name)
      : scheme.oneOf.flatMap(attrs => attrs.map(a => a.name))
);
export type Attribute =
  | (typeof attributes)[number]
  | "error"
  | "storeid"

export type AttrSchema = Omit<AttrSchemaSatisfies, "name"> & {
  name: Attribute
}

type GetType<T extends AttrSchema> = unknown extends T["type"]
  ? "string"
  : T["type"]


type TypeParsers = typeof typeParsers
type IsTypeParserKey<K> = K extends keyof TypeParsers ? K : never
type GetTypeParser<T extends AttrSchema> =
  ReturnType<TypeParsers[IsTypeParserKey<GetType<T>>]>
type Optional<T extends AttrSchema, V> = unknown extends T["optional"]
  ? V
  : V | undefined
type MaybeArray<T extends AttrSchema, V> = unknown extends T["isArray"]
  ? V
  : V[]
type ParsedHtmlType<T extends AttrSchema> = Optional<
  T, MaybeArray<
    T, GetTypeParser<T>
  >
>
type SingleAttrSchema<S extends AttrSchema[]> = Prettify<{
  [K in S[number] as K["name"]]: ParsedHtmlType<K>
}>

type Values<T extends object> = Prettify<T[keyof T]>
type AllNames<T extends AttrSchema[], N extends string = ""> =
  T extends []
    ? N
    : T extends [infer F extends AttrSchema, ...infer R extends AttrSchema[]]
      ? AllNames<R, `${F["name"]}_${N}`>
      : never


export type ParsedHtml = Prettify<{
  [S in Schemas[number] as S["class"]]:
    S extends { attrs: infer R extends AttrSchema[] }
      ? SingleAttrSchema<R>[]
      : S extends { oneOf: infer R extends AttrSchema[][] }
        ? Values<{
          [K in R[number] as AllNames<K>]: SingleAttrSchema<K>
        }>[]
        : never
}>
