import { Concrete, Prettify, Range, Values } from "../../utils/types"
import { graphConfigSchema, HtmlSchemas } from "./schema"

type BaseAttrType =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "graphProp" }
  | { type: "variable" }
  | { type: "parameter" }

export type AttrType =
  | BaseAttrType
  | { type: "array", items: BaseAttrType }
  | { type: "range" }

export type AttrSchemaSatisfies<T = string> = {
  name: T,
  optional?: true,
} & AttrType

export type HtmlSchemaSatisfies = {
  class: string,
  uniqueBy?: string[],
} & ({ attrs: AttrSchemaSatisfies[] } | { oneOf: AttrSchemaSatisfies[][] })

// schema.ts file
// ---------------------------------------------------------- //

type GetAttrType<T extends AttrType> =
  T["type"] extends "string" | "parameter" | "variable" ? string :
  T["type"] extends "number" ? number :
  T["type"] extends "boolean" ? boolean :
  T["type"] extends "graphProp" ? (typeof graphConfigSchema)[number]["name"] :
  T["type"] extends "range" ? Range :
  T extends { type: "array", items: infer R extends BaseAttrType } ? GetAttrType<R>[] :
  never

type OmitStore<T extends object> = Prettify<Omit<T, "store">>

type GetAttrObject<R extends AttrSchemaSatisfies[]> = OmitStore<
  { [K in R[number] as K["optional"] extends true ? K["name"] : never]?: GetAttrType<K> } &
  { [K in R[number] as K["optional"] extends true ? never : K["name"]]: GetAttrType<K> }
>

type AttrNameJoin<T extends AttrSchemaSatisfies[], S extends string = ""> =
  T extends [] ? S :
  T extends [infer F extends AttrSchemaSatisfies, ...infer R extends AttrSchemaSatisfies[]]
    ? AttrNameJoin<R, `${F["name"]}_${S}`>
    : never

export type ParsedHtml = Prettify<{
  [S in HtmlSchemas[number] as S["class"]]:
    S extends { attrs: AttrSchemaSatisfies[] } ? GetAttrObject<S["attrs"]>[] :
    S extends { oneOf: AttrSchemaSatisfies[][] } ? Values<{
      [K in S["oneOf"][number] as AttrNameJoin<K>]: GetAttrObject<K>
    }>[] :
    never
}>

export type GraphConfig = Concrete<Omit<ParsedHtml["graphCfg"][number], "store" | "id">>

export type GraphHtmlMetadata = {
  id: string, config: Partial<GraphConfig>
}

export type ParsedAndProcessedHtml = {
  parsed: ParsedHtml,
  processed: {
    plot: GraphHtmlMetadata[],
    vars: string[],
  }
}
