import { ContinuousGeneratorODE, DiscreteGenerator, NamedResult } from "@reside-ic/dust2"
import { Bars2, Lines2, ScatterPoints2 } from "@reside-ic/skadi-chart"
import { Accessor } from "solid-js"
import { ParsedAndProcessedHtml } from "../schemas/html/types"
import { FormIdLabel, JsonPayload, Params } from "../schemas/json/types"
import { GraphStateClass } from "./graph/class"

export type Generator =
  | DiscreteGenerator<any, any, any>
  | ContinuousGeneratorODE<any, any, any>

export type ModelRunResult = {
  main: NamedResult,
  static: { id: string, data: NamedResult }[];
}

export type Metadata = any
export type PlotData = {
  lines: Lines2,
  points: ScatterPoints2,
  bars: Bars2,
  extents: { x: Range, y: Range },
}

export type Form = Record<string, FormIdLabel>

export type Range = [number, number];
export type GraphMetadata = {
  maxExtents: { xrange: Range, yrange: Range }
}


export type Fixed = {
  json: JsonPayload,
  generator: Generator,
  html: ParsedAndProcessedHtml,
}

export type Producer<T> = (fn: (x: T) => void) => void;

export type Store = {
  // will be initialised once at the start
  name: string,
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

  graphStates: GraphStateClass,
}
