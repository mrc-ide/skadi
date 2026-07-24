import { createSignal } from "solid-js";
import { Fixed, Params, Producer } from "../types";
import { deepCopy, objMap } from "../utils";

export const getParamsStore = (fixed: Fixed) => {
  const [params, setParams] = createSignal<Params>({
    static: {},
    user: objMap(
      fixed.html.pars,
      (_, v) => v.val
    ),
  });

  // the produce interface works better for updating params, i.e. make a
  // copy of the object and modify
  const setParamsProduce: Producer<Params> = fn => {
    const paramsCopy = deepCopy(params());
    fn(paramsCopy);
    setParams(paramsCopy);
  };

  return { params, setParams: setParamsProduce };
};
