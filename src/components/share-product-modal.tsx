import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Download,
  Share2,
  Globe,
  Megaphone,
  Target,
  Layers,
  Tag,
  X,
  CheckCircle2,
  QrCode,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
  };
}

export function ShareProductModal({ open, onOpenChange, product }: ShareProductModalProps) {
  const [utm, setUtm] = useState({
    source: "",
    medium: "",
    campaign: "",
    content: "",
    term: "",
  });

  const [fullUrl, setFullUrl] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const baseUrl = `${window.location.origin}/product/${product.id}`;
    const params = new URLSearchParams();

    if (utm.source) params.append("utm_source", utm.source);
    if (utm.medium) params.append("utm_medium", utm.medium);
    if (utm.campaign) params.append("utm_campaign", utm.campaign);
    if (utm.content) params.append("utm_content", utm.content);
    if (utm.term) params.append("utm_term", utm.term);

    const queryString = params.toString();
    setFullUrl(queryString ? `${baseUrl}?${queryString}` : baseUrl);
  }, [product.id, utm]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success("Campaign link copied to clipboard");
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${product.name}-${utm.campaign || "direct"}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code downloaded");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const quickPresets = [
    { label: "Instagram", source: "instagram", medium: "social" },
    { label: "Facebook", source: "facebook", medium: "social" },
    { label: "Email", source: "newsletter", medium: "email" },
    { label: "Pinterest", source: "pinterest", medium: "social" },
  ];

  const applyPreset = (preset: { label: string; source: string; medium: string }) => {
    setUtm((prev) => ({ ...prev, source: preset.source, medium: preset.medium }));
    toast.info(`Applied ${preset.label} preset`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto md:overflow-hidden border-none shadow-2xl bg-white rounded-[32px] md:rounded-[40px] max-h-[95vh] h-auto md:h-[90vh] flex flex-col">
        <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
          {/* Left Side: QR & Preview */}
          <div className="w-full md:w-[340px] bg-muted/20 border-b md:border-b-0 md:border-r border-border/50 p-6 md:p-10 flex flex-col items-center justify-center gap-6 md:gap-8 shrink-0">
            <div className="space-y-2 text-center">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                Campaign QR Code
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                Scan to visit storefront
              </p>
            </div>

            <div
              ref={qrRef}
              className="p-6 bg-white rounded-[32px] shadow-2xl border border-border/50 transition-all duration-500 hover:scale-105"
            >
              <QRCodeSVG
                value={fullUrl}
                size={180}
                level="H"
                includeMargin
                imageSettings={{
                  src: "/logo.png",
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            <Button
              onClick={handleDownloadQR}
              variant="outline"
              className="w-full rounded-2xl h-12 border-primary/20 hover:border-primary/40 font-bold text-xs"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR PNG
            </Button>

            <div className="pt-6 border-t border-border/50 w-full">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border/50 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">
                    UTM Tracking Active
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Analytics will track this source.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: UTM Configuration */}
          <div className="flex-1 flex flex-col bg-white md:overflow-hidden">
            <div className="p-6 pb-4 md:p-10 md:pb-6 border-b border-border/30 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-serif text-primary tracking-tight">
                  Link Architect
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-medium">
                  Design your campaign link for {product.name}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-10 w-10 hover:bg-muted/80"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 md:overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-10 custom-scrollbar">
              <section className="space-y-4">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                  Quick Presets
                </Label>
                <div className="flex flex-wrap gap-3">
                  {quickPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset)}
                      className="px-5 py-2.5 rounded-full bg-muted/40 hover:bg-primary-soft hover:text-primary transition-all text-xs font-bold border border-border/50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-primary/60" /> Source
                  </Label>
                  <Input
                    value={utm.source}
                    onChange={(e) => setUtm((prev) => ({ ...prev, source: e.target.value }))}
                    placeholder="e.g. instagram, newsletter"
                    className="h-12 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold flex items-center gap-2">
                    <Megaphone className="h-3.5 w-3.5 text-primary/60" /> Medium
                  </Label>
                  <Input
                    value={utm.medium}
                    onChange={(e) => setUtm((prev) => ({ ...prev, medium: e.target.value }))}
                    placeholder="e.g. social, email, cpc"
                    className="h-12 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-primary/60" /> Campaign
                  </Label>
                  <Input
                    value={utm.campaign}
                    onChange={(e) => setUtm((prev) => ({ ...prev, campaign: e.target.value }))}
                    placeholder="e.g. summer_sale, launch"
                    className="h-12 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-primary/60" /> Content
                  </Label>
                  <Input
                    value={utm.content}
                    onChange={(e) => setUtm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="e.g. banner_top, logov2"
                    className="h-12 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                  Generated Campaign URL
                </Label>
                <div className="relative group">
                  <div className="w-full bg-muted/30 p-4 rounded-2xl pr-14 break-all text-xs font-mono text-muted-foreground border border-border/30 min-h-[60px] flex items-center">
                    {fullUrl}
                  </div>
                  <Button
                    onClick={handleCopy}
                    size="icon"
                    className="absolute top-1/2 -translate-y-1/2 right-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 border-t border-border/40 bg-muted/5 mt-auto">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between w-full">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" />
                  Link is ready for production use
                </div>
                <Button
                  onClick={handleCopy}
                  className="rounded-full h-14 px-12 font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 min-w-[200px] w-full sm:w-auto"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Final Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
