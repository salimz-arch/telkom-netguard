import { use } from "echarts/core";
import { LineChart, GaugeChart, BarChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

export default defineNuxtPlugin(() => {
  use([
    LineChart,
    GaugeChart,
    BarChart,
    PieChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    DataZoomComponent,
    MarkLineComponent,
    TitleComponent,
    CanvasRenderer,
  ]);
});
