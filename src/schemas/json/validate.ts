import path from "node:path";
import fs from "node:fs";
import { FormConfig, JsonType, ModelMetadata } from "./types";
import { isNullish, iterate, objForEach, tryResult } from "../../utils";
import { formAssetType, JsonSchemas } from "./schema";

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

export const validateJsonType = (
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
  json: any,
  schema: JsonSchemas[number],
  metadata: ModelMetadata,
) => {
  validateJsonType(json, schema, [`(${schema.name}.json)`], metadata);
};

export const validateFormDefault = (forms: FormConfig[]) => {
  forms.forEach((fg, fgIdx) => {
    fg.fields.forEach((f, fIdx) => {
      if (!f.options.find(op => op.id === f.default)) {
        error("default id does not exist in options", ["(forms.json)", `${fgIdx}`, `${fIdx}`]);
      }
    });
  });
};

export const validateFormAssets = (
  storePath: string,
  forms: FormConfig[],
  metadata: ModelMetadata
) => {
  const formAssetsPath = path.resolve(storePath, "formAssets");
  let allFiles = fs.readdirSync(formAssetsPath);

  const fieldIds = forms.flatMap(f => f.fields.map(f => f.options.map(op => op.id)));
  iterate(...fieldIds, async (...args) => {
    const fileName = args.slice(0, args.length / 2).join("__") + ".json";
    const filePath = path.resolve(formAssetsPath, fileName);
    allFiles = allFiles.filter(f => f !== fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} not found`);
    }
    
    const json = JSON.parse(fs.readFileSync(filePath).toString());
    validateJsonType(json, formAssetType, [`(${fileName})`], metadata);
  });

  if (allFiles.length > 0) {
    throw new Error(`Found extra files in ${formAssetsPath}: ${allFiles.join(", ")}`);
  }
};
