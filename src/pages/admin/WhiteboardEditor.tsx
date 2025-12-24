import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Tldraw, Editor, TLAssetStore, AssetRecordType, getSnapshot, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Save, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { GalleryPickerModal } from '@/components/admin/updates/GalleryPickerModal';
import imageCompression from 'browser-image-compression';
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

export default function WhiteboardEditor() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<any>(null);
  
  // Refs for stability
  const isHydratingRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const whiteboardIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    whiteboardIdRef.current = whiteboardId;
  }, [whiteboardId]);

  // Window-level error catching for debugging
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[WhiteboardEditor] Uncaught error:', event.error);
      toast.error('Bir hata oluştu. Konsolu kontrol edin.');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[WhiteboardEditor] Unhandled rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
          if (data.scene_data && Object.keys(data.scene_data).length > 0) {
            setInitialSnapshot(data.scene_data);
          }
        }
      } catch (err) {
        console.error('[WhiteboardEditor] Load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWhiteboard();
  }, []);

  // Custom asset store for uploading images to Supabase Storage
  const assetStore = useMemo<TLAssetStore>(() => ({
    async upload(asset, file) {
      try {
        console.log('[WhiteboardEditor] Uploading asset:', file.name);
        
        // Compress image
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          fileType: 'image/webp',
        });

        // Generate unique filename
        const fileExt = 'webp';
        const fileName = `whiteboard_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `whiteboard/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, compressedFile, {
            contentType: 'image/webp',
            upsert: false,
          });

        if (uploadError) {
          console.error('[WhiteboardEditor] Upload error:', uploadError);
          toast.error('Resim yüklenirken hata oluştu');
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        // Also save to gallery_images table
        const { data: userData } = await supabase.auth.getUser();
        const { error: insertError } = await supabase.from('gallery_images').insert({
          file_name: fileName,
          file_path: filePath,
          url: urlData.publicUrl,
          original_size: file.size,
          optimized_size: compressedFile.size,
          mime_type: 'image/webp',
          uploaded_by: userData.user?.id,
        });

        if (insertError) {
          console.error('[WhiteboardEditor] Gallery insert error:', insertError);
        }

        console.log('[WhiteboardEditor] Asset uploaded:', urlData.publicUrl);
        toast.success('Resim yüklendi');
        return { src: urlData.publicUrl };
      } catch (error) {
        console.error('[WhiteboardEditor] Asset upload error:', error);
        throw error;
      }
    },
    resolve(asset) {
      return asset.props.src;
    },
  }), []);

  // Save function using refs to avoid dependency changes
  const saveWhiteboard = useCallback(async () => {
    const currentEditor = editorRef.current;
    const currentWhiteboardId = whiteboardIdRef.current;

    if (!currentEditor || !currentWhiteboardId) {
      console.log('[WhiteboardEditor] Save skipped: no editor or whiteboardId');
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
      const snapshot = getSnapshot(currentEditor.store);
      console.log('[WhiteboardEditor] Saving snapshot...');
      
      const { error } = await supabase
        .from('whiteboards')
        .update({
          scene_data: snapshot,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWhiteboardId);

      if (error) {
        console.error('[WhiteboardEditor] Save error:', error);
        toast.error('Kaydetme hatası');
      } else {
        console.log('[WhiteboardEditor] Snapshot saved successfully');
      }
    } catch (err) {
      console.error('[WhiteboardEditor] Save error:', err);
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }, []);

  // Load snapshot ONCE when editor and initialSnapshot are ready
  useEffect(() => {
    if (!editor || hasHydratedRef.current) return;

    // If there's an initial snapshot, load it
    if (initialSnapshot) {
      try {
        console.log('[WhiteboardEditor] Loading initial snapshot...');
        isHydratingRef.current = true;
        loadSnapshot(editor.store, initialSnapshot);
        console.log('[WhiteboardEditor] Initial snapshot loaded');
      } catch (e) {
        console.error('[WhiteboardEditor] Could not load initial snapshot:', e);
        toast.error('Snapshot yüklenemedi, temiz sayfa açılıyor');
      } finally {
        // Delay turning off hydrating to ensure store settles
        setTimeout(() => {
          isHydratingRef.current = false;
          hasHydratedRef.current = true;
          console.log('[WhiteboardEditor] Hydration complete, autosave enabled');
        }, 500);
      }
    } else {
      // No snapshot, mark as hydrated
      hasHydratedRef.current = true;
      console.log('[WhiteboardEditor] No initial snapshot, starting fresh');
    }
  }, [editor, initialSnapshot]);

  // Set up autosave listener SEPARATELY from onMount
  useEffect(() => {
    if (!editor || !whiteboardId) return;

    console.log('[WhiteboardEditor] Setting up autosave listener...');

    const throttledSave = throttle(() => {
      if (!isHydratingRef.current) {
        saveWhiteboard();
      }
    }, 3000);

    const cleanup = editor.store.listen(() => {
      throttledSave();
    }, { scope: 'document' });

    return () => {
      console.log('[WhiteboardEditor] Autosave listener cleanup');
      cleanup();
      throttledSave.cancel();
    };
  }, [editor, whiteboardId, saveWhiteboard]);

  // Handle gallery image selection - proper tldraw v4 asset creation
  const handleGallerySelect = useCallback((urls: string[]) => {
    if (!editor) return;

    console.log('[WhiteboardEditor] Adding gallery images:', urls.length);

    urls.forEach((url, index) => {
      try {
        // Create asset first (tldraw v4 requirement)
        const assetId = AssetRecordType.createId();
        
        editor.createAssets([{
          id: assetId,
          type: 'image',
          typeName: 'asset',
          props: {
            name: `Gallery Image ${index + 1}`,
            src: url,
            w: 400,
            h: 300,
            mimeType: 'image/webp',
            isAnimated: false,
          },
          meta: {},
        }]);

        // Create image shape with assetId
        const viewportCenter = editor.getViewportScreenCenter();
        editor.createShape({
          type: 'image',
          x: viewportCenter.x - 200 + (index * 50),
          y: viewportCenter.y - 150 + (index * 50),
          props: {
            assetId,
            w: 400,
            h: 300,
          },
        });

        console.log('[WhiteboardEditor] Image added with assetId:', assetId);
      } catch (err) {
        console.error('[WhiteboardEditor] Error adding image:', err);
        toast.error('Resim eklenirken hata oluştu');
      }
    });

    setGalleryOpen(false);
    toast.success(`${urls.length} resim eklendi`);
  }, [editor]);

  // Manual save button
  const handleManualSave = async () => {
    await saveWhiteboard();
    toast.success('Kaydedildi');
  };

  // Reset whiteboard
  const handleReset = async () => {
    if (!whiteboardId || !editor) return;

    try {
      console.log('[WhiteboardEditor] Resetting whiteboard...');
      
      // Clear database
      const { error } = await supabase
        .from('whiteboards')
        .update({
          scene_data: {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', whiteboardId);

      if (error) {
        console.error('[WhiteboardEditor] Reset error:', error);
        toast.error('Sıfırlama hatası');
        return;
      }

      // Reset editor - delete all shapes
      const allShapeIds = editor.getCurrentPageShapeIds();
      if (allShapeIds.size > 0) {
        editor.deleteShapes([...allShapeIds]);
      }

      // Delete all assets
      const allAssets = editor.getAssets();
      if (allAssets.length > 0) {
        editor.deleteAssets(allAssets.map(a => a.id));
      }

      toast.success('Harita sıfırlandı');
      console.log('[WhiteboardEditor] Whiteboard reset complete');
    } catch (err) {
      console.error('[WhiteboardEditor] Reset error:', err);
      toast.error('Sıfırlama sırasında hata');
    }
  };

  // STABLE onMount - no dependencies, just sets the editor ref
  const handleEditorMount = useCallback((editorInstance: Editor) => {
    console.log('[WhiteboardEditor] Editor mounted');
    setEditor(editorInstance);
    editorRef.current = editorInstance;
  }, []);

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

        {/* Tldraw Editor */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tldraw
              onMount={handleEditorMount}
              assets={assetStore}
            />
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
