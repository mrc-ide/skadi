import { ContinuousGeneratorODE, DiscreteGenerator } from "@reside-ic/dust2"
import { Lines, ScatterPoints } from "@reside-ic/skadi-chart"
import { Accessor, Setter } from "solid-js"

type ModelMetadata = { name: string }

export type Model = {
  generator: DiscreteGenerator<any, any, any> | ContinuousGeneratorODE<any, any, any>,
  metadata: {
    time: "discrete" | "continuous",
    variables: ModelMetadata[],
    parameters: ModelMetadata[],
    data: ModelMetadata[],
  },
}

export type Config = {
  particles: number,
  dt: number,
}

export type ParameterValue = number | number[]
export type ParameterValues = Record<string, ParameterValue>
export type Params = {
  static: ParameterValues,
  user: ParameterValues,
}

export type HtmlMetadata = {
  variables: string[]
}

export type Metadata = any
export type PlotData = {
  lines: Lines<Metadata>,
  points: ScatterPoints<Metadata>,
}

export type Form = Record<string, any>

export type GraphData = {
  main: PlotData,
  static: PlotData[]
}


export type Store = {
  // will be initialised once at the start
  fixed: {
    model: Model,
    config: Config,
    staticParamSets: Partial<Params>[],
    htmlMetadata: HtmlMetadata,
  }


  // updated via user form if any
  form: Accessor<Form>,
  setForm: Setter<Form>,

  // |
  // v

  // updated when form or user input updates
  params: Accessor<Params>,
  setParams: Setter<Params>,

  // |
  // v

  // updated when params update
  graphData: Accessor<GraphData>
  setGraphData: Setter<GraphData>,
}


// we get model as a string that we have to eval
export type JsonDefinedFields = {
  model: Omit<Model, "generator"> & { generator: string },
  config: Config,
  staticParamSets: Partial<Params>[],
}
