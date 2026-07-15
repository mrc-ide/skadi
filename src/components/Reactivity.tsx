import { Component, createEffect, on } from "solid-js";
import { useStore } from "../store";
import { calculateGraphData } from "../store/graph/data";

const Reactivity: Component<{ store: string }> = props => {
  const store = useStore(props.store);

  createEffect(on(store.params, () => {
    const main = calculateGraphData(store.fixed, store.params());
    store.setGraphData(prev => ({ ...prev, main }));
  }, { defer: true }))

  return (<></>)
}

export default Reactivity;
