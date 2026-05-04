import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { Mail, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Little Luxuries" },
      { name: "description", content: "Get in touch with our team for orders, gifting inquiries, or partnerships." },
      { property: "og:title", content: "Contact — Little Luxuries" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <Layout>
      <section className="bg-secondary/30 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="label-eyebrow">We'd love to hear from you</span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">Get in touch</h1>
          <p className="mt-5 text-muted-foreground">
            Questions about an order, a gift, or our craftsmanship? Our small, attentive team is here
            to help.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <Info icon={Mail} title="Email" body="hello@littleluxuries.co" sub="We reply within one business day." />
            <Info icon={MapPin} title="Studio" body="14 Coral Lane, London E2" sub="By appointment only" />
            <Info icon={Clock} title="Hours" body="Mon–Fri · 9am – 5pm GMT" sub="Closed weekends & holidays" />
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] md:p-10"
          >
            <h2 className="font-serif text-2xl">Send us a note</h2>
            <div className="mt-6 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First Name" placeholder="Eleanor" />
                <Field label="Last Name" placeholder="Vance" />
              </div>
              <Field label="Email" type="email" placeholder="you@email.com" />
              <Field label="Subject" placeholder="Gifting inquiry" />
              <div>
                <label className="label-eyebrow !text-foreground">Message</label>
                <textarea
                  rows={5}
                  className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="Tell us how we can help..."
                />
              </div>
              <button className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90">
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}

function Info({ icon: Icon, title, body, sub }: { icon: typeof Mail; title: string; body: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 label-eyebrow !text-muted-foreground">{title}</p>
      <p className="mt-1 font-serif text-xl">{body}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder: string }) {
  return (
    <div>
      <label className="label-eyebrow !text-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
