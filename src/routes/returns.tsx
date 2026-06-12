import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { useStoreSettingsContext } from "@/context/StoreSettingsContext";
import { CalendarClock, RefreshCw, PackageCheck, Truck, ShieldAlert, Mail } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & Exchanges — Little Luxuries Pakistan" },
      {
        name: "description",
        content:
          "Little Luxuries' 14-day exchange policy for baby garments in Pakistan. Easy size swaps and store credit, with simple steps to start an exchange.",
      },
      {
        name: "keywords",
        content:
          "return policy, exchange policy, baby clothes returns Pakistan, Little Luxuries returns, baby garment exchange Pakistan",
      },
      { property: "og:title", content: "Returns & Exchanges — Little Luxuries Pakistan" },
      {
        property: "og:description",
        content:
          "Our 14-day exchange policy: easy size swaps and store credit for your little one's wardrobe.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://littleluxuries.pk/returns" },
    ],
    links: [{ rel: "canonical", href: "https://littleluxuries.pk/returns" }],
  }),
  component: Returns,
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CalendarClock;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
          <Icon className="size-5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl text-foreground">{title}</h2>
          <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Returns() {
  const { settings } = useStoreSettingsContext();
  const email = settings?.business_email?.trim();
  const phone = settings?.contact_phone?.trim();

  return (
    <Layout>
      {/* HERO */}
      <section className="bg-secondary/30 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="label-eyebrow">Returns &amp; Exchanges</span>
          <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl md:text-6xl">
            Easy, gentle exchanges
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            We want you and your little one to love every piece. If the size or fit isn&apos;t quite
            right, we&apos;re happy to help you exchange it within 14 days.
          </p>
        </div>
      </section>

      {/* BODY */}
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="space-y-10">
          <Section icon={CalendarClock} title="Our 14-day window">
            <p>
              You have <strong className="font-medium text-foreground">14 days</strong> from the day
              your order is delivered to request an exchange or store credit. After 14 days, we&apos;re
              unable to accept returns or exchanges.
            </p>
          </Section>

          <Section icon={RefreshCw} title="Exchange or store credit">
            <p>
              Because each piece is prepared with care in small batches, we offer{" "}
              <strong className="font-medium text-foreground">exchanges and store credit</strong>{" "}
              rather than cash refunds. You can swap your item for a different size or style, or take
              store credit to use whenever you like.
            </p>
            <p>
              Cash refunds are issued <em>only</em> when an item arrives faulty, damaged, or not as
              ordered — see <span className="text-foreground">&ldquo;If your order arrives damaged or
              incorrect&rdquo;</span> below.
            </p>
          </Section>

          <Section icon={PackageCheck} title="Condition of returned items">
            <p>To keep things hygienic and safe for every family, returned items must be:</p>
            <ul className="ml-1 space-y-2">
              {[
                "Unworn and unwashed",
                "With all original tags and hygiene stickers still attached",
                "In their original packaging",
                "Free of marks, stains, scent, or pet hair",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>We may decline a return that doesn&apos;t meet these conditions.</p>
          </Section>

          <Section icon={ShieldAlert} title="Items we can't accept">
            <p>For hygiene and safety, the following are final sale and cannot be returned or exchanged:</p>
            <ul className="ml-1 space-y-2">
              {[
                "Bodysuits, innerwear, socks, bibs and similar items once worn, washed, or with the hygiene seal or tags removed",
                "Customized, personalized, or made-to-order pieces",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Truck} title="Return shipping">
            <p>
              Return and exchange shipping is arranged and paid by the customer. If the item you
              received is wrong, damaged, or defective, we&apos;ll cover the return courier{" "}
              <strong className="font-medium text-foreground">and reship the correct item to you at
              no cost</strong>.
            </p>
          </Section>

          <Section icon={ShieldAlert} title="If your order arrives damaged or incorrect">
            <p>
              We check every order before it leaves us, but if something arrives damaged, defective,
              or different from what you ordered, please contact us within{" "}
              <strong className="font-medium text-foreground">48 hours of delivery</strong> with a
              clear photo. We&apos;ll make it right — a replacement, exchange, or refund — and cover
              all shipping.
            </p>
          </Section>

          <Section icon={RefreshCw} title="How to start an exchange">
            <ol className="ml-1 space-y-3">
              {[
                "Contact us within 14 days with your order number and what you'd like to exchange.",
                "We'll confirm your exchange and share the return address.",
                "Pack the item securely with its tags and original packaging, and send it via your preferred courier.",
                "Once we receive and inspect it, we'll dispatch your exchange or issue your store credit within 3–5 business days.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section icon={Mail} title="Get in touch">
            <p>To start a return or exchange, or if you have any questions, reach our team:</p>
            <ul className="ml-1 space-y-2">
              {email && (
                <li>
                  Email:{" "}
                  <a href={`mailto:${email}`} className="text-primary underline-offset-2 hover:underline">
                    {email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  Phone / WhatsApp:{" "}
                  <a
                    href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {phone}
                  </a>
                </li>
              )}
              <li>
                Or visit our{" "}
                <Link to="/contact" className="text-primary underline-offset-2 hover:underline">
                  Contact page
                </Link>
                .
              </li>
            </ul>
            <p className="pt-2 text-sm">Last updated: June 2026.</p>
          </Section>
        </div>
      </div>
    </Layout>
  );
}
