# Intro to Skadi

This is a configurable and extendable HTML and JSON framework that creates static (no server)
and interactive visualisations of their [Odin2](https://github.com/mrc-ide/odin2) models. An
example of configuration the researcher would write is given [here](./example/). General
folder structure is:
* `index.html` - HTML file outlining what the user wants to display
* `stores/` - stores folder essentially has a 1 to 1 mapping with model (you can have
   multiple models in the same HTML page)
  * `<store-name>/` - the name of this folder will be reference in the HTML `w-store`
    attribute
    * `model.R` - your Odin2 model
    * `fixedParamSets.json` - any parameter sets you want to run while holding certain
      parameter values fixed. These can be a partial set of parameter values which will be
      filled in with user selected values for missing ones. They can also be form values if
      you want a trace with a form value held fixed. This file also optionally contains styles
      for your lines
    * `config.json` - this contains hyperparameters such as the step size the Odin2 runner
      takes. It also contains styles for the "main" user trace (the fully defined user one)
    *`forms.json` - this specifies a mapping from form values to parameter values. The general
      use case for this is array/tensor inputs into the model as these are difficult to have
      UI elements for
    * `formAssets/` - this folder contains json files named after the corresponding selection
      of form values (in the order the fields are defined in `forms.json`) joined by `__`.
      These files specify a partial set of parameters as well
Given this, we do some work at both build time and run time to create a site.


# Build time

* A builder [src/builder](./src/builder/) in combination with a running
  [odin.api container](./scripts/run-deps-prod.sh) is responsible for:
  * validating folder structure of configuration
  * validating researcher written JSON against schema in
    [src/schemas/json/schema.ts](./src/schemas/json/schema.ts)
  * sending `model.R` to odin.api and storing `model.json` in the destination folder (this
    contains the model compiled from Odin2 to Javascript as a JSON response)
  This builds the bundle that can be deployed anywhere.


# Run time

* The main entry first parses HTML for all stores that it uses. For each one, we validate all
  HTML elements attached to that store (with `w-store` attribute) against schema in
  [src/schemas/html/schema.ts](./src/schemas/html/schema.ts)
* We then parse the html and create each store with default form values, parameter values,
  graph configuration all filled in. One special thing to note here is that, as we parse the
  plots, we create a `w-storeid` on each one. This is a unique hash that we generate for each
  unique plot. This is useful because we can have 2 plot components that have
  `data-w-type="ref"` that refer to the same graph config and this approach helps deduplicate
  the graphs within the store
* We then render each component, keeping in mind that some of their attributes go into the
  component prop instead of being stored in the store
There is a special component that is mounted,
[src/components/Reactivity.tsx](./src/components/Reactivity.tsx), which governs flow of
reactivity between different parts of the store listed below. This is mounted for every store.
More detail on this below.


# Store

The store is not a traditional store where everything is deeply reactive. This is too slow and
also has too many side effects leading to complicated control flow and a web of reactivity that
is difficult to debug. Instead this it using `solid-js`'s signal interface so that we can control
the reactivity at a much more fine grained level. The store has 4 main parts: `fixed`, `form`,
`param` and `graphState`. The `Reactivity.tsx` enforces linear reactivity between these 4 parts
in the following way:
1. `fixed` - never changes so no reactivity needed
2. `form` - if form value changes, get the corresponding parameter values and add them to the
   `params` parts of the form
3. `params` - if the parameter values change, re-run the model for each parameter set in
   `fixedParamSets.json` and update the `graphState` with the new data. Since there is new
   data, additionally re-render all the graphs on the page
So the general flow is `form` -> `params` -> `graphState` -> components. This is linear and
simpler to think about. Below is more detail about each of these parts

## Fixed

The store has a `fixed` field that contains all the information from fetching the corresponding
user defined JSON (`config.json`, `forms.json`, etc) as well as the parsed and processed HTML.
We also need to `eval` the Javascript code that is represented as a string from `model.json` to
convert it into a valid Javascript object that we can feed into
[dust2-js](https://github.com/reside-ic/dust2-js) (the runner for the compiled model).

## Form

This adds the `form` and `setForm` fields. The `form` signal is initialised by the defaults for
the form value that the users put in `forms.json`. This `form` signal is passed on below into
creating the `params` signal

## Params

This adds the `params` and `setParams` fields into the store. The signal contains the `static`
and `user` keys. The `user` key is populated with defaults for parameters specified in the
`w-parCfg`. The `static` key holds the parameter values that are obtained from the
`formAssets/` with the current values of the `form` signal (which is passed in when we create
this part of the store)

## Graph States

### GraphStateClass

This adds the `graphStates` field into the store. The `GraphStateClass` is a class that
encapsulates getters and setters for graphs as well as updating graph data when `params` is
updated and firing off re-render signals attached to each graph state.

This class holds the following data:
* `syncKeys` - array of strings that specifies things that should be synced across graphs such
  as their `xrange`
* `graphStates` - array of `GraphState`s (objects for an individual graph described in the next
  section that hold information like `data`, `id` and `config`).

The class holds the following methods:
* `getGraph` - each `GraphState` is assigned an `id`, and this function is just a `.find` for
  that id on the `graphStates` array
* `setGraph` - given the `id` and changed keys of the graph config such as `xrange`, this
  function:
  1. updates the config of the graph with the corresponding `id`
  2. checks if any of the changed keys are in `syncKeys`, in which case it updates those keys
     for relevant graphs (note that if a graph has `ylock` set for example then this graph's
     `yrange` will not be synced)
  3. based on the type of keys changed, it will trigger the corresponding update to the plot
     components, so for example if `ylog` has changed we have to do a full re-render of the
     graph since the axes have changed, whereas if `xrange` hsa changed, we can trigger a
     different signal that only updates the range so that we can have zoom animations for
     multiple graphs
  Note that no changed keys here will generate new data. This is purely a visual change for the
  same underlying data
* `updateParams` - this function is called when `params` signal is updated and it gets all the
  new data, adds that to the `GraphState` and triggers a full re-render of each plot
When this class is created, there is an `initialSync` where we sync the `syncKeys` even if they
are different, e.g. if user has defined custom y ranges for multiple graphs but also requested to
sync `yrange` then we take the outer range of all these ranges (range that contains all of the
custom ranges)

### GraphState

This is the object inside the arrays in `graphStates` key in the `GraphStateClass`. This object
represents a plot shown to the user (ignoring copies of the same graph that the user may place in
multiple locations in the HTML). This holds the following keys:
* `id` - a unique hash for each graph, this is provided to each plotting component as props when
  it is mounted so that they can extract the relevant object from the store
* `type` - "cfg" or "diff" currently to control behaviour of how the graph processes data (in
  "diff" mode the graph component will take the difference between 2 trace for example)
* `config` - `GraphConfigClass` which encapsulated logic around getting and setting graph config
  values (more detail in the next section)
* `data` - this contained processed data in form that
  [skadi-chart](https://github.com/mrc-ide/skadi-chart) (our charting library) expects. This data
  was processed from the output of `dust2-js`, the Odin2 model runner
* `signals` - this is an object containing all the different types of signals that plotting
  components watch. This is the only type of `solid-js` reactivity that is in this store field.
  Everything else does not have any reactivity attached to it so to trigger any update you must
  first update the rest of the values and at the end of your function, trigger one of these
  signals. Under the hood these are just boolean values that toggle between `true` and `false`

### GraphConfigClass

This class holds the following data:
* `config` - this object holds visual data about the graph such as its `xrange` or shown `vars`
  (variables traces). This is created by combination of user defined HTML attributes and defaults
* `mutableKeys` - a string array containing which keys can be changed for this graph config. If
  a user has set `ylock` on the graph then we know that `yrange` is not mutable

This class holds the following methods:
* `get` - returns the `config` object as a readonly type
* `set` - takes and object of changed keys, filters out keys that are not mutable and updates the
  `config`. This means that, even if we accidentally call `set` with a different `yrange` and
  `ylock` is set on the graph, this function will not update the `yrange`


# Schemas and validation

## Intro and motivation

To reduce code duplication both the JSON and HTML configuration that is provided by the user is
validated, parsed and typed via the corresponding schemas. This is custom to Skadi and doesn't use
a third party library because we have some custom validation we do related to model parameters or
interplay between the HTML and JSON user configuration. Both schemas have a similar structure and
advised order to read these in the corresponding `src/schemas` folder:
1. `types.ts` - read this file until, "schema.ts file" comment. This defines the types for the
   structure of the schemas (these types will be used with the `satisfies` keyword in Typescript)
2. `schema.ts` - this uses the types from step 1 to make sure the schema objects follow the
   structure. These objects as all `as const` so we can extract type information from them later
3. `types.ts` - back to the types file, we use the schema objects in step 2 and extract relevant
   types from them using TS type level ternary statements and recursion
4. `validate.ts` - this contains functions that validate everything based on the schema

This means changing the schema, automatically changes the types of the parsed JSON or HTML and
automatically adds validation and build/run time errors. For our JSON configuration, they are
already objects so `JSON.parse` is sufficient to parse it. For HTML, we have an additional
`parseAndProcess.ts` file that converts relevant HTML into objects but also does more proceessing
on these objects. More details below.

## JSON

The JSON schema is simpler than the HTML one. We have support for usual JS types like strings,
number, etc in `JsonType` type in `types.ts` file. Some more custom types are:
* `variable`/`parameter` - these are strings in the generated types but are validated against the
  `model.json` response which contains metadata about the variables and parameters of the model
* `objectStatic` - like `object`, however the keys are known, there must be those keys present and
  no other keys
* `oneOf` - this is like a discriminated union in type script, however note that it can only
  discriminate if types are different `JsonType["type"]` values, so for example it cannot
  discriminate between two `possibilities` that both have type `array`. So you want to use it for
  `string` or `number` for example, not "array of strings" and "array of numbers" since these are
  both `array` types
* `stringUnion` - this is a union between strings

Beyond the JSON schema validation we also have some functions in the `validate.ts` file that
validate more custom logic like `id`s in a JSON file being unique or `default` in `form.json` is
an actual valid `id` of one of the options. It is good to put these extra assumptions and logic
here

## HTML

For the HTML schema, we care about `div`s with a particular `class` and their attributes (both
classes and attributes start with `w-` or `data-w-`). All attributes are strings so part of the
parsing and validation is splitting or checking the value of strings. We have the usual types
like `string`, `number`, `boolean`, etc. More custom types include:
* `syncableKey` - comes from the graph state
  [src/store/graph/class.ts](./src/store/graph/class.ts) file which decides what keys it can sync
* `variable`/`parameter` - decribed above in the JSON section
* `formId`/`fixedId` - must match one of the `id`s in the `forms.json` or `fixedParamSets.json`
  files
* `array` - comma separated strings
* `range` - comma separated list of numbers of length 2 (intended for upper and lower bound)

These are the types of the attributes. The HTML schema allows a little bit more functionality for
`div`s of a given `class`:
* `uniqueBy` - all `div`s of this `class` and of a particular `store` must be unique by these set
  of attributes. For example, a `graphCfg` has to be unique by `store` and `id` attributes, to
  remove possibility of two `graphCfg`s having the same `id` given the `store`
* `attrs` - list of attributes this element can declare and their types
* `oneOf` - discriminated union however these are discriminated based on a `type` field. For an
  example see `class` of "plot" in HTML schema file. User's specify what `type` their HTML element
  is using `data-w-type` attribute (which separates it from other `w-` attributes that we may want
  to parse and use as this `data-w-tyoe` attribute is just a discriminator)

The HTML requires an extra step. In the `parseAndProcess.ts` file, there is a small section on
actually parsing the attributes. The processing step de duplicates the `plot`s by references and
appends `storeid` attribute to all the `plot` components (these `storeid`s will be the `id` inside
the `GraphState` section above). The process step also keeps a useful list of all variables that
the user has referenced in the HTML for optimising the runner by only serialising the result for
those variables


# Code style

Most of Skadi processing is written in a functional style. These functions can be found in
[src/utils/index.ts](./src/utils/index.ts). Most of the JSON and the HTML schema files are
written in a functional way as well. Some more abstractions for HTML schema can be found in
[src/schemas/html/utils.ts](./src/schemas/html/utils.ts). To get a feel for easiest way to add code
in the same style, it is recommended to skim through both these files


# Components/Adding new components

All components are in the [src/components](./src/components/) folder. These are written in
`solid-js`. There is nothing special about how these components are written however, the main
thing to keep in mind is how these components receive props. The
[src/renderComponents.tsx](./src/renderComponents.tsx) file outlines how props get supplied to each
components that is mount to a `div` on the page. In these functions, you have all the attributes
defined on an element available to you. For example, for `plot` components we can now use that
`storeid` attribute (that our `parseAndProcess.ts` HTML file added to the `div`) and pass this
into the component as a prop so it knows what graph it is going to display. These render functions
are then called in [src/index.tsx](./src/index.tsx) to render that component to the page. The
`renderWithStore` function is a small callback that appends a `StoreProvider` to each component.
In short, to add a new component to Skadi:
1. Create the `solid-js` component inside the components folder
1. Add render function inside `renderComponents.ts` that defines how props are passed into the
   component
1. Call render function in `index.tsx`
