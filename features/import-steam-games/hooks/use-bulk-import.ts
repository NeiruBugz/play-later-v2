import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  startBulkImport,
  getBulkImportStatus,
  getImportJobs,
  getFailedImports,
  getSkippedImports,
  importSingleGame,
} from '../actions/bulk-import';
import { JobStatus } from '@prisma/client';

/**
 * Hook for starting a bulk import job
 */
export function useBulkImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Start a new import job
  const startImport = async (steamId: string, newOnly: boolean = false) => {
    setIsImporting(true);
    try {
      const result = await startBulkImport({ steamId, newOnly });
      if (result && result.data && result.data.success && result.data.jobId) {
        setCurrentJobId(result.data.jobId);
        // Invalidate the jobs query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['steamImportJobs'] });
        return result.data.jobId;
      } else {
        throw new Error(result?.data?.error || 'Failed to start import');
      }
    } catch (error) {
      console.error('Error starting import:', error);
      setIsImporting(false);
      throw error;
    }
  };

  return {
    startImport,
    isImporting,
    currentJobId,
    setCurrentJobId,
    setIsImporting,
  };
}

/**
 * Hook for tracking the status of a bulk import job
 */
export function useImportJobStatus(jobId: string | null) {
  const queryClient = useQueryClient();

  const jobQuery = useQuery({
    queryKey: ['steamImportJob', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const result = await getBulkImportStatus({ jobId });
      if (!result || !result.data || !result.data.success) {
        return null;
      }
      return result.data.job;
    },
    enabled: !!jobId,
    refetchInterval: (data) => {
      if (!data) return false;
      // Refetch every 2 seconds if the job is still processing
      if (
        'status' in data &&
        ['PENDING', 'PROCESSING'].includes(data.status as JobStatus)
      ) {
        return 2000;
      }
      // Stop polling once the job is completed or failed
      return false;
    },
  });

  // When job completes, invalidate related queries
  useEffect(() => {
    if (
      jobQuery.data &&
      ['COMPLETED', 'FAILED'].includes(jobQuery.data.status)
    ) {
      queryClient.invalidateQueries({ queryKey: ['steamImportJobs'] });
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
    }
  }, [jobQuery.data, queryClient]);

  return jobQuery;
}

/**
 * Hook for fetching all import jobs for the current user
 */
export function useImportJobs() {
  return useQuery({
    queryKey: ['steamImportJobs'],
    queryFn: async () => {
      const result = await getImportJobs();
      if (!result || !result.data || !result.data.success) {
        return [];
      }
      return result.data.jobs;
    },
  });
}

/**
 * Hook for fetching failed imports for a specific job
 */
export function useFailedImports(jobId: string | null) {
  return useQuery({
    queryKey: ['failedImports', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const result = await getFailedImports({ jobId });
      if (!result || !result.data || !result.data.success) {
        return [];
      }
      return result.data.failedImports;
    },
    enabled: !!jobId,
  });
}

/**
 * Hook for fetching skipped imports for a specific job
 */
export function useSkippedImports(jobId: string | null) {
  return useQuery({
    queryKey: ['skippedImports', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const result = await getSkippedImports({ jobId });
      if (!result || !result.data || !result.data.success) {
        return [];
      }
      return result.data.skippedImports;
    },
    enabled: !!jobId,
  });
}

/**
 * Hook for importing a single game from Steam
 */
export function useSingleGameImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Import a single game
  const importGame = async (steamId: string, appid: number) => {
    setIsImporting(true);
    setError(null);

    try {
      const result = await importSingleGame({ steamId, appid });

      if (result && result.data && result.data.success) {
        // Store the job ID if returned
        if (result.data.jobId) {
          setCurrentJobId(result.data.jobId);
        }

        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['steamImportJobs'] });
        queryClient.invalidateQueries({ queryKey: ['backlog'] });
        queryClient.invalidateQueries({ queryKey: ['steamGames'] });
        return result.data;
      } else {
        const errorMessage = result?.data?.error || 'Failed to import game';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error importing game:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    importGame,
    isImporting,
    error,
    clearError,
    currentJobId,
  };
}
