
import { objForEach } from "../utils";


// these refer to classes in the document, actual class names are these
// prefixed with `w-`, e.g. `w-store-cfg`
export type ClassName =
  | "store-cfg"
  | "graph-cfg"
  | "par-cfg"
  | "par"
  | "plot"

// these refer to attributes of elements in the document, actual attributes
// are prefixed with `w-`, e.g. `w-store`
export type Attr =
  | "store"
  | "storeid"
  | "sync"
  | "id"
  | "vars"
  | "xrange"
  | "yrange"
  | "ylog"
  | "par"
  | "val"
  | "min"
  | "max"
  | "step"
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
