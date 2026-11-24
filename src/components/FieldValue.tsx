import { Component } from "solid-js"
import { useStore } from "../store";

export type FieldValueProps = {
  store: string,
  fieldLabel: string,
}

const FieldValue: Component<FieldValueProps> = props => {
  const store = useStore(props.store);
  return (
    <span>{store.form()[props.fieldLabel]?.label}</span>
  )
};

export default FieldValue;
