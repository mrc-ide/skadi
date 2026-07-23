import { Component, createEffect, on } from "solid-js";
import { useStore } from "../store";
import { calculateGraphData } from "../store/graph/data";

const Reactivity: Component<{ store: string }> = props => {
  const store = useStore(props.store);

  createEffect(on(store.params, () => {
    const params = store.params();
    const userParams = { ...params.user, ...params.static };
    const fixedParams = store.fixed.json.fixedParamSets.map(p => ({
      ...userParams,
      ...p.user,
      ...p.static,
    }));
    const main = calculateGraphData(store.fixed, userParams);
    const static1 = fixedParams.map(p => calculateGraphData(store.fixed, p))
    store.setGraphData({ main, static: static1 });
  }, { defer: true }))

  return (<></>)
}

export default Reactivity;
