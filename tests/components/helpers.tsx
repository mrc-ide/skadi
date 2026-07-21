import { test as baseTest, vi } from "vitest";
import { config, fixedParamSets, model } from "./mockJson.ts";
import { htmlAppend, htmlClear } from "../store/html/helpers.ts";
import { getStores, storeContexts } from "../../src/store/index.tsx";
import { JSX, useContext } from "solid-js";
import { render } from "@solidjs/testing-library";

export const test = baseTest
  .extend("component", async ({}, { onCleanup }) => {
    const oldFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: string) => {
      let res: any;
      const filename = url.split("/").at(-1)!.split(".")[0];
      if (filename === "config") {
        res = config;
      } else if (filename === "fixedParamSets") {
        res = fixedParamSets;
      } else if (filename === "model") {
        res = model
      } else {
        throw new Error("file has not been mocked");
      }
      return { json: async () => res };
    }) as any;

    htmlAppend(`
      <!-- Config for basic store -->
      <div class="w-store-cfg"
           w-store="basic"
           w-sync="yRange"></div>
      
      <div class="w-graph-cfg"
           w-id="1"
           w-store="basic"
           w-vars="R, I"></div>

      <div class="w-par-cfg"
           w-store="basic"
           w-par="beta"
           w-val="4"
           w-min="1"
           w-max="6"
           w-step="0.1"></div>

      <div class="w-par-cfg"
           w-store="basic"
           w-par="sigma"
           w-val="2"
           w-min="0"
           w-max="2.5"
           w-step="0.1"></div>

      <!-- Visual elements -->
      <div class="w-par" w-store="basic" w-par="beta"></div>
      <div class="w-par" w-store="basic" w-par="beta"></div>
      <div class="w-par" w-store="basic" w-par="sigma"></div>

      <div class="graph-container">
        <div class="w-plot" w-id="1"></div>
        <div class="w-plot" w-id="1"></div>
        <div class="w-plot" w-store="basic" w-vars="S, I"></div>
      </div>
    `);

    const StoreProvider = (await getStores())["basic"];
    const store = useContext(storeContexts["basic"])!;
    
    const setParamsSpy = vi.spyOn(store, "setParams");
    const setGraphDataSpy = vi.spyOn(store, "setGraphData");

    const renderWithStore = (getJsx: () => JSX.Element) => 
      render(() => <StoreProvider>{getJsx()}</StoreProvider>);

    onCleanup(() => {
      htmlClear();
      globalThis.fetch = oldFetch;
    });

    return {
      store,
      setParamsSpy,
      setGraphDataSpy,
      render: renderWithStore
    };
  });
