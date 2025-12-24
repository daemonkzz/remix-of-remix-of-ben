export type QuestionType = 
  | 'short_text'
  | 'paragraph'
  | 'number'
  | 'radio'
  | 'checkbox'
  | 'discord_id';

export type UserAccessType = 'unverified' | 'verified';
export type FormType = 'whitelist' | 'other';

export interface FormPage {
  id: string;
  title: string;
  questionIds: string[];
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For radio and checkbox types
  pageId?: string; // Which page this question belongs to
}

export interface FormSettings {
  discordWebhookUrl: string;
  userAccessTypes: UserAccessType[]; // Who can access: 'unverified', 'verified'
  cooldownHours: number;
  maxApplications: number;
  accessCodes: string[]; // Password codes for protected forms
  isPasswordProtected: boolean;
  formType: FormType; // 'whitelist' or 'other'
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  isActive: boolean;
  questions: FormQuestion[];
  pages: FormPage[];
  settings: FormSettings;
}

// Default settings for new forms
export const defaultFormSettings: FormSettings = {
  discordWebhookUrl: '',
  userAccessTypes: ['verified'], // Default to verified users
  cooldownHours: 0,
  maxApplications: 0,
  accessCodes: [],
  isPasswordProtected: false,
  formType: 'other', // Default to other forms
};
