import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui/card";

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="hover:bg-gray-750 border-gray-700 bg-gray-800 transition-transform hover:scale-105">
      <CardHeader>
        <CardTitle className="flex items-center gap-4 space-x-4 text-white">
          {icon}
          <span className="text-xl">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">{description}</p>
      </CardContent>
    </Card>
  );
}
