import { Component, createEffect, createSignal, on } from "solid-js";
import { useStore } from "../store";
import { Chart } from "@reside-ic/skadi-chart";
import { PlotData, Range } from "../store/types";
import { getLine } from "./utils";
import { LineStyles, ParamValue } from "../schemas/json/types";

type RangeObj = { xrange: Range, yrange: Range }
const rangeToExtent = (obj: RangeObj) => ({
  x: { start: obj.xrange[0], end: obj.xrange[1] },
  y: { start: obj.yrange[0], end: obj.yrange[1] },
})

const Plot: Component<{ store: string, id: string }> = props => {
  const store = useStore(props.store);
  let plot!: HTMLDivElement;
  const [skadiChart, setSkadiChart] = createSignal<Chart<any>>();
  const gState = store.getGraphState(props.id);

  const drawChart = () => {
    const cfg = gState.config;
    
    const data = store.graphData();
    const plotData: PlotData = { lines: [], points: [] };
    const times = data.main.data.times;
    cfg.vars.forEach(v => {
      const addLine = (x: Record<string, ParamValue[]>, styles: LineStyles | undefined) => {
        const style = styles && styles[v];
        plotData.lines.push(getLine(v, times, x, style));
      };

      data.main.data.values.forEach(val => {
        const { styles } = store.fixed.json.config;
        addLine(val, styles);
      });

      data.static.forEach((s, i) => {
        s.data.values.forEach(val => {
          const { styles } = store.fixed.json.fixedParamSets[i];
          addLine(val, styles);
        });
      });
    });

    const scales = rangeToExtent(cfg);
    const maxScales = rangeToExtent(data.main);
    const sChart = new Chart({ logScale: { y: cfg.ylog } })
      .addAxes()
      .addTraces(plotData.lines)
      .addGridLines()
      .addZoom()
      .addCustomLifecycleHooks({
        beforeZoom: zoomProperties => {
          store.setGraphConfig(props.id, {
            xrange: zoomProperties.x,
            yrange: zoomProperties.y,
          });
        }
      })
      .appendTo(plot, maxScales, scales)

    setSkadiChart(sChart);
  };

  const handleZoom = () => skadiChart()!.handleZoom({
    x: gState.config.xrange,
    y: gState.config.yrange,
    eventType: "brush",
  });

  createEffect(on(gState.signals.fullRerender, drawChart, { defer: true }));
  createEffect(on(store.graphData, drawChart, { defer: true }));
  createEffect(on(gState.signals.rangeUpdated, handleZoom, { defer: true }));

  return (
    <div ref={plot} style={{ height: "300px" }}></div>
  );
};

export default Plot;
