/**
 * Learning Hub Core Data Types & Models
 */

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'editor' | 'user';
  approved: boolean;
  blocked: boolean;
  current_subject?: string;
  device_info?: string;
  last_login?: string;
  last_activity?: string;
  created_at?: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  description?: string;
  cover?: string;
  sort_order: number;
  is_active: boolean;
  question_count?: number;
  created_at?: string;
}

export interface QuestionOptionMap {
  [key: string]: string;
}

export interface QuestionImage {
  id?: string;
  public_id?: string;
  src?: string;
  url?: string;
  secure_url?: string;
  source?: 'cloudinary' | 'local';
}

export interface Question {
  id: number;
  subject_code: string;
  num: number;
  question: string;
  options?: QuestionOptionMap;
  answer: string;
  answer_text?: string;
  images?: QuestionImage[];
  is_active: boolean;
  has_image: boolean;
  error_risk?: 'low' | 'medium' | 'high';
  error_risk_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EditRequest {
  id: number;
  question_id?: number;
  question_num?: number;
  subject_code: string;
  user_id: string;
  user_email?: string;
  old_data?: Partial<Question>;
  new_data?: Partial<Question>;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}
