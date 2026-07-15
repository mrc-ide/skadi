/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { getStores } from './store'
import ParamSlider from './components/ParamSlider';
import Plot from './components/Plot';
import { objForEach } from './store/utils';
import { getAttr, getEls } from './store/html/utils';
import { JSX } from 'solid-js';
import { validateHtml } from './store/html/validate';
import Reactivity from './components/Reactivity';

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
   const props = {
      store,
      id: getAttr("storeid", el)!,
    };
    renderWithStore(el, () => <Plot {...props}/>)
  })
};

const main = async () => {
  validateHtml();
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
      renderReactivityEls(store, renderWithStore);
    }
  );
};

main();
