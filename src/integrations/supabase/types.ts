export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          community_id: string | null
          created_at: string
          created_by: string
          id: string
          title: string
        }
        Insert: {
          body: string
          community_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          title: string
        }
        Update: {
          body?: string
          community_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "merch_products"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          privacy: Database["public"]["Enums"]["community_privacy"]
          slug: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          privacy?: Database["public"]["Enums"]["community_privacy"]
          slug: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          privacy?: Database["public"]["Enums"]["community_privacy"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_invites: {
        Row: {
          community_id: string
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_invites_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_requests: {
        Row: {
          community_id: string
          created_at: string
          id: string
          message: string | null
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_join_requests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          role: Database["public"]["Enums"]["community_role"]
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["community_role"]
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["community_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          community_id: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["conversation_kind"]
          title: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["conversation_kind"]
          title?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["conversation_kind"]
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      merch_products: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_kes: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_kes: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_kes?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          parent_message_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          parent_message_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          parent_message_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          related_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          related_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          related_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          faith_reflection: string | null
          health_note: string | null
          id: string
          ingredients: string[] | null
          kind: Database["public"]["Enums"]["post_kind"]
          read_time: string | null
          serving_suggestions: string | null
          steps: string[] | null
          steps_label: string | null
          takeaway: string | null
          title: string
          updated_at: string
          verse: string | null
        }
        Insert: {
          author_id: string
          body?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          faith_reflection?: string | null
          health_note?: string | null
          id?: string
          ingredients?: string[] | null
          kind: Database["public"]["Enums"]["post_kind"]
          read_time?: string | null
          serving_suggestions?: string | null
          steps?: string[] | null
          steps_label?: string | null
          takeaway?: string | null
          title: string
          updated_at?: string
          verse?: string | null
        }
        Update: {
          author_id?: string
          body?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          faith_reflection?: string | null
          health_note?: string | null
          id?: string
          ingredients?: string[] | null
          kind?: Database["public"]["Enums"]["post_kind"]
          read_time?: string | null
          serving_suggestions?: string | null
          steps?: string[] | null
          steps_label?: string | null
          takeaway?: string | null
          title?: string
          updated_at?: string
          verse?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          favorite_verse: string | null
          full_name: string | null
          id: string
          updated_at: string
          username: string
          username_changed_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_verse?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          username: string
          username_changed_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_verse?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string
          username_changed_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_community_invite: {
        Args: { _invite_id: string }
        Returns: undefined
      }
      approve_join_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      can_access_conversation: {
        Args: { _conv_id: string; _user_id: string }
        Returns: boolean
      }
      generate_unique_username: { Args: { base: string }; Returns: string }
      get_or_create_dm: { Args: { _other_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conv_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cofounder" | "member"
      community_privacy: "public" | "private"
      community_role: "owner" | "member"
      conversation_kind: "direct" | "group"
      notification_type:
        | "post_like"
        | "post_comment"
        | "follow"
        | "new_message"
        | "announcement"
        | "new_post_from_following"
      post_kind: "article" | "recipe" | "devotion"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "cofounder", "member"],
      community_privacy: ["public", "private"],
      community_role: ["owner", "member"],
      conversation_kind: ["direct", "group"],
      notification_type: [
        "post_like",
        "post_comment",
        "follow",
        "new_message",
        "announcement",
        "new_post_from_following",
      ],
      post_kind: ["article", "recipe", "devotion"],
    },
  },
} as const
