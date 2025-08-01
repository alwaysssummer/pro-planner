// Supabase 데이터베이스 타입 정의

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          area: 'vocabulary' | 'phrase' | 'grammar' | 'logic';
          status: 'active' | 'completed' | 'pending';
          google_sheet_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          area: 'vocabulary' | 'phrase' | 'grammar' | 'logic';
          status?: 'active' | 'completed' | 'pending';
          google_sheet_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          area?: 'vocabulary' | 'phrase' | 'grammar' | 'logic';
          status?: 'active' | 'completed' | 'pending';
          google_sheet_url?: string | null;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          name: string;
          level: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          level?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          level?: string;
          created_at?: string;
        };
      };
      vocabulary_items: {
        Row: {
          id: string;
          task_id: string;
          unit: string | null;
          english: string;
          meaning: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          unit?: string | null;
          english: string;
          meaning: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          unit?: string | null;
          english?: string;
          meaning?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      task_assignments: {
        Row: {
          id: string;
          task_id: string;
          student_id: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          student_id: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          student_id?: string;
          assigned_at?: string;
        };
      };
      vocabulary_progress: {
        Row: {
          id: string;
          student_id: string;
          task_id: string;
          vocabulary_item_id: string;
          learned_at: string;
          score: number | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          task_id: string;
          vocabulary_item_id: string;
          learned_at?: string;
          score?: number | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          task_id?: string;
          vocabulary_item_id?: string;
          learned_at?: string;
          score?: number | null;
        };
      };
    };
  };
} 