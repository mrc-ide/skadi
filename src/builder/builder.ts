import path from "node:path";
import { processArgs } from "./args";
import fs from "node:fs";

const { configPath } = processArgs();

const clearAndMakeDir = (path: string) => {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { recursive: true });
  }
  fs.mkdirSync(path);
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

    fs.cpSync(
      path.resolve(storePath, "config.json"),
      path.resolve(destStorePath, "config.json")
    );

    fs.cpSync(
      path.resolve(storePath, "fixedParamSets.json"),
      path.resolve(destStorePath, "fixedParamSets.json")
    );

    fs.cpSync(
      path.resolve(storePath, "forms.json"),
      path.resolve(destStorePath, "forms.json")
    );
    
    fs.cpSync(
      path.resolve(storePath, "formAssets"),
      path.resolve(destStorePath, "formAssets"),
      { recursive: true }
    );

    const model = fs.readFileSync(path.resolve(storesPath, store, "model.R"))
      .toString()
      .split("\n");

    const res = await fetch("http://localhost:8001/compile2", {
      method: "POST",
      body: JSON.stringify({ model }),
      headers: { "content-type": "application/json" }
    });
    const resJson = await res.json();

    const modelJson = {
      generator: resJson.data.model,
      metadata: resJson.data.metadata,
    }

    fs.writeFileSync(path.resolve(destStorePath, `model.json`), JSON.stringify(modelJson));
  });
};

main();
