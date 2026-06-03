import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Tag, Sparkles, Percent, DollarSign, Clock } from "lucide-react";
import { couponService } from "@/lib/coupon-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPkr } from "@/lib/format-currency";

interface AddCouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCouponAdded: () => void;
}

export function AddCouponModal({ open, onOpenChange, onCouponAdded }: AddCouponModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    starts_at: "",
    expires_at: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      // Determine status based on dates
      let status: "active" | "scheduled" = "active";
      const now = new Date();
      if (formData.starts_at && new Date(formData.starts_at) > now) {
        status = "scheduled";
      }

      await couponService.createCoupon({
        code: formData.code.toUpperCase().replace(/\s+/g, ""),
        type: formData.type,
        discount_value: parseFloat(formData.discount_value),
        status,
        starts_at: formData.starts_at || undefined,
        expires_at: formData.expires_at || undefined,
      });

      toast.success("Boutique offer created successfully");
      onCouponAdded();
      onOpenChange(false);
      setFormData({
        code: "",
        type: "percentage",
        discount_value: "",
        starts_at: "",
        expires_at: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to create coupon");
    } finally {
      setIsLoading(false);
    }
  };

  const discountPreview =
    formData.type === "percentage"
      ? `${formData.discount_value || "0"}%`
      : formatPkr(Number(formData.discount_value || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-0 overflow-y-auto border-none shadow-2xl rounded-[28px] sm:rounded-[32px]">
        <div className="bg-linear-to-br from-primary/10 via-lilac/5 to-white p-5 sm:p-8">
          <DialogHeader className="mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="font-serif text-3xl text-foreground">
              Create Boutique Offer
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1 text-base font-light">
              Design a tailored incentive for your discerning clientele.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form Fields */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className="text-xs uppercase tracking-widest text-muted-foreground font-bold"
                  >
                    Coupon Code
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="code"
                      placeholder="e.g. LUXE20"
                      className="pl-10 h-12 rounded-xl bg-white border-border/50 focus:ring-primary/20"
                      value={formData.code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    Discount Type
                  </Label>
                  <Tabs
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, type: v as "percentage" | "fixed" }))
                    }
                  >
                    <TabsList className="grid grid-cols-2 h-12 rounded-xl bg-white/50 p-1 border border-border/50">
                      <TabsTrigger
                        value="percentage"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                      >
                        <Percent className="h-4 w-4 mr-2" /> Percent
                      </TabsTrigger>
                      <TabsTrigger
                        value="fixed"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                      >
                        <DollarSign className="h-4 w-4 mr-2" /> Fixed
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="value"
                    className="text-xs uppercase tracking-widest text-muted-foreground font-bold"
                  >
                    Discount Value
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder={formData.type === "percentage" ? "e.g. 20" : "e.g. 50"}
                    className="h-12 rounded-xl bg-white border-border/50 focus:ring-primary/20"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, discount_value: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Right Column: Scheduling & Preview */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="expires"
                    className="text-xs uppercase tracking-widest text-muted-foreground font-bold"
                  >
                    Expirations (Optional)
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="expires"
                      type="date"
                      className="pl-10 h-12 rounded-xl bg-white border-border/50 focus:ring-primary/20"
                      value={formData.expires_at}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, expires_at: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    Visual Preview
                  </Label>
                  <div className="rounded-2xl border-2 border-dashed border-primary/20 p-4 bg-white/40 flex items-center justify-center min-h-[120px]">
                    <div className="text-center group">
                      <div className="font-serif text-4xl text-primary/30 leading-none group-hover:scale-110 transition-transform">
                        {discountPreview}
                      </div>
                      <div className="mt-2 font-serif text-xl text-primary tracking-widest uppercase">
                        {formData.code || "CODE"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-3 flex gap-3 border border-amber-100">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                    Offer will go <span className="font-bold">Live</span> immediately unless a
                    future start date is specified in detailed settings.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-12 px-8 text-muted-foreground w-full sm:w-auto"
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-full h-12 px-10 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 w-full sm:w-auto"
              >
                {isLoading ? "Crafting..." : "Publish Offer"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
