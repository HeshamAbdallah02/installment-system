import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for using Excel export Web Worker
 * Requirements: 13.7
 */

interface ExportInstallmentData {
  customerName: string;
  nationalId: string;
  product: string;
  totalAmount: number;
  monthlyPayment: number;
  nextDueDate: Date | null;
  status: string;
  progressPercentage: number;
}

interface WorkerResponse {
  type: 'success' | 'error' | 'progress';
  buffer?: ArrayBuffer;
  error?: string;
  progress?: number;
}

export const useExcelWorker = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    // Create worker instance
    workerRef.current = new Worker(new URL('../workers/excelExportWorker.ts', import.meta.url), {
      type: 'module',
    });

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  /**
   * Generate Excel file using Web Worker
   */
  const generateExcel = useCallback((data: ExportInstallmentData[]): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      setIsGenerating(true);
      setProgress(0);
      setError(null);

      // Set up message handler
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, buffer, error: workerError, progress: workerProgress } = event.data;

        if (type === 'progress' && workerProgress !== undefined) {
          setProgress(workerProgress);
        } else if (type === 'success' && buffer) {
          setIsGenerating(false);
          setProgress(100);
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          resolve(blob);
        } else if (type === 'error') {
          setIsGenerating(false);
          setError(workerError || 'Unknown error');
          reject(new Error(workerError || 'Unknown error'));
        }
      };

      // Set up error handler
      workerRef.current.onerror = (event) => {
        setIsGenerating(false);
        setError(event.message);
        reject(new Error(event.message));
      };

      // Send data to worker
      workerRef.current.postMessage({
        type: 'generate',
        data,
      });
    });
  }, []);

  return {
    generateExcel,
    isGenerating,
    progress,
    error,
  };
};
