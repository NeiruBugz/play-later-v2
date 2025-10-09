import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();

  if (session?.user == null) {
    return <>Hello there</>;
  }

  return (
    <>
      <section className="container mt-2 pt-16">
        Hello there, {session.user.name}
      </section>
    </>
  );
}
