"use client";

import React from "react";
import {
  Activity,
  Archive,
  Baby,
  BookOpen,
  BriefcaseMedical,
  Car,
  Cat,
  Cloud,
  Dumbbell,
  FileText,
  Gamepad2,
  HandHeart,
  HeartPulse,
  Home,
  Luggage,
  Music,
  PawPrint,
  PhoneCall,
  Plane,
  Radio,
  Scale,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Smile,
  Sofa,
  Sparkles,
  Stethoscope,
  TrainFront,
  Tv,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  ShieldCheck,
  BriefcaseMedical,
  Car,
  Users,
  Home,
  Plane,
  PawPrint,
  Sofa,
  ShieldAlert,
  Smile,
  Scale,
  Baby,
  HandHeart,
  Stethoscope,
  Luggage,
  Cat,
  Activity,
  Smartphone,
  Archive,
  Wifi,
  PhoneCall,
  Radio,
  Cloud,
  TrainFront,
  Zap,
  Tv,
  Music,
  ShoppingBag,
  Sparkles,
  Gamepad2,
  BookOpen,
  Dumbbell,
};

export function CategoryIcon({
  name,
  iconName,
  className = "w-5 h-5",
}: {
  name?: string;
  iconName?: string;
  className?: string;
}) {
  const finalName = iconName || name;
  const IconComp = (finalName && ICON_MAP[finalName]) || FileText;
  return <IconComp className={className} />;
}
