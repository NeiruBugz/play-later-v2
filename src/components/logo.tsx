import { Gamepad } from "lucide-react";

export function Logo({ name }: { name: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Gamepad className="size-6" />
      <span className="inline-block font-bold">{name}</span>
    </div>
  );
}
