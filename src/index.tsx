/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { getStores } from './store'
import ParamSlider from './components/ParamSlider';
import Plot from './components/Plot';

const main = async () => {
  const stores = await getStores();
  Object.entries(stores).forEach(([storeInstance, { store, StoreContext }]) => {
    const els = document.querySelectorAll(`.w-par[data-w-store="${storeInstance}"]`);
    els.forEach(el => {
      el.innerHTML = "";
      let par = "";
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (attr.nodeName === "w-par") par = attr.nodeValue!;
      }
      render(() => (
        <StoreContext.Provider value={store}>
          <ParamSlider storeInstance={storeInstance} par={par}/>
        </StoreContext.Provider>
      ), el)
    });
    const els1 = document.querySelectorAll(`.w-plot[data-w-store="${storeInstance}"]`);
    els1.forEach(el => {
      el.innerHTML = "";
      render(() => (
        <StoreContext.Provider value={store}>
          <Plot storeInstance={storeInstance}/>
        </StoreContext.Provider>
      ), el)
    });
  });
};

main();
