import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Plus, Globe, Plane, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { shippingZones } from "@/lib/admin-data";
import { useState, useEffect, useRef } from "react";
import { useStoreSettingsContext } from "@/context/StoreSettingsContext";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import { useShippingZones } from "@/hooks/use-shipping-zones";
import { useTaxSettings } from "@/hooks/use-tax-settings";
import { ShippingZone } from "@/lib/shipping-zones";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { imageService } from "@/lib/image-service";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Store Settings — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout searchPlaceholder="Search settings…">
      <SettingsPage />
    </AdminLayout>
  ),
});

function SettingsPage() {
  const { settings, updateSetting, refresh } = useStoreSettingsContext();
  const {
    settings: adminSettings,
    updateSetting: updateAdminSetting,
    updateMultipleSettings,
  } = useAdminSettings();
  const { zones, loading: zonesLoading, updateMultipleZones } = useShippingZones();
  const [localZones, setLocalZones] = useState<ShippingZone[]>([]);
  const [zonesDirty, setZonesDirty] = useState(false);
  const {
    settings: taxSettings,
    loading: taxLoading,
    updateSetting: updateTaxSetting,
    updateMultipleSettings: updateMultipleTaxSettings,
    toggleTaxStatus,
  } = useTaxSettings();
  const [togglingZones, setTogglingZones] = useState<Set<string>>(new Set());
  const [storeInfo, setStoreInfo] = useState({
    address: "888 Refresh Test Street, RefreshCity, United Kingdom",
    appointment: "By appointment only",
    openingTime: "00:00",
    closingTime: "23:59",
    closedInfo: "Closed weekends & holidays",
  });
  const [storeProfile, setStoreProfile] = useState({
    storeName: "Little Luxuries Boutique",
    founderName: "Eleanor Vance",
    businessEmail: "concierge@littleluxuries.com",
    contactPhone: "+1 (555) 892-0192",
    timezone: "London (GMT +00)",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [logoUrl, setLogoUrl] = useState(logo);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSavingZones, setIsSavingZones] = useState(false);
  const [showTaxSettings, setShowTaxSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showTwoFactorAuth, setShowTwoFactorAuth] = useState(false);

  // Local state for form editing
  const [editingAdminProfile, setEditingAdminProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    permissions: "",
    twoFactorEnabled: false,
    lastLogin: "",
    accountCreated: "",
  });

  // Initialize forms with current settings
  useEffect(() => {
    if (settings) {
      setStoreInfo({
        address: `${settings.address_line1}, ${settings.address_city}, ${settings.address_country}`,
        appointment: "By appointment only",
        openingTime: settings.business_hours_start || "00:00",
        closingTime: settings.business_hours_end || "23:59",
        closedInfo: "Closed weekends & holidays",
      });

      setStoreProfile({
        storeName: settings.store_name || "Little Luxuries Boutique",
        founderName: settings.founder_name || "Eleanor Vance",
        businessEmail: settings.business_email || "concierge@littleluxuries.com",
        contactPhone: settings.contact_phone || "+1 (555) 892-0192",
        timezone: settings.timezone_display || "London (GMT +00)",
      });

      // Set logo URL from settings
      if (settings.logo_url && settings.logo_url !== "/src/assets/logo.png") {
        setLogoUrl(settings.logo_url);
      }
    }
  }, [settings]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      console.log("Saving store info:", storeInfo);

      // Parse address components
      const addressParts = storeInfo.address.split(",").map((part) => part.trim());
      const addressLine1 = addressParts[0] || "";
      const addressCity = addressParts[1] || "";
      const addressCountry = addressParts[2] || "";

      console.log("Parsed address:", { addressLine1, addressCity, addressCountry });

      // Update all settings
      const updates = [
        { key: "address_line1" as const, value: addressLine1 },
        { key: "address_city" as const, value: addressCity },
        { key: "address_country" as const, value: addressCountry },
        { key: "business_hours_start" as const, value: storeInfo.openingTime },
        { key: "business_hours_end" as const, value: storeInfo.closingTime },
      ];

      let failed = false;
      for (const update of updates) {
        const result = await updateSetting(update.key, update.value);
        if (!result.success) {
          failed = true;
          toast.error(result.error || `Failed to save ${update.key}`);
        }
      }

      await refresh();
      if (!failed) toast.success("Store information saved.");
    } catch (error) {
      console.error("Error saving store information:", error);
      toast.error("Failed to save store information.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      console.log("Saving store profile:", storeProfile);

      // Update all profile settings
      const updates = [
        { key: "store_name" as const, value: storeProfile.storeName },
        { key: "founder_name" as const, value: storeProfile.founderName },
        { key: "business_email" as const, value: storeProfile.businessEmail },
        { key: "contact_phone" as const, value: storeProfile.contactPhone },
        { key: "timezone_display" as const, value: storeProfile.timezone },
        { key: "logo_url" as const, value: logoUrl },
      ];

      let failed = false;
      for (const update of updates) {
        const result = await updateSetting(update.key, update.value);
        if (!result.success) {
          failed = true;
          toast.error(result.error || `Failed to save ${update.key}`);
        }
      }

      await refresh();
      if (!failed) toast.success("Store profile saved.");
    } catch (error) {
      console.error("Error saving store profile:", error);
      toast.error("Failed to save store profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, etc.).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    setIsUploadingLogo(true);
    // Temporary local preview while the real upload is in flight
    const tempUrl = URL.createObjectURL(file);
    setLogoUrl(tempUrl);

    try {
      const publicUrl = await imageService.uploadImage(file, "store");
      setLogoUrl(publicUrl);
      URL.revokeObjectURL(tempUrl);
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!zonesLoading && zones.length > 0) {
      setLocalZones(zones);
      setZonesDirty(false);
    }
  }, [zones, zonesLoading]);

  const handleToggleZoneLocal = (id: string) => {
    setLocalZones((prev) =>
      prev.map((z) =>
        z.id === id
          ? { ...z, status: z.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
          : z,
      ),
    );
    setZonesDirty(true);
  };

  const handleSaveZones = async () => {
    setIsSavingZones(true);
    try {
      const result = await updateMultipleZones(localZones);
      if (result.success) {
        toast.success("Shipping zones saved.");
        setZonesDirty(false);
      } else {
        toast.error(result.error || "Failed to save shipping zones.");
      }
    } catch (error) {
      console.error("Error saving shipping zones:", error);
      toast.error("Failed to save shipping zones.");
    } finally {
      setIsSavingZones(false);
    }
  };

  const handleUpdateTaxSetting = async (country: string, field: string, value: any) => {
    const zoneId = country;
    const updates: any = {};

    if (field === "rate") {
      updates.tax_rate = parseFloat(value) || 0;
    } else if (field === "type") {
      updates.tax_type = value;
    } else if (field === "inclusive") {
      updates.tax_inclusive = value === "inclusive";
    }

    const result = await updateTaxSetting(zoneId, updates);
    if (!result.success) {
      console.error("Error updating tax setting:", result.error);
    }
  };

  const handleSaveTaxSettings = async () => {
    try {
      const result = await updateMultipleTaxSettings(taxSettings);
      if (result.success) {
        toast.success("Tax settings saved.");
        setShowTaxSettings(false);
      } else {
        toast.error(result.error || "Failed to save tax settings.");
      }
    } catch (error) {
      console.error("Error saving tax settings:", error);
      toast.error("Failed to save tax settings.");
    }
  };

  const handleUpdateAdminProfile = (field: string, value: string) => {
    setEditingAdminProfile({
      ...editingAdminProfile,
      [field]: value,
    });
  };

  const handleSaveAdminProfile = async () => {
    try {
      const updates = {
        admin_name: editingAdminProfile.name,
        admin_email: editingAdminProfile.email,
        admin_phone: editingAdminProfile.phone,
        admin_role: editingAdminProfile.role,
      };

      const result = await updateMultipleSettings(updates);
      if (result.success) {
        toast.success("Admin profile saved.");
        setShowEditProfile(false);
      } else {
        toast.error(result.error || "Failed to save admin profile.");
      }
    } catch (error) {
      console.error("Error saving admin profile:", error);
      toast.error("Failed to save admin profile.");
    }
  };

  const handleToggleTwoFactor = async () => {
    try {
      const newStatus = !adminSettings?.admin_two_factor_enabled;
      const result = await updateAdminSetting("admin_two_factor_enabled", newStatus);
      if (result.success) {
        console.log(`Two-factor authentication ${newStatus ? "enabled" : "disabled"}`);
      } else {
        console.error("Error toggling two-factor authentication:", result.error);
      }
    } catch (error) {
      console.error("Error toggling two-factor authentication:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-primary">Store Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your boutique's global configurations, payment methods, and regional logistics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store profile */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-7 shadow-(--shadow-card)">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-primary">Store Profile</h2>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
                Identity & Contact
              </div>
            </div>
            <Button className="rounded-full" onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
            <div className="text-center">
              <div className="h-32 w-32 rounded-2xl bg-white grid place-items-center relative overflow-hidden ring-1 ring-border">
                <img src={logoUrl} alt="Store Logo" className="h-full w-full object-contain p-1" />
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <div className="text-white text-xs">Uploading...</div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={triggerFileInput}
                disabled={isUploadingLogo}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="h-3.5 w-3.5" />
                {isUploadingLogo ? "Uploading..." : "Change Logo"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Store Name
                </Label>
                <Input
                  value={storeProfile.storeName}
                  onChange={(e) => setStoreProfile({ ...storeProfile, storeName: e.target.value })}
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Founder Name
                </Label>
                <Input
                  value={storeProfile.founderName}
                  onChange={(e) => setStoreProfile({ ...storeProfile, founderName: e.target.value })}
                  placeholder="e.g. Eleanor Vance"
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Business Email
                </Label>
                <Input
                  value={storeProfile.businessEmail}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, businessEmail: e.target.value })
                  }
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Contact Number
                </Label>
                <Input
                  value={storeProfile.contactPhone}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, contactPhone: e.target.value })
                  }
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Timezone
                </Label>
                <Input
                  value={storeProfile.timezone}
                  onChange={(e) => setStoreProfile({ ...storeProfile, timezone: e.target.value })}
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="rounded-2xl bg-card p-7 shadow-(--shadow-card)">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-primary">Studio</h2>
            <Button className="rounded-full" onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Address
              </Label>
              <Input
                value={storeInfo.address}
                onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Appointment
              </Label>
              <Input
                value={storeInfo.appointment}
                onChange={(e) => setStoreInfo({ ...storeInfo, appointment: e.target.value })}
                className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Hours
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Opening Time</Label>
                  <Input
                    type="time"
                    value={storeInfo.openingTime}
                    onChange={(e) => setStoreInfo({ ...storeInfo, openingTime: e.target.value })}
                    className="mt-1 h-12 bg-muted/40 border-0 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Closing Time</Label>
                  <Input
                    type="time"
                    value={storeInfo.closingTime}
                    onChange={(e) => setStoreInfo({ ...storeInfo, closingTime: e.target.value })}
                    className="mt-1 h-12 bg-muted/40 border-0 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
              </div>
              <Input
                value={storeInfo.closedInfo}
                onChange={(e) => setStoreInfo({ ...storeInfo, closedInfo: e.target.value })}
                className="mt-3 h-12 bg-muted/40 border-0 rounded-xl"
                placeholder="Additional hours information..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping zones */}
      <div className="rounded-2xl bg-card p-7 shadow-(--shadow-card)">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-2xl text-primary">Shipping & Logistics</h2>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Zones & Taxation Rules
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setShowTaxSettings(true)}
            >
              Tax Settings
            </Button>
            <Button
              className="rounded-full"
              onClick={handleSaveZones}
              disabled={isSavingZones || !zonesDirty}
            >
              {isSavingZones ? "Saving..." : zonesDirty ? "Save Zones" : "Saved"}
            </Button>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground max-w-3xl">
          Click a zone to toggle Active or Inactive, then press{" "}
          <span className="font-medium text-foreground">Save Zones</span>. Changes are not written
          until you save. Pakistan domestic shipping (PKR 250, free from PKR 10,000) still applies
          on checkout for local orders even when Pakistan is Inactive — Active only marks the zone
          as enabled for international destinations.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {zonesLoading
            ? // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-muted/30 p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-muted/40"></div>
                    <div className="h-6 w-16 rounded-full bg-muted/40"></div>
                  </div>
                  <div className="h-6 bg-muted/40 rounded mb-2"></div>
                  <div className="h-4 bg-muted/40 rounded mb-4"></div>
                  <div className="h-4 bg-muted/40 rounded w-3/4"></div>
                </div>
              ))
            : // Country zone cards
              localZones.map((zone) => (
                <div
                  key={zone.id}
                  role="button"
                  tabIndex={0}
                  className={`rounded-2xl bg-card border-2 cursor-pointer transition-all hover:shadow-lg ${
                    zone.status === "ACTIVE"
                      ? "border-primary/20 bg-primary-soft/10"
                      : "border-muted/30 bg-muted/20"
                  }`}
                  onClick={() => handleToggleZoneLocal(zone.id!)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleZoneLocal(zone.id!);
                    }
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-xl grid place-items-center ${
                          zone.status === "ACTIVE"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {zone.icon === "globe" ? (
                          <Globe className="h-5 w-5" />
                        ) : (
                          <Plane className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            zone.status === "ACTIVE"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {zone.status}
                        </span>
                      </div>
                    </div>

                    <div className="font-serif text-xl text-foreground">{zone.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">{zone.description}</p>
                    <div className="mt-4 text-sm text-foreground/80">🚚 {zone.delivery_info}</div>
                    {zone.id === "pakistan" && zone.status === "INACTIVE" && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Domestic PK checkout still uses PKR 250 / free from 10k.
                      </p>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Tax Settings Modal */}
      {showTaxSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl text-primary">Tax Settings</h2>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  Regional Tax Configuration
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowTaxSettings(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {taxLoading
                ? // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-muted/30 p-5 animate-pulse">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-6 bg-muted/40 rounded w-32"></div>
                        <div className="h-4 bg-muted/40 rounded w-48"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-10 bg-muted/40 rounded"></div>
                        <div className="h-10 bg-muted/40 rounded"></div>
                        <div className="h-10 bg-muted/40 rounded"></div>
                      </div>
                    </div>
                  ))
                : Object.entries(taxSettings).map(([zoneId, settings]) => (
                    <div key={zoneId} className="rounded-2xl bg-muted/30 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif text-lg text-primary capitalize">
                          {zoneId === "uae"
                            ? "United Arab Emirates"
                            : zoneId === "uk"
                              ? "United Kingdom"
                              : zoneId === "usa"
                                ? "United States"
                                : zoneId.charAt(0).toUpperCase() + zoneId.slice(1)}
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground">
                            {settings.description}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                settings.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {settings.status}
                            </span>
                            <div
                              onClick={async () => {
                                if (togglingZones.has(zoneId)) return; // Prevent multiple clicks

                                console.log(`Toggle clicked for zone: ${zoneId}`);
                                setTogglingZones((prev) => new Set(prev).add(zoneId));

                                try {
                                  const result = await toggleTaxStatus(zoneId);
                                  console.log(`Toggle result for ${zoneId}:`, result);
                                } catch (error) {
                                  console.error(`Toggle error for ${zoneId}:`, error);
                                } finally {
                                  setTogglingZones((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(zoneId);
                                    return newSet;
                                  });
                                }
                              }}
                              className={`relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out cursor-pointer ${
                                togglingZones.has(zoneId)
                                  ? "opacity-60 cursor-not-allowed"
                                  : "hover:scale-105"
                              } ${settings.status === "ACTIVE" ? "bg-green-600" : "bg-gray-400"}`}
                            >
                              <div
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out ${
                                  togglingZones.has(zoneId) ? "animate-pulse" : ""
                                } ${
                                  settings.status === "ACTIVE" ? "translate-x-6" : "translate-x-0.5"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Tax Rate (%)
                          </Label>
                          <Input
                            type="number"
                            value={settings.tax_rate}
                            onChange={(e) =>
                              handleUpdateTaxSetting(
                                zoneId,
                                "rate",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="mt-2 h-10 bg-card border-0 rounded-lg"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Tax Type
                          </Label>
                          <select
                            value={settings.tax_type}
                            onChange={(e) => handleUpdateTaxSetting(zoneId, "type", e.target.value)}
                            className="mt-2 h-10 bg-card border-0 rounded-lg px-3 w-full"
                          >
                            <option value="GST">GST</option>
                            <option value="VAT">VAT</option>
                            <option value="Sales Tax">Sales Tax</option>
                            <option value="Custom Duty">Custom Duty</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Price Display
                          </Label>
                          <select
                            value={settings.tax_inclusive ? "inclusive" : "exclusive"}
                            onChange={(e) =>
                              handleUpdateTaxSetting(
                                zoneId,
                                "inclusive",
                                e.target.value === "inclusive",
                              )
                            }
                            className="mt-2 h-10 bg-card border-0 rounded-lg px-3 w-full"
                          >
                            <option value="inclusive">Tax Inclusive</option>
                            <option value="exclusive">Tax Exclusive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowTaxSettings(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTaxSettings}>Save Tax Settings</Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin account */}
      <div className="rounded-2xl p-6 sm:p-8 bg-linear-to-br from-primary to-lilac text-primary-foreground">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_auto] gap-6 items-center">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-card/20 grid place-items-center text-4xl">
            👤
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.2em] opacity-80">
              Administrator Account
            </div>
            <div className="font-serif text-2xl sm:text-3xl mt-2">
              {adminSettings?.admin_name || <Skeleton className="h-8 w-48 bg-white/30" />}
            </div>
            <p className="text-sm opacity-90 mt-1">
              {adminSettings ? (
                `${adminSettings.admin_role} • ${adminSettings.admin_permissions}`
              ) : (
                <Skeleton className="h-4 w-64 bg-white/30" />
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="secondary"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => {
                  if (adminSettings) {
                    setEditingAdminProfile({
                      name: adminSettings.admin_name,
                      email: adminSettings.admin_email,
                      phone: adminSettings.admin_phone,
                      role: adminSettings.admin_role,
                      permissions: adminSettings.admin_permissions,
                      twoFactorEnabled: adminSettings.admin_two_factor_enabled,
                      lastLogin: adminSettings.admin_last_login,
                      accountCreated: adminSettings.admin_account_created,
                    });
                    setShowEditProfile(true);
                  }
                }}
              >
                Edit Profile
              </Button>
            </div>
          </div>
          <div className="hidden xl:block">
            <Button
              variant="secondary"
              className="rounded-full bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <ShieldCheck className="h-4 w-4 mr-2" /> Manage Account
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold shrink-0" /> Last backup: October 24, 2023 at
          10:15 AM
        </div>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground">Discard All</button>
          <Button className="rounded-full">Save All Changes</Button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl text-primary">Edit Profile</h2>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  Administrator Information
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowEditProfile(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </Label>
                  <Input
                    value={editingAdminProfile.name}
                    onChange={(e) => handleUpdateAdminProfile("name", e.target.value)}
                    className="mt-2 h-10 bg-card border-0 rounded-lg"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={editingAdminProfile.email}
                    onChange={(e) => handleUpdateAdminProfile("email", e.target.value)}
                    className="mt-2 h-10 bg-card border-0 rounded-lg"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Phone Number
                  </Label>
                  <Input
                    value={editingAdminProfile.phone}
                    onChange={(e) => handleUpdateAdminProfile("phone", e.target.value)}
                    className="mt-2 h-10 bg-card border-0 rounded-lg"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Role
                  </Label>
                  <select
                    value={editingAdminProfile.role}
                    onChange={(e) => handleUpdateAdminProfile("role", e.target.value)}
                    className="mt-2 h-10 bg-card border-0 rounded-lg px-3 w-full"
                  >
                    <option value="Senior Store Manager">Senior Store Manager</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/30 p-4">
                <h3 className="font-serif text-lg text-primary mb-3">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Login:</span>
                    <span>{editingAdminProfile.lastLogin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Created:</span>
                    <span>{editingAdminProfile.accountCreated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Permissions:</span>
                    <span>{editingAdminProfile.permissions}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowEditProfile(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdminProfile}>Save Profile</Button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Auth Modal */}
      {showTwoFactorAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl text-primary">Two-Factor Authentication</h2>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  Security Settings
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowTwoFactorAuth(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-primary">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-colors ${
                      adminSettings?.admin_two_factor_enabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <button
                      onClick={handleToggleTwoFactor}
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        adminSettings?.admin_two_factor_enabled
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </div>
                </div>
              </div>

              {adminSettings?.admin_two_factor_enabled ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
                    <h4 className="font-medium text-green-800 mb-2">
                      ✓ Two-Factor Authentication Enabled
                    </h4>
                    <p className="text-sm text-green-700">
                      Your account is now protected with two-factor authentication. You'll need to
                      enter a verification code when signing in.
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Setup instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                      <li>Scan the QR code with your app</li>
                      <li>Enter the verification code to confirm setup</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
                  <h4 className="font-medium text-orange-800 mb-2">
                    ⚠️ Two-Factor Authentication Disabled
                  </h4>
                  <p className="text-sm text-orange-700">
                    Your account is not protected with two-factor authentication. We recommend
                    enabling it for better security.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowTwoFactorAuth(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input defaultValue={value} className="mt-2 h-12 bg-muted/40 border-0 rounded-xl" />
    </div>
  );
}
