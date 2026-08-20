import { Component, createEffect, createSignal, on } from "solid-js";
import { useStore } from "../store";
import { Chart, Scales } from "@reside-ic/skadi-chart";

export type PlotProps = { store: string, id: string } & (
  | { type: "ref" | "cfg" }
  | { type: "diff", fixedId1: string, fixedId2: string }
)

const Plot: Component<PlotProps> = props => {
  const store = useStore(props.store);
  let plot!: HTMLDivElement;
  const [skadiChart, setSkadiChart] = createSignal<Chart<any>>();
  const gState = store.graphStates.getGraph(props.id);

  const drawChart = () => {
    const maxExtents = gState.data.extents;
    const extents = gState.config.get();

    const maxScales: Scales = {
      x: { start: maxExtents.x[0], end: maxExtents.x[1] },
      y: { start: maxExtents.y[0], end: maxExtents.y[1] },
    }
    const scales: Scales = {
      x: { start: extents.xrange[0], end: extents.xrange[1] },
      y: { start: extents.yrange[0], end: extents.yrange[1] },
    }

    const sChart = new Chart({ logScale: { y: gState.config.get().ylog } })
      .addAxes()
      .addTraces(gState.data.lines)
      .addGridLines()
      .addZoom()
      .addCustomLifecycleHooks({
        beforeZoom: zoomProperties => {
          store.graphStates.setGraph(props.id, {
            type: "range",
            changed: {
              xrange: zoomProperties.x,
              yrange: zoomProperties.y,
            }
          });
        }
      })
      .appendTo(plot, maxScales, scales)

    setSkadiChart(sChart);
  };

  const handleZoom = () => skadiChart()!.handleZoom({
    x: gState.config.get().xrange,
    y: gState.config.get().yrange,
    eventType: "brush",
  });

  createEffect(on(gState.signals.fullRerender.get, drawChart));
  createEffect(on(gState.signals.rangeUpdated.get, handleZoom));

  return (
    <div ref={plot} style={{ height: "300px" }}></div>
  );
};

export default Plot;
