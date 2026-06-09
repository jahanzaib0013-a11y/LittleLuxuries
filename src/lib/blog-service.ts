import { supabase, Database } from "./supabase";

export type Blog = Database["public"]["Tables"]["blogs"]["Row"];
export type BlogInsert = Database["public"]["Tables"]["blogs"]["Insert"];
export type BlogUpdate = Database["public"]["Tables"]["blogs"]["Update"];

/** URL-safe slug from a title: lowercase, hyphenated, alnum only. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Resolve a pasted video URL into something embeddable. */
export function videoEmbed(url?: string | null): { kind: "iframe" | "file" | "none"; src: string } {
  const u = (url || "").trim();
  if (!u) return { kind: "none", src: "" };
  // YouTube (watch, youtu.be, shorts, embed)
  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  // Vimeo
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  // Direct video file
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(u)) return { kind: "file", src: u };
  // Fallback: assume it's already an embeddable URL
  if (/^https?:\/\//i.test(u)) return { kind: "iframe", src: u };
  return { kind: "none", src: "" };
}

// Retry a write without `video_url` if that column doesn't exist yet (migration
// 012 not run), so blog saving never breaks pre-migration.
function isMissingVideoColumn(message?: string) {
  return !!message && /video_url/i.test(message);
}

export const blogService = {
  /** All posts (admin). Pass "published" to limit. Newest first. */
  async getBlogs(status?: string): Promise<Blog[]> {
    let query = supabase.from("blogs").select("*");
    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching blogs:", error);
      return [];
    }
    return data || [];
  },

  async getBlog(id: string): Promise<Blog | null> {
    const { data, error } = await supabase.from("blogs").select("*").eq("id", id).maybeSingle();
    if (error) {
      console.error("Error fetching blog:", error);
      return null;
    }
    return data;
  },

  /** Public single-post lookup — only returns published posts. */
  async getBlogBySlug(slug: string): Promise<Blog | null> {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) {
      console.error("Error fetching blog by slug:", error);
      return null;
    }
    return data;
  },

  async createBlog(blog: BlogInsert): Promise<Blog | null> {
    let { data, error } = await supabase.from("blogs").insert(blog).select().single();
    if (error && isMissingVideoColumn(error.message)) {
      const { video_url: _omit, ...rest } = blog as BlogInsert & { video_url?: string | null };
      ({ data, error } = await supabase.from("blogs").insert(rest).select().single());
    }
    if (error) {
      console.error("Error creating blog:", error);
      return null;
    }
    return data;
  },

  async updateBlog(id: string, updates: BlogUpdate): Promise<Blog | null> {
    let { data, error } = await supabase
      .from("blogs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error && isMissingVideoColumn(error.message)) {
      const { video_url: _omit, ...rest } = updates as BlogUpdate & { video_url?: string | null };
      ({ data, error } = await supabase.from("blogs").update(rest).eq("id", id).select().single());
    }
    if (error) {
      console.error("Error updating blog:", error);
      return null;
    }
    return data;
  },

  async deleteBlog(id: string): Promise<boolean> {
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) {
      console.error("Error deleting blog:", error);
      return false;
    }
    return true;
  },
};
