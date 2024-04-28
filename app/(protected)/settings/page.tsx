import { notFound } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getUserData } from "@/app/(protected)/settings/actions/get-user-data";

export default async function SettingsPage() {
  const userData = await getUserData();
  if (!userData) {
    notFound();
  }
  return (
    <section className="relative">
      <header className="container sticky top-0 z-40 bg-background">
        <div className="flex flex-wrap justify-between">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Settings
          </h1>
        </div>
      </header>
      <div className="container mt-4">
        <form className="w-1/2">
          <Label htmlFor="name" className="h-fit">
            Name
            <Input
              defaultValue={userData.name ?? ""}
              disabled
              className="my-2"
              id="name"
              name="name"
            />
          </Label>

          <Label htmlFor="email">
            Email
            <Input
              defaultValue={userData.email ?? ""}
              disabled
              className="my-2"
              id="email"
              name="email"
            />
          </Label>

          <Label htmlFor="username">
            Username
            <Input
              defaultValue={userData.username ?? ""}
              className="my-2"
              id="username"
              name="username"
              placeholder="Enter username"
            />
          </Label>
        </form>
      </div>
    </section>
  );
}
