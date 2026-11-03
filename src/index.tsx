/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { getStores } from './store'
import ParamSlider from './components/ParamSlider';
import Plot from './components/Plot';
import { JSX } from 'solid-js';
import Reactivity from './components/Reactivity';
import { dataW, getAttr, getEls } from './schemas/html/utils';
import { objForEach } from './utils';
import Form from './components/Form';
import { PlotType } from './schemas/html/schema';

type RenderFunc = (el: Element, getJsx: () => JSX.Element) => void

const renderParamSliderEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("par", { store });
  return els.forEach(el => {
    const props = {
      store,
      par: getAttr("par", el)!
    };
    renderWithStore(el, () => <ParamSlider {...props}/>);
  });
}

const renderReactivityEls = (store: string, renderWithStore: RenderFunc) => {
  const el = document.createElement("div");
  document.body.append(el);
  const props = { store };
  renderWithStore(el, () => <Reactivity {...props}/>);
}

const renderPlotEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("plot", { store });
  return els.map(el =>  {
    const type = el.getAttribute(dataW("type"))! as PlotType;
    if (type !== "diff") {
      const props = {
        store,
        type,
        id: getAttr("storeid", el)!,
      };
      renderWithStore(el, () => <Plot {...props}/>)
    } else {
      const props = {
        store,
        type,
        id: getAttr("storeid", el)!,
        fixedId1: getAttr("fixedid1", el)!,
        fixedId2: getAttr("fixedid2", el)!,
      };
      renderWithStore(el, () => <Plot {...props}/>)
    }
  })
};

const renderFormEls = (store: string, renderWithStore: RenderFunc) => {
  const els = getEls("form", { store });
  return els.map(el =>  {
   const props = {
      store,
      formId: getAttr("formid", el)!,
    };
    renderWithStore(el, () => <Form {...props}/>)
  })
};

const main = async () => {
  objForEach(
    await getStores(),
    (store, StoreProvider) => {
      const renderWithStore = (el: Element, getJsx: () => JSX.Element) => {
        el.innerHTML = "";
        render(() => (
          <StoreProvider>
            {getJsx()}
          </StoreProvider>
        ), el);
      };
      renderParamSliderEls(store, renderWithStore);
      renderPlotEls(store, renderWithStore);
      renderFormEls(store, renderWithStore);
      renderReactivityEls(store, renderWithStore);
    }
  );
};

main();
