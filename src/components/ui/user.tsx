import { Avatar } from "@chakra-ui/react";
import { auth } from "../../../auth";

export async function UserAvatar() {
  const session = await auth();

  if (!session?.user || !session.user.name || !session.user.image) {
    return null;
  }

  return (
    <Avatar.Root>
      <Avatar.Fallback name={session.user.name} />
      <Avatar.Image src={session.user.image} />
    </Avatar.Root>
  );
}
