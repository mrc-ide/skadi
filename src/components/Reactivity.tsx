import { Component, createEffect, on } from "solid-js";
import { useStore } from "../store";
import { getParamsFromForm } from "../store/forms/state";

const Reactivity: Component<{ store: string }> = props => {
  const store = useStore(props.store);

  createEffect(on(store.form, async () => {
    const staticParams = await getParamsFromForm(store.name, store.fixed, store.form());
    store.setParams(p => p.static = staticParams);
  }, { defer: true }));

  createEffect(on(store.params, () => {
    store.graphStates.updateParams(store.params());
  }, { defer: true }));

  return (<></>)
}

export default Reactivity;
