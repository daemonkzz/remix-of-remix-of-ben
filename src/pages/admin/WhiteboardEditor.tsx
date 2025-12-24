import { useState, useEffect, useCallback, useRef } from 'react';
import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles, DataURL } from '@excalidraw/excalidraw/types';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Save, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { GalleryPickerModal } from '@/components/admin/updates/GalleryPickerModal';
import { throttle } from 'lodash';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SceneData {
  elements: any[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

export default function WhiteboardEditor() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<SceneData | null>(null);
  
  // Refs for stability
  const isHydratingRef = useRef(true);
  const saveInFlightRef = useRef(false);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const whiteboardIdRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    whiteboardIdRef.current = whiteboardId;
  }, [whiteboardId]);

  useEffect(() => {
    excalidrawAPIRef.current = excalidrawAPI;
  }, [excalidrawAPI]);

  // Load initial whiteboard data
  useEffect(() => {
    const loadWhiteboard = async () => {
      try {
        console.log('[WhiteboardEditor] Loading whiteboard...');
        const { data, error } = await supabase
          .from('whiteboards')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          console.error('[WhiteboardEditor] Error loading whiteboard:', error);
          toast.error('Whiteboard yüklenirken hata oluştu');
          return;
        }

        if (data) {
          console.log('[WhiteboardEditor] Whiteboard loaded:', data.id);
          setWhiteboardId(data.id);
          
          const sceneData = data.scene_data as SceneData | null;
          if (sceneData && sceneData.elements && sceneData.elements.length > 0) {
            setInitialData(sceneData);
          }
        }
      } catch (err) {
        console.error('[WhiteboardEditor] Load error:', err);
      } finally {
        setIsLoading(false);
        // Allow saves after a short delay
        setTimeout(() => {
          isHydratingRef.current = false;
          console.log('[WhiteboardEditor] Hydration complete, autosave enabled');
        }, 1000);
      }
    };

    loadWhiteboard();
  }, []);

  // Save function using refs to avoid dependency changes
  const saveWhiteboard = useCallback(async () => {
    const api = excalidrawAPIRef.current;
    const currentWhiteboardId = whiteboardIdRef.current;

    if (!api || !currentWhiteboardId) {
      console.log('[WhiteboardEditor] Save skipped: no API or whiteboardId');
      return;
    }

    // Skip if hydrating
    if (isHydratingRef.current) {
      console.log('[WhiteboardEditor] Save skipped: hydrating');
      return;
    }

    // Skip if already saving
    if (saveInFlightRef.current) {
      console.log('[WhiteboardEditor] Save skipped: already in flight');
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    
    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      console.log('[WhiteboardEditor] Elements to save:', elements.length, elements);

      // Deep clone elements to avoid readonly proxy issues
      const sceneData: SceneData = {
        elements: JSON.parse(JSON.stringify(elements)),
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          zoom: appState.zoom,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
        },
        files: JSON.parse(JSON.stringify(files)),
      };

      console.log('[WhiteboardEditor] Saving scene data...', sceneData);
      
      const { error } = await supabase
        .from('whiteboards')
        .update({
          scene_data: sceneData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWhiteboardId);

      if (error) {
        console.error('[WhiteboardEditor] Save error:', error);
        toast.error('Kaydetme hatası');
      } else {
        console.log('[WhiteboardEditor] Scene data saved successfully');
      }
    } catch (err) {
      console.error('[WhiteboardEditor] Save error:', err);
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }, []);

  // Throttled save for onChange
  const throttledSave = useCallback(
    throttle(() => {
      if (!isHydratingRef.current) {
        saveWhiteboard();
      }
    }, 3000),
    [saveWhiteboard]
  );

  // Handle scene changes
  const handleChange = useCallback((
    elements: readonly any[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    throttledSave();
  }, [throttledSave]);

  // Helper function to convert URL to data URL
  const urlToDataURL = async (url: string): Promise<DataURL> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as DataURL);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Handle gallery image selection
  const handleGallerySelect = useCallback(async (urls: string[]) => {
    if (!excalidrawAPI) return;

    console.log('[WhiteboardEditor] Adding gallery images:', urls.length);
    setGalleryOpen(false);

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        
        // Convert URL to data URL for Excalidraw
        const dataURL = await urlToDataURL(url);
        
        // Generate unique file ID
        const fileId = `gallery_${Date.now()}_${i}`;
        
        // Add file to Excalidraw
        excalidrawAPI.addFiles([{
          id: fileId as any,
          dataURL,
          mimeType: 'image/webp',
          created: Date.now(),
        }]);

        // Create image element using convertToExcalidrawElements
        const viewportCenter = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };

        const imageElements = convertToExcalidrawElements([{
          type: 'image',
          fileId: fileId as any,
          x: viewportCenter.x - 200 + (i * 50),
          y: viewportCenter.y - 150 + (i * 50),
          width: 400,
          height: 300,
        }]);

        // Update scene with new element
        excalidrawAPI.updateScene({
          elements: [...excalidrawAPI.getSceneElements(), ...imageElements],
        });

        console.log('[WhiteboardEditor] Image added:', fileId);
      }

      toast.success(`${urls.length} resim eklendi`);
    } catch (err) {
      console.error('[WhiteboardEditor] Error adding images:', err);
      toast.error('Resim eklenirken hata oluştu');
    }
  }, [excalidrawAPI]);

  // Manual save button
  const handleManualSave = async () => {
    await saveWhiteboard();
    toast.success('Kaydedildi');
  };

  // Reset whiteboard
  const handleReset = async () => {
    if (!whiteboardId || !excalidrawAPI) return;

    try {
      console.log('[WhiteboardEditor] Resetting whiteboard...');
      
      // Clear database
      const { error } = await supabase
        .from('whiteboards')
        .update({
          scene_data: { elements: [], appState: {}, files: {} },
          updated_at: new Date().toISOString(),
        })
        .eq('id', whiteboardId);

      if (error) {
        console.error('[WhiteboardEditor] Reset error:', error);
        toast.error('Sıfırlama hatası');
        return;
      }

      // Reset Excalidraw
      excalidrawAPI.resetScene();

      toast.success('Harita sıfırlandı');
      console.log('[WhiteboardEditor] Whiteboard reset complete');
    } catch (err) {
      console.error('[WhiteboardEditor] Reset error:', err);
      toast.error('Sıfırlama sırasında hata');
    }
  };

  return (
    <AdminLayout activeTab="canliharita">
      <div className="h-screen flex flex-col">
        {/* Toolbar */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Canlı Harita Editörü</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGalleryOpen(true)}
              className="gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Galeriden Ekle
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Kaydediliyor...
              </span>
            )}
            
            {/* Reset Button with Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4" />
                  Sıfırla
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Haritayı Sıfırla</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem haritadaki tüm öğeleri silecektir. Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sıfırla
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="default"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Kaydet
            </Button>
          </div>
        </div>

        {/* Excalidraw Editor */}
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 80px)' }}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                initialData={initialData ? {
                  elements: initialData.elements,
                  appState: initialData.appState,
                  files: initialData.files,
                } : undefined}
                onChange={handleChange}
                theme="dark"
                langCode="tr-TR"
              />
            </div>
          )}
        </div>

        {/* Gallery Picker Modal */}
        <GalleryPickerModal
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          onSelect={handleGallerySelect}
        />
      </div>
    </AdminLayout>
  );
}
