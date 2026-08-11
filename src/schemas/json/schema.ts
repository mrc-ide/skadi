import { JsonSchemaSatisfies, JsonType, ObjectProperty, StaticObjectProperty } from "./types";

const modelInfo = {
  type: "array",
  items: {
    type: "objectStatic",
    properties: [
      { key: "name", type: "string" }
    ]
  }
} as const satisfies JsonType;

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
        {
          key: "stroke",
          optional: true,
          type: "stringUnion",
          values: ["solid", "dot", "dash", "dotdash"]
        },
      ]
    }
  }
} as const satisfies StaticObjectProperty;

const parameterValue = {
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
    name: "model",
    type: "objectStatic",
    properties: [
      { key: "generator", type: "string" },
      {
        key: "metadata",
        type: "objectStatic",
        properties: [
          { key: "time", type: "stringUnion", values: ["discrete", "continuous"] },
          { key: "variables", ...modelInfo },
          { key: "parameters", ...modelInfo },
          { key: "data", ...modelInfo },
        ]
      },
    ]
  },
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
        { key: "id", type: "string" },
        {
          key: "static",
          optional: true,
          type: "object",
          properties: parameterValue,
        },
        {
          key: "user",
          optional: true,
          type: "object",
          properties: parameterValue,
        },
        styles
      ]
    }
  },
  {
    name: "forms",
    type: "array",
    items: {
      type: "objectStatic",
      properties: [
        { key: "id", type: "string" },
        {
          key: "fields",
          type: "array",
          items: {
            type: "objectStatic",
            properties: [
              { key: "label", type: "string" },
              { key: "default", type: "string" },
              {
                key: "options",
                type: "array",
                items: {
                  type: "objectStatic",
                  properties: [
                    { key: "id", type: "string" },
                    { key: "label", type: "string" },
                  ]
                }
              },
            ]
          }
        }
      ]
    }
  }
] as const satisfies JsonSchemaSatisfies[];
export type JsonSchemas = typeof jsonSchemas;

export type JsonFileName = JsonSchemas[number]["name"];

export const getJsonSchema = (findName: JsonFileName) =>
  jsonSchemas.find(({ name }) => name === findName)!;

export const formAssetType = {
  type: "object",
  properties: parameterValue,
} as const satisfies JsonType;
