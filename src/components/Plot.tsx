import { Component, createEffect, createSignal, on } from "solid-js";
import { useStore } from "../store";
import { Chart } from "@reside-ic/skadi-chart";
import { PlotData, Range } from "../store/types";

type RangeObj = { xRange: Range, yRange: Range }
const rangeToExtent = (obj: RangeObj) => ({
  x: { start: obj.xRange[0], end: obj.xRange[1] },
  y: { start: obj.yRange[0], end: obj.yRange[1] },
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
      data.main.data.values.forEach(val => {
        const line: PlotData["lines"][number] = { points: [], style: {} };
        for (let i = 0; i < times.length; i++) {
          const x = times[i];
          const y = val[v][i] as number;
          line.points.push({ x, y });
        }
        plotData.lines.push(line);
      })
    });

    const scales = rangeToExtent(cfg);
    const maxScales = rangeToExtent(data.main);
    const sChart = new Chart({ logScale: { y: cfg.yLog } })
      .addAxes()
      .addTraces(plotData.lines)
      .addGridLines()
      .addZoom()
      .addCustomLifecycleHooks({
        beforeZoom: zoomProperties => {
          store.setGraphConfig(props.id, {
            xRange: zoomProperties.x,
            yRange: zoomProperties.y,
          });
        }
      })
      .appendTo(plot, maxScales, scales)

    setSkadiChart(sChart);
  };

  const handleZoom = () => skadiChart()!.handleZoom({
    x: gState.config.xRange,
    y: gState.config.yRange,
    eventType: "brush",
  });

  createEffect(on(gState.signals.fullRerender, drawChart));
  createEffect(on(store.graphData, drawChart));
  createEffect(on(gState.signals.rangeUpdated, handleZoom));

  return (
    <div ref={plot} style={{ height: "300px" }}></div>
  );
};

export default Plot;
