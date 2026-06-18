import { Component, createEffect } from "solid-js";
import { useStore } from "../store";
import { Chart } from "@reside-ic/skadi-chart";

const Plot: Component<{ storeInstance: string }> = props => {
  const store = useStore(props.storeInstance);
  let plot!: HTMLDivElement;

  createEffect(() => {
    const scales = {
        x: { start: 0, end: 15 }
    };
    const data = store.graphData();
    new Chart()
      .addAxes()
      .addTraces(data.main.lines)
      .addScatterPoints(data.main.points)
      .addGridLines()
      .addZoom()
      .appendTo(plot, scales);
  });

  return (
    <div ref={plot} style={{ height: "600px" }}></div>
  );
};

export default Plot;
