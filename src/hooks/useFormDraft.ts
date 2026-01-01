import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseFormDraftOptions<T> {
  /** Unique key for localStorage */
  key: string;
  /** Initial data */
  initialData: T;
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
  /** Whether to show toast on auto-save */
  showSaveToast?: boolean;
  /** Auto-load draft without showing prompt (default: false) */
  autoLoad?: boolean;
}

interface UseFormDraftReturn<T> {
  /** Current data */
  data: T;
  /** Update data */
  setData: React.Dispatch<React.SetStateAction<T>>;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Mark as saved (clears unsaved flag and removes draft) */
  markAsSaved: () => void;
  /** Clear the draft from localStorage */
  clearDraft: () => void;
  /** Whether a draft was loaded on init */
  hasDraft: boolean;
  /** Load draft from localStorage (returns true if draft existed) */
  loadDraft: () => boolean;
  /** Ignore the draft and use initial data */
  ignoreDraft: () => void;
  /** Whether draft prompt is pending */
  isDraftPromptPending: boolean;
}

export function useFormDraft<T>({
  key,
  initialData,
  debounceMs = 1000,
  showSaveToast = false,
  autoLoad = false,
}: UseFormDraftOptions<T>): UseFormDraftReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isDraftPromptPending, setIsDraftPromptPending] = useState(false);
  
  const initialDataRef = useRef(initialData);
  const isInitializedRef = useRef(false);
  const lastSavedDataRef = useRef<string>('');

  // Check for existing draft on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const storageKey = `draft_${key}`;
    const savedDraft = localStorage.getItem(storageKey);
    
    if (savedDraft) {
      try {
        const parsedData = JSON.parse(savedDraft) as T;
        
        if (autoLoad) {
          // Auto-load: silently restore draft without modal
          setData(parsedData);
          setHasUnsavedChanges(true);
          lastSavedDataRef.current = savedDraft;
          toast.info('Kaldığınız yerden devam ediyorsunuz', { duration: 2000 });
        } else {
          // Manual load: show draft prompt modal
          setHasDraft(true);
          setIsDraftPromptPending(true);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [key, autoLoad]);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    // Don't auto-save if draft prompt is pending
    if (isDraftPromptPending) return;
    
    const currentDataStr = JSON.stringify(data);
    const initialDataStr = JSON.stringify(initialDataRef.current);
    
    // Check if data has changed from initial
    if (currentDataStr !== initialDataStr && currentDataStr !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true);
      
      const timeoutId = setTimeout(() => {
        const storageKey = `draft_${key}`;
        localStorage.setItem(storageKey, currentDataStr);
        lastSavedDataRef.current = currentDataStr;
        
        if (showSaveToast) {
          toast.info('Taslak otomatik kaydedildi', { duration: 2000 });
        }
      }, debounceMs);
      
      return () => clearTimeout(timeoutId);
    } else if (currentDataStr === initialDataStr) {
      setHasUnsavedChanges(false);
    }
  }, [data, key, debounceMs, showSaveToast, isDraftPromptPending]);

  // Browser/tab close protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard shortcut: Ctrl/Cmd + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // This will be handled by the parent component
        // We emit a custom event that the parent can listen to
        window.dispatchEvent(new CustomEvent('formDraftSaveRequest'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadDraft = useCallback((): boolean => {
    const storageKey = `draft_${key}`;
    const savedDraft = localStorage.getItem(storageKey);
    
    if (savedDraft) {
      try {
        const parsedData = JSON.parse(savedDraft) as T;
        setData(parsedData);
        setHasDraft(false);
        setIsDraftPromptPending(false);
        setHasUnsavedChanges(true);
        toast.success('Taslak yüklendi');
        return true;
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    
    setIsDraftPromptPending(false);
    return false;
  }, [key]);

  const ignoreDraft = useCallback(() => {
    const storageKey = `draft_${key}`;
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setIsDraftPromptPending(false);
    toast.info('Taslak silindi');
  }, [key]);

  const clearDraft = useCallback(() => {
    const storageKey = `draft_${key}`;
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    lastSavedDataRef.current = '';
  }, [key]);

  const markAsSaved = useCallback(() => {
    clearDraft();
    setHasUnsavedChanges(false);
    // Update initial data ref to current data
    initialDataRef.current = data;
  }, [clearDraft, data]);

  return {
    data,
    setData,
    hasUnsavedChanges,
    markAsSaved,
    clearDraft,
    hasDraft,
    loadDraft,
    ignoreDraft,
    isDraftPromptPending,
  };
}
