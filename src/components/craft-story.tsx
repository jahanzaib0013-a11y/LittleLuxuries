import defaultCraftImage from "@/assets/hero-baby.webp";
import { Reveal } from "@/components/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Parallax } from "@/components/motion/parallax";
import { defaultCraftStory, type CraftStoryContent } from "@/lib/content-data";

/**
 * Editorial brand-story showcase — a framed, gently parallaxing image beside
 * the craft chapters, each revealing on scroll. Content is editable from the
 * admin Content tab. Robust and SSR-safe (no scroll-target refs).
 */
export function CraftStory({ story }: { story?: CraftStoryContent }) {
  const data = story ?? defaultCraftStory;
  if (data.isActive === false) return null;

  const image = data.imageUrl || defaultCraftImage;

  return (
    <Reveal>
      <section className="overflow-hidden bg-background py-24 sm:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
          <Parallax className="relative hidden lg:block" factor={-1}>
            <div className="lux-img-ring relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-(--shadow-soft)">
              <img
                src={image}
                alt="Little Luxuries craftsmanship"
                className="h-full w-full object-cover"
              />
            </div>
          </Parallax>

          <div>
            <span className="label-eyebrow">{data.eyebrow}</span>
            <RevealText
              as="h2"
              text={data.headline}
              emphasisClassName="italic text-primary"
              className="display-serif mt-4 text-3xl text-foreground sm:text-4xl md:text-5xl"
            />
            <div className="mt-10 space-y-8">
              {data.chapters.map((c, i) => (
                <Reveal key={i} index={i}>
                  <div className="flex gap-5 border-t border-border/60 pt-6">
                    <span className="font-serif text-3xl italic text-gold/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-serif text-xl text-foreground">{c.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
