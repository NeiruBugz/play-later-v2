import { Flex, Text, HStack, Button, Spinner } from '@chakra-ui/react';

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show

    // Always show first page
    pages.push(1);

    // Calculate start and end of the page range
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Adjust range if we're near the beginning or end
    if (currentPage <= 3) {
      endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - maxVisiblePages + 2);
    }

    // Add ellipsis if needed before middle pages
    if (startPage > 2) {
      pages.push('...');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed after middle pages
    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <Flex
      justify="space-between"
      align="center"
      mt="4"
      wrap="wrap"
      gap="2"
      p="2"
      borderWidth="1px"
      borderRadius="md"
    >
      <Text fontSize="sm" color="gray.600" fontWeight="medium">
        Page {currentPage} of {totalPages}
      </Text>
      <HStack gap="2">
        <Button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
          size="sm"
          variant="outline"
          colorPalette="blue"
        >
          {isLoading ? <Spinner size="xs" mr="2" /> : null}
          Previous
        </Button>

        {totalPages <= 7
          ? // Show all pages if there are 7 or fewer
            [...Array(totalPages)].map((_, i) => (
              <Button
                key={i + 1}
                onClick={() => onPageChange(i + 1)}
                disabled={isLoading}
                size="sm"
                variant={currentPage === i + 1 ? 'solid' : 'outline'}
                colorPalette={currentPage === i + 1 ? 'blue' : 'gray'}
              >
                {i + 1}
              </Button>
            ))
          : // Show limited pages with ellipsis for larger page counts
            getPageNumbers().map((page, index) =>
              page === '...' ? (
                <Text key={`ellipsis-${index}`} px="1">
                  ...
                </Text>
              ) : (
                <Button
                  key={`page-${page}`}
                  onClick={() => typeof page === 'number' && onPageChange(page)}
                  disabled={isLoading}
                  size="sm"
                  variant={currentPage === page ? 'solid' : 'outline'}
                  colorPalette={currentPage === page ? 'blue' : 'gray'}
                >
                  {page}
                </Button>
              ),
            )}

        <Button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isLoading}
          size="sm"
          variant="outline"
          colorPalette="blue"
        >
          Next
          {isLoading ? <Spinner size="xs" ml="2" /> : null}
        </Button>
      </HStack>
    </Flex>
  );
}

export { Pagination };
