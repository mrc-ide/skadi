import { createEffect, createSignal, on } from "solid-js";
import { Form, GraphConfig, GraphConfigNoId, GraphData, GraphHtmlMetadata, HtmlMetadata, JsonDefinedFields, Params, Range, Store } from "./types";
import { deepCopy, getJson, pushIfNotIn } from "./utils";
import { System } from "@reside-ic/dust2";

export const getStoresInPage = () => {
  const stores = document.querySelectorAll("[data-w-store]")!;
  const storeInstancesInPage: string[] = []
  const storeNamesInPage: string[] = []
  stores.forEach(el => {
    const storeInstance = el.getAttribute("data-w-store")!;
    const storeName = storeInstance.split(":")[0];
    pushIfNotIn(storeInstancesInPage, storeInstance);
    pushIfNotIn(storeNamesInPage, storeName);
  });
  return { storeInstancesInPage, storeNamesInPage };
};

export const readJsonForStores = async (
  storeNamesInPage: string[]
): Promise<Record<string, JsonDefinedFields>> => {
  // flat array pattern is a bit more annoying to deal with but ensures we
  // wait for all promises concurrently

  const promises: Promise<any>[] = [];
  storeNamesInPage.forEach(s => {
    promises.push(getJson(s, "config"));
    promises.push(getJson(s, "model"));
    promises.push(getJson(s, "fixedParameterSets"));
  });

  const res = await Promise.all(promises);

  return Object.fromEntries(storeNamesInPage.map((s, idx) => {
    const flatIdx = idx * 3;
    return [
      s, {
        config: res[flatIdx],
        model: res[flatIdx + 1],
        staticParamSets: res[flatIdx + 2],
      }
    ];
  }));
};

const getHtmlMetadata = (
  storeInstance: string,
  modelMetadata: JsonDefinedFields["model"]["metadata"]
): HtmlMetadata => {
  const graphs = document.querySelectorAll(
    `.w-plot[data-w-store="${storeInstance}"]`
  );

  const userDefinedIdToUuid: Record<string, string> = {};
  const graphMetadata: GraphHtmlMetadata[] = [];
  const sync: (keyof GraphConfig)[] = [];
  let allVars: string[] = [];

  graphs.forEach(g => {
    const userDefinedId = g.getAttribute("w-id");
    let uuid: string;
    if (!userDefinedId) {
      uuid = crypto.randomUUID();
    } else {
      userDefinedIdToUuid[userDefinedId] ??= crypto.randomUUID();
      uuid = userDefinedIdToUuid[userDefinedId];
    }
    g.setAttribute("w-store-id", uuid);

    const varsStr = g.getAttribute("w-vars");
    const vars = varsStr?.split(",").map(s => s.trim());
    if (vars) {
      vars.forEach(v => pushIfNotIn(allVars, v));
    } else {
      allVars = modelMetadata.variables.map(v => v.name);
    }

    const xRangeStr = g.getAttribute("w-x-range");
    const xRange = xRangeStr?.split(",").map(s => s ? Number(s) : null) as Range | undefined;

    const yRangeStr = g.getAttribute("w-x-range");
    const yRange = yRangeStr?.split(",").map(s => s ? Number(s) : null) as Range | undefined;

    const yLogStr = g.getAttribute("w-y-log");
    const yLog = yLogStr === "true";

    if (!graphMetadata.find(g => g.id === uuid)) {
      graphMetadata.push({
        id: uuid, vars, xRange,
        yRange, yLog
      });
    }

    const syncsStr = g.getAttribute("w-sync");
    const syncs = syncsStr?.split(",").map(s => s.trim());
    if (syncs) syncs.forEach(s => pushIfNotIn(sync, s));
  });

  return { graphMetadata, sync, allVars };
};

const calculateGraphData = (fixed: Store["fixed"], params: Params) => {
  const { startTime, endTime, particles, dt } = fixed.config;
  const sys = System.createODE(
    fixed.model.generator as any,
    { ...params.static, ...params.user },
    startTime || 0,
    dt || 0.01,
    particles || 1,
  );

  sys.setStateInitial();

  const nPoints = 1000;
  const timeStep = (endTime - startTime) / nPoints;
  return sys.simulateByStateVariableName(
    Array.from({ length: nPoints }).map((_, i) => i * timeStep),
    fixed.htmlMetadata.allVars
  );
};

const addReactivity = (store: Store) => {
  createEffect(on(store.params, () => {
    const main = calculateGraphData(store.fixed, store.params());
    store.setGraphData(prev => ({ ...prev, main }));
  }, { defer: true }))
};

export const getInitialisedStore = (
  storeInstance: string,
  jsonDefinedFields: JsonDefinedFields,
): Store => {
  const metadata: JsonDefinedFields["model"]["metadata"] =
    deepCopy(jsonDefinedFields.model.metadata);
  const fixed: Store["fixed"] = {
    config: deepCopy(jsonDefinedFields.config),
    staticParamSets: deepCopy(jsonDefinedFields.staticParamSets),
    model: {
      generator: eval(jsonDefinedFields.model.generator),
      metadata,
    },
    htmlMetadata: getHtmlMetadata(storeInstance, metadata),
  };

  const [form, setForm] = createSignal<Form>({});
  const [params, setParams] = createSignal<Params>({ user: {}, static: {} });
  const [graphData, setGraphData] = createSignal<GraphData>({
    main: calculateGraphData(fixed, params()),
    static: []
  });
  const [graphConfigs, setGraphConfigs] = createSignal<GraphConfig[]>(
    fixed.htmlMetadata.graphMetadata.map(g => ({
      id: g.id,
      vars: g.vars ?? fixed.model.metadata.variables.map(v => v.name),
      xRange: g.xRange ?? [fixed.config.startTime, fixed.config.endTime],
      yRange: g.yRange ?? [null, null],
      yLog: g.yLog ?? false
    }))
  );
  const setGraphConfig = (id: string, changedProps: Partial<GraphConfigNoId>) => {
    let newGraphConfigs = [...graphConfigs()];
    const idx = newGraphConfigs.findIndex(g => g.id === id);
    newGraphConfigs[idx] = {
      ...newGraphConfigs[idx],
      ...changedProps
    };

    const changedProperties = Object.keys(changedProps) as (keyof typeof changedProps)[];
    const { sync } = fixed.htmlMetadata;
    const propertiesToSync = changedProperties
      .filter(k => sync.includes(k as keyof GraphConfig));
    const changedSyncProps = Object.fromEntries(
      propertiesToSync.map(k => [k, changedProps[k]])
    );

    newGraphConfigs = newGraphConfigs.map(g => ({...g, ...changedSyncProps}))

    setGraphConfigs(newGraphConfigs);
  };

  const store = {
    fixed,
    form,
    setForm,
    params,
    setParams,
    graphData,
    setGraphData,
    graphConfigs,
    setGraphConfig
  };

  addReactivity(store);

  return store;
};
