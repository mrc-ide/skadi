import path from "node:path";
import fs from "node:fs";
import { objForEach, Prettify } from "../store/utils";
import { ModelMetadata } from "../store/types";

type StaticObjectProperty = WithJsonType<{ key: string, optional?: true }>
type ObjectProperty = { key: JsonType, value: JsonType }

type JsonType =
  | { type: "string" }
  | { type: "number" }
  | { type: "variable" }
  | { type: "parameter" }
  | { type: "array", items: JsonType }
  | {
    type: "object",
    properties: ObjectProperty
  }
  | {
    type: "objectStatic",
    properties: StaticObjectProperty[]
  }
  | { type: "oneOf", possibilities: JsonType[] }

type WithJsonType<T> = T & JsonType;
type JsonSchemaSatisfies = WithJsonType<{ name: string }>

const styles = {
  key: "styles",
  optional: true,
  type: "object",
  properties: {
    key: { type: "variable" },
    value: {
      type: "objectStatic",
      properties: [
        { key: "color", optional: true, type: "string" },
        { key: "width", optional: true, type: "number" },
        { key: "stroke", optional: true, type: "string" },
      ]
    }
  }
} as const satisfies StaticObjectProperty;

const parameterValues = {
  key: { type: "parameter" },
  value: {
    type: "oneOf",
    possibilities: [
      { type: "number" },
      { type: "array", items: { type: "number" } }
    ]
  }
} as const satisfies ObjectProperty;

export const jsonSchemas = [
  {
    name: "config",
    type: "objectStatic",
    properties: [
      { key: "startTime", optional: true, type: "number" },
      { key: "endTime", type: "number" },
      { key: "particles", type: "number" },
      { key: "dt", optional: true, type: "number" },
      styles,
    ]
  },
  {
    name: "fixedParamSets",
    type: "array",
    items: {
      type: "objectStatic",
      properties: [
        {
          key: "static",
          optional: true,
          type: "object",
          properties: parameterValues,
        },
        {
          key: "user",
          optional: true,
          type: "object",
          properties: parameterValues,
        },
        styles
      ]
    }
  }
] as const satisfies JsonSchemaSatisfies[];
export type JsonSchemas = typeof jsonSchemas;

type Values<T extends object> = Prettify<T[keyof T]>;

type GetJsonType<T extends JsonType> =
  T["type"] extends "string" | "parameter" | "variable" ? string :
  T["type"] extends "number" ? number :
  T extends { type: "array", items: infer R extends JsonType } ? GetJsonType<R>[] :
  T extends {
    type: "object",
    properties: { value: infer V extends JsonType }
  } ? Record<string, GetJsonType<V>> :
  T extends {
    type: "objectStatic",
    properties: infer R extends StaticObjectProperty[]
  } ? { [K in R[number] as K["key"]]: GetJsonType<K> } :
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

const isObject = (x: any) =>
  typeof x === 'object' && !Array.isArray(x) && x !== null;
const isArray = (x: any) =>
  typeof x === 'object' && Array.isArray(x);

const isString = (x: any, _metadata: ModelMetadata) => typeof x === "string";
const isNumber = (x: any, _metadata: ModelMetadata) => typeof x === "number";
const isVariable = (s: string, metadata: ModelMetadata) =>
  metadata.variables.map(v => v.name).includes(s as any);
const isParameter = (s: string, metadata: ModelMetadata) =>
  metadata.parameters.map(v => v.name).includes(s as any);

const typeValidators = {
  string: isString,
  number: isNumber,
  variable: isVariable,
  parameter: isParameter,
} as const;

const error = (msg: string, path: string[]) => {
  const pathMsg = path.join(".");
  const errMsg = `Error at ${pathMsg}: ${msg}`;
  throw new Error(errMsg);
};

const validateJsonType = (
  json: any,
  jsonType: JsonType,
  path: string[],
  metadata: ModelMetadata,
) => {
  if (jsonType.type === "objectStatic") {
    if (!isObject(json)) error("expected an object", path);
    jsonType.properties.forEach(p => {
      if (p.optional && (json[p.key] === undefined || json[p.key] === null)) return;
      validateJsonType(json[p.key], p, [...path, p.key], metadata);
    });

    const allKeys = jsonType.properties.map(p => p.key);
    objForEach(
      json,
      (k: string) => !allKeys.includes(k)
        ? error("unknown key", [...path, k])
        : null
    )
  } else if (jsonType.type === "object") {
    if (!isObject(json)) error("expected an object", path);
    const { key, value } = jsonType.properties;
    objForEach(
      json,
      (k: string, v) => {
        validateJsonType(k, key, [...path, `(key: ${k})`], metadata);
        validateJsonType(v, value, [...path, k], metadata);
      }
    );
  } else if (jsonType.type === "array") {
    if (!isArray(json)) error("expected an array", path);
    json.forEach((el: any, idx: number) => {
      validateJsonType(el, jsonType.items, [...path, `${idx}`], metadata);
    });
  } else if (jsonType.type === "oneOf") {
    const { possibilities } = jsonType;
    let foundOne = false;
    for (let i = 0; i < possibilities.length; i++) {
      const p = possibilities[i];
      try {
        validateJsonType(json, p, path, metadata)
      } catch {
        continue
      }
      foundOne = true;
      break;
    }
    if (!foundOne) error("type does not match set of types allowed", path);
  } else {
    const { type } = jsonType;
    const validator = typeValidators[type];
    if (!validator(json, metadata)) error(`expected a ${type}`, path);
  }
};

export const validateJsonSchemas = (
  storePath: string,
  metadata: ModelMetadata,
) => {
  jsonSchemas.forEach(s => {
    const filePath = path.resolve(storePath, `${s.name}.json`);
    const fileContents = fs.readFileSync(filePath).toString();
    validateJsonType(JSON.parse(fileContents), s, [`(${filePath})`], metadata);
  })
};
