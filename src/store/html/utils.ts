import { addIfNotIn, objForEach } from "../utils";
import { Attribute, attributes, AttrSchema, ClassName } from "./schema";

// helper function to add `w-`
export const w = (x: ClassName | Attribute) => `w-${x}`;
export const isW = (x: string) => x.startsWith("w-");
export const stripW = (x: string) => isW(x) ? x.slice(2) : null;
export const isAttr = (x: string): x is Attribute => attributes.includes(x as any);

const makeQuery = (
  className: ClassName,
  attrs: Partial<Record<Attribute, string>> = {},
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
  attrs: Partial<Record<Attribute, string>> = {},
) => {
  return Array.from(
    document.querySelectorAll(makeQuery(className, attrs))
  );
};

export const getEl = (
  className: ClassName,
  attrs: Partial<Record<Attribute, string>> = {},
) => {
  return document.querySelector(makeQuery(className, attrs));
};

export const getAttr = (a: Attribute, el: Element) => el.getAttribute(w(a));
export const setAttr = (a: Attribute, val: string, el: Element) => el.setAttribute(w(a), val);
export const unsetAttr = (a: Attribute, el: Element) => el.removeAttribute(w(a));

const tagErrorElement = (el: Element) => {
  setAttr("error", "", el);
};

type ErrMsgCallback = (elMsg: string) => string
export const error = (
  el: Element, fn: ErrMsgCallback, changeHtml: boolean = true
) => {
  const msgConsole = fn(`element with tag ${w("error")}`);
  const msgOverlay = fn("element shown below");

  if (changeHtml) {
    tagErrorElement(el);


    const errorOverlay = document.createElement("div");
    errorOverlay.setAttribute("class", "error-overlay");

    const errorText = document.createElement("div");
    errorText.setAttribute("class", "error-text");
    errorText.textContent = "Error: " + msgOverlay;

    const errorCodeContainer = document.createElement("div");
    errorCodeContainer.setAttribute("class", "error-code-container");
    const html = document.body.innerHTML.split("\n");
    const errLineNum = html.findIndex(l => l.includes(w("error")));
    const maxDigits = Math.floor(Math.log10(html.length)) + 1;
    const errPattern = ` ${w("error")}=""`;
    errorCodeContainer.textContent = html
      .map((l, i) => {
        const lNum = `${i + 1}`;
        return i === errLineNum
          ? " ==> " + lNum.padStart(maxDigits) + l.replace(errPattern, "")
          : lNum.padStart(maxDigits + 5) + l; // pad 5 for missing " --> "
      })
      .join("\n");
    
    const errorInDevtoolsText = document.createElement("div");
    errorInDevtoolsText.setAttribute("class", "error-in-devtools-text");
    errorInDevtoolsText.textContent = "You can also view the element in devtools "
    + "(Ctrl + Shift + i) by going to the Elements tab and searching (Ctrl + f) "
    + `for "${w("error")}"`;

    errorOverlay.append(errorText);
    errorOverlay.append(errorCodeContainer);
    errorOverlay.append(errorInDevtoolsText);

    document.body.append(errorOverlay);

    errorCodeContainer.scrollTo({
      top: errLineNum / html.length * errorCodeContainer.scrollHeight
        - errorCodeContainer.getBoundingClientRect().height / 2
    });
  }

  throw new Error(msgConsole);
};

export const expectAttrs = (
  attrs: Attribute[], el: Element, changeHtml: boolean = true
) => {
  attrs.forEach(a => {
    if (!getAttr(a, el)) {
      error(el, elMsg =>
        `Attribute "${w(a)}" missing from ${elMsg}`,
        changeHtml
      );
    }
  });
};

export const expectOnlyAttrs = (
  attrs: Attribute[], el: Element, changeHtml: boolean = true
) => {
  for (let i = 0; i < el.attributes.length; i++) {
    // stripW returns null if not of form `w-`
    const a = stripW(el.attributes[i].name);
    if (!a) continue;
    if (!isAttr(a)) {
      error(el, elMsg =>
        `Unknown attribute "${w(a as any)}" defined for ${elMsg}`,
        changeHtml
      );
    } else if (!attrs.includes(a)) {
      error(el, elMsg =>
        `"${w(a as any)}" defined for ${elMsg} is known but not for this class`,
        changeHtml
      );
    }
  }
};

export const expectSchema = (
  attrSchema: AttrSchema[], el: Element, changeHtml: boolean = true
) => {
  const allAttrs = attrSchema
    .map(a => a.name);
  expectOnlyAttrs(allAttrs, el, changeHtml);

  const requiredAttrs = attrSchema
    .filter(a => !a.optional)
    .map(a => a.name);
  expectAttrs(requiredAttrs, el, changeHtml);
}

export const findSchema = <
  T extends { oneOf: AttrSchema[][] }
>(scheme: T, el: Element) => {
  return scheme.oneOf.find(s => {
    try {
      expectSchema(s, el, false)
    } catch {
      // on error we tag element with w-error, this reverts it as
      // we don't care if some of these error
      return false;
    };
    return true;
  });
};

export const attrEq = (a: Attribute) =>
  (el1: Element, el2: Element) => getAttr(a, el1) === getAttr(a, el2)

export const attrsEq = (attrs: Attribute[]) =>
  (el1: Element, el2: Element) =>
    attrs.reduce((agg, a) => agg && attrEq(a)(el1, el2), true);

export const getStoresInPage = () => {
  const els = Array.from(document.querySelectorAll(`[${w("store")}]`)!);
  return els.reduce(
    (stores, el) => addIfNotIn(stores, getAttr("store", el)!),
    [] as string[]
  );
};
