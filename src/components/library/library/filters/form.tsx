import { LibraryFiltersUIProps } from "@/src/components/library/library/filters/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";

const DefaultSortState = {
  order: "desc",
  sortBy: "updatedAt",
};

const sortingFields = ["updatedAt", "gameplayTime", "createdAt"];

const mapper = {
  createdAt: "Creation date",
  gameplayTime: "Time to beat the story",
  purchaseType: "Purchase type",
  updatedAt: "Updated",
};
function FiltersForm({
  toggleOpen,
}: {
  toggleOpen: LibraryFiltersUIProps["setOpen"];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [filters, setFilters] = useState({
    order: searchParams?.get("order") ?? DefaultSortState.order,
    purchaseType: searchParams?.get("purchase") ?? "",
    search: searchParams?.get("search") ?? "",
    sortBy: searchParams?.get("sortBy") ?? DefaultSortState.sortBy,
  });

  const onChange = (
    value: string,
    key: "platform" | "purchase" | "search" | "sort"
  ) => {
    console.log(value, key);
    if (key === "sort") {
      const [sortBy, order] = value.split("-");
      setFilters((prev) => ({
        ...prev,
        order,
        sortBy,
      }));
    }

    if (key === "platform") {
      setFilters((prev) => ({
        ...prev,
        platform: value,
      }));
    }

    if (key === "purchase") {
      setFilters((prev) => ({
        ...prev,
        purchaseType: value,
      }));
    }
  };

  const handleSearch = (term: string) => {
    setFilters((prev) => ({
      ...prev,
      search: term,
    }));
  };

  const onApply = () => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("search", filters.search);
    newSearchParams.set("sortBy", filters.sortBy);
    newSearchParams.set("order", filters.order);
    newSearchParams.set("purchase", filters.purchaseType);

    if (pathname) {
      replace(`${pathname}?${newSearchParams}`);
    }

    toggleOpen(false);
  };

  const onClear = () => {
    if (pathname) {
      replace(pathname);
    }
    toggleOpen(false);
  };

  const options = useMemo(() => {
    const options: Array<{ label: ReactNode; value: string }> = [];
    sortingFields.forEach((value) => {
      options.push({
        label: (
          <div className="flex h-6 items-center gap-4 ">
            {mapper[value as keyof typeof mapper]}{" "}
            <ChevronUp className="size-4" />
          </div>
        ),
        value: `${value}-asc`,
      });
      options.push({
        label: (
          <div className="flex h-6 items-center gap-4">
            {mapper[value as keyof typeof mapper]}{" "}
            <ChevronDown className="size-4" />
          </div>
        ),
        value: `${value}-desc`,
      });
    });

    return options;
  }, []);

  return (
    <section className="flex flex-col gap-2 py-4">
      <Label className="flex flex-col gap-2">
        <span>Search</span>
        <Input
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search within your library"
          value={filters.search}
        />
      </Label>
      <Select
        onValueChange={(value) => onChange(value, "sort")}
        value={`${filters.sortBy}-${filters.order}`}
      >
        <div>
          <Label className="my-2 block">Sort</Label>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select your platform" />
          </SelectTrigger>
          <SelectContent>
            {options.map((value) => (
              <SelectItem key={value.value} value={value.value}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </div>
      </Select>
      <Select
        onValueChange={(value) => onChange(value, "purchase")}
        value={`${filters.purchaseType}`}
      >
        <div>
          <Label className="my-2 block">Purchase type</Label>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select ownership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PHYSICAL">Physical</SelectItem>
            <SelectItem value="DIGITAL">Digital</SelectItem>
            <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
          </SelectContent>
        </div>
      </Select>
      <footer className="flex items-center justify-between pt-2">
        <Button onClick={onClear} variant="secondary">
          Clear filters
        </Button>
        <Button onClick={onApply}>Apply</Button>
      </footer>
    </section>
  );
}

export { FiltersForm };
