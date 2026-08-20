import { Concrete, Prettify, Values } from "../../utils/types"
import { JsonSchemas } from "./schema"

export type StaticObjectProperty = WithJsonType<{ key: string, optional?: true }>
export type ObjectProperty = { key: JsonType, value: JsonType }

export type JsonType =
  | { type: "string" }
  | { type: "number" }
  | { type: "variable" }
  | { type: "parameter" }
  | { type: "array", items: JsonType }
  | { type: "object", properties: ObjectProperty }
  | { type: "objectStatic", properties: StaticObjectProperty[] }
  | { type: "oneOf", possibilities: JsonType[] }
  | { type: "stringUnion", values: string[] }

type WithJsonType<T> = T & JsonType;
export type JsonSchemaSatisfies = WithJsonType<{ name: string }>

// schema.ts file
// ---------------------------------------------------------- //

type OptionalObject<R extends StaticObjectProperty[]> = Prettify<
  { [K in R[number] as K["optional"] extends true ? K["key"] : never]?: GetJsonType<K> } &
  { [K in R[number] as K["optional"] extends true ? never : K["key"]]: GetJsonType<K> }
>

type GetJsonType<T extends JsonType> =
  T["type"] extends "string" | "parameter" | "variable" ? string :
  T["type"] extends "number" ? number :
  T extends { type: "stringUnion", values: string[] } ? T["values"][number] :
  T extends { type: "array", items: infer R extends JsonType } ? GetJsonType<R>[] :
  T extends {
    type: "object",
    properties: { value: infer V extends JsonType }
  } ? Record<string, GetJsonType<V>> :
  T extends {
    type: "objectStatic",
    properties: infer R extends StaticObjectProperty[]
  } ? OptionalObject<R> :
  // this type will only work if possibilities types are
  // different, will not work for two types that are both
  // object for example
  T extends {
    type: "oneOf",
    possibilities: infer P extends JsonType[],
  } ? Values<{ [K in P[number] as K["type"]]: GetJsonType<K> }> :
  never

export type JsonPayload = Prettify<{
  [S in JsonSchemas[number] as S["name"]]: GetJsonType<S>
}>

export type Model = JsonPayload["model"]
export type ModelMetadata = JsonPayload["model"]["metadata"]
export type FixedParamSet = JsonPayload["fixedParamSets"]
export type Params = Concrete<
  Omit<NonNullable<JsonPayload["fixedParamSets"][number]>, "styles" | "id">
>
export type ParamValues = NonNullable<JsonPayload["fixedParamSets"][number]["user"]>
export type ParamValue = ParamValues[string]
export type Config = JsonPayload["config"]
export type LineStyle = NonNullable<JsonPayload["config"]["styles"]>[string]
export type LineStyles = NonNullable<JsonPayload["config"]["styles"]>
export type Stroke = NonNullable<LineStyle["stroke"]>
export type FormConfig = JsonPayload["forms"][number]
export type FormField = FormConfig["fields"][number]
export type FormIdLabel = FormField["options"][number]
