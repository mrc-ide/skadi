import path from "node:path";
import { JsonType, ModelMetadata } from "./types";
import { isNullish, objForEach, tryResult } from "../../utils";
import { JsonSchemas } from "./schema";

const typeValidators = {
  string: (x: any, _metadata: ModelMetadata) => typeof x === "string",
  number: (x: any, _metadata: ModelMetadata) => typeof x === "number",
  variable: (s: string, metadata: ModelMetadata) =>
    metadata.variables.map(v => v.name).includes(s as any),
  parameter: (s: string, metadata: ModelMetadata) =>
    metadata.parameters.map(v => v.name).includes(s as any),
} as const;

// these are used in more custom way than how typeValidators is used
const isObject = (x: any) => typeof x === 'object' && !Array.isArray(x) && x !== null;
const isArray = (x: any) => typeof x === 'object' && Array.isArray(x);

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
      if (p.optional && isNullish(json[p.key])) return;
      if (!p.optional && isNullish(json[p.key]))
        error("expected key to be defined", [...path, `(key: ${p.key})`]);
      validateJsonType(json[p.key], p, [...path, p.key], metadata);
    });

    const allKeys = jsonType.properties.map(p => p.key);
    objForEach(json, (k: string) => !allKeys.includes(k)
      ? error("unknown key", [...path, k])
      : null
    );

  } else if (jsonType.type === "object") {
    if (!isObject(json)) error("expected an object", path);
    const { key, value } = jsonType.properties;
    objForEach(json, (k: string, v) => {
      validateJsonType(k, key, [...path, `(key: ${k})`], metadata);
      validateJsonType(v, value, [...path, k], metadata);
    });

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
      const { success } = tryResult(() => validateJsonType(json, p, path, metadata));
      if (!success) continue;
      foundOne = true;
      break;
    }
    if (!foundOne) error("type does not match set of types allowed", path);

  } else if (jsonType.type === "stringUnion") {
    const { values } = jsonType;
    if (!values.includes(json)) error(`expected one of ${values.join(", ")}`, path);

  } else {
    const { type } = jsonType;
    const validator = typeValidators[type];
    if (!validator(json, metadata)) error(`expected a ${type}`, path);
  }
};

export const validateJsonSchema = (
  storePath: string,
  json: any,
  schema: JsonSchemas[number],
  metadata: ModelMetadata,
) => {
  const filePath = path.resolve(storePath, `${schema.name}.json`);
  validateJsonType(json, schema, [`(${filePath})`], metadata);
};
