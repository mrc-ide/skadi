import { ContinuousGeneratorODE, DiscreteGenerator } from "@reside-ic/dust2"
import { Lines, ScatterPoints } from "@reside-ic/skadi-chart"
import { NamedResult } from "interfaces/System"
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
  startTime: number,
  endTime: number,
  particles: number,
  dt: number,
}

export type ParameterValue = number | number[]
export type ParameterValues = Record<string, ParameterValue>
export type Params = {
  static: ParameterValues,
  user: ParameterValues,
}

export type GraphHtmlMetadata = {
  id: string,
} & Partial<GraphConfigNoId>
export type HtmlMetadata = {
  graphMetadata: GraphHtmlMetadata[],
  sync: (keyof GraphConfig)[],
  allVars: string[],
}

export type Metadata = any
export type PlotData = {
  lines: Lines<Metadata>,
  points: ScatterPoints<Metadata>,
}

export type Form = Record<string, any>

export type GraphData = {
  main: NamedResult,
  static: NamedResult[]
}

export type Range = [number | null, number | null]
export type GraphConfig = {
  id: string,
  vars: string[],
  xRange: Range,
  yRange: Range,
  yLog: boolean,
}
export type GraphConfigNoId = Omit<GraphConfig, "id">


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
  graphData: Accessor<GraphData>,
  setGraphData: Setter<GraphData>,


  // graph groups contain graph configs which
  // hold properties of graphs unrelated to the
  // data like x range and they contain sync
  // property that tracks what is synced between
  // the configs
  graphConfigs: Accessor<GraphConfig[]>,
  setGraphConfig: (
    id: string,
    changedProp: Partial<GraphConfigNoId>
  ) => void,
}


// we get model as a string that we have to eval
export type JsonDefinedFields = {
  model: Omit<Model, "generator"> & { generator: string },
  config: Config,
  staticParamSets: Partial<Params>[],
}
