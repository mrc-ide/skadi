import { JSX } from "solid-js";
import Form from "./components/Form";
import ParamSlider from "./components/ParamSlider";
import Plot from "./components/Plot";
import Reactivity from "./components/Reactivity";
import { PlotType } from "./schemas/html/schema";
import { dataW, getAttr, getEls, w } from "./schemas/html/utils";
import { supportedVariants } from "./schemas/html/validate";
import Barchart from "./components/Barchart";
import ParamValue from "./components/ParamValue";
import ParamMin from "./components/ParamMin";
import ParamMax from "./components/ParamMax";
import FormValue from "./components/FormValue";

type RenderFunc = (el: Element, getJsx: () => JSX.Element) => void

export const renderParamSliderEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("parSlider", { store });
  return els.forEach(el => {
    const props = {
      store,
      par: getAttr("par", el)!
    };
    renderWithStore(el, () => <ParamSlider {...props}/>);
  });
}

export const renderParamValueEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("parVal", { store });
  return els.forEach(el => {
    const props = {
      store,
      par: getAttr("par", el)!
    };
    renderWithStore(el, () => <ParamValue {...props}/>);
  });
}

export const renderParamMinEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("parMin", { store });
  return els.forEach(el => {
    const props = {
      store,
      par: getAttr("par", el)!
    };
    renderWithStore(el, () => <ParamMin {...props}/>);
  });
}

export const renderParamMaxEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("parMax", { store });
  return els.forEach(el => {
    const props = {
      store,
      par: getAttr("par", el)!
    };
    renderWithStore(el, () => <ParamMax {...props}/>);
  });
}

export const renderFieldValueEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("fieldVal", { store });
  return els.forEach(el => {
    const props = {
      store,
      fieldLabel: getAttr("fieldlabel", el)!
    };
    renderWithStore(el, () => <FormValue {...props}/>);
  });
}

export const renderReactivityEls = (store: string, renderWithStore: RenderFunc) => {
  const el = document.createElement("div");
  document.body.append(el);
  const props = { store };
  renderWithStore(el, () => <Reactivity {...props}/>);
}

export const renderPlotEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("plot", { store });
  return els.map(el =>  {
    const type = el.getAttribute(dataW("type"))! as PlotType;
    const variant = el.getAttribute(w("variant")) || supportedVariants[0];
    const El = variant === supportedVariants[0] ? Plot : Barchart;
    if (type !== "diff") {
      const props = {
        store,
        type,
        id: getAttr("storeid", el)!,
      };
      renderWithStore(el, () => <El {...props}/>)
    } else {
      const props = {
        store,
        type,
        id: getAttr("storeid", el)!,
        fixedId1: getAttr("fixedid1", el)!,
        fixedId2: getAttr("fixedid2", el)!,
      };
      renderWithStore(el, () => <El {...props}/>)
    }
  })
};

export const renderFormEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("form", { store });
  return els.map(el =>  {
   const props = {
      store,
      formId: getAttr("formid", el)!,
    };
    renderWithStore(el, () => <Form {...props}/>)
  })
};
