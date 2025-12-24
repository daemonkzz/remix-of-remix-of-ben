import { useState, useEffect, useCallback, useRef } from 'react';
import { exportToCanvas } from '@excalidraw/excalidraw';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import { supabase } from '@/integrations/supabase/client';

interface SceneData {
  elements: any[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

// Normalize files: ensure each file has an id field
const normalizeFiles = (files: BinaryFiles | undefined): BinaryFiles => {
  if (!files || typeof files !== 'object') return {};

  const normalized: BinaryFiles = {};
  for (const [key, value] of Object.entries(files)) {
    if (value && typeof value === 'object') {
      normalized[key] = {
        ...value,
        id: (value as any).id || key,
        mimeType:
          (value as any).mimeType ||
          ((value as any).dataURL?.match(/^data:([^;,]+)/)?.[1] || 'image/png'),
      };
    }
  }
  return normalized;
};

/**
 * Normalize elements - fixes image status and filters deleted elements
 */
const normalizeElements = (elements: any[], files: BinaryFiles): any[] => {
  if (!Array.isArray(elements)) return [];

  return elements
    .filter(el => el && typeof el === 'object' && !el.isDeleted)
    .map((el) => {
      if (el.type === 'image') {
        const fileId = (el as any).fileId;
        const hasFile = !!fileId && !!(files as any)[fileId];

        if ((el as any).status === 'pending') {
          return { ...el, status: hasFile ? 'saved' : 'error' };
        }

        if (!hasFile && ((el as any).status === 'saved' || (el as any).status == null)) {
          return { ...el, status: 'error' };
        }
      }

      return el;
    });
};

/**
 * Get renderable elements - filters out deleted elements and broken images
 */
const getRenderableElements = (elements: any[], files: BinaryFiles) => {
  return (elements || []).filter((el) => {
    if (!el || typeof el !== 'object') return false;
    if (el.isDeleted) return false;

    if (el.type === 'image') {
      const fileId = (el as any).fileId;
      const hasFile = !!fileId && !!(files as any)[fileId];
      const status = (el as any).status;
      return hasFile && (status === 'saved' || status == null);
    }

    return true;
  });
};

// Transparent background to integrate with site theme
const TRANSPARENT_BACKGROUND = 'transparent';

interface UseWhiteboardViewerOptions {
  whiteboardName?: string;
}

interface UseWhiteboardViewerReturn {
  imageUrl: string | null;
  isLoading: boolean;
  isConnected: boolean;
  elementCount: number;
  fileCount: number;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
}

export function useWhiteboardViewer(
  options: UseWhiteboardViewerOptions = {}
): UseWhiteboardViewerReturn {
  const { whiteboardName = 'Ana Harita' } = options;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [elementCount, setElementCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);

  const sceneDataRef = useRef<SceneData | null>(null);

  // Generate canvas image from scene data
  const generateImage = useCallback(async (sceneData: SceneData): Promise<string | null> => {
    if (!sceneData || !sceneData.elements || sceneData.elements.length === 0) {
      console.log('[WhiteboardViewer] No elements for render');
      return null;
    }

    try {
      const files = normalizeFiles(sceneData.files);
      const elements = normalizeElements(sceneData.elements, files);
      const renderableElements = getRenderableElements(elements, files);

      if (renderableElements.length === 0) {
        console.log('[WhiteboardViewer] No renderable elements');
        return null;
      }

      console.log('[WhiteboardViewer] Generating canvas with', renderableElements.length, 'elements');

      const canvas = await exportToCanvas({
        elements: renderableElements,
        appState: {
          viewBackgroundColor: TRANSPARENT_BACKGROUND,
          exportWithDarkMode: true,
        },
        files,
        maxWidthOrHeight: 1920,
      });

      const dataUrl = canvas.toDataURL('image/png');
      console.log('[WhiteboardViewer] Image generated:', canvas.width, 'x', canvas.height);
      
      return dataUrl;
    } catch (err) {
      console.error('[WhiteboardViewer] Render error:', err);
      return null;
    }
  }, []);

  // Load whiteboard data from database
  const loadWhiteboard = useCallback(async (): Promise<SceneData | null> => {
    try {
      console.log('[WhiteboardViewer] Loading whiteboard...');
      const { data, error } = await supabase
        .from('whiteboards')
        .select('id, scene_data')
        .eq('name', whiteboardName)
        .maybeSingle();

      if (error) {
        console.error('[WhiteboardViewer] Load error:', error);
        return null;
      }

      if (data) {
        console.log('[WhiteboardViewer] Loaded whiteboard:', data.id);
        setWhiteboardId(data.id);
        const sceneData = data.scene_data as SceneData | null;
        
        if (sceneData) {
          const count = sceneData.elements?.length || 0;
          const fCount = sceneData.files ? Object.keys(sceneData.files).length : 0;
          
          console.log('[WhiteboardViewer] Scene data:', { elements: count, files: fCount });
          sceneDataRef.current = sceneData;
          setElementCount(count);
          setFileCount(fCount);
          setLastUpdate(new Date());
          
          return sceneData;
        }
      }
      return null;
    } catch (err) {
      console.error('[WhiteboardViewer] Load error:', err);
      return null;
    }
  }, [whiteboardName]);

  // Refresh function
  const refresh = useCallback(async () => {
    setIsLoading(true);
    const sceneData = await loadWhiteboard();
    if (sceneData) {
      const url = await generateImage(sceneData);
      if (url) {
        setImageUrl(url);
      }
    }
    setIsLoading(false);
  }, [loadWhiteboard, generateImage]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const sceneData = await loadWhiteboard();
      if (sceneData) {
        const url = await generateImage(sceneData);
        if (url) {
          setImageUrl(url);
        }
      }
      setIsLoading(false);
    };
    init();
  }, [loadWhiteboard, generateImage]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!whiteboardId) return;

    console.log('[WhiteboardViewer] Setting up realtime subscription for:', whiteboardId);

    const channel = supabase
      .channel('whiteboard-viewer-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whiteboards',
          filter: `id=eq.${whiteboardId}`,
        },
        async (payload) => {
          console.log('[WhiteboardViewer] Realtime update received');
          const newSceneData = (payload.new as any).scene_data as SceneData;
          
          if (newSceneData) {
            sceneDataRef.current = newSceneData;
            setElementCount(newSceneData.elements?.length || 0);
            setFileCount(newSceneData.files ? Object.keys(newSceneData.files).length : 0);
            setLastUpdate(new Date());
            
            const url = await generateImage(newSceneData);
            if (url) {
              setImageUrl(url);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[WhiteboardViewer] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[WhiteboardViewer] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [whiteboardId, generateImage]);

  return {
    imageUrl,
    isLoading,
    isConnected,
    elementCount,
    fileCount,
    lastUpdate,
    refresh,
  };
}
