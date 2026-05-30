export type PostStatus = "pending" | "published" | "rejected";
export type TargetType = "post" | "comment";
export type ReportStatus = "pending" | "resolved";

export interface Post {
  id: string;
  content: string;
  category: string;
  status: PostStatus;
  is_pinned: boolean;
  anon_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  anon_token: string | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  target_type: TargetType;
  target_id: string;
  reaction: string;
  anon_token: string;
  created_at: string;
}

export interface Report {
  id: string;
  target_type: TargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Post, "id" | "created_at" | "updated_at">>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, "id" | "created_at">;
        Update: Partial<Omit<Comment, "id" | "created_at">>;
      };
      reactions: {
        Row: Reaction;
        Insert: Omit<Reaction, "id" | "created_at">;
        Update: Partial<Omit<Reaction, "id" | "created_at">>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at">;
        Update: Partial<Omit<Report, "id" | "created_at">>;
      };
    };
  };
}
