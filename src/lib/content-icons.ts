import type { LucideIcon } from "lucide-react";
import {
  Leaf,
  Award,
  Heart,
  Shield,
  Sparkles,
  Gem,
  Cloud,
  Sun,
  Moon,
  Flower,
  Trees,
  Droplet,
  Wind,
  Flame,
  Zap,
  Package,
  Truck,
  RefreshCw,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Building,
  Home,
  ShoppingBag,
  CreditCard,
  Tag,
  Percent,
  Gift,
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  TrendingUp,
  Target,
  Star,
  Smile,
} from "lucide-react";

export const CONTENT_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Smile", icon: Smile },
  { name: "Leaf", icon: Leaf },
  { name: "Award", icon: Award },
  { name: "Shield", icon: Shield },
  { name: "Sparkles", icon: Sparkles },
  { name: "Gem", icon: Gem },
  { name: "Cloud", icon: Cloud },
  { name: "Sun", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "Flower", icon: Flower },
  { name: "Trees", icon: Trees },
  { name: "Droplet", icon: Droplet },
  { name: "Wind", icon: Wind },
  { name: "Flame", icon: Flame },
  { name: "Zap", icon: Zap },
  { name: "Package", icon: Package },
  { name: "Truck", icon: Truck },
  { name: "RefreshCw", icon: RefreshCw },
  { name: "Clock", icon: Clock },
  { name: "Calendar", icon: Calendar },
  { name: "MapPin", icon: MapPin },
  { name: "Phone", icon: Phone },
  { name: "Mail", icon: Mail },
  { name: "Globe", icon: Globe },
  { name: "Users", icon: Users },
  { name: "Building", icon: Building },
  { name: "Home", icon: Home },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "CreditCard", icon: CreditCard },
  { name: "Tag", icon: Tag },
  { name: "Percent", icon: Percent },
  { name: "Gift", icon: Gift },
  { name: "Bell", icon: Bell },
  { name: "AlertCircle", icon: AlertCircle },
  { name: "CheckCircle", icon: CheckCircle },
  { name: "Info", icon: Info },
  { name: "HelpCircle", icon: HelpCircle },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "Target", icon: Target },
];

const ICON_BY_NAME = new Map(CONTENT_ICONS.map(({ name, icon }) => [name, icon]));

export const DEFAULT_SOCIAL_PROOF_ICON = "Star";

export function getContentIcon(iconName: string | undefined, fallbackName = DEFAULT_SOCIAL_PROOF_ICON): LucideIcon {
  if (iconName && ICON_BY_NAME.has(iconName)) {
    return ICON_BY_NAME.get(iconName)!;
  }
  return ICON_BY_NAME.get(fallbackName) ?? Star;
}

const PROMISE_ICON_FALLBACKS = ["Leaf", "Award", "Heart"] as const;

export function getPromiseIcon(promise: { iconName?: string }, index: number): LucideIcon {
  return getContentIcon(promise.iconName, PROMISE_ICON_FALLBACKS[index % 3]);
}

export function isStarIcon(iconName: string | undefined): boolean {
  return (iconName ?? DEFAULT_SOCIAL_PROOF_ICON) === "Star";
}
