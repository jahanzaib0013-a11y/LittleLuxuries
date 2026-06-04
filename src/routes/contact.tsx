import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { Mail, MapPin, Clock } from "lucide-react";
import { useStoreSettingsContext } from "@/context/StoreSettingsContext";
import { ContactForm } from "@/components/contact-form";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Little Luxuries" },
      {
        name: "description",
        content: "Get in touch with our team for orders, gifting inquiries, or partnerships.",
      },
      { property: "og:title", content: "Contact — Little Luxuries" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
  component: Contact,
});

function Contact() {
  console.log("🌐 Contact page component rendering");
  const { settings, loading, error } = useStoreSettingsContext();

  // Debug logging
  console.log("📋 Contact page - settings:", settings);
  console.log("⏳ Contact page - loading:", loading);
  console.log("❌ Contact page - error:", error);

  // Build dynamic address string
  const buildAddress = () => {
    if (!settings) return "14 Coral Lane, London, United Kingdom";

    const parts = [];
    if (settings.address_line1) parts.push(settings.address_line1);
    if (settings.address_city) parts.push(settings.address_city);
    if (settings.address_country) parts.push(settings.address_country);

    return parts.length > 0 ? parts.join(", ") : "14 Coral Lane, London, United Kingdom";
  };

  const address = buildAddress();

  console.log("📍 Generated address:", address);
  console.log("📧 Business email from settings:", settings?.business_email);

  // Format business hours from start and end times
  const formatBusinessHours = () => {
    if (settings?.business_hours_start && settings?.business_hours_end) {
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      };

      return `${formatTime(settings.business_hours_start)} – ${formatTime(settings.business_hours_end)}`;
    }
    return settings?.business_hours || "Mon–Fri · 9am – 5pm GMT";
  };

  return (
    <Layout>
      <section className="bg-secondary/30 py-12 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="label-eyebrow">We'd love to hear from you</span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl text-foreground md:text-6xl">
            Get in touch
          </h1>
          <p className="mt-5 text-muted-foreground">
            Questions about an order, a gift, or our craftsmanship? Our small, attentive team is
            here to help.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid gap-12 xl:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <Info
              icon={Mail}
              title="Email"
              body={settings?.business_email || "hello@littleluxuries.co"}
              sub="We reply within one business day."
            />
            <Info icon={MapPin} title="Studio" body={address} sub="By appointment only" />
            <Info
              icon={Clock}
              title="Hours"
              body={formatBusinessHours()}
              sub="Closed weekends & holidays"
            />
          </div>

          <ContactForm />
        </div>
      </section>
    </Layout>
  );
}

function Info({
  icon: Icon,
  title,
  body,
  sub,
}: {
  icon: typeof Mail;
  title: string;
  body: string;
  sub: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-(--shadow-card)">
      <div className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 label-eyebrow !text-muted-foreground">{title}</p>
      <p className="mt-1 font-serif text-xl">{body}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
