import { createSignal } from "solid-js";
import { Fixed, Form, Producer } from "../types";
import { Params } from "../../schemas/json/types";
import { deepCopy, objFrom } from "../../utils";
import { getParamsFromForm } from "../forms/state";

export const getParamsStore = async (storeName: string, fixed: Fixed, form: Form) => {
  const initialParams: Params = {
    static: await getParamsFromForm(storeName, fixed, form),
    user: objFrom(
      fixed.html.parsed.parCfg,
      p => p.par,
      p => p.val,
    ),
  }
  const [params, setParams] = createSignal<Params>(initialParams);
  // the produce interface works better for updating params, i.e. make a
  // copy of the object and modify
  const setParamsProduce: Producer<Params> = fn => {
    const paramsCopy = deepCopy(params());
    fn(paramsCopy);
    setParams(paramsCopy);
  };

  return { params, setParams: setParamsProduce };
};
