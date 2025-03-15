'use client';

import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from '../../../../../shared/components/ui/select';
import { normalizeString } from '../../../../../shared/lib/normalize-string';
import {
  createListCollection,
  NativeSelectField,
  NativeSelectIndicator,
  NativeSelectRoot,
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';

const mapStringToCollection = (options: { platform: string }[]) =>
  createListCollection({
    items: options.map((option) => ({
      label: normalizeString(option.platform),
      value: option.platform,
    })),
  });

export function PlatformFilter({
  platformOptions,
}: {
  platformOptions: { platform: string }[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onPlatformSelect = useCallback(
    (value: string[]) => {
      if (!value || !value.length) {
        return;
      }

      const [platform] = value;

      const paramsToUpdate = new URLSearchParams(params);

      if (platform === 'all') {
        paramsToUpdate.delete('platform');
      } else {
        paramsToUpdate.set('platform', platform);
      }

      paramsToUpdate.set('page', '1');
      startTransition(() => {
        router.replace(`/collection/?${paramsToUpdate.toString()}`);
      });
    },
    [router, params],
  );

  const currentPlatform = params.get('platform') || 'all';
  const options = useMemo(
    () => mapStringToCollection(platformOptions),
    [platformOptions],
  );

  return (
    <>
      <SelectRoot
        collection={options}
        disabled={pending}
        value={[currentPlatform]}
        onValueChange={(e) => onPlatformSelect(e.value)}
        flexShrink={0}
        maxW="400px"
        hideBelow="md"
      >
        <SelectTrigger>
          <SelectValueText placeholder="Select platform" />
        </SelectTrigger>
        <SelectContent zIndex={100}>
          <SelectItem item={{ value: 'all', label: 'All' }}>All</SelectItem>
          {options.items.map((option) => (
            <SelectItem item={option} key={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      <NativeSelectRoot hideFrom="md">
        <NativeSelectField
          placeholder="Select platform"
          value={currentPlatform}
          onChange={(e) => onPlatformSelect([e.target.value])}
        >
          <option value="all">All</option>
          {options.items.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelectField>
        <NativeSelectIndicator />
      </NativeSelectRoot>
    </>
  );
}
