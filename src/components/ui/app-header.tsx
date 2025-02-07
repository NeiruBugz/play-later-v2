import { UserAvatar } from "@/components/ui/user";
import { Flex, HStack, Link, Text } from "@chakra-ui/react";
import { Suspense } from "react";
import NextLink from "next/link";

const linksConfig = [
  {
    href: "/collection?status=PLAYING&page=1",
    label: "Collection",
  },
  {
    href: "/wishlist",
    label: "Wishlist",
  },
  {
    href: "/backlog",
    label: "Backlogs",
  },
] as const;

export function AppHeader() {
  return (
    <Flex justify="space-between" w="full" py={2} align="center">
      <Flex align="center">
        <Text fontWeight="bold" asChild>
          <NextLink href="/">PlayLater</NextLink>
        </Text>
        <HStack align="center" mx={2}>
          {linksConfig.map((link) => (
            <Link key={`${link.href}-${link.label}`} asChild>
              <NextLink href={link.href}>{link.label}</NextLink>
            </Link>
          ))}
        </HStack>
      </Flex>
      <Suspense>
        <UserAvatar />
      </Suspense>
    </Flex>
  );
}
