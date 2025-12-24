import { useState, useEffect, useCallback } from 'react';
import { Tldraw, Editor, getSnapshot, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LiveMap() {
  const [editor, setEditor] = useState<Editor | null>(null);
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

  // Subscribe to realtime updates
  useEffect(() => {
    if (!whiteboardId || !editor) return;

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
          console.log('Realtime update received:', payload);
          if (payload.new && (payload.new as any).scene_data) {
            try {
              loadSnapshot(editor.store, (payload.new as any).scene_data);
            } catch (e) {
              console.error('Error loading realtime update:', e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [whiteboardId, editor]);

  // Handle editor mount
  const handleEditorMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
    
    // Make it readonly
    editorInstance.updateInstanceState({ isReadonly: true });
    
    // Load initial snapshot if available
    if (initialSnapshot) {
      try {
        loadSnapshot(editorInstance.store, initialSnapshot);
        // Zoom to fit content after loading
        setTimeout(() => {
          editorInstance.zoomToFit();
        }, 100);
      } catch (e) {
        console.log('Could not load initial snapshot:', e);
      }
    }
  }, [initialSnapshot]);

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
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Harita yükleniyor...</p>
            </div>
          </div>
        ) : (
          <Tldraw
            onMount={handleEditorMount}
            hideUi
          />
        )}
      </div>
    </div>
  );
}
