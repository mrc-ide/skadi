import { createSignal } from "solid-js";
import { Fixed, Form, Producer } from "../types";
import { deepCopy, objFrom } from "../../utils";
import { ParamValues } from "../../schemas/json/types";

const getFormAsset = async (store: string, fileName: string): Promise<ParamValues> => {
  const res = await fetch(`./stores/${store}/formAssets/${fileName}.json`);
  return await res.json();
}

export const getParamsFromForm = async (storeName: string, fixed: Fixed, form: Form) => {
  const fileName = fixed.json.forms
    .flatMap(form => form.fields.map(f => f.label))
    .map(field => form[field].id)
    .join("__");
  return await getFormAsset(storeName.split(":")[0], fileName);
};

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
