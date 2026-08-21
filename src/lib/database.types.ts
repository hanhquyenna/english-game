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
          cost: number
          id: string
          image_url: string
          label: string
          slot: string | null
          unlock_rule: string
        }
        Insert: {
          category: Database["public"]["Enums"]["avatar_category"]
          cost?: number
          id?: string
          image_url: string
          label: string
          slot?: string | null
          unlock_rule: string
        }
        Update: {
          category?: Database["public"]["Enums"]["avatar_category"]
          cost?: number
          id?: string
          image_url?: string
          label?: string
          slot?: string | null
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
          school: string
          teacher_id: string
        }
        Insert: {
          cefr_level?: string
          created_at?: string
          id?: string
          name: string
          school?: string
          teacher_id: string
        }
        Update: {
          cefr_level?: string
          created_at?: string
          id?: string
          name?: string
          school?: string
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
          skill: Database["public"]["Enums"]["exercise_skill"] | null
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
          skill?: Database["public"]["Enums"]["exercise_skill"] | null
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
          skill?: Database["public"]["Enums"]["exercise_skill"] | null
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
          approved_at: string | null
          audio_url: string | null
          created_at: string
          id: string
          star_rating: number | null
          status: string
          student_id: string
          teacher_comment: string | null
          teacher_comment_audio_url: string | null
          text: string
          topic_id: string | null
          type: string
          unit_id: string | null
        }
        Insert: {
          approved_at?: string | null
          audio_url?: string | null
          created_at?: string
          id?: string
          star_rating?: number | null
          status?: string
          student_id: string
          teacher_comment?: string | null
          teacher_comment_audio_url?: string | null
          text: string
          topic_id?: string | null
          type?: string
          unit_id?: string | null
        }
        Update: {
          approved_at?: string | null
          audio_url?: string | null
          created_at?: string
          id?: string
          star_rating?: number | null
          status?: string
          student_id?: string
          teacher_comment?: string | null
          teacher_comment_audio_url?: string | null
          text?: string
          topic_id?: string | null
          type?: string
          unit_id?: string | null
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
      messages: {
        Row: {
          body: string
          class_id: string
          created_at: string
          id: string
          sender_id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          body: string
          class_id: string
          created_at?: string
          id?: string
          sender_id: string
          student_id: string
          teacher_id: string
        }
        Update: {
          body?: string
          class_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      class_post_comments: {
        Row: {
          author_id: string
          body: string
          class_post_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          class_post_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          class_post_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      material_folders: {
        Row: {
          class_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          cefr_level: string
          class_id: string
          created_at: string
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          title: string
          topic_id: string | null
        }
        Insert: {
          cefr_level?: string
          class_id: string
          created_at?: string
          file_type?: string
          file_url: string
          folder_id?: string | null
          id?: string
          title: string
          topic_id?: string | null
        }
        Update: {
          cefr_level?: string
          class_id?: string
          created_at?: string
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          title?: string
          topic_id?: string | null
        }
        Relationships: []
      }
      lesson_plans: {
        Row: {
          activities: string
          created_at: string
          homework: string
          id: string
          materials: string
          objectives: string
          teacher_id: string
          title: string
          topic_id: string | null
        }
        Insert: {
          activities: string
          created_at?: string
          homework: string
          id?: string
          materials: string
          objectives: string
          teacher_id: string
          title: string
          topic_id?: string | null
        }
        Update: {
          activities?: string
          created_at?: string
          homework?: string
          id?: string
          materials?: string
          objectives?: string
          teacher_id?: string
          title?: string
          topic_id?: string | null
        }
        Relationships: []
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
          gems: number
          last_weekly_bonus_claimed_at: string | null
          last_vault_review_bonus_at: string | null
          peep_overrides: Json
          student_id: string
          unlocked_accessory_ids: Json
        }
        Insert: {
          base_avatar_seed: string
          current_rank_frame_id?: string | null
          equipped_accessory_ids?: Json
          gems?: number
          last_weekly_bonus_claimed_at?: string | null
          last_vault_review_bonus_at?: string | null
          peep_overrides?: Json
          student_id: string
          unlocked_accessory_ids?: Json
        }
        Update: {
          base_avatar_seed?: string
          current_rank_frame_id?: string | null
          equipped_accessory_ids?: Json
          gems?: number
          last_weekly_bonus_claimed_at?: string | null
          last_vault_review_bonus_at?: string | null
          peep_overrides?: Json
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
      speaking_attempts: {
        Row: {
          attempt_number: number
          audio_url: string
          created_at: string
          id: string
          lesson_id: string | null
          model_audio_url: string | null
          overall_score: number | null
          student_id: string
        }
        Insert: {
          attempt_number?: number
          audio_url: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          model_audio_url?: string | null
          overall_score?: number | null
          student_id: string
        }
        Update: {
          attempt_number?: number
          audio_url?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          model_audio_url?: string | null
          overall_score?: number | null
          student_id?: string
        }
        Relationships: []
      }
      xp_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          ref_id: string | null
          source: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ref_id?: string | null
          source: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ref_id?: string | null
          source?: string
          student_id?: string
        }
        Relationships: []
      }
      vocab_review_log: {
        Row: {
          created_at: string
          id: string
          next_review_at: string
          result: string
          student_id: string
          vocab_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_review_at: string
          result: string
          student_id: string
          vocab_id: string
        }
        Update: {
          created_at?: string
          id?: string
          next_review_at?: string
          result?: string
          student_id?: string
          vocab_id?: string
        }
        Relationships: []
      }
      cefr_thresholds: {
        Row: {
          band: string
          xp_required: number
        }
        Insert: {
          band: string
          xp_required: number
        }
        Update: {
          band?: string
          xp_required?: number
        }
        Relationships: []
      }
      avatar_items: {
        Row: {
          asset_url: string
          category: string
          id: string
          price_gems: number
          title: string
          z_index: number
        }
        Insert: {
          asset_url: string
          category: string
          id?: string
          price_gems?: number
          title?: string
          z_index?: number
        }
        Update: {
          asset_url?: string
          category?: string
          id?: string
          price_gems?: number
          title?: string
          z_index?: number
        }
        Relationships: []
      }
      student_avatar_ownership: {
        Row: {
          avatar_item_id: string
          purchased_at: string
          student_id: string
        }
        Insert: {
          avatar_item_id: string
          purchased_at?: string
          student_id: string
        }
        Update: {
          avatar_item_id?: string
          purchased_at?: string
          student_id?: string
        }
        Relationships: []
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
          subtitle: string | null
          title: string
        }
        Insert: {
          assigned_at?: string | null
          cefr_level?: string
          class_id: string
          created_at?: string
          id?: string
          order: number
          subtitle?: string | null
          title: string
        }
        Update: {
          assigned_at?: string | null
          cefr_level?: string
          class_id?: string
          created_at?: string
          id?: string
          order?: number
          subtitle?: string | null
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
          image_url: string | null
          meaning: string
          term: string
          topic_id: string
        }
        Insert: {
          cefr_level?: string
          created_at?: string
          example?: string | null
          id?: string
          image_url?: string | null
          meaning: string
          term: string
          topic_id: string
        }
        Update: {
          cefr_level?: string
          created_at?: string
          example?: string | null
          id?: string
          image_url?: string | null
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
      submissions_v2: {
        Row: {
          content: string | null
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          media_mime_type: string | null
          media_url: string | null
          score: number | null
          source_ref_id: string | null
          source_type: string
          star_rating: number | null
          status: string
          student_id: string
          teacher_comment: string | null
          teacher_comment_media_url: string | null
          teacher_comment_type: string | null
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          score?: number | null
          source_ref_id?: string | null
          source_type: string
          star_rating?: number | null
          status?: string
          student_id: string
          teacher_comment?: string | null
          teacher_comment_media_url?: string | null
          teacher_comment_type?: string | null
          type: string
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          score?: number | null
          source_ref_id?: string | null
          source_type?: string
          star_rating?: number | null
          status?: string
          student_id?: string
          teacher_comment?: string | null
          teacher_comment_media_url?: string | null
          teacher_comment_type?: string | null
          type?: string
        }
        Relationships: []
      }
      assignment_configs: {
        Row: {
          allowed_types: Json
          id: string
          lesson_content_id: string | null
          max_audio_duration_seconds: number | null
          max_file_size_mb: number | null
          max_video_duration_seconds: number | null
        }
        Insert: {
          allowed_types?: Json
          id?: string
          lesson_content_id?: string | null
          max_audio_duration_seconds?: number | null
          max_file_size_mb?: number | null
          max_video_duration_seconds?: number | null
        }
        Update: {
          allowed_types?: Json
          id?: string
          lesson_content_id?: string | null
          max_audio_duration_seconds?: number | null
          max_file_size_mb?: number | null
          max_video_duration_seconds?: number | null
        }
        Relationships: []
      }
      arena_topics: {
        Row: {
          created_at: string
          id: string
          level_range: string
          title: string
          unlock_threshold: number
        }
        Insert: {
          created_at?: string
          id?: string
          level_range?: string
          title: string
          unlock_threshold?: number
        }
        Update: {
          created_at?: string
          id?: string
          level_range?: string
          title?: string
          unlock_threshold?: number
        }
        Relationships: []
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
      reset_demo_data: { Args: never; Returns: undefined }
    }
    Enums: {
      avatar_category: "BASE" | "ACCESSORY" | "RANK_FRAME"
      exercise_type: "MCQ" | "FILL_BLANK" | "MATCHING" | "VOCAB_CARD"
      exercise_skill: "VOCAB" | "GRAMMAR" | "READING" | "LISTENING" | "WRITING" | "SPEAKING"
      topic_source: "school" | "library"
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
