import { Select } from "@kobalte/core/select";
import { Component, For } from "solid-js";
import { useStore } from "../store";
import style from "./form.module.css";
import { FormIdLabel } from "../schemas/json/types";

export type FormProps = {
  store: string,
  formId: string,
}

const Form: Component<FormProps> = props => {
  const store = useStore(props.store);
  const { fields } = store.fixed.json.forms.find(f => f.id === props.formId)!;

  const setFormValue = (fieldLabel: string, val: FormIdLabel | null) => {
    if (!val) return;
    store.setForm(f => f[fieldLabel] = val);
  };

  return (
    <For each={fields}>{field =>
      <>
      <p style={{ "margin-bottom": "4px" }}>{field.label}</p>
      <Select
        value={store.form()[field.label]}
        onChange={val => setFormValue(field.label, val)}
        options={field.options}
        optionValue="id"
        optionTextValue="label"
        itemComponent={(props) => (
          <Select.Item item={props.item} class={style.select__item}>
            <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
          </Select.Item>
        )}
      >
        <Select.Trigger class={style.select__trigger} aria-label={field.label}>
          <Select.Value<FormIdLabel> class={style.select__value}>
            {(state) => state.selectedOption().label}
          </Select.Value>
          <Select.Icon class={style.select__icon}>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class={style.select__content}>
            <Select.Listbox class={style.select__listbox} />
          </Select.Content>
        </Select.Portal>
      </Select>
      </>
    }</For>
  )
};

export default Form;
