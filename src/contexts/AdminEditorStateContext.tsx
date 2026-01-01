import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Form Builder types
interface FormBuilderData {
  title: string;
  description: string;
  coverImageUrl: string;
  formType: string;
  pages: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  questions: Array<{
    id: string;
    pageId: string;
    type: string;
    label: string;
    placeholder: string;
    required: boolean;
    options: string[];
    minLength?: number;
    maxLength?: number;
    order: number;
  }>;
  settings: {
    formType: string;
    requiresAccessCode: boolean;
    accessCode: string;
    allowMultipleSubmissions: boolean;
    showProgressBar: boolean;
    submitButtonText: string;
    successMessage: string;
    redirectUrl: string;
  };
}

// Update Editor types
interface UpdateEditorData {
  title: string;
  subtitle: string;
  category: string;
  version: string;
  coverImageUrl: string;
  content: any;
  isPublished: boolean;
}

// Rules Editor types
interface RulesEditorData {
  categories: any[];
}

// Notification Editor types
interface NotificationEditorData {
  title: string;
  content: string;
  targetType: 'all' | 'selected';
  selectedUsers: Array<{ id: string; username: string; avatar_url: string | null }>;
}

interface AdminEditorStateContextType {
  // Form Builder
  getFormBuilderState: (id: string) => FormBuilderData | null;
  setFormBuilderState: (id: string, data: FormBuilderData) => void;
  clearFormBuilderState: (id: string) => void;
  
  // Update Editor
  getUpdateEditorState: (id: string) => UpdateEditorData | null;
  setUpdateEditorState: (id: string, data: UpdateEditorData) => void;
  clearUpdateEditorState: (id: string) => void;
  
  // Rules Editor
  getRulesEditorState: () => RulesEditorData | null;
  setRulesEditorState: (data: RulesEditorData) => void;
  clearRulesEditorState: () => void;
  
  // Notification Editor
  getNotificationEditorState: () => NotificationEditorData | null;
  setNotificationEditorState: (data: NotificationEditorData) => void;
  clearNotificationEditorState: () => void;
}

const AdminEditorStateContext = createContext<AdminEditorStateContextType | null>(null);

export const useAdminEditorState = () => {
  const context = useContext(AdminEditorStateContext);
  if (!context) {
    throw new Error('useAdminEditorState must be used within AdminEditorStateProvider');
  }
  return context;
};

interface AdminEditorStateProviderProps {
  children: ReactNode;
}

export const AdminEditorStateProvider: React.FC<AdminEditorStateProviderProps> = ({ children }) => {
  // State stores - key için 'new' veya gerçek id kullanılır
  const [formBuilderStates, setFormBuilderStates] = useState<Record<string, FormBuilderData>>({});
  const [updateEditorStates, setUpdateEditorStates] = useState<Record<string, UpdateEditorData>>({});
  const [rulesEditorState, setRulesEditorStateInternal] = useState<RulesEditorData | null>(null);
  const [notificationEditorState, setNotificationEditorStateInternal] = useState<NotificationEditorData | null>(null);

  // Form Builder methods
  const getFormBuilderState = useCallback((id: string): FormBuilderData | null => {
    return formBuilderStates[id] || null;
  }, [formBuilderStates]);

  const setFormBuilderState = useCallback((id: string, data: FormBuilderData) => {
    setFormBuilderStates(prev => ({ ...prev, [id]: data }));
  }, []);

  const clearFormBuilderState = useCallback((id: string) => {
    setFormBuilderStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, []);

  // Update Editor methods
  const getUpdateEditorState = useCallback((id: string): UpdateEditorData | null => {
    return updateEditorStates[id] || null;
  }, [updateEditorStates]);

  const setUpdateEditorState = useCallback((id: string, data: UpdateEditorData) => {
    setUpdateEditorStates(prev => ({ ...prev, [id]: data }));
  }, []);

  const clearUpdateEditorState = useCallback((id: string) => {
    setUpdateEditorStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, []);

  // Rules Editor methods
  const getRulesEditorState = useCallback((): RulesEditorData | null => {
    return rulesEditorState;
  }, [rulesEditorState]);

  const setRulesEditorState = useCallback((data: RulesEditorData) => {
    setRulesEditorStateInternal(data);
  }, []);

  const clearRulesEditorState = useCallback(() => {
    setRulesEditorStateInternal(null);
  }, []);

  // Notification Editor methods
  const getNotificationEditorState = useCallback((): NotificationEditorData | null => {
    return notificationEditorState;
  }, [notificationEditorState]);

  const setNotificationEditorState = useCallback((data: NotificationEditorData) => {
    setNotificationEditorStateInternal(data);
  }, []);

  const clearNotificationEditorState = useCallback(() => {
    setNotificationEditorStateInternal(null);
  }, []);

  const value: AdminEditorStateContextType = {
    getFormBuilderState,
    setFormBuilderState,
    clearFormBuilderState,
    getUpdateEditorState,
    setUpdateEditorState,
    clearUpdateEditorState,
    getRulesEditorState,
    setRulesEditorState,
    clearRulesEditorState,
    getNotificationEditorState,
    setNotificationEditorState,
    clearNotificationEditorState,
  };

  return (
    <AdminEditorStateContext.Provider value={value}>
      {children}
    </AdminEditorStateContext.Provider>
  );
};
