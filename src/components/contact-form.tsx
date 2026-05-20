import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { sendContactEmail } from "@/lib/email.server";
import { FieldError, inputWithError } from "@/components/field-error";
import {
  validateEmail,
  validateRequired,
  hasFieldErrors,
  type FieldErrors,
} from "@/lib/form-validation";

type ContactFields = "firstName" | "lastName" | "email" | "subject" | "message";

export function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ContactFields>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: FieldErrors<ContactFields> = {
      firstName: validateRequired(formData.firstName, "First name"),
      lastName: validateRequired(formData.lastName, "Last name"),
      email: validateEmail(formData.email),
      subject: validateRequired(formData.subject, "Subject"),
      message: validateRequired(formData.message, "Message"),
    };

    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await (sendContactEmail as any)({ data: formData });

      if (result?.success === false) {
        toast.error(result.message || "Failed to send message.");
        return;
      }

      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err?.message || "Failed to send message. Please try again.");
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

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Eleanor"
                aria-invalid={Boolean(fieldErrors.firstName)}
                className={inputWithError(
                  Boolean(fieldErrors.firstName),
                  "w-full h-12 rounded-xl border-border/50 bg-secondary/30 px-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30",
                )}
              />
              <FieldError message={fieldErrors.firstName} />
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
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Vance"
                aria-invalid={Boolean(fieldErrors.lastName)}
                className={inputWithError(
                  Boolean(fieldErrors.lastName),
                  "w-full h-12 rounded-xl border-border/50 bg-secondary/30 px-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30",
                )}
              />
              <FieldError message={fieldErrors.lastName} />
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
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@email.com"
              aria-invalid={Boolean(fieldErrors.email)}
              className={inputWithError(
                Boolean(fieldErrors.email),
                "w-full h-12 rounded-xl border-border/50 bg-secondary/30 px-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30",
              )}
            />
            <FieldError message={fieldErrors.email} />
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
              onChange={(e) => updateField("subject", e.target.value)}
              placeholder="Gifting inquiry"
              aria-invalid={Boolean(fieldErrors.subject)}
              className={inputWithError(
                Boolean(fieldErrors.subject),
                "w-full h-12 rounded-xl border-border/50 bg-secondary/30 px-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30",
              )}
            />
            <FieldError message={fieldErrors.subject} />
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
              onChange={(e) => updateField("message", e.target.value)}
              placeholder="Tell us how we can help..."
              rows={6}
              aria-invalid={Boolean(fieldErrors.message)}
              className={inputWithError(
                Boolean(fieldErrors.message),
                "w-full rounded-xl border-border/50 bg-secondary/30 p-4 transition-all focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30 resize-none",
              )}
            />
            <FieldError message={fieldErrors.message} />
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
