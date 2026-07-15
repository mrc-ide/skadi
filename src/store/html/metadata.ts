import { FixedJson, GraphConfig, graphConfigAttrs, graphConfigKeys, GraphHtmlMetadata, HtmlMetadata, Range } from "../types";
import { addIfNotIn, concatIfNotIn, objFrom, objFromVals, objMapStatic } from "../utils";
import { getAttr, getEl, getEls, setAttr, splitComma, w } from "./utils";

export const getStoresInPage = () => {
  const els = Array.from(document.querySelectorAll(`[${w("store")}]`)!);
  return els.reduce(
    (stores, el) => addIfNotIn(stores, getAttr("store", el)!),
    [] as string[]
  );
};

const getGraphMetadataConfig = (el: Element): GraphHtmlMetadata["config"] => {
  const graphConfigString = objFromVals(
    graphConfigKeys,
    (_, idx) => getAttr(graphConfigAttrs[idx], el)
  );
  return objMapStatic(graphConfigString, {
    vars: splitComma,
    xRange: str => splitComma(str)?.map(s => s ? Number(s) : null) as Range | undefined,
    yRange: str => splitComma(str)?.map(s => s ? Number(s) : null) as Range | undefined,
    yLog: l => l === "true"
  });
};

export const getHtmlMetadata = (
  store: string,
  fixedJson: FixedJson,
): HtmlMetadata => {
  // generate store attr for graphs which reference id
  getEls("plot").forEach(el => {
    const id = getAttr("id", el);
    if (!id) return;

    const graphCfgEl = getEl("graph-cfg", { id })!;
    const store = getAttr("store", graphCfgEl)!;
    setAttr("store", store, el);
  });

  const graphEls = getEls("plot", { store });

  // generate store ids for all graph making sure user defined ids that
  // are equal have the same store id
  graphEls.forEach(el => {
    const storeId = getAttr("storeid", el);
    if (storeId) return;

    const uuid = crypto.randomUUID();
    const id = getAttr("id", el);
    // current graph or all graphs with matching user id if provided
    const elsWithId = id
      ? getEls("plot", { id })
      : [el]
    elsWithId.forEach(x => setAttr("storeid", uuid, x));
  });


  // aggregate over syncs for any graph in this store instance
  const sync = getEls("store-cfg", { store }).reduce((s, el) => {
    const currSync = splitComma(getAttr("sync", el)) as (keyof GraphConfig)[] | undefined;
    return currSync ? concatIfNotIn(s, currSync) : s;
  }, [] as (keyof GraphConfig)[])


  const allVars = fixedJson.modelMetadata.variables.map(v => v.name);
  // aggregate over all vars but if left blank, default to all vars of the model
  const vars = graphEls.reduce((v, el) => {
    const currVars = splitComma(getAttr("sync", el));
    return currVars ? concatIfNotIn(v, currVars) : allVars;
  }, [] as string[]);


  const graphMetadata = graphEls.reduce((gM, el) => {
    const uuid = getAttr("storeid", el)!;
    const id = getAttr("id", el);

    const graphMetadataConfig = id
      ? getGraphMetadataConfig(getEl("graph-cfg", { id })!)
      : getGraphMetadataConfig(el);

    const metadata: GraphHtmlMetadata = {
      id: uuid,
      config: graphMetadataConfig
    };

    // consider objects with same id as equal, so we only push first graph
    // metadata object of any user defined graph ids
    return addIfNotIn(
      gM,
      metadata,
      (x, y) => x.id === y.id
    );
  }, [] as GraphHtmlMetadata[]);

  const parsMetadata = getEls("par-cfg", { store })
    .map(el => {
      const stepAttr = getAttr("step", el);
      const step = stepAttr ? parseFloat(stepAttr) : undefined;
      return {
        par: getAttr("par", el)!,
        val: parseFloat(getAttr("val", el)!),
        min: parseFloat(getAttr("min", el)!),
        max: parseFloat(getAttr("max", el)!),
        step,
      };
    });
  const pars = objFrom(
    parsMetadata,
    p => p.par,
    p => {
      const { par: _, ...rest } = p;
      return rest;
    }
  );


  return { graphMetadata, sync, vars, pars };
};
