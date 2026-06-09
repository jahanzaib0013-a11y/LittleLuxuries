import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { BlogEditorModal } from "@/components/blog-editor-modal";
import { useAdminBlogs, useInvalidateBlogs } from "@/lib/blog-queries";
import { blogService, type Blog } from "@/lib/blog-service";
import { isUsableImageUrl, imgErrorFallback, cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export const Route = createFileRoute("/blogs")({
  head: () => ({ meta: [{ title: "Blogs — Little Luxuries Admin" }] }),
  component: BlogsPage,
});

function BlogsPage() {
  const { data: blogs = [], isLoading } = useAdminBlogs();
  const invalidate = useInvalidateBlogs();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (b: Blog) => {
    setEditing(b);
    setEditorOpen(true);
  };
  const remove = async (b: Blog) => {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    const ok = await blogService.deleteBlog(b.id);
    if (ok) {
      toast.success("Post deleted");
      invalidate();
    } else {
      toast.error("Failed to delete post");
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Blogs</h1>
            <p className="text-sm text-muted-foreground">Write and publish journal posts.</p>
          </div>
          <Button onClick={openNew} className="gap-2 rounded-full bg-primary">
            <Plus className="h-4 w-4" /> New post
          </Button>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-primary-soft/60">
              <BookOpen className="size-6 text-primary/50" />
            </div>
            <h2 className="mt-4 font-serif text-xl text-foreground">No posts yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create your first journal entry.</p>
            <Button onClick={openNew} className="mt-5 gap-2 rounded-full bg-primary">
              <Plus className="h-4 w-4" /> New post
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {blogs.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-3 shadow-(--shadow-card)"
              >
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={isUsableImageUrl(b.cover_image_url) ? b.cover_image_url! : logo}
                    alt={b.title}
                    onError={imgErrorFallback(logo)}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        b.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {b.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(b.published_at ?? b.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-1 truncate font-serif text-lg text-foreground">{b.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">/blog/{b.slug}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEdit(b)}
                    className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(b)}
                    className="grid size-9 place-items-center rounded-full text-destructive hover:bg-destructive/10"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BlogEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        blog={editing}
        onSaved={invalidate}
      />
    </AdminLayout>
  );
}
