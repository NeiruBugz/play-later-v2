import { Gamepad } from "lucide-react"

export function Logo({ name }: { name: string }) {
  return (
    <>
      <Gamepad className="size-6" />
      <span className="inline-block font-bold">{name}</span>
    </>
  )
}
