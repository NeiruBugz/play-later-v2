import { HStack, Button, Text, Box, Container } from "@chakra-ui/react";
import { auth } from "../../auth";
import { SignIn } from "@/components/ui/sign-in";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Box textAlign="center" py={8}>
        <Text mb={4}>You are not signed in.</Text>
        <SignIn />
      </Box>
    );
  }
  return (
    <Container>
      <HStack>
        <Button>Click me</Button>
        <Button>Click me</Button>
      </HStack>
    </Container>
  );
}
