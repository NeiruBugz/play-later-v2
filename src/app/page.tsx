import { Text, Box } from "@chakra-ui/react";
import { auth } from "../../auth";
import { SignIn } from "@/components/ui/sign-in";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    redirect("/collection");
  }

  return (
    <Box textAlign="center" py={8}>
      <Text mb={4}>You are not signed in.</Text>
      <SignIn />
    </Box>
  );
}
