import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, User, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { sendContactEmail } from "@/lib/email-server";
import { storeSettingsService, StoreSettings } from "@/lib/store-settings";

export function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    storeSettingsService.getSettings().then(setSettings);
  }, []);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submit triggered", formData);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      console.log("Validation failed - missing fields");
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("Validation passed, submitting...");
    setIsSubmitting(true);

    try {
      const result = await (sendContactEmail as any)({ data: formData });
      console.log("Server response:", result);

      toast.success("Message sent successfully! We'll get back to you soon.");

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Email error caught:", error);
      toast.error(`Failed to send: ${error?.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl bg-card p-8 shadow-(--shadow-card)">
        <div className="mb-8">
          <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-secondary/50 border border-border/50 text-foreground shadow-sm">
            <Mail className="size-5" />
          </div>
          <h2 className="font-serif text-3xl font-medium text-foreground">Get in Touch</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2.5">
              <Label
                htmlFor="firstName"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                placeholder="Eleanor"
                required
                className="w-full h-12 rounded-xl border-border/50 bg-secondary/30 px-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="lastName"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Last Name *
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange("lastName")}
                placeholder="Vance"
                required
                className="w-full h-12 rounded-xl border-border/50 bg-secondary/30 px-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              placeholder="you@email.com"
              required
              className="w-full h-12 rounded-xl border-border/50 bg-secondary/30 px-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="subject"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Subject *
            </Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={handleInputChange("subject")}
              placeholder="Gifting inquiry"
              required
              className="w-full h-12 rounded-xl border-border/50 bg-secondary/30 px-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="message"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Message *
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={handleInputChange("message")}
              placeholder="Tell us how we can help..."
              rows={6}
              required
              className="w-full rounded-xl border-border/50 bg-secondary/30 p-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-full bg-primary px-8 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Send className="mr-2 h-4 w-4 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
