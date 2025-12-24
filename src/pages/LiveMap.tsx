import { useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface SceneData {
  elements: any[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

export default function LiveMap() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<SceneData | null>(null);
  
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);

  // Keep ref in sync
  useEffect(() => {
    excalidrawAPIRef.current = excalidrawAPI;
  }, [excalidrawAPI]);

  // Load initial whiteboard data
  useEffect(() => {
    const loadWhiteboard = async () => {
      try {
        const { data, error } = await supabase
          .from('whiteboards')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          console.error('Error loading whiteboard:', error);
          return;
        }

        if (data) {
          setWhiteboardId(data.id);
          const sceneData = data.scene_data as SceneData | null;
          if (sceneData && sceneData.elements && sceneData.elements.length > 0) {
            setInitialData(sceneData);
          }
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWhiteboard();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!whiteboardId || !excalidrawAPI) return;

    console.log('[LiveMap] Setting up realtime subscription...');

    const channel = supabase
      .channel('whiteboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whiteboards',
          filter: `id=eq.${whiteboardId}`,
        },
        (payload) => {
          console.log('[LiveMap] Realtime update received');
          const newSceneData = (payload.new as any).scene_data as SceneData;
          if (newSceneData && newSceneData.elements) {
            try {
              // Update scene with new data
              excalidrawAPI.updateScene({
                elements: newSceneData.elements,
              });
              
              // Update files if present
              if (newSceneData.files && Object.keys(newSceneData.files).length > 0) {
                excalidrawAPI.addFiles(Object.values(newSceneData.files));
              }
            } catch (e) {
              console.error('[LiveMap] Error loading realtime update:', e);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[LiveMap] Subscription status:', status);
      });

    return () => {
      console.log('[LiveMap] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [whiteboardId, excalidrawAPI]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Ana Sayfa
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Canlı Harita</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Canlı
          </span>
        </div>
      </header>

      {/* Map Area */}
      <div className="flex-1 relative" style={{ height: 'calc(100vh - 64px)' }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Harita yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            <Excalidraw
              excalidrawAPI={(api) => setExcalidrawAPI(api)}
              initialData={initialData ? {
                elements: initialData.elements,
                appState: {
                  ...initialData.appState,
                  viewModeEnabled: true,
                },
                files: initialData.files,
              } : {
                appState: {
                  viewModeEnabled: true,
                }
              }}
              viewModeEnabled={true}
              zenModeEnabled={true}
              theme="dark"
              langCode="tr-TR"
              UIOptions={{
                canvasActions: {
                  export: false,
                  saveAsImage: false,
                  loadScene: false,
                  clearCanvas: false,
                  toggleTheme: false,
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
