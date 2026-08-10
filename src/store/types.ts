import { ContinuousGeneratorODE, DiscreteGenerator, NamedResult } from "@reside-ic/dust2"
import { Lines, ScatterPoints } from "@reside-ic/skadi-chart"
import { Accessor, Setter } from "solid-js"
import { GraphConfig, ParsedAndProcessedHtml } from "../schemas/html/types"
import { FormIdLabel, JsonPayload, Params } from "../schemas/json/types"

export type Generator =
  | DiscreteGenerator<any, any, any>
  | ContinuousGeneratorODE<any, any, any>

export type Metadata = any
export type PlotData = {
  lines: Lines<Metadata>,
  points: ScatterPoints<Metadata>,
}

export type Form = Record<string, FormIdLabel>

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
  json: JsonPayload,
  generator: Generator,
  html: ParsedAndProcessedHtml,
}

export type Producer<T> = (fn: (x: T) => void) => void;

export type Store = {
  // will be initialised once at the start
  fixed: Fixed,


  // updated via user form if any
  form: Accessor<Form>,
  setForm: Producer<Form>,

  // |
  // v

  // updated when form or user input updates
  params: Accessor<Params>,
  setParams: Producer<Params>,

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
