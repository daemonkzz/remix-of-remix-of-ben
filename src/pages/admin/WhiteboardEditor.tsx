import { useState, useCallback } from 'react';
import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { ExcalidrawImperativeAPI, DataURL } from '@excalidraw/excalidraw/types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Save, Loader2, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GalleryPickerModal } from '@/components/admin/updates/GalleryPickerModal';
import { useWhiteboardSync } from '@/hooks/useWhiteboardSync';
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

export default function WhiteboardEditor() {
  const [excalidrawAPI, setExcalidrawAPIState] = useState<ExcalidrawImperativeAPI | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const {
    isLoading,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    initialData,
    setExcalidrawAPI,
    handleChange,
    saveNow,
    resetWhiteboard,
  } = useWhiteboardSync({
    autoSaveDelay: 1200,
  });

  // Handle API ref + state together
  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPIState(api);
    setExcalidrawAPI(api);
  }, [setExcalidrawAPI]);

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
        const dataURL = await urlToDataURL(url);
        const fileId = `gallery_${Date.now()}_${i}`;
        
        excalidrawAPI.addFiles([{
          id: fileId as any,
          dataURL,
          mimeType: 'image/webp',
          created: Date.now(),
        }]);

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

        excalidrawAPI.updateScene({
          elements: [...excalidrawAPI.getSceneElements(), ...imageElements],
        });
      }

      toast.success(`${urls.length} resim eklendi`);
    } catch (err) {
      console.error('[WhiteboardEditor] Error adding images:', err);
      toast.error('Resim eklenirken hata oluştu');
    }
  }, [excalidrawAPI]);

  // Manual save with feedback
  const handleManualSave = async () => {
    const success = await saveNow();
    if (success) {
      toast.success('Kaydedildi');
    } else {
      toast.error('Kaydetme başarısız');
    }
  };

  // Reset with feedback
  const handleReset = async () => {
    const success = await resetWhiteboard();
    if (success) {
      toast.success('Harita sıfırlandı');
    } else {
      toast.error('Sıfırlama başarısız');
    }
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSavedAt) return null;
    const diff = Date.now() - lastSavedAt.getTime();
    if (diff < 60000) return 'Az önce kaydedildi';
    const mins = Math.floor(diff / 60000);
    return `${mins} dk önce kaydedildi`;
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
          
          <div className="flex items-center gap-3">
            {/* Save status indicator */}
            <div className="flex items-center gap-2 text-sm">
              {isSaving ? (
                <span className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </span>
              ) : hasUnsavedChanges ? (
                <span className="text-amber-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Kaydedilmemiş değişiklikler
                </span>
              ) : lastSavedAt ? (
                <span className="text-green-500 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {formatLastSaved()}
                </span>
              ) : null}
            </div>
            
            {/* Reset Button */}
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

            {/* Save Button */}
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
                excalidrawAPI={handleExcalidrawAPI}
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
