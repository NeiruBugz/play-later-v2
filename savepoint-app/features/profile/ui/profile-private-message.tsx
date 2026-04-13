import { Card, CardContent } from "@/shared/components/ui/card";

export function ProfilePrivateMessage() {
  return (
    <Card role="status" aria-live="polite" className="mx-auto max-w-md">
      <CardContent className="flex flex-col gap-2 p-6 text-center">
        <h2 className="heading-sm">Private profile</h2>
        <p className="text-muted-foreground">
          This profile is private. Only the owner can view its contents.
        </p>
      </CardContent>
    </Card>
  );
}
