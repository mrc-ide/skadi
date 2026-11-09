import { describe, expect, test } from "vitest";
import { JsonType, ModelMetadata } from "../../../src/schemas/json/types";
import { validateJsonType } from "../../../src/schemas/json/validate";

describe("validateJsonType", () => {
  const modelMetadata: ModelMetadata = {
    time: "continuous",
    variables: ["v1", "v2"].map(name => ({ name })),
    parameters: ["p1", "p2"].map(name => ({ name })),
    data: ["d1", "d2"].map(name => ({ name })),
  };

  const expectValidateErr = (
    jsonType: JsonType,
    json: any,
    errMsgs: string[] | null = null,
  ) => {
    const filename = "foo.json";
    const validate = () => validateJsonType(json, jsonType, [filename], modelMetadata);
    if (!errMsgs) {
      expect(validate).not.toThrow()
    } else {
      errMsgs.push(filename)
      const lookAheads = errMsgs.map(msg => `(?=.*${msg})`).join("");
      const errRegex = new RegExp(`^${lookAheads}.*`, "i");
      expect(validate).toThrow(errRegex);
    }
  };

  test("error if object not given when expected", () => {
    expectValidateErr(
      {
        type: "objectStatic",
        properties: []
      },
      "hey",
      ["expected an object"]
    );

    expectValidateErr(
      {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string" },
        }
      },
      "hey",
      ["expected an object"]
    );
  });

  test("error if key not given when expected", () => {
    expectValidateErr(
      {
        type: "objectStatic",
        properties: [
          { key: "x", type: "number" }
        ]
      },
      { y: 2 },
      ["expected key to be defined", "key: x"]
    );
  });

  test("error if extra key given", () => {
    expectValidateErr(
      {
        type: "objectStatic",
        properties: [
          { key: "x", type: "number" }
        ]
      },
      { y: 2, x: 1 },
      ["unknown key"]
    );
  });

  test("recursively validates objects", () => {
    expectValidateErr(
      {
        type: "objectStatic",
        properties: [
          {
            key: "x", type: "object",
            properties: {
              key: { type: "string" },
              value: { type: "number" },
            }
          }
        ]
      },
      { x: { a: 2 } },
    );
  });

  test("error if array not given when expected", () => {
    expectValidateErr(
      {
        type: "array",
        items: { type: "string" }
      },
      "hey",
      ["expected an array"]
    );
  });

  test("error if array items incorrect", () => {
    expectValidateErr(
      {
        type: "array",
        items: { type: "number" }
      },
      [1, "whoops", 3],
      // .1 here is the index of incorrect element
      ["expected a number", ".1"]
    );
  });

  test("error if oneOf types not found", () => {
    const jsonType: JsonType = {
      type: "oneOf",
      possibilities: [
        { type: "number" },
        { type: "string" }
      ]
    };
    expectValidateErr(jsonType, 3);
    expectValidateErr(jsonType, "hey");
    expectValidateErr(jsonType, {}, ["type does not match set"]);
  });
});
