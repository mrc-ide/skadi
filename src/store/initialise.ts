import { Fixed, Store } from "./types";
import { getGraphDataStore } from "./graph/data";
import { getGraphStateStore } from "./graph/state";
import { getParamsStore } from "./params/state";
import { JsonPayload } from "../schemas/json/types";
import { validateHtml } from "../schemas/html/validate";
import { parseAndProcessHtml } from "../schemas/html/parseAndProcess";
import { getFormsStore } from "./forms/state";

export const getInitialisedStore = (
  storeName: string,
  jsonPayload: JsonPayload,
): Store => {
  validateHtml(storeName, jsonPayload);

  const fixed: Fixed = {
    json: jsonPayload,
    // see https://rolldown.rs/guide/troubleshooting#avoiding-direct-eval
    generator: (0, eval)(jsonPayload.model.generator),
    html: parseAndProcessHtml(storeName, jsonPayload),
  };

  const formsStore = getFormsStore(fixed);
  const paramsStore = getParamsStore(fixed);
  const graphDataStore = getGraphDataStore(fixed, paramsStore.params());
  const graphStateStore = getGraphStateStore(fixed, graphDataStore.graphData());

  const store: Store = {
    fixed,
    ...formsStore,
    ...paramsStore,
    ...graphDataStore,
    ...graphStateStore,
  };

  return store;
};
