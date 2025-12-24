export type QuestionType = 
  | 'short_text'
  | 'paragraph'
  | 'number'
  | 'radio'
  | 'checkbox'
  | 'discord_id';

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For radio and checkbox types
}

export interface FormSettings {
  discordWebhookUrl: string;
  roleRestrictions: string[];
  cooldownHours: number;
  maxApplications: number;
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  isActive: boolean;
  questions: FormQuestion[];
  settings: FormSettings;
}
