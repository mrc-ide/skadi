import { createSignal } from "solid-js";
import { Fixed, FixedJson, Form, JsonPayload, Store } from "./types";
import { getGraphDataStore } from "./graph/data";
import { getGraphStateStore } from "./graph/state";
import { getParamsStore } from "./params/state";
import { validateHtml } from "./html/validate";
import { processHtml } from "./html/process";

export const getInitialisedStore = (
  storeName: string,
  jsonPayload: JsonPayload,
): Store => {
  validateHtml(storeName, jsonPayload);

  const fixedJson: FixedJson = {
    config: jsonPayload.config,
    modelMetadata: jsonPayload.model.metadata,
    fixedParamSets: jsonPayload.fixedParamSets,
  };

  const fixed: Fixed = {
    json: fixedJson,
    // see https://rolldown.rs/guide/troubleshooting#avoiding-direct-eval
    generator: (0, eval)(jsonPayload.model.generator),
    html: processHtml(storeName, jsonPayload),
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
