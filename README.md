# plan for skadi

assumption: model is in odin, should be okay to hardcode any logic with odin in it
assumption: model is static (this will have to change for dynamic wodin, keep that in the back of your mind) (!) idea: maybe for wodin we make a model refreshed function that can re do initial logic of model stuff, should be easy enough if you think about this from the start

people want to run model with different parameters and potentially fit parameters (but fit only for deterministic models)

~they want to mark certain parameter sets as a baseline (make this more general i think, go for n parameter sets as base with styles decided by user like line styles)~

~json files as parameter inputs to models, particularly array parameters that cannot be input by the user currently (remember once free draw is stable in skadi chart, we can have array inputs by user)~

free draw array inputs
barchart

~parameter comparison elements, we have to put constraints on what types of parameters can be compared, must only compare scalars realistically (varying through time obviously to get a time series for each scalar) or compare summary statistics between parameter sets, barchart/numbers useful for that, perhaps diff plots so they can see the two traces and then toggle for a trace with difference~

~form component for parameter value json loading, will have to be file names of a specific format i guess? with a sensible delimiter, `_` is probably far too common hmmm, will have to think about that, maybe a folder structure of some kind, might be a bit complicated (should probably give people a helper function for that)~

store design:
```ts
{
    // FOR MODEL RUNNING
    model, // with metadata of course, including any args to run model for dust2-js like particles and so on, user cannot modify these, ASSUMPTION

    form, // for static assets

    userData?, // if they want to fit model this is their data, dont add this initially! not a priority
    
    params: {
        static, // from form, update every time form does
        user, // user inputs
    },

    fixedParamSets: {
        static?, // if either are missing, get it from param values when running model
        user?, // these also need to contain styles
    }[] // update never they are fixed!



    // FOR MODEL RUN, every time params changes, run model for param values and fixed param sets
    // DELIBERATE SIMPLIFICATION: we might not need to rerun fixed parameter sets that are fully defined/defined by form but havent changed since the last time, this is not an optimisation we care about in the vast majority of cases



    // FOR DISPLAYING SO AFTER MODEL RUN
    htmlMetadata, // we need to hold metadata about which variables we want as outputs from the model for example

    graphData, // needs to be separated by params and fixed param sets
    // all mounted components will just react to the data and run an update, regardless of whether they need to run an update or not
}
```
