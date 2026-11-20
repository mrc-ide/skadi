import { Component, createEffect, createSignal, on } from "solid-js";
import { useStore } from "../store";
import { Chart2 } from "@reside-ic/skadi-chart";

export type BarchartProps = { store: string, id: string } & (
  | { type: "ref" | "cfg" }
  | { type: "diff", fixedId1: string, fixedId2: string }
)

const Barchart: Component<BarchartProps> = props => {
  const store = useStore(props.store);
  let plot!: HTMLDivElement;
  const [skadiChart, setSkadiChart] = createSignal<any>();
  const gState = store.graphStates.getGraph(props.id);

  const drawChart = () => {
    const cfg = gState.config.get();

    const sChart2 = Chart2.start()
      .xBottom().categorical()
      .yLeft().numerical()
      .startHtml()
      .addElement(plot)
      .startData()
      .registerBars(gState.data.bars)
      .startConfig()
      .configureAxes({
        y: { start: [{ log: cfg.ylog }] }
      })
      .configureDomain({
        x: { start: [{ domain: cfg.vars }] },
        y: { start: [{ domain: cfg.yrange }] }
      })
      .startVisual()
      .addAxes()
      .addBars()
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

  const handleZoom = () =>
    skadiChart()!.interactiveState.interactiveLayers.skadiChartZoom!.handleZoom({
      x: {},
      y: { start: gState.config.get().yrange },
      eventType: "brush",
    });

  createEffect(on(gState.signals.fullRerender.get, drawChart));
  createEffect(on(gState.signals.rangeUpdated.get, handleZoom));

  return (
    <div ref={plot} style={{ height: "300px" }}></div>
  );
};

export default Barchart;
