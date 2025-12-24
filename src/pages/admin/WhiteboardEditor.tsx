import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Tldraw, Editor, TLAssetStore, AssetRecordType, getHashForString, getSnapshot, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GalleryPickerModal } from '@/components/admin/updates/GalleryPickerModal';
import imageCompression from 'browser-image-compression';
import { throttle } from 'lodash';

export default function WhiteboardEditor() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<any>(null);

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
          toast.error('Whiteboard yüklenirken hata oluştu');
          return;
        }

        if (data) {
          setWhiteboardId(data.id);
          if (data.scene_data && Object.keys(data.scene_data).length > 0) {
            setInitialSnapshot(data.scene_data);
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

  // Custom asset store for uploading images to Supabase Storage
  const assetStore = useMemo<TLAssetStore>(() => ({
    async upload(asset, file) {
      try {
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
          console.error('Upload error:', uploadError);
          toast.error('Resim yüklenirken hata oluştu');
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        // Also save to gallery_images table
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('gallery_images').insert({
          file_name: fileName,
          file_path: filePath,
          url: urlData.publicUrl,
          original_size: file.size,
          optimized_size: compressedFile.size,
          mime_type: 'image/webp',
          uploaded_by: userData.user?.id,
        });

        toast.success('Resim yüklendi');
        return { src: urlData.publicUrl };
      } catch (error) {
        console.error('Asset upload error:', error);
        throw error;
      }
    },
    resolve(asset) {
      return asset.props.src;
    },
  }), []);

  // Save function
  const saveWhiteboard = useCallback(async (editorInstance: Editor) => {
    if (!editorInstance || !whiteboardId) return;

    setIsSaving(true);
    try {
      const snapshot = getSnapshot(editorInstance.store);
      
      const { error } = await supabase
        .from('whiteboards')
        .update({
          scene_data: snapshot,
          updated_at: new Date().toISOString(),
        })
        .eq('id', whiteboardId);

      if (error) {
        console.error('Save error:', error);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [whiteboardId]);

  // Handle gallery image selection
  const handleGallerySelect = useCallback((urls: string[]) => {
    if (!editor) return;

    urls.forEach((url, index) => {
      // Create asset
      const assetId = AssetRecordType.createId(getHashForString(url));
      
      editor.createAssets([{
        id: assetId,
        type: 'image',
        typeName: 'asset',
        props: {
          name: 'Gallery Image',
          src: url,
          w: 400,
          h: 300,
          mimeType: 'image/webp',
          isAnimated: false,
        },
        meta: {},
      }]);

      // Create image shape on canvas
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
    });

    setGalleryOpen(false);
    toast.success(`${urls.length} resim eklendi`);
  }, [editor]);

  // Manual save button
  const handleManualSave = async () => {
    if (editor) {
      await saveWhiteboard(editor);
      toast.success('Kaydedildi');
    }
  };

  // Handle editor mount
  const handleEditorMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
    
    // Load initial snapshot if available
    if (initialSnapshot) {
      try {
        loadSnapshot(editorInstance.store, initialSnapshot);
      } catch (e) {
        console.log('Could not load initial snapshot:', e);
      }
    }

    // Set up auto-save on store changes
    const throttledSave = throttle(() => {
      saveWhiteboard(editorInstance);
    }, 2000);

    const cleanup = editorInstance.store.listen(() => {
      throttledSave();
    }, { scope: 'document' });

    // Cleanup on unmount
    return () => {
      cleanup();
      throttledSave.cancel();
    };
  }, [initialSnapshot, saveWhiteboard]);

  return (
    <AdminLayout>
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
