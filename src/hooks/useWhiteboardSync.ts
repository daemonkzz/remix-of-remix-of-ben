import { useCallback, useRef, useEffect, useState } from 'react';
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SceneData {
  elements: any[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

export interface SavedStats {
  elementCount: number;
  fileCount: number;
}

interface UseWhiteboardSyncOptions {
  autoSaveDelay?: number;
  onSaveStart?: () => void;
  onSaveEnd?: (success: boolean, stats?: SavedStats) => void;
}

/**
 * Deep clones scene data to avoid Excalidraw readonly proxy issues
 * CRITICAL: Filters out isDeleted elements to prevent invisible elements bug
 */
export function cloneSceneData(
  elements: readonly any[],
  appState: AppState,
  files: BinaryFiles
): SceneData {
  // CRITICAL FIX: Filter out deleted elements before saving
  const visibleElements = elements.filter(el => !el.isDeleted);
  
  // Only keep files that are referenced by visible image elements
  const referencedFileIds = new Set(
    visibleElements
      .filter(el => el.type === 'image' && el.fileId)
      .map(el => el.fileId)
  );
  
  const cleanedFiles: BinaryFiles = {};
  for (const [fileId, fileData] of Object.entries(files)) {
    if (referencedFileIds.has(fileId)) {
      cleanedFiles[fileId] = fileData;
    }
  }
  
  console.log('[cloneSceneData] Filtering:', {
    originalElements: elements.length,
    visibleElements: visibleElements.length,
    originalFiles: Object.keys(files).length,
    cleanedFiles: Object.keys(cleanedFiles).length,
  });
  
  return {
    elements: JSON.parse(JSON.stringify(visibleElements)),
    appState: {
      viewBackgroundColor: appState.viewBackgroundColor,
      zoom: appState.zoom,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
    },
    files: JSON.parse(JSON.stringify(cleanedFiles)),
  };
}

export function useWhiteboardSync(options: UseWhiteboardSyncOptions = {}) {
  const { autoSaveDelay = 1000, onSaveStart, onSaveEnd } = options;

  // State
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [initialData, setInitialData] = useState<SceneData | null>(null);
  const [lastSavedStats, setLastSavedStats] = useState<SavedStats | null>(null);
  const [currentStats, setCurrentStats] = useState<SavedStats>({ elementCount: 0, fileCount: 0 });

  // Refs
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const whiteboardIdRef = useRef<string | null>(null);
  const isHydratingRef = useRef(true);
  const saveInFlightRef = useRef(false);
  const pendingSceneRef = useRef<SceneData | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    whiteboardIdRef.current = whiteboardId;
  }, [whiteboardId]);

  // Load whiteboard data
  useEffect(() => {
    const loadWhiteboard = async () => {
      try {
        console.log('[useWhiteboardSync] Loading whiteboard...');
        const { data, error } = await supabase
          .from('whiteboards')
          .select('*')
          .eq('name', 'Ana Harita')
          .maybeSingle();

        if (error) {
          console.error('[useWhiteboardSync] Load error:', error);
          toast.error('Whiteboard yüklenirken hata oluştu');
          return;
        }

        if (data) {
          console.log('[useWhiteboardSync] Loaded whiteboard:', data.id);
          setWhiteboardId(data.id);
          
          const sceneData = data.scene_data as SceneData | null;
          if (sceneData) {
            const elementCount = sceneData.elements?.length || 0;
            const fileCount = sceneData.files ? Object.keys(sceneData.files).length : 0;
            
            console.log('[useWhiteboardSync] Initial data:', { elementCount, fileCount });
            setLastSavedStats({ elementCount, fileCount });
            setCurrentStats({ elementCount, fileCount });
            
            if (elementCount > 0) {
              setInitialData(sceneData);
            }
          }
        } else {
          // Create default whiteboard if not exists
          console.log('[useWhiteboardSync] Creating new whiteboard...');
          const { data: newData, error: createError } = await supabase
            .from('whiteboards')
            .insert({ name: 'Ana Harita', scene_data: { elements: [], appState: {}, files: {} } })
            .select()
            .single();

          if (createError) {
            console.error('[useWhiteboardSync] Create error:', createError);
          } else if (newData) {
            setWhiteboardId(newData.id);
            setLastSavedStats({ elementCount: 0, fileCount: 0 });
          }
        }
      } catch (err) {
        console.error('[useWhiteboardSync] Load error:', err);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          isHydratingRef.current = false;
          console.log('[useWhiteboardSync] Hydration complete');
        }, 500);
      }
    };

    loadWhiteboard();
  }, []);

  // Core save function with read-back verification
  const saveToDatabase = useCallback(async (sceneData: SceneData): Promise<boolean> => {
    const currentWhiteboardId = whiteboardIdRef.current;

    if (!currentWhiteboardId) {
      console.log('[useWhiteboardSync] Save skipped: no whiteboardId');
      return false;
    }

    if (saveInFlightRef.current) {
      console.log('[useWhiteboardSync] Save skipped: already in flight');
      return false;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    onSaveStart?.();

    const elementCount = sceneData.elements?.length || 0;
    const fileCount = sceneData.files ? Object.keys(sceneData.files).length : 0;

    try {
      console.log('[useWhiteboardSync] Saving:', { elementCount, fileCount });

      const { error } = await supabase
        .from('whiteboards')
        .update({
          scene_data: sceneData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWhiteboardId);

      if (error) {
        console.error('[useWhiteboardSync] Save error:', error);
        onSaveEnd?.(false);
        return false;
      }

      // Read-back verification: re-fetch to confirm data was written
      const { data: verifyData, error: verifyError } = await supabase
        .from('whiteboards')
        .select('scene_data')
        .eq('id', currentWhiteboardId)
        .single();

      if (verifyError) {
        console.error('[useWhiteboardSync] Verification error:', verifyError);
        onSaveEnd?.(false);
        return false;
      }

      const savedScene = verifyData.scene_data as SceneData;
      const savedElementCount = savedScene?.elements?.length || 0;
      const savedFileCount = savedScene?.files ? Object.keys(savedScene.files).length : 0;

      console.log('[useWhiteboardSync] Verified:', { savedElementCount, savedFileCount });

      // Check if data was actually saved
      if (elementCount > 0 && savedElementCount === 0) {
        console.error('[useWhiteboardSync] VERIFICATION FAILED: Elements were not saved!');
        toast.error('Kayıt doğrulaması başarısız: Veriler DB\'ye yazılmadı!');
        onSaveEnd?.(false);
        return false;
      }

      const stats: SavedStats = { elementCount: savedElementCount, fileCount: savedFileCount };
      setLastSavedStats(stats);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      onSaveEnd?.(true, stats);
      return true;
    } catch (err) {
      console.error('[useWhiteboardSync] Save error:', err);
      onSaveEnd?.(false);
      return false;
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }, [onSaveStart, onSaveEnd]);

  // Manual save - prioritizes pending onChange state over API state
  const saveNow = useCallback(async (): Promise<boolean> => {
    const api = excalidrawAPIRef.current;
    
    // First priority: use pending scene (most recent onChange data)
    if (pendingSceneRef.current) {
      console.log('[useWhiteboardSync] Manual save using pending scene');
      const sceneData = pendingSceneRef.current;
      
      // Cancel pending autosave
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      const success = await saveToDatabase(sceneData);
      if (success) {
        pendingSceneRef.current = null;
      }
      return success;
    }

    // Fallback: get from API
    if (!api) {
      console.log('[useWhiteboardSync] Manual save skipped: no API and no pending');
      return false;
    }

    console.log('[useWhiteboardSync] Manual save using API state');

    // Cancel pending autosave
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const sceneData = cloneSceneData(
      api.getSceneElements(),
      api.getAppState(),
      api.getFiles()
    );

    return saveToDatabase(sceneData);
  }, [saveToDatabase]);

  // Flush pending saves (for unmount)
  const flushPendingSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const pending = pendingSceneRef.current;
    if (pending && !saveInFlightRef.current) {
      console.log('[useWhiteboardSync] Flushing pending save...');
      await saveToDatabase(pending);
      pendingSceneRef.current = null;
    }
  }, [saveToDatabase]);

  // Force capture current state from API (useful after programmatic changes)
  const captureCurrentState = useCallback(() => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    const sceneData = cloneSceneData(
      api.getSceneElements(),
      api.getAppState(),
      api.getFiles()
    );
    
    pendingSceneRef.current = sceneData;
    setHasUnsavedChanges(true);
    setCurrentStats({
      elementCount: sceneData.elements.length,
      fileCount: Object.keys(sceneData.files).length,
    });

    console.log('[useWhiteboardSync] State captured:', {
      elements: sceneData.elements.length,
      files: Object.keys(sceneData.files).length,
    });
  }, []);

  // onChange handler for Excalidraw
  const handleChange = useCallback((
    elements: readonly any[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    // Skip during hydration
    if (isHydratingRef.current) return;

    // Store latest scene data
    const sceneData = cloneSceneData(elements, appState, files);
    pendingSceneRef.current = sceneData;
    setHasUnsavedChanges(true);
    setCurrentStats({
      elementCount: sceneData.elements.length,
      fileCount: Object.keys(sceneData.files).length,
    });

    // Debounce autosave
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const pending = pendingSceneRef.current;
      if (pending) {
        saveToDatabase(pending);
        pendingSceneRef.current = null;
      }
    }, autoSaveDelay);
  }, [autoSaveDelay, saveToDatabase]);

  // Set Excalidraw API ref
  const setExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI | null) => {
    excalidrawAPIRef.current = api;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Sync flush on unmount
      const pending = pendingSceneRef.current;
      if (pending && whiteboardIdRef.current) {
        // Fire and forget - can't await in cleanup
        supabase
          .from('whiteboards')
          .update({
            scene_data: pending,
            updated_at: new Date().toISOString(),
          })
          .eq('id', whiteboardIdRef.current)
          .then(() => console.log('[useWhiteboardSync] Unmount save complete'));
      }
    };
  }, []);

  // Reset whiteboard
  const resetWhiteboard = useCallback(async (): Promise<boolean> => {
    const currentWhiteboardId = whiteboardIdRef.current;
    const api = excalidrawAPIRef.current;

    if (!currentWhiteboardId || !api) return false;

    try {
      const emptyScene: SceneData = { elements: [], appState: {}, files: {} };

      const { error } = await supabase
        .from('whiteboards')
        .update({
          scene_data: emptyScene,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWhiteboardId);

      if (error) {
        console.error('[useWhiteboardSync] Reset error:', error);
        return false;
      }

      api.resetScene();
      setHasUnsavedChanges(false);
      setLastSavedStats({ elementCount: 0, fileCount: 0 });
      setCurrentStats({ elementCount: 0, fileCount: 0 });
      pendingSceneRef.current = null;
      return true;
    } catch (err) {
      console.error('[useWhiteboardSync] Reset error:', err);
      return false;
    }
  }, []);

  return {
    // State
    whiteboardId,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    initialData,
    lastSavedStats,
    currentStats,
    
    // Actions
    setExcalidrawAPI,
    handleChange,
    saveNow,
    flushPendingSave,
    resetWhiteboard,
    captureCurrentState,
    
    // Refs (for advanced use)
    excalidrawAPIRef,
  };
}
