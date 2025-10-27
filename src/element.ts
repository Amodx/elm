import { ElementChildren, ElementProps, SvgElementProps } from "./ElementProps";
import { SignalsController } from "./SignalController";
import { RefernceObject } from "./ElementProps";
import { animateElement } from "./animate";
const EFFECT_TAG = "amodx-elm-effect-hook";
export class EffectElement extends HTMLElement {
  _mount: () => void | null;
  _unmount: () => void | null;
  private _parent: HTMLElement | null;
  private _didMount = false;
  connectedCallback() {
    if (this._didMount) return;
    this._parent = this.parentElement;
    if (!this._parent) return;
    this._didMount = true;
    this._mount?.();
  }

  disconnectedCallback() {
    if (!this._didMount) return;
    if (this._parent?.isConnected) {
      this._parent.append(this);
      return;
    }
    this._unmount?.();
  }
}

function ensureEffectElementRegistered(targetWindow?: Window | null) {
  try {
    const w =
      targetWindow ?? (typeof window !== "undefined" ? window : undefined);
    if (!w || !w.customElements) return;

    if (!w.customElements.get(EFFECT_TAG)) {
      w.customElements.define(EFFECT_TAG, EffectElement);
    }

    const doc = w.document;
    if (!doc.getElementById(`${EFFECT_TAG}-style`)) {
      const style = doc.createElement("style");
      style.id = `${EFFECT_TAG}-style`;
      style.textContent = /* css */ `
        ${EFFECT_TAG} {
          display: none;
          visibility: hidden;
          opacity: 0;
          position: absolute;
          width: 0;
          height: 0;
          margin: 0;
          padding: 0;
          overflow: hidden;
          pointer-events: none;
          contain: strict;
        }
      `;
      doc.head.appendChild(style);
    }
  } catch (error) {
    console.warn(`Could not set up useEffect for @amodx/elm`, error);
  }
}
export function useRef<Refernce = any>(
  current: Refernce | null = null
): RefernceObject<Refernce> {
  const ref: RefernceObject<Refernce> = { current };
  return ref;
}

export function useElmRef<Tag extends keyof HTMLElementTagNameMap>(
  current: HTMLElementTagNameMap[Tag] | null = null
) {
  return useRef<HTMLElementTagNameMap[Tag]>(current);
}

class Query {
  id: string | null = null;
  classes: string[] | null = null;
  attributes: Record<string, string> | null = null;
}

function matchesQuery(element: HTMLElement, query: Query) {
  if (query.id && element.id != query.id) return false;
  if (query.classes) {
    for (const cssClass of query.classes) {
      if (!element.classList.contains(cssClass)) return false;
    }
  }
  if (query.attributes) {
    for (const key in query.attributes) {
      if (
        !(
          element.hasAttribute(key) &&
          element.getAttribute(key) == query.attributes[key]
        )
      )
        return false;
    }
  }
  return true;
}

function findParent(
  element: HTMLElement,
  queryString: string,
  stopElement: HTMLElement | null = null
) {
  const query = processQueryString(queryString);
  let currentParent: HTMLElement | null = element;
  while (currentParent) {
    if (matchesQuery(currentParent, query)) return currentParent;
    currentParent = currentParent.parentElement;
    if (currentParent == stopElement) break;
  }
  return null;
}
function findChild(
  element: HTMLElement,
  queryString: string,
  stopElement: HTMLElement | null = null
): HTMLElement | null {
  const query = processQueryString(queryString);

  const stack: HTMLElement[] = [element];
  while (stack.length) {
    const current = stack.pop()!;
    if (matchesQuery(current, query)) return current;
    if (current === stopElement) break;
    for (const child of Array.from(current.children) as HTMLElement[]) {
      stack.push(child);
    }
  }
  return null;
}
function processQueryString(queryString: string) {
  const query = new Query();
  const tokens = queryString.split(" ");
  for (const token of tokens) {
    if (!token) continue;
    const firstChar = token.charAt(0);
    if (firstChar == "#") {
      query.id = token.replace("#", "");
      continue;
    }
    if (firstChar == ".") {
      query.classes = [];
      for (const classToken of token.split(".")) {
        if (!classToken) continue;
        query.classes.push(classToken);
      }
      continue;
    }
    if (token.includes("=")) {
      for (const attributeToken of token.split(",")) {
        query.attributes = {};
        const [key, value] = attributeToken.split("=");
        if (!key || !value) continue;
        query.attributes[key] = value;
      }
      continue;
    }
    query.classes = [token];
  }
  return query;
}

function processPropsString(el: Element, string: string) {
  const query = processQueryString(string);
  if (query.id) el.id = query.id;
  if (query.classes) el.classList.add(...query.classes);
  if (query.attributes) {
    for (const key in query.attributes) {
      el.setAttribute(key, query.attributes[key]);
    }
  }
}

function addChild(child: ElementChildren, frag: DocumentFragment) {
  if (child === null || child === false || child === undefined) return;
  if (typeof child === "string") {
    frag.appendChild(document.createTextNode(child));
    return;
  }
  if (typeof child === "number") {
    frag.appendChild(document.createTextNode(String(child)));
    return;
  }
  if (Array.isArray(child)) {
    processChildren(child, frag);
  } else {
    frag.appendChild(child);
  }
}

function processChildren(children: ElementChildren, frag: DocumentFragment) {
  if (Array.isArray(children)) {
    for (const child of children) {
      addChild(child, frag);
    }
    return;
  }
  addChild(children, frag);
}

function appendChildren(
  el: Element | DocumentFragment,
  children: ElementChildren
) {
  const tempFrag = document.createDocumentFragment();
  processChildren(children, tempFrag);
  el.appendChild(tempFrag);
}

function applyProps<Tag extends keyof HTMLElementTagNameMap>(
  props: ElementProps<Tag>,
  el: HTMLElementTagNameMap[Tag]
) {
  for (const key in props) {
    const value = props[key as keyof ElementProps<Tag>];
    if (key in el) {
      const isObject = typeof value === "object" && value !== null;
      if (key == "attributes" && isObject) {
        for (const key in value) {
          el.setAttribute(key, String(value[key]));
        }
        continue;
      }
      if (key == "dataset" && isObject) {
        for (const key in value) {
          el.dataset[key] = String(value[key]);
        }
        continue;
      }
      if (key == "style" && isObject) {
        for (const key in value) {
          el.style[key as any] = String(value[key]);
        }
        continue;
      }

      (el as any)[key] = value;
    } else {
      if (
        typeof value === "string" ||
        (typeof value === "number" && value !== null)
      ) {
        el.setAttribute(key, String(value));
      } else {
        (el as any)[key] = value;
      }
    }
  }
}

const wrapTags: Record<
  keyof HTMLElementTagNameMap,
  ReturnType<typeof wrap<{}, keyof HTMLElementTagNameMap>>
> = new Proxy(
  {},
  {
    get(target: any, tag: keyof HTMLElementTagNameMap) {
      if (!(tag in target)) {
        target[tag] = (props: any, ...children: ElementChildren[]) => {
          return _elm(tag, props, ...children);
        };
      }
      return target[tag];
    },
  }
) as Record<
  keyof HTMLElementTagNameMap,
  ReturnType<typeof wrap<{}, keyof HTMLElementTagNameMap>>
>;

export const props = <Tag extends keyof HTMLElementTagNameMap>(
  props: Partial<ElementProps<Tag>>
) => {
  return props as any;
};

let effectElm: EffectElement;
function applyAndProcess(
  el: Element,
  props?: SvgElementProps<any> | ElementProps<any> | string | null,
  children?: ElementChildren
) {
  let isObjectProps = typeof props == "object" && props !== null;
  let objectProps = props as ElementProps<any>;
  if (isObjectProps) {
    if (objectProps.hooks?.beforeRender) objectProps.hooks.beforeRender();

    if (objectProps.ref) {
      objectProps.ref!.current = el;
    }

    applyProps(objectProps, el);
  }

  appendChildren(el, children);

  if (props && typeof props == "string") {
    processPropsString(el, props);
  }

  if (isObjectProps) {
    applySignal(objectProps, el);
    if (objectProps.hooks?.afterRender) objectProps.hooks.afterRender(el);
    if (objectProps.hooks?.mount || objectProps.hooks?.unmount) {
      if (!effectElm) {
        ensureEffectElementRegistered();
        effectElm = document.createElement(EFFECT_TAG) as any;
      }
      const newEffect = effectElm.cloneNode(false) as EffectElement;
      newEffect._mount = objectProps.hooks.mount;
      newEffect._unmount = objectProps.hooks.unmount;
      el.append(newEffect);
    }
  }
}

/**Record of cached elements to clone */
const tags: Record<string, HTMLElement> = {};

type ElmType = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  props?: ElementProps<Tag> | string | null,
  ...children: ElementChildren[]
) => Tag extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[Tag]
  : HTMLElement;

const _elm: ElmType = (tag, props, ...children) => {
  let el: HTMLElement;
  if (!tags[tag]) {
    const newElm = document.createElement(tag as keyof HTMLElementTagNameMap);
    tags[tag] = newElm;
  }
  el = tags[tag].cloneNode(false) as HTMLElement;

  applyAndProcess(el, props, children);
  return el as any;
};

type ProcessFunction<
  ExtraProps extends {},
  Tag extends keyof HTMLElementTagNameMap
> = (
  props: ElementProps<Tag> & ExtraProps,
  children: ElementChildren[]
) => ElementChildren[] | ElementChildren | void;
type ProcessOverrideFunction<
  ExtraProps extends {},
  Tag extends keyof HTMLElementTagNameMap
> = (
  props: ElementProps<Tag> & ExtraProps,
  children: ElementChildren[]
) => HTMLElement | DocumentFragment;

export const wrap = <
  ExtraProps extends {},
  Tag extends keyof HTMLElementTagNameMap
>(
  tag: Tag,
  processOrOverride?: ProcessFunction<ExtraProps, Tag> | boolean,
  process?: ProcessOverrideFunction<ExtraProps, Tag>
): ((
  props: (ElementProps<Tag> & ExtraProps) | string,
  ...children: ElementChildren[]
) => Tag extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[Tag]
  : HTMLElement) => {
  if (typeof processOrOverride == "function") {
    return (
      props: (ElementProps<Tag> & ExtraProps) | string,
      ...children: ElementChildren[]
    ) => {
      const newProps: ElementProps<Tag> & ExtraProps =
        typeof props == "string" ? { className: props } : (props as any);
      let newChildren = processOrOverride
        ? processOrOverride(newProps, children)
        : null;
      if (newChildren) {
        children = Array.isArray(newChildren) ? newChildren : [newChildren];
      }
      return _elm(tag, props, ...children) as any;
    };
  }
  if (typeof processOrOverride == "boolean" && process) {
    return (
      props: (ElementProps<Tag> & ExtraProps) | string,
      ...children: ElementChildren[]
    ) => {
      const newProps: ElementProps<Tag> & ExtraProps =
        typeof props == "string" ? { className: props } : (props as any);
      return process(newProps, children) as any;
    };
  }
  return wrapTags[tag] as any;
};

function applySignal(objectProps: ElementProps<any>, el: Element) {
  if (objectProps.signal) {
    if (Array.isArray(objectProps.signal)) {
      for (let i = 0; i < objectProps.signal.length; i++) {
        SignalsController.register(objectProps.signal[i], el);
      }
    } else {
      SignalsController.register(objectProps.signal!, el);
    }
  }
}

export function html(
  htmlString: string,
  props: ElementProps<any> | string | null = null,
  ...children: ElementChildren[]
): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();
  const el = template.content.firstChild as HTMLElement;
  applyAndProcess(el, props, children);
  return el;
}

export function raw<Tag extends keyof HTMLElementTagNameMap>(
  el: HTMLElementTagNameMap[Tag],
  props: ElementProps<Tag> | string | null = null,
  ...children: ElementChildren[]
): HTMLElementTagNameMap[Tag] {
  applyAndProcess(el, props, children);
  return el;
}

export function frag(...children: ElementChildren[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  appendChildren(frag, children);
  return frag;
}

export function css(cssString: string) {
  const styleElement = document.createElement("style");
  styleElement.innerHTML = cssString;
  document.head.appendChild(styleElement);
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function svg<Tag extends keyof SVGElementTagNameMap>(
  tag: Tag,
  props: SvgElementProps<Tag> | string | null,
  ...children: ElementChildren[]
): SVGElementTagNameMap[Tag] {
  const el = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[Tag];

  applyAndProcess(el, props, children);
  return el as any;
}

const ElmModule = {
  applyProps,
  appendChildren,
  wrap,
  frag,
  html,
  raw,
  props,
  css,
  svg,
  animate: animateElement,
  tags: wrapTags,
  findParent,
  findChild,
};

export const elm: ElmType & typeof ElmModule = Object.assign(_elm, ElmModule);
