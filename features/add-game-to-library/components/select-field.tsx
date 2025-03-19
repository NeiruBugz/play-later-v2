import {
  SelectRoot,
  SelectContent,
  SelectTrigger,
  SelectValueText,
  SelectItem,
} from '../../../shared/components/ui/select';
import { ListCollection, Field } from '@chakra-ui/react';

type SelectFieldProps<T extends { value: string; label: string }> = {
  label: string;
  collection: ListCollection<T>;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  isDisabled?: boolean;
};

function SelectField<T extends { value: string; label: string }>({
  label,
  collection,
  value,
  onChange,
  placeholder,
  isDisabled,
}: SelectFieldProps<T>) {
  return (
    <Field.Root disabled={isDisabled}>
      <Field.Label>{label}</Field.Label>
      <SelectRoot
        collection={collection}
        value={value}
        onValueChange={(e) => onChange(e.value)}
        width="full"
      >
        <SelectTrigger>
          <SelectValueText placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {collection.items.map((item) => (
            <SelectItem item={item} key={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </Field.Root>
  );
}

export { SelectField };
