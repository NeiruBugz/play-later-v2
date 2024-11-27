import { CollectionFiltersSkeleton } from "@/src/collection/ui/collection-filters-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto overflow-hidden px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-2 flex justify-between">
        <h1 className="font-bold md:text-xl xl:text-2xl">Collection</h1>
      </div>
      <CollectionFiltersSkeleton />
    </div>
  );
}
