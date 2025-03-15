'use client';

import { Button, Flex, Input } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';

export function Search() {
  const params = useSearchParams();
  const router = useRouter();

  const [inputValue, setInputValue] = useState(params.get('search') ?? '');

  useEffect(() => {
    if (inputValue.length === 0) {
      const paramsToUpdate = new URLSearchParams(params);

      paramsToUpdate.delete('search');

      router.replace(`/collection/?${paramsToUpdate.toString()}`);
    }
  }, [inputValue.length, params, router]);

  const onInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;

    setInputValue(value);
  }, []);

  const onApply = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);

    paramsToUpdate.set('search', inputValue);
    paramsToUpdate.set('page', '1');

    router.replace(`/collection/?${paramsToUpdate.toString()}`);
  }, [inputValue, params, router]);

  return (
    <Flex align="center" gap={3}>
      <Input
        md={{
          width: '400px',
        }}
        placeholder="Search by name"
        value={inputValue}
        onChange={onInputChange}
      />
      <Button
        type="button"
        disabled={inputValue.length < 3}
        onClick={onApply}
        size="sm"
      >
        Apply
      </Button>
    </Flex>
  );
}
