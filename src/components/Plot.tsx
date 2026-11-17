import { Component, createEffect, createSignal, on } from "solid-js";
import { useStore } from "../store";
import { Chart2 } from "@reside-ic/skadi-chart";

export type PlotProps = { store: string, id: string } & (
  | { type: "ref" | "cfg" }
  | { type: "diff", fixedId1: string, fixedId2: string }
)

const Plot: Component<PlotProps> = props => {
  const store = useStore(props.store);
  let plot!: HTMLDivElement;
  const [skadiChart, setSkadiChart] = createSignal<any>();
  const gState = store.graphStates.getGraph(props.id);

  const drawChart = () => {
    const extents = gState.config.get();

    const sChart2 = Chart2.start()
      .xBottom().numerical()
      .yLeft().numerical()
      .startHtml()
      .addElement(plot)
      .startData()
      .registerLines(gState.data.lines)
      .startConfig()
      .configureAxes({
        y: { start: [{ log: gState.config.get().ylog }] }
      })
      .configureDomain({
        x: {
          start: [{ domain: extents.xrange }]
        },
        y: {
          start: [{ domain: extents.yrange }]
        }
      })
      .startVisual()
      .addAxes()
      .addTraces()
      .addCustomHooks({
        beforeZoomHook: zoomProperties => {
          store.graphStates.setGraph(props.id, {
            type: "range",
            changed: {
              xrange: zoomProperties.x.start ?? undefined,
              yrange: zoomProperties.y.start ?? undefined,
            }
          });
        },
      })
      .startInteractive()
      .addZoom()
      .end()
      .outputs();

    setSkadiChart(sChart2);
  };

  const handleZoom = () => skadiChart()!.interactiveState.interactiveLayers.skadiChartZoom!.handleZoom({
    x: { start: gState.config.get().xrange },
    y: { start: gState.config.get().yrange },
    eventType: "brush",
  });

  createEffect(on(gState.signals.fullRerender.get, drawChart));
  createEffect(on(gState.signals.rangeUpdated.get, handleZoom));

  return (
    <div ref={plot} style={{ height: "300px" }}></div>
  );
};

export default Plot;
