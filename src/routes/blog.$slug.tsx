import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Layout } from "@/components/site-layout";
import { Parallax } from "@/components/motion/parallax";
import { blogService, videoEmbed, type Blog } from "@/lib/blog-service";
import { usePublishedBlogs } from "@/lib/blog-queries";
import { isUsableImageUrl, imgErrorFallback } from "@/lib/utils";
import heroFallback from "@/assets/hero-baby.jpg";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingTime(body: string) {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: allPosts = [] } = usePublishedBlogs();

  useEffect(() => {
    let active = true;
    setLoading(true);
    blogService.getBlogBySlug(slug).then((p) => {
      if (!active) return;
      setPost(p);
      setLoading(false);
      if (p?.title) document.title = `${p.title} — Little Luxuries`;
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const paragraphs = (post?.body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 3);
  const media = videoEmbed(post?.video_url);

  return (
    <Layout>
      {loading ? (
        <p className="py-32 text-center text-sm text-muted-foreground">Loading…</p>
      ) : !post ? (
        <div className="mx-auto max-w-xl px-6 py-28 text-center">
          <div className="divider-ornament mx-auto w-40">
            <span className="diamond" />
          </div>
          <h1 className="mt-6 font-serif text-3xl italic text-foreground">Post not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This story may have moved or isn't published yet.
          </p>
          <Link
            to="/blog"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:-translate-y-0.5"
          >
            Browse the journal
          </Link>
        </div>
      ) : (
        <article>
          {/* Cinematic header */}
          <header
            className="lux-grain relative overflow-hidden"
            style={{ background: "var(--gradient-hero)" }}
          >
            <div className="relative z-[1] mx-auto max-w-3xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-20">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="size-3.5" /> The Journal
              </Link>
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {fmtDate(post.published_at ?? post.created_at)} · {readingTime(post.body)} min read
              </p>
              <h1 className="display-serif mx-auto mt-4 max-w-2xl text-4xl leading-[1.08] text-foreground sm:text-5xl md:text-6xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mx-auto mt-5 max-w-xl text-lg italic leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
            </div>
          </header>

          {/* Video (if provided) — otherwise the cover image */}
          {media.kind !== "none" ? (
            <div className="mx-auto -mt-2 max-w-4xl px-4 sm:px-6">
              <div className="lux-img-ring relative aspect-video overflow-hidden rounded-[2rem] bg-black shadow-(--shadow-soft)">
                {media.kind === "file" ? (
                  <video
                    src={media.src}
                    controls
                    playsInline
                    poster={
                      isUsableImageUrl(post.cover_image_url) ? post.cover_image_url! : undefined
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <iframe
                    src={media.src}
                    title={post.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                )}
              </div>
            </div>
          ) : (
            isUsableImageUrl(post.cover_image_url) && (
              <div className="mx-auto -mt-2 max-w-4xl px-4 sm:px-6">
                <Parallax className="relative" factor={-0.5}>
                  <div className="lux-img-ring relative aspect-[16/9] overflow-hidden rounded-[2rem] bg-muted shadow-(--shadow-soft)">
                    <img
                      src={post.cover_image_url!}
                      alt={post.title}
                      onError={imgErrorFallback(heroFallback)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Parallax>
              </div>
            )
          )}

          {/* Body — editorial prose with drop cap */}
          <div className="mx-auto max-w-2xl px-5 py-14 sm:px-6 sm:py-20">
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "text-[1.075rem] leading-[1.9] text-foreground/90 first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:font-medium first-letter:leading-[0.8] first-letter:text-primary"
                    : "mt-6 text-[1.075rem] leading-[1.9] text-foreground/90"
                }
              >
                {para}
              </p>
            ))}

            <div className="divider-ornament mx-auto mt-14 w-48">
              <span className="diamond" />
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary hover:underline"
              >
                <ArrowLeft className="size-4" /> Back to the journal
              </Link>
            </div>
          </div>

          {/* More stories */}
          {related.length > 0 && (
            <section className="border-t border-border/50 bg-secondary/30 py-16 sm:py-20">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <h2 className="mb-10 text-center font-serif text-2xl italic text-foreground sm:text-3xl">
                  More from the journal
                </h2>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((rp) => (
                    <Link
                      key={rp.id}
                      to="/blog/$slug"
                      params={{ slug: rp.slug }}
                      className="lux-zoom group block"
                    >
                      <div className="lux-img-ring relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted shadow-(--shadow-card)">
                        <img
                          src={
                            isUsableImageUrl(rp.cover_image_url)
                              ? rp.cover_image_url!
                              : heroFallback
                          }
                          alt={rp.title}
                          loading="lazy"
                          onError={imgErrorFallback(heroFallback)}
                          className="h-full w-full object-cover transition-transform duration-700 md:group-hover:scale-105"
                        />
                      </div>
                      <h3 className="mt-4 font-serif text-lg leading-snug text-foreground transition-colors group-hover:text-primary">
                        {rp.title}
                      </h3>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        Read{" "}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </article>
      )}
    </Layout>
  );
}
