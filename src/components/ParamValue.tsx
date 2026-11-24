import { Component } from "solid-js";
import { useStore } from "../store";
import "./paramSlider.css"

export type ParamValueProps = {
  store: string,
  par: string,
}

const ParamValue: Component<ParamValueProps> = props => {
  const store = useStore(props.store);
  return (
    <span>{store.params().user[props.par] as number}</span>
  )
};

export default ParamValue;
