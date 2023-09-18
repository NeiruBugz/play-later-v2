import { Gamepad } from "lucide-react"

export function Logo({ name }: { name: string }) {
  return (
    <>
      <Gamepad className="h-6 w-6" />
      <span className="inline-block font-bold">{name}</span>
    </>
  )
}
