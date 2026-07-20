import { createSignal } from "solid-js";
import { Fixed, Params, ProduceParam } from "../types";
import { deepCopy, objMap } from "../utils";

export const getParamsStore = (fixed: Fixed) => {
  const initialParams: Params = {
    static: {},
    user: objMap(
      fixed.html.pars,
      (_, v) => v.val
    ),
  }
  const [params, setParams] = createSignal<Params>(initialParams);
  // the produce interface works better for updating params, i.e. make a
  // copy of the object and modify
  const setParamsProduce = (fn: ProduceParam) => {
    const paramsCopy = deepCopy(params());
    fn(paramsCopy);
    setParams(paramsCopy);
  };

  return { params, setParams: setParamsProduce };
};
