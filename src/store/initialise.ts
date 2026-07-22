import { createSignal } from "solid-js";
import { Fixed, FixedJson, Form, JsonPayload, Store } from "./types";
import { deepCopy } from "./utils";
import { getHtmlMetadata } from "./html/metadata";
import { getGraphDataStore } from "./graph/data";
import { getGraphStateStore } from "./graph/state";
import { getParamsStore } from "./params/state";

export const getInitialisedStore = (
  storeName: string,
  jsonPayload: JsonPayload,
): Store => {
  const fixedJson: FixedJson = {
    config: deepCopy(jsonPayload.config),
    modelMetadata: deepCopy(jsonPayload.model.metadata),
    fixedParamSets: deepCopy(jsonPayload.fixedParamSets),
  };

  const fixed: Fixed = {
    json: fixedJson,
    // see https://rolldown.rs/guide/troubleshooting#avoiding-direct-eval
    generator: (0, eval)(jsonPayload.model.generator),
    html: getHtmlMetadata(storeName, fixedJson),
  };

  const [form, setForm] = createSignal<Form>({});

  const paramsStore = getParamsStore(fixed);
  const graphDataStore = getGraphDataStore(fixed, paramsStore.params());
  const graphStateStore = getGraphStateStore(fixed, graphDataStore.graphData());

  const store: Store = {
    fixed,
    form,
    setForm,
    ...paramsStore,
    ...graphDataStore,
    ...graphStateStore,
  };

  return store;
};
