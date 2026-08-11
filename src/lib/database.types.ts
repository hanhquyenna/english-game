export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      avatars: {
        Row: {
          category: Database["public"]["Enums"]["avatar_category"]
          id: string
          image_url: string
          label: string
          unlock_rule: string
        }
        Insert: {
          category: Database["public"]["Enums"]["avatar_category"]
          id?: string
          image_url: string
          label: string
          unlock_rule: string
        }
        Update: {
          category?: Database["public"]["Enums"]["avatar_category"]
          id?: string
          image_url?: string
          label?: string
          unlock_rule?: string
        }
        Relationships: []
      }
      class_posts: {
        Row: {
          class_id: string
          created_at: string
          id: string
          image_url: string | null
          teacher_id: string
          text: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          teacher_id: string
          text: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          teacher_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_posts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_posts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          cefr_level: string
          created_at: string
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          cefr_level?: string
          created_at?: string
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          cefr_level?: string
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string
          created_at: string
          exercise_ids: Json
          id: string
          published_at: string | null
          title: string
          topic_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          exercise_ids?: Json
          id?: string
          published_at?: string | null
          title: string
          topic_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          exercise_ids?: Json
          id?: string
          published_at?: string | null
          title?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          attempted_at: string
          correct: boolean
          exercise_id: string
          id: string
          student_id: string
        }
        Insert: {
          attempted_at?: string
          correct: boolean
          exercise_id: string
          id?: string
          student_id: string
        }
        Update: {
          attempted_at?: string
          correct?: boolean
          exercise_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          content: Json
          created_at: string
          created_by_teacher_id: string | null
          grammar_point_id: string | null
          id: string
          topic_id: string
          type: Database["public"]["Enums"]["exercise_type"]
          vocab_item_id: string | null
        }
        Insert: {
          content: Json
          created_at?: string
          created_by_teacher_id?: string | null
          grammar_point_id?: string | null
          id?: string
          topic_id: string
          type: Database["public"]["Enums"]["exercise_type"]
          vocab_item_id?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          created_by_teacher_id?: string | null
          grammar_point_id?: string | null
          id?: string
          topic_id?: string
          type?: Database["public"]["Enums"]["exercise_type"]
          vocab_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_teacher_id_fkey"
            columns: ["created_by_teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_vocab_item_id_fkey"
            columns: ["vocab_item_id"]
            isOneToOne: false
            referencedRelation: "vocab_items"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_mastery: {
        Row: {
          grammar_point_id: string
          last_reviewed_at: string
          mastery_score: number
          student_id: string
        }
        Insert: {
          grammar_point_id: string
          last_reviewed_at?: string
          mastery_score?: number
          student_id: string
        }
        Update: {
          grammar_point_id?: string
          last_reviewed_at?: string
          mastery_score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_mastery_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_mastery_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_points: {
        Row: {
          cefr_level: string
          created_at: string
          explanation: string
          id: string
          name: string
          topic_id: string
        }
        Insert: {
          cefr_level?: string
          created_at?: string
          explanation: string
          id?: string
          name: string
          topic_id: string
        }
        Update: {
          cefr_level?: string
          created_at?: string
          explanation?: string
          id?: string
          name?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_points_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          id: string
          student_id: string
          teacher_comment: string | null
          text: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          teacher_comment?: string | null
          text: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          teacher_comment?: string | null
          text?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos: {
        Row: {
          created_at: string
          id: string
          note: string | null
          student_id: string
          tag: Database["public"]["Enums"]["kudos_tag"]
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          student_id: string
          tag: Database["public"]["Enums"]["kudos_tag"]
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          student_id?: string
          tag?: Database["public"]["Enums"]["kudos_tag"]
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kudos_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      level_scores: {
        Row: {
          cefr_band: string
          composite_score: number
          computed_at: string
          coverage_score: number
          exam_score: number
          grammar_score: number
          hours_score: number
          id: string
          student_id: string
          vocab_score: number
        }
        Insert: {
          cefr_band: string
          composite_score: number
          computed_at?: string
          coverage_score: number
          exam_score: number
          grammar_score: number
          hours_score: number
          id?: string
          student_id: string
          vocab_score: number
        }
        Update: {
          cefr_band?: string
          composite_score?: number
          computed_at?: string
          coverage_score?: number
          exam_score?: number
          grammar_score?: number
          hours_score?: number
          id?: string
          student_id?: string
          vocab_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "level_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_links: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_avatars: {
        Row: {
          base_avatar_seed: string
          current_rank_frame_id: string | null
          equipped_accessory_ids: Json
          student_id: string
          unlocked_accessory_ids: Json
        }
        Insert: {
          base_avatar_seed: string
          current_rank_frame_id?: string | null
          equipped_accessory_ids?: Json
          student_id: string
          unlocked_accessory_ids?: Json
        }
        Update: {
          base_avatar_seed?: string
          current_rank_frame_id?: string | null
          equipped_accessory_ids?: Json
          student_id?: string
          unlocked_accessory_ids?: Json
        }
        Relationships: [
          {
            foreignKeyName: "student_avatars_current_rank_frame_id_fkey"
            columns: ["current_rank_frame_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_avatars_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          id: string
          minutes: number
          started_at: string
          student_id: string
        }
        Insert: {
          id?: string
          minutes?: number
          started_at?: string
          student_id: string
        }
        Update: {
          id?: string
          minutes?: number
          started_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          answers: Json
          exam_id: string
          graded_at: string | null
          id: string
          score: number | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          answers?: Json
          exam_id: string
          graded_at?: string | null
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          answers?: Json
          exam_id?: string
          graded_at?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_progress: {
        Row: {
          percent_complete: number
          student_id: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          percent_complete?: number
          student_id: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          percent_complete?: number
          student_id?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          assigned_at: string | null
          cefr_level: string
          class_id: string
          created_at: string
          id: string
          order: number
          title: string
        }
        Insert: {
          assigned_at?: string | null
          cefr_level?: string
          class_id: string
          created_at?: string
          id?: string
          order: number
          title: string
        }
        Update: {
          assigned_at?: string | null
          cefr_level?: string
          class_id?: string
          created_at?: string
          id?: string
          order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      vocab_items: {
        Row: {
          cefr_level: string
          created_at: string
          example: string | null
          id: string
          meaning: string
          term: string
          topic_id: string
        }
        Insert: {
          cefr_level?: string
          created_at?: string
          example?: string | null
          id?: string
          meaning: string
          term: string
          topic_id: string
        }
        Update: {
          cefr_level?: string
          created_at?: string
          example?: string | null
          id?: string
          meaning?: string
          term?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_mastery: {
        Row: {
          last_reviewed_at: string
          mastery_score: number
          student_id: string
          vocab_item_id: string
        }
        Insert: {
          last_reviewed_at?: string
          mastery_score?: number
          student_id: string
          vocab_item_id: string
        }
        Update: {
          last_reviewed_at?: string
          mastery_score?: number
          student_id?: string
          vocab_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_mastery_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocab_mastery_vocab_item_id_fkey"
            columns: ["vocab_item_id"]
            isOneToOne: false
            referencedRelation: "vocab_items"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          date: string
          id: string
          streak_count: number
          student_id: string
          xp: number
        }
        Insert: {
          date: string
          id?: string
          streak_count?: number
          student_id: string
          xp?: number
        }
        Update: {
          date?: string
          id?: string
          streak_count?: number
          student_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      avatar_category: "BASE" | "ACCESSORY" | "RANK_FRAME"
      exercise_type: "MCQ" | "FILL_BLANK" | "MATCHING" | "VOCAB_CARD"
      kudos_tag: "HARD_WORK" | "TEAMWORK" | "PERSISTENCE" | "ON_TASK" | "CUSTOM"
      notification_type:
        | "NEW_ASSIGNMENT"
        | "EXAM_RESULT"
        | "LEVEL_UP"
        | "STREAK_AT_RISK"
        | "STREAK_BROKEN"
        | "KUDOS_RECEIVED"
        | "CLASS_POST"
      user_role: "TEACHER" | "STUDENT" | "PARENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      avatar_category: ["BASE", "ACCESSORY", "RANK_FRAME"],
      exercise_type: ["MCQ", "FILL_BLANK", "MATCHING", "VOCAB_CARD"],
      kudos_tag: ["HARD_WORK", "TEAMWORK", "PERSISTENCE", "ON_TASK", "CUSTOM"],
      notification_type: [
        "NEW_ASSIGNMENT",
        "EXAM_RESULT",
        "LEVEL_UP",
        "STREAK_AT_RISK",
        "STREAK_BROKEN",
        "KUDOS_RECEIVED",
        "CLASS_POST",
      ],
      user_role: ["TEACHER", "STUDENT", "PARENT"],
    },
  },
} as const
