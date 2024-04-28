import { ReactNode, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type LibraryFiltersUIProps } from "@/app/(protected)/library/components/library/filters/types";

const DefaultSortState = {
  order: "desc",
  sortBy: "updatedAt",
};

const sortingFields = ["updatedAt", "gameplayTime", "createdAt"];

const mapper = {
  updatedAt: "Updated",
  gameplayTime: "Time to beat the story",
  createdAt: "Creation date",
  purchaseType: "Purchase type",
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
    search: searchParams?.get("search") ?? "",
    sortBy: searchParams?.get("sortBy") ?? DefaultSortState.sortBy,
    order: searchParams?.get("order") ?? DefaultSortState.order,
    purchaseType: searchParams?.get("purchase") ?? "",
  });

  const onChange = (
    value: string,
    key: "search" | "sort" | "platform" | "purchase"
  ) => {
    console.log(value, key);
    if (key === "sort") {
      const [sortBy, order] = value.split("-");
      setFilters((prev) => ({
        ...prev,
        sortBy,
        order,
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
    const options: Array<{ value: string; label: ReactNode }> = [];
    sortingFields.forEach((value) => {
      options.push({
        value: `${value}-asc`,
        label: (
          <div className="flex h-6 items-center gap-4 ">
            {mapper[value as keyof typeof mapper]}{" "}
            <ChevronUp className="size-4" />
          </div>
        ),
      });
      options.push({
        value: `${value}-desc`,
        label: (
          <div className="flex h-6 items-center gap-4">
            {mapper[value as keyof typeof mapper]}{" "}
            <ChevronDown className="size-4" />
          </div>
        ),
      });
    });

    return options;
  }, []);

  return (
    <section className="flex flex-col gap-2 py-4">
      <Label className="flex flex-col gap-2">
        <span>Search</span>
        <Input
          placeholder="Search within your library"
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </Label>
      <Select
        value={`${filters.sortBy}-${filters.order}`}
        onValueChange={(value) => onChange(value, "sort")}
      >
        <div>
          <Label className="my-2 block">Sort</Label>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select your platform" />
          </SelectTrigger>
          <SelectContent>
            {options.map((value) => (
              <SelectItem value={value.value} key={value.value}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </div>
      </Select>
      <Select
        value={`${filters.purchaseType}`}
        onValueChange={(value) => onChange(value, "purchase")}
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
        <Button variant="secondary" onClick={onClear}>
          Clear filters
        </Button>
        <Button onClick={onApply}>Apply</Button>
      </footer>
    </section>
  );
}

export { FiltersForm };
