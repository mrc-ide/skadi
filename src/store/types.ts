import { ContinuousGeneratorODE, DiscreteGenerator, NamedResult } from "@reside-ic/dust2"
import { Lines, ScatterPoints } from "@reside-ic/skadi-chart"
import { Accessor, Setter } from "solid-js"
import { ParsedHtml } from "./html/schema"

export type ModelInfo = { name: string }
export type ModelMetadata = {
  time: "discrete" | "continuous",
  variables: ModelInfo[],
  parameters: ModelInfo[],
  data: ModelInfo[],
}
export type Generator =
  | DiscreteGenerator<any, any, any>
  | ContinuousGeneratorODE<any, any, any>

export type Stroke =
  | "solid"
  | "dot"
  | "dash"
  | "dotdash"
export type LineStyle = {
  color?: string,
  width?: number,
  stroke?: Stroke,
}
export type Config = {
  startTime?: number,
  endTime: number,
  particles: number,
  dt?: number,
  styles?: Record<string, LineStyle>
}

export type ParameterValue = number | number[]
export type ParameterValues = Record<string, ParameterValue>
export type Params = {
  static: ParameterValues,
  user: ParameterValues,
}

export type GraphHtmlMetadata = {
  id: string, config: Partial<GraphConfig>
}
export type ProcessedHtml = {
  parsed: ParsedHtml,
  processed: {
    plot: GraphHtmlMetadata[],
    vars: string[],
  }
}

export type FixedParamSet = Partial<Params> & {
  style?: LineStyle
}

export type FixedJson = {
  config: Config,
  fixedParamSets: FixedParamSet[],
  modelMetadata: ModelMetadata,
}

export type Metadata = any
export type PlotData = {
  lines: Lines<Metadata>,
  points: ScatterPoints<Metadata>,
}

export type Form = Record<string, any>

export type Range = [number, number]
export type DataWithRange = {
  data: NamedResult,
  xrange: Range,
  yrange: Range,
}
export type GraphData = {
  main: DataWithRange,
  static: DataWithRange[]
}

export type GraphConfig = {
  vars: string[],
  xrange: Range,
  yrange: Range,
  ylog: boolean,
}
export const graphConfigKeys = [
  "vars", "xrange", "yrange", "ylog"
] as const satisfies (keyof GraphConfig)[];

export type LowercaseArray<T extends string[]> =
  T extends [infer First extends string, ...infer Rest extends string []]
    ? [Lowercase<First>, ...LowercaseArray<Rest>]
    : []

export const graphConfigAttrs =
  graphConfigKeys.map(x => x.toLowerCase()) as LowercaseArray<typeof graphConfigKeys>;

export type GraphState = {
  id: string,
  config: GraphConfig,
  signals: {
    fullRerender: Accessor<boolean>,
    setFullRerender: Setter<boolean>,
    rangeUpdated: Accessor<boolean>,
    setRangeUpdated: Setter<boolean>,
  },
}

type ExcludeSet<K extends string> = K extends `set${infer _}` ? never : K
export type GraphSignal = keyof {
  [K in keyof GraphState["signals"] as ExcludeSet<K>]: any
}

export type Fixed = {
  json: FixedJson,
  generator: Generator,
  html: ProcessedHtml,
}

export type ProduceParam = (p: Params) => void

export type Store = {
  // will be initialised once at the start
  fixed: Fixed,


  // updated via user form if any
  form: Accessor<Form>,
  setForm: Setter<Form>,

  // |
  // v

  // updated when form or user input updates
  params: Accessor<Params>,
  setParams: (fn: ProduceParam) => void,

  // |
  // v

  // updated when params update
  graphData: Accessor<GraphData>,
  setGraphData: Setter<GraphData>,


  graphStates: GraphState[],
  getGraphState: (
    id: string,
  ) => GraphState,
  setGraphConfig: (
    id: string,
    changedProps: Partial<GraphConfig>,
    rangeUpdated?: boolean,
  ) => void,
}


// we get model as a string that we have to eval
export type JsonPayload = {
  model: {
    generator: string,
    metadata: ModelMetadata,
  },
  config: Config,
  fixedParamSets: FixedParamSet[],
}
