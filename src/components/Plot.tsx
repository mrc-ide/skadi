import { Component, createEffect } from "solid-js";
import { useStore } from "../store";
import { Chart } from "@reside-ic/skadi-chart";
import { PlotData } from "../store/types";

const Plot: Component<{ storeInstance: string, id: string }> = props => {
  const store = useStore(props.storeInstance);
  let plot!: HTMLDivElement;

  createEffect(() => {
    const scales = {
        x: { start: store.fixed.config.startTime, end: store.fixed.config.endTime }
    };
    const data = store.graphData();
    const config = store.graphConfigs().find(g => g.id === props.id)!;
    const plotData: PlotData = {
      lines: [], points: []
    };

    const times = data.main.times;
    const { vars } = config;
    vars.forEach(v => {
      data.main.values.forEach(val => {
        const line: PlotData["lines"][number] = { points: [], style: {} };
        for (let i = 0; i < times.length; i++) {
          const x = times[i];
          const y = val[v][i] as number;
          line.points.push({ x, y });
        }
        plotData.lines.push(line);
      })
    });

    new Chart()
      .addAxes()
      .addTraces(plotData.lines)
      .addGridLines()
      .addZoom()
      .appendTo(plot, scales);
  });

  return (
    <div ref={plot} style={{ height: "600px" }}></div>
  );
};

export default Plot;
