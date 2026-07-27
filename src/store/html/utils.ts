
import { objForEach } from "../utils";

// We automatically add a `w-` prefix to these attr names,
// e.g. `w-store`
type AttrSchema = {
  name: string,
  optional?: boolean,
}

// We automatically add a `w-` prefix to these classes,
// e.g. `w-storeCfg`
type Schema = { class: string }
  & ({ attrs: AttrSchema[] } | { oneOf: AttrSchema[][] })

const graphConfigSchema = [
  { name: "vars", optional: true },
  { name: "yLog", optional: true },
] as const satisfies AttrSchema[];

export const schemas = [
  {
    class: "storeCfg",
    attrs: [
      { name: "store" },
      { name: "sync", optional: true },
    ]
  },
  {
    class: "graphCfg",
    attrs: [
      { name: "store" },
      { name: "id" },
      ...graphConfigSchema,
    ]
  },
  {
    class: "parCfg",
    attrs: [
      { name: "store" },
      { name: "par" },
      { name: "val" },
      { name: "min" },
      { name: "max" },
      { name: "step", optional: true },
    ]
  },
  {
    class: "par",
    attrs: [
      { name: "store" },
      { name: "par" },
    ]
  },
  {
    class: "plot",
    oneOf: [
      [
        { name: "id" },
      ],
      [
        { name: "store" },
        ...graphConfigSchema,
      ]
    ]
  },
] as const satisfies Schema[];
export type Schemas = typeof schemas;

export type ClassName = Schemas[number]["class"]

type GetAttrs<T> = T extends (infer R)[] ? R : never
type GetOneOf<T> = T extends (infer R)[][] ? R : never
type GetName<T> = T extends { name: infer N } ? N : never
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
type Values<T extends object> = Prettify<T[keyof T]>

export type Attr =
  Values<{
    [K in Schemas[number] as K["class"]]: "attrs" extends keyof K
      ? GetName<GetAttrs<K["attrs"]>>
      : "oneOf" extends keyof K
        ? GetName<GetOneOf<K["oneOf"]>>
        : never
  }>
  | "error"

// helper function to add `w-`
export const w = (x: ClassName | Attr) => `w-${x}`;

const makeQuery = (
  className: ClassName,
  attrs: Partial<Record<Attr, string>> = {},
) => {
  let query = `.${w(className)}`;
  objForEach(
    attrs,
    (a, val) => query += `[${w(a)}="${val}"]`
  );
  return query;
};

export const getEls = (
  className: ClassName,
  attrs: Partial<Record<Attr, string>> = {},
) => {
  return Array.from(
    document.querySelectorAll(makeQuery(className, attrs))
  );
};

export const getEl = (
  className: ClassName,
  attrs: Partial<Record<Attr, string>> = {},
) => {
  return document.querySelector(makeQuery(className, attrs));
};

export const getAttr = (a: Attr, el: Element) => el.getAttribute(w(a));
export const setAttr = (a: Attr, val: string, el: Element) => el.setAttribute(w(a), val);

const tagErrorElement = (el: Element) => {
  setAttr("error", "", el);
};

type ErrMsgCallback = (elMsg: string) => string
export const error = (el: Element, fn: ErrMsgCallback) => {
  tagErrorElement(el);
  const elMsg = `element with tag ${w("error")}`;
  throw new Error(fn(elMsg));
};

export const expectAttrs = (attrs: Attr[], el: Element) => {
  attrs.forEach(a => {
    if (!getAttr(a, el)) {
      error(el, elMsg =>
        `Attribute "${w(a)}" missing from ${elMsg}`
      );
    }
  });
};

export const expectOneOfAttrs = (attrSets: Attr[][], el: Element) => {
  let attrSetFound = false;
  outer: for (const attrs of attrSets) {
    for (const a of attrs) {
      if (!getAttr(a, el)) continue outer;
    }
    attrSetFound = true;
    break;
  }

  if (!attrSetFound) {
    error(el, elMsg =>
      `The ${elMsg} does not have known set of attributes`
    );
  }
};

export type AttrIsValidFn = (attrVal: string | undefined | null) => boolean
export const expectAttrFn = (
  a: Attr,
  el: Element,
  fn: AttrIsValidFn,
  errFn: ErrMsgCallback,
) => {
  if (!fn(getAttr(a, el))) {
    error(el, errFn);
  }
};

export const expectAttrsFn = (
  attrs: Attr[],
  el: Element,
  fn: AttrIsValidFn,
  errFn: (attr: Attr, elMsg: string) => string,
) => {
  attrs.forEach(a => expectAttrFn(a, el, fn, errFn.bind(null, a)));
};

export const attrEq = (a: Attr) =>
  (el1: Element, el2: Element) => getAttr(a, el1) === getAttr(a, el2)

export const attrsEq = (attrs: Attr[]) =>
  (el1: Element, el2: Element) =>
    attrs.reduce((agg, a) => agg && attrEq(a)(el1, el2), true);

export const splitComma = (str: string | undefined | null) =>
  str?.split(",").map(s => s.trim());

export const isStrNumber = (s: string | undefined | null) =>
  !!(s && !isNaN(parseFloat(s)));
