import { getBacklogChartData } from "@/src/entities/backlog-item/model/get-backlog-chart-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui/card";
import { Chart } from "@/src/widgets/chart";

export async function CollectionChart() {
  const chartData = await getBacklogChartData();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <Chart data={chartData} />
      </CardContent>
    </Card>
  );
}
