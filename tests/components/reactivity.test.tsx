import { describe, expect } from "vitest";
import { test } from "./helpers";
import Reactivity from "../../src/components/Reactivity";

describe("Reactivity", () => {
  test("updates graph data when params change", ({ component }) => {
    component.render(() => <Reactivity store="basic"/>);
    expect(component.setGraphDataSpy).not.toHaveBeenCalled();
    component.store.setParams(p => ({...p}));
    expect(component.setGraphDataSpy).toHaveBeenCalledTimes(1);
  });
});
