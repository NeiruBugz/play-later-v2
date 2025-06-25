import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";
import { Body } from "@/shared/components/typography";

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
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="relative">
        <CardTitle className="flex items-start gap-4 text-lg font-semibold">
          <div className="flex-shrink-0 rounded-lg bg-background/80 p-2 ring-1 ring-border/50 transition-all duration-300 group-hover:bg-primary/5 group-hover:ring-primary/20">
            {icon}
          </div>
          <span className="leading-tight">{title}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        <Body variant="muted" className="leading-relaxed">
          {description}
        </Body>
      </CardContent>
    </Card>
  );
}
