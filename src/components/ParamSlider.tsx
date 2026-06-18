import { Slider } from "@kobalte/core/slider";
import { Component } from "solid-js";
import { useStore } from "../store";
import "./style.css"

const ParamSlider: Component<{ storeInstance: string, par: string }> = props => {
  const store = useStore(props.storeInstance);

  const setParamValue = (v: number[]) => {
    console.log("called")
    store.setParams(params => ({
      ...params,
      user: {
        ...params.user,
        [props.par]: v[0]
      }
    }));
  };

  return (
    <Slider class="SliderRoot"
            minValue={1}
            maxValue={6}
            step={0.01}
            value={[store.params().user[props.par] as number || 2]}
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
