import { Component } from "solid-js";
import { useStore } from "../store";
import "./paramSlider.css"

export type ParamMaxProps = {
  store: string,
  par: string,
}

const ParamMax: Component<ParamMaxProps> = props => {
  const store = useStore(props.store);
  const { max } = store.fixed.html.parsed.parCfg.find(p => p.par = props.par)!;
  return (
    <span>{max}</span>
  )
};

export default ParamMax;
