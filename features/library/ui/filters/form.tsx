import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { getAllUserPlatforms } from "@/features/library/actions";
import { LibraryFiltersUIProps } from "@/features/library/ui/filters/types";
import { ArrowDown, ArrowUp } from "lucide-react";

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

import { useSearchParamsMutation } from "@/lib/hooks/useSearchParamsMutation";

const DefaultSortState = {
  order: "desc",
  sortBy: "updatedAt",
};

const sortingFields = ["updatedAt", "gameplayTime", "createdAt"];

const mapper = {
  updatedAt: "Updated",
  gameplayTime: "Time to beat the story",
  createdAt: "Creation date",
};
function FiltersForm({
  toggleOpen,
}: {
  toggleOpen: LibraryFiltersUIProps["setOpen"];
}) {
  const {
    currentValue,
    handleParamsMutation,
    handleMultipleParamsMutation,
    handleParamsDeleteByName,
  } = useSearchParamsMutation();
  const [filters, setFilters] = useState({
    order: currentValue("order") ?? DefaultSortState.order,
    sortBy: currentValue("sortBy") ?? DefaultSortState.sortBy,
    platform: currentValue("platform") ?? " ",
    search: currentValue("search") ?? "",
  });
  const [platformOptions, setPlatformOptions] = useState<
    Array<Record<"platform", string>>
  >([]);

  useEffect(() => {
    getAllUserPlatforms().then((res) =>
      setPlatformOptions(res as Array<Record<"platform", string>>)
    );
  }, []);

  useEffect(() => {
    const sortOrder = currentValue("order");
    const sortField = currentValue("sortBy");
    const platform = currentValue("platform") ?? " ";

    if (platform === " ") {
      handleParamsDeleteByName("platform");
    }

    if (!sortOrder) {
      handleParamsMutation("order", DefaultSortState.order);
    }

    if (!sortField) {
      handleParamsMutation("sortBy", DefaultSortState.sortBy);
    }

    return () => {
      handleParamsDeleteByName("platform");
    };
  }, [currentValue, handleParamsMutation, handleParamsDeleteByName]);

  const options = useMemo(() => {
    const options: Array<{ value: string; label: ReactNode }> = [];
    sortingFields.forEach((value) => {
      options.push({
        value: `${value}-asc`,
        label: (
          <div className="flex h-6 items-center gap-4 ">
            {mapper[value as keyof typeof mapper]}{" "}
            <ArrowUp className="size-4" />
          </div>
        ),
      });
      options.push({
        value: `${value}-desc`,
        label: (
          <div className="flex h-6 items-center gap-4">
            {mapper[value as keyof typeof mapper]}{" "}
            <ArrowDown className="size-4" />
          </div>
        ),
      });
    });

    return options;
  }, []);

  const onValueChange = (value: string) => {
    if (value === "all") {
      setFilters((prev) => ({ ...prev, platform: "" }));
    }
    setFilters((prev) => ({ ...prev, platform: value }));
  };

  const onSortingSelect = (value: string) => {
    const [field, order] = value.split("-");
    setFilters((prev) => ({ ...prev, sortBy: field, order }));
  };

  const onSearchQueryChange = ({
    currentTarget: { value },
  }: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const onClear = () => {
    handleMultipleParamsMutation([
      { sortBy: DefaultSortState.sortBy },
      { order: DefaultSortState.order },
      { platform: " " },
      { search: "" },
    ]);
    toggleOpen(false);
  };

  const onApply = () => {
    const params: Array<Record<string, string>> = [
      { sortBy: filters.sortBy },
      { order: filters.order },
    ];
    if (filters.platform) {
      params.push({ platform: filters.platform });
    }
    if (filters.search) {
      params.push({ search: filters.search });
    }
    handleMultipleParamsMutation(params);
    toggleOpen(false);
  };

  return (
    <section className="flex flex-col gap-2 py-4">
      <Label className="flex flex-col gap-2">
        <span>Search</span>
        <Input
          onChange={onSearchQueryChange}
          value={filters.search}
          placeholder="Search within your library"
        />
      </Label>
      <Select
        value={`${filters.sortBy}-${filters.order}`}
        onValueChange={onSortingSelect}
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
        value={filters.platform}
        onValueChange={onValueChange}
        defaultValue="+"
      >
        <div>
          <Label className="my-2 block">Platform</Label>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Platform filter" />
          </SelectTrigger>
          <SelectContent>
            {platformOptions.map((option) => (
              <SelectItem
                key={option.platform}
                value={option.platform}
                className="normal-case"
              >
                {option.platform}
              </SelectItem>
            ))}
            <SelectItem value={" "} className="normal-case">
              All
            </SelectItem>
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
