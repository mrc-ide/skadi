import { Context, createContext, useContext } from "solid-js";
import { getInitialisedStore, getStoresInPage, readJsonForStores } from "./initialise";
import { Store } from "./types";

export const storeContexts: Record<
  string,
  Context<Store | undefined>
> = {};

export const getStores = async () => {
  const { storeInstancesInPage, storeNamesInPage } = getStoresInPage();
  const storeElementsFromJson = await readJsonForStores(storeNamesInPage);

  return Object.fromEntries(storeInstancesInPage.map(storeInstance => {
    const storeName = storeInstance.split(":")[0];
    const StoreContext = createContext<Store>();
    storeContexts[storeInstance] = StoreContext;

    const store = getInitialisedStore(
      storeInstance,
      storeElementsFromJson[storeName]
    );

    return [storeInstance, { StoreContext, store }];
  }));
};

export const useStore = (storeInstance: string) => {
  const store = useContext(storeContexts[storeInstance]);
  if (!store) {
    throw new Error("store context not defined");
  }
  return store;
};
