import path from "node:path";
import { processArgs } from "./args";
import fs from "node:fs";
import { validateFixedParamSetIdNotMain, validateFormAssets, validateFormDefault, validateIdUnique, validateJsonSchema } from "../schemas/json/validate";
import { getJsonSchema, JsonFileName } from "../schemas/json/schema";

const { configPath } = processArgs();

const clearAndMakeDir = (path: string) => {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { recursive: true });
  }
  fs.mkdirSync(path);
};

const getModelJson = async (storePath: string) => {
  const model = fs.readFileSync(path.resolve(storePath, "model.R"))
    .toString()
    .split("\n");

  const res = await fetch("http://localhost:8001/compile2", {
    method: "POST",
    body: JSON.stringify({ model }),
    headers: { "content-type": "application/json" }
  });
  const resJson = await res.json();

  return {
    generator: resJson.data.model,
    metadata: resJson.data.metadata,
  };
};

const getJson = (storePath: string, fileName: JsonFileName) => {
  const filePath = path.resolve(storePath, `${fileName}.json`);
  const fileContents = fs.readFileSync(filePath).toString();
  return JSON.parse(fileContents);
};

const writeJson = async (destPath: string, fileName: JsonFileName, content: any) => {
  const filePath = path.resolve(destPath, `${fileName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content));
};

const main = async () => {
  const storesPath = path.resolve(configPath, "stores")
  const stores = fs.readdirSync(storesPath, { recursive: false }) as string[];

  // destination is ./build dir in config path
  const destPath = path.resolve(configPath, "build");
  clearAndMakeDir(destPath);

  const destStoresPath = path.resolve(destPath, "stores");
  clearAndMakeDir(destStoresPath);

  // copy in their config specific files (assets to come soon)
  fs.cpSync(path.resolve(configPath, "index.html"), path.resolve(destPath, "index.html"));

  // make folder per store with config.json (their config + default code) and
  // model.json (model response from odin.api)
  stores.forEach(async store => {
    const destStorePath = path.resolve(destStoresPath, store);
    const storePath = path.resolve(storesPath, store);

    fs.mkdirSync(destStorePath);

    const model = await getModelJson(storePath);
    const { metadata } = model;
    validateJsonSchema(model, getJsonSchema("model"), metadata);
    writeJson(destStorePath, "model", model);

    const config = getJson(storePath, "config");
    validateJsonSchema(config, getJsonSchema("config"), metadata);
    writeJson(destStorePath, "config", config);

    const fixedParamSets = getJson(storePath, "fixedParamSets");
    validateJsonSchema(fixedParamSets, getJsonSchema("fixedParamSets"), metadata);
    validateFixedParamSetIdNotMain(fixedParamSets);
    validateIdUnique("fixedParamSets", fixedParamSets);
    writeJson(destStorePath, "fixedParamSets", fixedParamSets);

    const formsPath = path.resolve(storePath, "forms.json");
    const formAssetsPath = path.resolve(storePath, "forms.json");
    if (fs.existsSync(formsPath)) {
      if (!fs.existsSync(formAssetsPath)) {
        throw new Error(`Expected folder ${formAssetsPath} as ${formsPath} exists`);
      }
      const forms = getJson(storePath, "forms");
      validateJsonSchema(forms, getJsonSchema("forms"), metadata);
      validateIdUnique("forms", forms);
      validateFormDefault(forms);
      validateFormAssets(storePath, forms, metadata);

      writeJson(destStorePath, "forms", forms);
      fs.cpSync(
        path.resolve(storePath, "formAssets"),
        path.resolve(destStorePath, "formAssets"),
        { recursive: true }
      );
    }
  });
};

main();
