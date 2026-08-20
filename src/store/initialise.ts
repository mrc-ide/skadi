import { Fixed, Store } from "./types";
import { getParamsStore } from "./params/state";
import { JsonPayload } from "../schemas/json/types";
import { validateHtml } from "../schemas/html/validate";
import { parseAndProcessHtml } from "../schemas/html/parseAndProcess";
import { getFormsStore } from "./forms/state";
import { GraphStateClass } from "./graph/class";

export const getInitialisedStore = async (
  storeName: string,
  jsonPayload: JsonPayload,
): Promise<Store> => {
  validateHtml(storeName, jsonPayload);

  const fixed: Fixed = {
    json: jsonPayload,
    // see https://rolldown.rs/guide/troubleshooting#avoiding-direct-eval
    generator: (0, eval)(jsonPayload.model.generator),
    html: parseAndProcessHtml(storeName, jsonPayload),
  };

  const formsStore = getFormsStore(fixed);
  const paramsStore = await getParamsStore(storeName, fixed, formsStore.form());
  const graphStateStore = { graphStates: new GraphStateClass(fixed, paramsStore.params()) };

  const store: Store = {
    name: storeName,
    fixed,
    ...formsStore,
    ...paramsStore,
    ...graphStateStore,
  };

  return store;
};
