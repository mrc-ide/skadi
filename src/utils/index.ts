import { Result } from "./types";

export const isNullish = (x: any) => x === null || x === undefined;

export const tryResult = <T>(fn: () => T): Result<T> => {
  try {
    return { success: true, result: fn() };
  } catch {
    return { success: false, result: null };
  }
};

export type Eq<T> = (x: T, y: T) => boolean
const defEq = <T>(x: T, y: T) => x === y;

export const pushIfNotIn = <T>(
  arr: T[],
  el: T,
  eq: Eq<T> = defEq,
) => {
  if (!arr.find(x => eq(x, el))) arr.push(el);
};

export const addIfNotIn = <T>(
  arr: T[],
  el: T,
  eq: Eq<T> = defEq,
) => {
  return arr.find(x => eq(x, el)) ? arr : [...arr, el];
};

export const concatIfNotIn = <T>(
  arr1: T[],
  arr2: T[],
  eq: Eq<T> = defEq,
) => {
  const elsToAdd = arr2.filter(el => !arr1.find(x => eq(x, el)));
  return arr1.concat(elsToAdd);
};

export const callIfDuplicate = <T>(
  arr: T[],
  eq: Eq<T> = defEq,
  fn: (x: T) => void,
) => {
  const unique: T[] = [];
  arr.forEach(el => {
    const inUnique = !!unique.find(x => eq(x, el));
    if (!inUnique) {
      unique.push(el);
    } else {
      fn(el);
    }
  });
};

export const unique = <T>(
  arr: T[],
  eq: Eq<T> = defEq,
) => {
  return arr.reduce((unique, el) => addIfNotIn(unique, el, eq), [] as T[]);
};

export const all = (arr: boolean[]) =>
  arr.reduce((bool, a) => bool && a, true);

export const zip = <
  ArrType1, ArrType2,
>(arr1: ArrType1[], arr2: ArrType2[]) => {
  return arr1.map((a, i) => [a, arr2[i]] as [ArrType1, ArrType2]);
};

export const deepCopy = <T extends object>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export type ObjKey = string | number | symbol

export const objFrom = <T, K extends ObjKey, V>(
  arr: readonly T[],
  getKey: (x: T, idx: number) => K,
  getVal: (x: T, idx: number) => V,
): Record<K, V> => {
  return Object.fromEntries(arr.map((x, idx) => {
    return [getKey(x, idx), getVal(x, idx)];
  })) as Record<K, V>;
};

export const objFromVals = <K extends ObjKey, V>(
  arr: readonly K[],
  getVal: (x: K, idx: number) => V,
) => {
  return objFrom(arr, x => x, getVal);
};

export const objForEach = <
  Obj extends object,
  K extends keyof Obj = keyof Obj,
  V extends Obj[keyof Obj] = Obj[keyof Obj],
>(
  obj: Obj,
  fn: (k: K, v: V) => void,
) => {
  Object.entries(obj).forEach(([key, val]) => {
    const k = key as K;
    const v = val as V;
    fn(k, v);
  });
};

type AnyFuncObj<Obj extends object> = {
  [K in keyof Obj]: (v: Obj[K]) => any
}
type RetObj<FnObj extends Record<any, (v: any) => any>> = {
  [K in keyof FnObj]: ReturnType<FnObj[K]>
}

export const objMapStatic = <
  Obj extends object,
  FnObj extends AnyFuncObj<Obj> = AnyFuncObj<Obj>,
>(
  obj: Obj,
  fnObj: FnObj,
): RetObj<FnObj> => {
  return Object.fromEntries(
    Object.entries(fnObj).map(([key, fn]) => {
      const func = fn as (v: any) => any;
      const val = obj[key as keyof Obj];
      return [key, func(val)];
    })
  ) as RetObj<FnObj>;
};

export const objMap = <
  Obj extends object,
  K extends keyof Obj,
  V extends Obj[keyof Obj],
  Ret
>(
  obj: Obj,
  fn: (k: K, v: V) => Ret,
): Record<K, Ret> => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => {
      const k = key as K;
      const v = val as V;
      return [k, fn(k, v)];
    })
  ) as Record<K, Ret>;
};

export const objAssignIfTruthy = <
  K extends ObjKey,
  O1 extends Partial<Record<K, any>>,
  O2 extends Record<K, any>>(
  arr: readonly K[],
  obj1: O1,
  obj2: O2,
) => {
  return objFromVals(
    arr,
    k => obj1[k] ?? obj2[k]
  ) as { [Key in K]: O2[Key] };
};

export const objMergeAndAssignKey = <
  Obj1 extends object,
  K extends keyof Obj1,
  Obj2 extends Partial<Obj1[K]>,
>(
  obj1: Obj1,
  key: K,
  obj2: Obj2,
) => {
  obj1[key] = { ...obj1[key], ...obj2 };
};

type FilterFn<K, V> = (k: K, v: V) => boolean

export const objFilter = <
  Obj extends object,
  K extends keyof Obj = keyof Obj,
  V extends Obj[keyof Obj] = Obj[keyof Obj],
>(
  obj: Obj,
  filterFn: FilterFn<K, V>,
): Partial<Obj> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, val]) => {
      const k = key as K;
      const v = val as V;
      return filterFn(k, v);
    })
  ) as Partial<Obj>;
};

export const objLen = (obj: object) => Object.keys(obj).length

export const objKeys = <
  Obj extends object,
>(
  obj: Obj,
) => Object.keys(obj) as (keyof Obj)[];

export const splitComma = (str: string | undefined | null) =>
  str?.split(",").map(s => s.trim());


// this is an inefficient but convenient function to iterate through multiple
// arrays provided, it collapses all loops to a single loop. Do not use it for
// huge nested for loops, it will probably cause a slowdown
type ROArray = readonly any[]
type Element<T extends ROArray> = { [K in keyof T]: T[K][number] }
type Indices<T extends ROArray> = { [K in keyof T]: number }
type IterateFunc<T extends ROArray> = (
  ...elsAndIdxs: [...Element<T>, ...Indices<T>]
) => void
type Head<T extends ROArray> = T extends [infer First, ...any] ? First : never
type AnyFunc = (...x: ROArray) => void

export const iterate = <T extends ROArray[]>(...args: [...T, IterateFunc<T>]) => {
  if (args.length === 1) {
    (args[0] as IterateFunc<[]>)();
    return;
  }

  const iterArr = args[0] as Head<T>;
  iterArr.forEach((el, elIdx) => {
    const funcWithElAndIdx = (...argsWithoutElAndIdx: any[]) => {
      const els = argsWithoutElAndIdx.slice(0, argsWithoutElAndIdx.length / 2);
      const idxs = argsWithoutElAndIdx.slice(argsWithoutElAndIdx.length / 2);
      return (args[args.length - 1] as AnyFunc)(el, ...els, elIdx, ...idxs);
    };

    (iterate as AnyFunc)(...args.slice(1, -1), funcWithElAndIdx);
  });
};
