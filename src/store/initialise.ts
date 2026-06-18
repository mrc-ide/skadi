import { createEffect, createSignal, on } from "solid-js";
import { Form, GraphData, HtmlMetadata, JsonDefinedFields, Params, PlotData, Store } from "./types";
import { deepCopy, getJson, pushIfNotIn } from "./utils";
import { System } from "@reside-ic/dust2";
import { Point } from "@reside-ic/skadi-chart";

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

const getHtmlMetadata = (storeInstance: string): HtmlMetadata => {
  document.querySelectorAll(`[data-w-store="${storeInstance}"]`)!;
  return { variables: [] };
};

const recalculateGraphData = (store: Store) => {
  const params = store.params();
  const sys = System.createODE(
    store.fixed.model.generator as any,
    { ...params.static, ...params.user },
    0,
    store.fixed.config.dt || 0.01,
    store.fixed.config.particles || 1,
  );

  sys.setStateInitial();

  const dt = 15 / 500
  const res = sys.simulateByStateVariableName(
    Array.from({ length: 500 }).map((_, i) => i * dt)
  );
  const vars = Object.keys(res.values[0]);
  const lines = vars.map<PlotData["lines"][number]>(v => {
    const points: Point[] = [];
    for (let i = 0; i < res.times.length; i++) {
      const x = res.times[i];
      const y = res.values[0][v][i] as any as number;
      points.push({ x, y });
    }
    return { points, style: {} };
  });

  store.setGraphData(graphData => ({
    ...graphData,
    main: { lines, points: [] }
  }));
};

const addReactivity = (store: Store) => {
  createEffect(on(store.params, () => {
    recalculateGraphData(store);
  }, { defer: true }))
};

export const getInitialisedStore = (
  storeInstance: string,
  jsonDefinedFields: JsonDefinedFields,
): Store => {
  const fixed = {
    config: deepCopy(jsonDefinedFields.config),
    staticParamSets: deepCopy(jsonDefinedFields.staticParamSets),
    model: {
      generator: eval(jsonDefinedFields.model.generator),
      metadata: deepCopy(jsonDefinedFields.model.metadata),
    },
    htmlMetadata: getHtmlMetadata(storeInstance),
  };

  const [form, setForm] = createSignal<Form>({});
  const [params, setParams] = createSignal<Params>({ user: {}, static: {} });
  const [graphData, setGraphData] = createSignal<GraphData>({
    main: { lines: [], points: [] },
    static: []
  });

  const store = {
    fixed,
    form,
    setForm,
    params,
    setParams,
    graphData,
    setGraphData,
  };

  addReactivity(store);

  return store;
};
