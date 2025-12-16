import { useState, useCallback, useRef } from 'react';
import { removeBackground, type Config } from '@imgly/background-removal';

type ProcessingStage = 'downloading' | 'processing' | 'encoding' | null;

interface UseBackgroundRemovalReturn {
  isProcessing: boolean;
  progress: number;
  stage: ProcessingStage;
  error: string | null;
  removeImageBackground: (imageDataUrl: string) => Promise<string | null>;
  cancelProcessing: () => void;
}

// Helper function to convert data URL to Blob without using fetch
const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const useBackgroundRemoval = (): UseBackgroundRemovalReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ProcessingStage>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const removeImageBackground = useCallback(
    async (imageDataUrl: string): Promise<string | null> => {
      setIsProcessing(true);
      setProgress(0);
      setStage(null);
      setError(null);

      // Create new abort controller for this operation
      abortControllerRef.current = new AbortController();

      try {
        // Convert data URL to blob for processing (without fetch to avoid CSP issues)
        const blob = dataUrlToBlob(imageDataUrl);

        const config: Config = {
          progress: (key, current, total) => {
            // Calculate overall progress based on processing stages
            const stageProgress = total > 0 ? current / total : 0;
            let overallProgress = 0;

            // Map different stages to progress percentage and set stage
            if (key === 'fetch:model') {
              setStage('downloading');
              overallProgress = stageProgress * 30; // 0-30%
            } else if (key === 'compute:inference') {
              setStage('processing');
              overallProgress = 30 + stageProgress * 60; // 30-90%
            } else if (key === 'encode') {
              setStage('encoding');
              overallProgress = 90 + stageProgress * 10; // 90-100%
            } else {
              overallProgress = stageProgress * 100;
            }

            setProgress(Math.min(Math.round(overallProgress), 99));
          },
          // Use quantized model for faster processing (smaller file, faster inference)
          model: 'isnet_quint8',
          // Output quality
          output: {
            quality: 0.8,
            format: 'image/png',
          },
        };

        const resultBlob = await removeBackground(blob, config);

        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        // Convert result blob to data URL
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setProgress(100);
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(resultBlob);
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
        }
        const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus background';
        setError(errorMessage);
        console.error('Background removal error:', err);
        return null;
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  return {
    isProcessing,
    progress,
    stage,
    error,
    removeImageBackground,
    cancelProcessing,
  };
};
