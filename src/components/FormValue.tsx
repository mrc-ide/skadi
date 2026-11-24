import { Component } from "solid-js"
import { useStore } from "../store";

export type FormValueProps = {
  store: string,
  fieldLabel: string,
}

const FormValue: Component<FormValueProps> = props => {
  const store = useStore(props.store);
  return (
    <span>{store.form()[props.fieldLabel]?.label}</span>
  )
};

export default FormValue;
