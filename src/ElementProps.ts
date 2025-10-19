type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? A
  : B;

type FunctionKeys<T> = {
  [K in keyof T]-?: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

type ReadonlyKeys<T> = {
  [K in keyof T]-?: IfEquals<
    { [Q in K]: T[K] },
    { -readonly [Q in K]: T[K] },
    never,
    K
  >;
}[keyof T];

type NeverSetExtras = "style" | "attributes" | "classList" | "dataset";

type NeverSetKeys<T> =
  | ReadonlyKeys<T>
  | FunctionKeys<T>
  | Extract<keyof T, NeverSetExtras>;

type AssignableKeys<T> = Exclude<keyof T, NeverSetKeys<T>>;

type AssignableSubset<T> = Partial<Pick<T, AssignableKeys<T>>>;

export type ProperOmit<T, K extends PropertyKey> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type SignalData<Tag extends keyof HTMLElementTagNameMap> = {
  origin: any;
  update: (elm: HTMLElementTagNameMap[Tag], signalProps: any) => void;
};
export type RefernceObject<Refernce = any> = {
  current: Refernce | null;
};

export type ElmObjRefData = {
  ref?: RefernceObject;
};

type Child =
  | Element
  | HTMLElement
  | DocumentFragment
  | string
  | number
  | false
  | null
  | undefined;

export type ElementChildren = Child | ElementChildren[];

type ElementAssignablePropsMap = {
  [K in keyof HTMLElementTagNameMap]: AssignableSubset<
    HTMLElementTagNameMap[K]
  >;
};

export type ElementProps<Tag extends keyof HTMLElementTagNameMap> = ProperOmit<
  ElementAssignablePropsMap[Tag] & {
    ref?: RefernceObject<HTMLElementTagNameMap[Tag]>;
    signal?: SignalData<Tag> | SignalData<Tag>[];
    hooks?: {
      beforeRender?: () => void;
      afterRender?: (elm: HTMLElementTagNameMap[Tag]) => void;
    };
  },
  never
> & {
  attributes?: Record<string, string | number | boolean>;
  style?: RecursivePartial<HTMLElement["style"]>;
  dataset?: Record<string, string>;
};

// ===== SVG element props =====
export type SvgSignalData<Tag extends keyof SVGElementTagNameMap> = {
  origin: any;
  update: (elm: SVGElementTagNameMap[Tag], signalProps: any) => void;
};

type SVGAssignablePropsMap = {
  [K in keyof SVGElementTagNameMap]: AssignableSubset<SVGElementTagNameMap[K]>;
};

export type SvgElementProps<Tag extends keyof SVGElementTagNameMap> =
  ProperOmit<
    SVGAssignablePropsMap[Tag] & {
      ref?: RefernceObject<SVGElementTagNameMap[Tag]>;
      signal?: SvgSignalData<Tag> | SvgSignalData<Tag>[];
      hooks?: {
        beforeRender?: () => void;
        afterRender?: (elm: SVGElementTagNameMap[Tag]) => void;
      };
    },
    never
  > & {
    attributes?: Record<string, string | number | boolean>;
    style?: RecursivePartial<SVGElement["style"]>;
    dataset?: Record<string, string>;
  };
