import { useCallback, useRef, useEffect, useState } from 'react';
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SceneData {
  elements: any[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

interface UseWhiteboardSyncOptions {
  autoSaveDelay?: number;
  onSaveStart?: () => void;
  onSaveEnd?: (success: boolean) => void;
}

/**
 * Deep clones scene data to avoid Excalidraw readonly proxy issues
 */
export function cloneSceneData(
  elements: readonly any[],
  appState: AppState,
  files: BinaryFiles
): SceneData {
  return {
    elements: JSON.parse(JSON.stringify(elements)),
    appState: {
      viewBackgroundColor: appState.viewBackgroundColor,
      zoom: appState.zoom,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
    },
    files: JSON.parse(JSON.stringify(files)),
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
          if (sceneData && sceneData.elements && sceneData.elements.length > 0) {
            setInitialData(sceneData);
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

  // Core save function
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

    try {
      console.log('[useWhiteboardSync] Saving', sceneData.elements.length, 'elements...');

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

      console.log('[useWhiteboardSync] Saved successfully');
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      onSaveEnd?.(true);
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

  // Manual save - uses current API state
  const saveNow = useCallback(async (): Promise<boolean> => {
    const api = excalidrawAPIRef.current;
    
    if (!api) {
      console.log('[useWhiteboardSync] Manual save skipped: no API');
      return false;
    }

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
    
    // Actions
    setExcalidrawAPI,
    handleChange,
    saveNow,
    flushPendingSave,
    resetWhiteboard,
    
    // Refs (for advanced use)
    excalidrawAPIRef,
  };
}
