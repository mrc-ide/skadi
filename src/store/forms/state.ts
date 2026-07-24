import { createSignal } from "solid-js";
import { Fixed, Form, Producer } from "../types";
import { deepCopy, objFrom } from "../utils";

export const getFormsStore = (fixed: Fixed) => {
  const [form, setForm] = createSignal<Form>(
    objFrom(
      fixed.json.forms.flatMap(f => f.fields),
      f => f.label,
      f => f.options.find(op => op.id === f.default)!,
    )
  );

  const setFormProduce: Producer<Form> = fn => {
    const paramsCopy = deepCopy(form());
    fn(paramsCopy);
    setForm(paramsCopy);
  };

  return { form, setForm: setFormProduce };
};
