import type {
  FormAction,
  FormState,
  LibraryFiltersUIProps,
} from "@/src/components/library/library/filters/types";

import {
  DefaultSortState,
  mapper,
  sortingFields,
} from "@/src/components/library/library/filters/constants";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { buildUrl } from "@/src/packages/library/client-helpers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useActionState } from "react";

function FiltersForm({
  toggleOpen,
}: {
  toggleOpen: LibraryFiltersUIProps["setOpen"];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();

  const formAction: FormAction = (prevState, formData) => {
    const purchaseType = formData.get("purchaseType") as string;
    const search = formData.get("search")
      ? (formData.get("search") as string)
      : undefined;
    const sortBy = formData.get("sortBy") as string;
    const order = (formData.get("order") as string) ?? DefaultSortState.order;
    startTransition(() => {
      push(
        buildUrl(pathname, {
          ...prevState,
          order,
          purchaseType: purchaseType ? (purchaseType as string) : undefined,
          search: search,
          sortBy,
        })
      );
      toggleOpen(false);
    });
    return {
      ...prevState,
      order,
      purchaseType: purchaseType ? (purchaseType as string) : undefined,
      search: search,
      sortBy,
    };
  };

  const [state, action, isPending] = useActionState<FormState, FormData>(
    formAction,
    {
      order: searchParams?.get("order") ?? DefaultSortState.order,
      purchaseType: searchParams?.get("purchaseType") ?? "",
      search: searchParams?.get("search") ?? "",
      sortBy: searchParams?.get("sortBy") ?? DefaultSortState.sortBy,
      status: searchParams?.get("status") ?? "INPROGRESS",
    } as FormState
  );

  return (
    <form action={action} className="flex flex-col gap-2 py-4">
      <Label className="flex flex-col gap-2">
        <span>Search</span>
        <Input
          defaultValue={state.search}
          name="search"
          placeholder="Search within your library"
        />
      </Label>
      <Select defaultValue={`${state.sortBy}`} name="sortBy">
        <div>
          <Label className="my-2 block">Sort</Label>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select your platform" />
          </SelectTrigger>
          <SelectContent>
            {sortingFields.map((fieldKey) => (
              <SelectItem key={fieldKey} value={`${fieldKey}`}>
                {mapper[fieldKey as keyof typeof mapper]}
              </SelectItem>
            ))}
          </SelectContent>
        </div>
      </Select>
      <div>
        <Label>Order</Label>
        <RadioGroup
          className="mt-2 flex items-center gap-2"
          defaultValue={state.order}
          name="order"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="r1" value="asc" />
            <Label htmlFor="r1">ASC</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="r2" value="desc" />
            <Label htmlFor="r2">DESC</Label>
          </div>
        </RadioGroup>
      </div>
      <Select defaultValue={`${state.purchaseType}`} name="purchaseType">
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
        <Button disabled={isPending} type="reset" variant="secondary">
          Clear selection
        </Button>
        <Button disabled={isPending} type="submit">
          Apply
        </Button>
      </footer>
    </form>
  );
}

export { FiltersForm };
