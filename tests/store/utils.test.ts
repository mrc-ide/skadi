import { describe, expect, test } from "vitest";
import { addIfNotIn, callIfDuplicate, concatIfNotIn, Eq, iterate, objAssignIfTruthy, objFilter, objForEach, objFrom, objFromVals, objKeys, objLen, objMap, objMapStatic, objMergeAndAssignKey, pushIfNotIn, unique } from "../../src/store/utils";

const numArr1 = () => [1, 2, 3];
const numArr2 = () => [2, 3, 4];
const numArrCombined = () => [1, 2, 3, 4];

type Obj = { id: number }
const objFunctor = (fn: () => number[]) => {
  return () => fn().map(n => ({ id: n }));
};
const objArr1 = objFunctor(numArr1);
const objArr2 = objFunctor(numArr2);
const objArrCombined = objFunctor(numArrCombined);

const objEq = (o1: Obj, o2: Obj) => o1.id === o2.id;

type TestFn = <T>(args: {
  getArr1: () => T[], getArr2: () => T[],
  el1: T, el2: T,
  newEl1: T, newEl2: T,
  getCombined: () => T[],
  eq?: Eq<T> | undefined
}) => void

// Some array functions expose an eq arg that let's us define equality
// for example obj1 and obj2 are equal if their `id` fields are equal.
// This test helper reduced code duplication by executing test logic with
// both numbers and then objects
const testWithAndWithoutEq = (fn: TestFn) => {
  fn({
    getArr1: numArr1, getArr2: numArr2,
    el1: 1, el2: 2,
    newEl1: 5, newEl2: 6,
    getCombined: numArrCombined
  });
  fn({
    getArr1: objArr1, getArr2: objArr2,
    el1: { id: 1 }, el2: { id: 2 },
    newEl1: { id: 5 }, newEl2: { id: 6 },
    getCombined: objArrCombined,
    eq: objEq
  });
};

describe("array utils", () => {
  test("pushIfNotIn", () => {
    testWithAndWithoutEq(({ getArr1, el1, newEl1, eq }) => {
      const arr = getArr1();
      pushIfNotIn(arr, el1, eq);
      expect(arr).toStrictEqual(getArr1());

      pushIfNotIn(arr, newEl1, eq);
      expect(arr).toStrictEqual([...getArr1(), newEl1]);
    });
  });

  test("addIfNotIn", () => {
    testWithAndWithoutEq(({ getArr1, el1, newEl1, eq }) => {
      const arr = getArr1();
      expect(addIfNotIn(arr, el1, eq)).toStrictEqual(arr);

      expect(addIfNotIn(arr, newEl1, eq))
        .toStrictEqual([...getArr1(), newEl1]);
    });
  });

  test("concatIfNotIn", () => {
    testWithAndWithoutEq(({ getArr1, getArr2, getCombined, eq }) => {
      expect(concatIfNotIn(getArr1(), getArr2(), eq))
        .toStrictEqual(getCombined());
    });
  });

  test("callIfDuplicate", () => {
    testWithAndWithoutEq(({ getArr1, el1, eq }) => {
      let foundElement: any = null;
      const arr = getArr1();
      const arrWithDup = [...arr, el1];
      const fn = (el: any) => foundElement = el;

      // no duplicates here so function is not called
      callIfDuplicate(arr, eq, fn);
      expect(foundElement).toBeNull();

      // function called and foundElement reassigned
      callIfDuplicate(arrWithDup, eq, fn);
      expect(foundElement).toBe(el1);
    });
  });

  test("unique", () => {
    testWithAndWithoutEq(({ getArr1, el1, eq }) => {
      const arr = getArr1();
      const arrWithDup = [...arr, el1];
      expect(unique(arrWithDup, eq)).toStrictEqual(arr);
    });
  });
});



const obj1 = { a: 2, b: 3 };
const obj1Keys = ["a", "b"] as const;

describe("object utils", () => {
  test("objFrom", () => {
    expect(objFrom(
      obj1Keys,
      x => `${x}1`,
      x => obj1[x] * 10
    )).toStrictEqual({
      a1: 20, b1: 30
    });
  });

  test("objFromVals", () => {
    expect(objFromVals(
      obj1Keys,
      x => obj1[x]
    )).toStrictEqual(obj1);
  });

  test("objForEach", () => {
    const entries: [string, number][] = [];
    objForEach(
      obj1,
      (k, v) => entries.push([k, v])
    );
    expect(entries).toStrictEqual(Object.entries(obj1));
  });

  test("objMapStatic", () => {
    expect(objMapStatic(
      obj1, {
        a: x => -x,
        b: x => x * 100
      }
    )).toStrictEqual({
      a: -2, b: 300
    });
  });

  test("objMap", () => {
    expect(objMap(
      obj1,
      (k, v) => `${k}${v * 10}`
    )).toStrictEqual({
      a: "a20", b: "b30"
    });
  });

  test("objAssignIfTruthy", () => {
    expect(objAssignIfTruthy(
      obj1Keys,
      { a: 40, b: null },
      obj1
    )).toStrictEqual({
      a: 40, b: 3
    });
  });

  test("objMergeAndAssignKey", () => {
    const obj = {
      a: { b: 2, c: 3 },
      d: 4
    };
    objMergeAndAssignKey(
      obj, "a", { b: 20 }
    );
    expect(obj).toStrictEqual({
      a: { b: 20, c: 3 },
      d: 4
    })
  });

  test("objFilter", () => {
    expect(objFilter(
      obj1,
      (k, _) => k === "b"
    )).toStrictEqual({ b: 3 });
  });

  test("objLen", () => {
    expect(objLen(obj1)).toBe(2);
  });

  test("objKeys", () => {
    expect(objKeys(obj1)).toStrictEqual(obj1Keys);
  });
});


type WithIdx<T> = readonly [T, number]
type Entry = readonly [WithIdx<string>, WithIdx<number>, WithIdx<{ id: number}>]

describe("iterator utils", () => {
  test("iterate", () => {
    const iter1 = ["foo", "bar"];
    const iter2 = [10, 20, 30];
    const iter3 = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const entriesForLoops: Entry[] = [];
    const entriesIterate: Entry[] = [];
    
    // ugly
    for (let i = 0; i < iter1.length; i++) {
      const entry1 = [iter1[i], i] as const;
      for (let j = 0; j < iter2.length; j++) {
        const entry2 = [iter2[j], j] as const;
        for (let k = 0; k < iter3.length; k++) {
          const entry3 = [iter3[k], k] as const;
          entriesForLoops.push([entry1, entry2, entry3]);
        }
      }
    }

    // neat :)
    iterate(iter1, iter2, iter3, (x1, x2, x3, i1, i2, i3) => {
      const entry1 = [x1, i1] as const;
      const entry2 = [x2, i2] as const;
      const entry3 = [x3, i3] as const;
      entriesIterate.push([entry1, entry2, entry3]);
    });

    expect(entriesForLoops).toStrictEqual(entriesIterate);
  });
});
