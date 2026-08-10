import { Context, createContext, ParentProps, useContext } from "solid-js";
import { getInitialisedStore } from "./initialise";
import { Store } from "./types";
import { readJsonForStores } from "./json";
import { addIfNotIn, objFromVals, unique } from "../utils";
import { getAttr, w } from "../schemas/html/utils";

export const storeContexts: Record<string, Context<Store>> = {};
const getStoreType = (s: string) => s.split(":")[0];

const getStoresInPage = () => {
  const els = Array.from(document.querySelectorAll(`[${w("store")}]`)!);
  return els.reduce(
    (stores, el) => addIfNotIn(stores, getAttr("store", el)!),
    [] as string[]
  );
};

export const getStores = async () => {
  const stores = getStoresInPage();
  const storeTypes = unique(stores.map(getStoreType));
  const jsonPayloads = await readJsonForStores(storeTypes);

  return objFromVals(
    stores,
    s => {
      const jsonPayload = jsonPayloads[getStoreType(s)];
      const store = getInitialisedStore(s, jsonPayload);

      const StoreContext = createContext<Store>(store);
      storeContexts[s] = StoreContext;

      return (props: ParentProps) => (
        <StoreContext.Provider value={store}>
          {props.children}
        </StoreContext.Provider>
      );
    }
  );
};

export const useStore = (storeName: string) => {
  const store = useContext(storeContexts[storeName]);
  if (!store) throw new Error("store context not defined");
  return store;
};
