/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { getStores } from './store'
import { JSX } from 'solid-js';
import { objForEach } from './utils';
import { renderFieldValueEls, renderFormEls, renderParamMaxEls, renderParamMinEls, renderParamSliderEls, renderParamValueEls, renderPlotEls, renderReactivityEls } from './renderComponents';

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
      renderParamValueEls(store, renderWithStore);
      renderFieldValueEls(store, renderWithStore);
      renderParamMinEls(store, renderWithStore);
      renderParamMaxEls(store, renderWithStore);
      renderPlotEls(store, renderWithStore);
      renderFormEls(store, renderWithStore);
      renderReactivityEls(store, renderWithStore);
    }
  );
};

main();
