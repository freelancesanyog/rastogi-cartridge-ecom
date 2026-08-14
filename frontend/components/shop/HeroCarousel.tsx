"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  Printer,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Keyboard,
  HardDrive,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface SlideData {
  id: number;
  badgeIcon: any;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  titlePrefix: string;
  titleGradient: string;
  titleSuffix: string;
  description: string;
  discountText: string;
  bgGradient: string;
  glowColor1: string;
  glowColor2: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  secondaryCtaIcon: any;
}

const slides: SlideData[] = [
  {
    id: 1,
    badgeIcon: Zap,
    badgeText: "Rastogi Cartridge • Big Saving Days Sale is Live!",
    badgeBg: "bg-amber-500/20",
    badgeBorder: "border-amber-400/40",
    badgeTextColor: "text-amber-300",
    titlePrefix: "India's Preferred Store for",
    titleGradient: "from-amber-400 to-emerald-400",
    titleSuffix: "Genuine Cartridges & Toners",
    description:
      "Get up to 40% OFF on OEM & compatible printer toners for HP, Canon, Epson, Brother & Dell. 100% Fit Guarantee & Cash-on-Delivery across India.",
    discountText: "40% OFF",
    bgGradient: "from-[#131921] via-[#232f3e] to-[#131921]",
    glowColor1: "bg-amber-500/10",
    glowColor2: "bg-emerald-500/10",
    primaryCtaText: "Explore All Deals",
    primaryCtaHref: "/catalog?category=printer-cartridges",
    secondaryCtaText: "Printer Cartridge Finder",
    secondaryCtaHref: "/compatibility",
    secondaryCtaIcon: Printer,
  },
  {
    id: 2,
    badgeIcon: Monitor,
    badgeText: "Monitor Accessories & Essential Add-Ons",
    badgeBg: "bg-indigo-500/20",
    badgeBorder: "border-indigo-400/40",
    badgeTextColor: "text-indigo-300",
    titlePrefix: "Upgrade Your Setup with",
    titleGradient: "from-indigo-400 via-sky-300 to-cyan-400",
    titleSuffix: "Premium Monitor Accessories",
    description:
      "Enhance your workstation or gaming setup with monitor arms, stands, mounts, cables, adapters, and essential accessories starting at just ₹499 with guaranteed safe shipping.",
    discountText: "Extra 15% OFF",
    bgGradient: "from-[#0f172a] via-[#1e1b4b] to-[#0f172a]",
    glowColor1: "bg-indigo-500/15",
    glowColor2: "bg-cyan-500/15",
    primaryCtaText: "Shop Accessories",
    primaryCtaHref: "/catalog?category=monitor-accessories",
    secondaryCtaText: "Today's Deals",
    secondaryCtaHref: "/catalog?in_stock=true",
    secondaryCtaIcon: Sparkles,
  },
  {
    id: 3,
    badgeIcon: Keyboard,
    badgeText: "Pro Mechanical Keyboards & Ergonomic Mice",
    badgeBg: "bg-purple-500/20",
    badgeBorder: "border-purple-400/40",
    badgeTextColor: "text-purple-300",
    titlePrefix: "Precision Gear Built for",
    titleGradient: "from-purple-400 via-pink-400 to-amber-300",
    titleSuffix: "Typing & High Performance",
    description:
      "Experience tactile mechanical switches, hot-swappable keycaps, and ergonomic high-DPI gaming mice designed for non-stop productivity.",
    discountText: "Under ₹999 Deals",
    bgGradient: "from-[#18181b] via-[#27272a] to-[#09090b]",
    glowColor1: "bg-purple-500/15",
    glowColor2: "bg-pink-500/15",
    primaryCtaText: "Explore Keyboards",
    primaryCtaHref: "/catalog?category=keyboards",
    secondaryCtaText: "Customer Support",
    secondaryCtaHref: "/contact",
    secondaryCtaIcon: ShieldCheck,
  },
  {
    id: 4,
    badgeIcon: HardDrive,
    badgeText: "Desktop Accessories & Essential PC Add-Ons",
    badgeBg: "bg-emerald-500/20",
    badgeBorder: "border-emerald-400/40",
    badgeTextColor: "text-emerald-300",
    titlePrefix: "Power Up Your Workspace with",
    titleGradient: "from-emerald-400 via-teal-300 to-amber-400",
    titleSuffix: "Premium PC Accessories",
    description:
      "Complete your workstation or gaming setup with keyboards, mice, USB hubs, cooling accessories, cables, adapters, laptop stands, and essential PC add-ons.",
    discountText: "Save Big Today",
    bgGradient: "from-[#022c22] via-[#064e3b] to-[#022c22]",
    glowColor1: "bg-emerald-500/15",
    glowColor2: "bg-amber-500/15",
    primaryCtaText: "Shop PC Accessories",
    primaryCtaHref: "/catalog?category=accessories",
    secondaryCtaText: "Full Catalog",
    secondaryCtaHref: "/catalog",
    secondaryCtaIcon: ArrowRight,
  },
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentIndex];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!isPaused) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, currentIndex]);

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden mx-0 sm:mx-4 lg:mx-6 mt-0 sm:mt-4 rounded-none sm:rounded-2xl shadow-2xl border border-slate-800 transition-all duration-700 select-none"
    >
      {/* Dynamic Background Gradient Container */}
      <div
        className={`w-full p-6 sm:p-10 lg:p-12 text-white bg-gradient-to-r ${currentSlide.bgGradient} transition-all duration-700 ease-in-out relative`}
      >
        {/* Glow Effects */}
        <div
          className={`absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 ${currentSlide.glowColor1} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
        />
        <div
          className={`absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 ${currentSlide.glowColor2} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
        />

        {/* Slide Content */}
        <div className="relative z-10 max-w-3xl space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">

          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${currentSlide.badgeBg} border ${currentSlide.badgeBorder} ${currentSlide.badgeTextColor} text-xs font-bold shadow-sm`}
          >
            <currentSlide.badgeIcon className="w-4 h-4 animate-bounce shrink-0" />
            <span>{currentSlide.badgeText}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {currentSlide.titlePrefix} <br />
            <span
              className={`text-transparent bg-clip-text bg-gradient-to-r ${currentSlide.titleGradient}`}
            >
              {currentSlide.titleSuffix}
            </span>
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {currentSlide.description}
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={currentSlide.primaryCtaHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-400/20 active:scale-95"
            >
              <span>{currentSlide.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={currentSlide.secondaryCtaHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700/80 backdrop-blur-sm transition-all active:scale-95"
            >
              <currentSlide.secondaryCtaIcon className="w-4 h-4 text-amber-400" />
              <span>{currentSlide.secondaryCtaText}</span>
            </Link>
          </div>
        </div>

        {/* Carousel Navigation Arrow Buttons (Left & Right) */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-slate-700/60 backdrop-blur-md transition-all shadow-md active:scale-90 hidden sm:flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-slate-700/60 backdrop-blur-md transition-all shadow-md active:scale-90 hidden sm:flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`transition-all duration-300 rounded-full ${currentIndex === index
                ? "w-8 h-2.5 bg-amber-400 shadow-md shadow-amber-400/30"
                : "w-2.5 h-2.5 bg-slate-600/80 hover:bg-slate-400"
                }`}
            />
          ))}
        </div>

        {/* Animated Progress Line at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60">
          <div
            key={currentIndex}
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-[5000ms] linear"
            style={{
              width: isPaused ? "100%" : "100%",
              animation: isPaused ? "none" : "progress 5s linear infinite",
            }}
          />
        </div>
      </div>
    </section>
  );
}
