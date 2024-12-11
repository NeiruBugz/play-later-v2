import { getBacklogChartData } from "@/src/entities/backlog-item/model/get-backlog-chart-data";
import { Card, CardHeader, CardTitle } from "@/src/shared/ui/card";

export async function CollectionChart() {
  const chartData = await getBacklogChartData();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Chart</CardTitle>
      </CardHeader>
    </Card>
  );
}
