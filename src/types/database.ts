export type PostStatus = "pending" | "published" | "rejected";
export type TargetType = "post" | "comment";
export type ReportStatus = "pending" | "resolved";

export type Post = {
  id: string;
  content: string;
  category: string;
  status: PostStatus;
  is_pinned: boolean;
  is_anonymous: boolean;
  author_name: string | null;
  anon_token: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type Comment = {
  id: string;
  post_id: string;
  content: string;
  anon_token: string | null;
  created_at: string;
};

export type Reaction = {
  id: string;
  target_type: TargetType;
  target_id: string;
  reaction: string;
  anon_token: string;
  created_at: string;
};

export type Report = {
  id: string;
  target_type: TargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "created_at" | "updated_at" | "published_at"> & {
          published_at?: string | null;
        };
        Update: Partial<Omit<Post, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, "id" | "created_at">;
        Update: Partial<Omit<Comment, "id" | "created_at">>;
        Relationships: [];
      };
      reactions: {
        Row: Reaction;
        Insert: Omit<Reaction, "id" | "created_at">;
        Update: Partial<Omit<Reaction, "id" | "created_at">>;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at">;
        Update: Partial<Omit<Report, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
