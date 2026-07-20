import { Slider } from "@kobalte/core/slider";
import { Component } from "solid-js";
import { useStore } from "../store";
import "./style.css"

export type ParamsProps = {
  store: string,
  par: string,
}

const ParamSlider: Component<ParamsProps> = props => {
  const store = useStore(props.store);
  const { min, max, step } = store.fixed.html.pars[props.par];

  const setParamValue = (v: number[]) => {
    if (store.params().user[props.par] === v[0]) return;
    store.setParams(params => params.user[props.par] = v[0]);
  };

  return (
    <Slider class="SliderRoot"
            minValue={min}
            maxValue={max}
            step={step || ((max - min) / 1000)}
            value={[store.params().user[props.par] as number]}
            onChange={setParamValue}>
      <div class="SliderLabel">
        <Slider.Label>{props.par}</Slider.Label>
        <Slider.ValueLabel />
      </div>
      <Slider.Track class="SliderTrack">
        <Slider.Fill class="SliderRange" />
        <Slider.Thumb class="SliderThumb">
          <Slider.Input />
        </Slider.Thumb>
      </Slider.Track>
    </Slider>
  )
};

export default ParamSlider;
