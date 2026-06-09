import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { Layout } from "@/components/site-layout";
import { Reveal } from "@/components/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { usePublishedBlogs } from "@/lib/blog-queries";
import type { Blog } from "@/lib/blog-service";
import { isUsableImageUrl, imgErrorFallback } from "@/lib/utils";
import heroFallback from "@/assets/hero-baby.jpg";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Journal — Little Luxuries" },
      {
        name: "description",
        content: "Gentle parenting notes, fabric stories, and care guides from Little Luxuries.",
      },
    ],
  }),
  component: BlogListPage,
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

function coverFor(post: Blog) {
  return isUsableImageUrl(post.cover_image_url) ? post.cover_image_url! : heroFallback;
}

function BlogListPage() {
  const { data: posts = [], isLoading } = usePublishedBlogs();
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <Layout>
      {/* Editorial header */}
      <section
        className="lux-grain relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative z-[1] mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="label-eyebrow justify-center">The Little Luxuries Journal</span>
          <RevealText
            as="h1"
            text={"Notes, stories &\ngentle inspiration"}
            emphasisClassName="italic text-primary"
            className="display-serif mt-5 text-4xl text-foreground sm:text-5xl md:text-6xl"
          />
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Thoughts on craft, fabric, and the small rituals of caring for your little one — written
            with the same care we sew into every piece.
          </p>
          <div className="divider-ornament mx-auto mt-8 w-40">
            <span className="diamond" />
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {isLoading ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="font-serif text-2xl italic text-foreground">Stories coming soon</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              We're writing our first journal entries — check back shortly.
            </p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <Reveal>
                <Link
                  to="/blog/$slug"
                  params={{ slug: featured.slug }}
                  className="group mt-4 grid gap-8 lg:mt-0 lg:grid-cols-2 lg:gap-12"
                >
                  <div className="lux-img-ring relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-muted shadow-(--shadow-soft)">
                    <img
                      src={coverFor(featured)}
                      alt={featured.title}
                      onError={imgErrorFallback(heroFallback)}
                      className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out md:group-hover:scale-105"
                    />
                    <span className="absolute left-5 top-5 rounded-full bg-background/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
                      Latest
                    </span>
                    {featured.video_url && (
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-14 place-items-center rounded-full bg-background/80 text-primary shadow-(--shadow-card) backdrop-blur-sm transition-transform group-hover:scale-110">
                          <Play className="size-5 translate-x-0.5 fill-primary" />
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {fmtDate(featured.published_at ?? featured.created_at)} ·{" "}
                      {readingTime(featured.body)} min read
                    </p>
                    <h2 className="display-serif mt-3 text-3xl leading-tight text-foreground transition-colors group-hover:text-primary sm:text-4xl">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
                        {featured.excerpt}
                      </p>
                    )}
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                      Read the story
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            )}

            {rest.length > 0 && (
              <>
                <div className="divider-ornament mx-auto my-16 w-full max-w-xs">
                  <span className="diamond" />
                </div>
                <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, i) => (
                    <Reveal key={post.id} index={i}>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: post.slug }}
                        className="lux-zoom group flex h-full flex-col"
                      >
                        <div className="lux-img-ring relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted shadow-(--shadow-card)">
                          <img
                            src={coverFor(post)}
                            alt={post.title}
                            loading="lazy"
                            onError={imgErrorFallback(heroFallback)}
                            className="h-full w-full object-cover transition-transform duration-700 md:group-hover:scale-105"
                          />
                          {post.video_url && (
                            <span className="absolute inset-0 grid place-items-center">
                              <span className="grid size-11 place-items-center rounded-full bg-background/80 text-primary shadow-(--shadow-card) backdrop-blur-sm transition-transform group-hover:scale-110">
                                <Play className="size-4 translate-x-0.5 fill-primary" />
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {fmtDate(post.published_at ?? post.created_at)} · {readingTime(post.body)}{" "}
                          min
                        </p>
                        <h3 className="mt-2 font-serif text-xl leading-snug text-foreground transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {post.excerpt}
                          </p>
                        )}
                        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                          Read article
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}
