import { Component, createEffect, on } from "solid-js";
import { useStore } from "../store";
import { calculateGraphData } from "../store/graph/data";
import { getJson } from "../store/json";
import { ParameterValues } from "../store/types";
import { getGraphRanges } from "../store/graph/state";

const Reactivity: Component<{ store: string }> = props => {
  const store = useStore(props.store);

  createEffect(on(store.form, async () => {
    const form = store.form();
    const fileName = store.fixed.json.forms
      .flatMap(form => form.fields.map(f => f.label))
      .map(field => form[field].id)
      .join("__");
    const staticParams = await getJson<ParameterValues>(
      props.store.split(":")[0], `formAssets/${fileName}`
    );
    store.setParams(p => p.static = staticParams);
  }))

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
    store.graphStates.forEach(g => {
      const ranges = getGraphRanges(main, g.config.vars, store.fixed);
      g.config.xRange = ranges.xRange;
      g.config.yRange = ranges.yRange;
    });
    store.setGraphData({ main, static: static1 });
  }))

  return (<></>)
}

export default Reactivity;
