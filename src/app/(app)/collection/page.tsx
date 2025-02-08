import { Filters } from "@/app/(app)/collection/_components/filters";
import { List } from "@/app/(app)/collection/_components/list";
import { Box, Heading } from "@chakra-ui/react";
import { Suspense } from "react";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const awaited = await searchParams;

  return (
    <Box>
      <Heading as="h2">Collection</Heading>
      <Filters />
      <Suspense fallback={"Loading..."}>
        <List params={awaited} />
      </Suspense>
    </Box>
  );
}
