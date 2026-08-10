import { Component, createEffect, on } from "solid-js";
import { useStore } from "../store";
import { calculateGraphData } from "../store/graph/data";
import { ParamValues } from "../schemas/json/types";
import { getGraphRanges } from "../store/graph/state";

const getFormAsset = async (store: string, fileName: string): Promise<ParamValues> => {
  const res = await fetch(`./stores/${store}/formAssets/${fileName}.json`);
  return await res.json();
}

const Reactivity: Component<{ store: string }> = props => {
  const store = useStore(props.store);

  createEffect(on(store.form, async () => {
    const form = store.form();
    const fileName = store.fixed.json.forms
      .flatMap(form => form.fields.map(f => f.label))
      .map(field => form[field].id)
      .join("__");
    const staticParams = await getFormAsset(
      props.store.split(":")[0], fileName
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
      g.config.xrange = ranges.xrange;
      g.config.yrange = ranges.yrange;
    });

    store.setGraphData({ main, static: static1 });
  }))

  return (<></>)
}

export default Reactivity;
