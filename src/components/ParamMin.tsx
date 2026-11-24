import { Component } from "solid-js";
import { useStore } from "../store";
import "./paramSlider.css"

export type ParamMinProps = {
  store: string,
  par: string,
}

const ParamMin: Component<ParamMinProps> = props => {
  const store = useStore(props.store);
  const { min } = store.fixed.html.parsed.parCfg.find(p => p.par = props.par)!;
  return (
    <span>{min}</span>
  )
};

export default ParamMin;
