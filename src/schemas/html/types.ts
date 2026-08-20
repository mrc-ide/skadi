import { SyncableKey } from "../../store/graph/class"
import { Concrete, Prettify, Range, Values } from "../../utils/types"
import { HtmlSchemas } from "./schema"

type BaseAttrType =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "syncableKey" }
  | { type: "variable" }
  | { type: "parameter" }
  | { type: "formId" }
  | { type: "fixedId" }

export type AttrType =
  | BaseAttrType
  | { type: "array", items: BaseAttrType }
  | { type: "range" }

export type AttrSchemaSatisfies<T = string> = {
  name: T,
  optional?: true,
} & AttrType

export type OneOfAttrs = { type: string, attrs: AttrSchemaSatisfies[] }

export type HtmlSchemaSatisfies = {
  class: string,
  uniqueBy?: string[],
} & (
  | { attrs: AttrSchemaSatisfies[] }
  | { oneOf: OneOfAttrs[] }
)

// schema.ts file
// ---------------------------------------------------------- //

type GetAttrType<T extends AttrType> =
  T["type"] extends "string" | "parameter" | "variable" | "formId" | "fixedId" ? string :
  T["type"] extends "number" ? number :
  T["type"] extends "boolean" ? boolean :
  T["type"] extends "syncableKey" ? SyncableKey :
  T["type"] extends "range" ? Range :
  T extends { type: "array", items: infer R extends BaseAttrType } ? GetAttrType<R>[] :
  never

type OmitStore<T extends object> = Prettify<Omit<T, "store">>

type GetAttrObject<R extends AttrSchemaSatisfies[]> = OmitStore<
  { [K in R[number] as K["optional"] extends true ? K["name"] : never]?: GetAttrType<K> } &
  { [K in R[number] as K["optional"] extends true ? never : K["name"]]: GetAttrType<K> }
>

export type ParsedHtml = Prettify<{
  [S in HtmlSchemas[number] as S["class"]]:
    S extends { attrs: AttrSchemaSatisfies[] } ? GetAttrObject<S["attrs"]>[] :
    S extends { oneOf: OneOfAttrs[] } ? Values<{
      [K in S["oneOf"][number] as K["type"]]: GetAttrObject<K["attrs"]>
    }>[] :
    never
}>

export type GraphConfigWithFixedId = Concrete<
  Omit<ParsedHtml["graphCfg"][number], "store" | "id">
>

export type GraphConfig = Omit<GraphConfigWithFixedId, "fixedid">

type PlotHtml = ParsedHtml["plot"][number]

export type GraphHtmlMetadata = { id: string } & (
  | { type: "cfg", config: Extract<PlotHtml, { fixedid?: string[] | undefined }> }
  | { type: "diff", config: Extract<PlotHtml, { fixedid1: string }> }
)

export type ParsedAndProcessedHtml = {
  parsed: ParsedHtml,
  processed: {
    plot: GraphHtmlMetadata[],
    vars: string[],
  }
}
