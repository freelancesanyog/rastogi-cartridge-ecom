"use client";

import React from "react";
import { Star, CheckCircle, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  initial: string;
  title: string;
  comment: string;
  rating: number;
  verified: boolean;
  avatarBg?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Mehul Patel",
    initial: "M",
    title: "Amazing Quality",
    comment:
      "Product quality exceeded expectations. The print yield and dark ink density are much better than expensive branded cartridges I've purchased before.",
    rating: 5,
    verified: true,
    avatarBg: "bg-emerald-800 text-white",
  },
  {
    id: "2",
    name: "Aditi Sharma",
    initial: "A",
    title: "Fast Dispatch",
    comment:
      "Delivery was surprisingly quick and the box packaging felt super premium. Received regular SMS and WhatsApp tracking updates throughout.",
    rating: 5,
    verified: true,
    avatarBg: "bg-teal-800 text-white",
  },
  {
    id: "3",
    name: "Rahul Verma",
    initial: "R",
    title: "Easy COD Experience",
    comment:
      "Cash on Delivery option made ordering completely stress-free. Very smooth experience from checking printer model fit to unboxing.",
    rating: 5,
    verified: true,
    avatarBg: "bg-emerald-900 text-white",
  },
  {
    id: "4",
    name: "Neha Kapoor",
    initial: "N",
    title: "Great Support",
    comment:
      "Customer support responded quickly and guided me to the exact toner cartridge for my HP Laser printer. Great buying experience!",
    rating: 5,
    verified: true,
    avatarBg: "bg-green-800 text-white",
  },
  {
    id: "5",
    name: "Sandeep Kumar",
    initial: "S",
    title: "Crisp Print Yield",
    comment:
      "Printed over 1,500 pages for my CA firm documents seamlessly without any fading or smudging. Rastogi Cartridge is super reliable!",
    rating: 5,
    verified: true,
    avatarBg: "bg-blue-500 text-white",
  },
  {
    id: "6",
    name: "Vikas Malhotra",
    initial: "V",
    title: "Unbeatable Value",
    comment:
      "Best place to buy compatible toner cartridges in India. Premium OEM standard quality at fractions of original cartridge pricing.",
    rating: 5,
    verified: true,
    avatarBg: "bg-emerald-950 text-white",
  },
  {
    id: "7",
    name: "Priya Singh",
    initial: "P",
    title: "Perfect Fit & Output",
    comment:
      "Slid right into my Canon printer effortlessly. Crystal clear text output and no leakages. Will definitely buy all future refills here.",
    rating: 5,
    verified: true,
    avatarBg: "bg-teal-900 text-white",
  },
  {
    id: "8",
    name: "Anish Sharma",
    initial: "A",
    title: "High Yield & Sharp Text",
    comment:
      "Superb text sharpness for our daily invoice printouts. Very durable cartridges and genuine customer service. 10/10 recommended!",
    rating: 5,
    verified: true,
    avatarBg: "bg-slate-800 text-white",
  },
];

export default function CustomersLoveRastogiCartridge() {
  // Duplicate array for seamless infinite marquee loop
  const marqueeItems = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="w-full bg-gradient-to-b from-slate-50 to-emerald-50/20 dark:from-slate-900/60 dark:to-slate-950 py-12 md:py-16 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative">

      {/* Header Section */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-8 md:mb-12 space-y-3">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1b3b2b] dark:text-emerald-300 font-serif tracking-tight">
          Customers Love Rastogi Cartridge
        </h2>

        {/* Rating summary pill */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
          <div className="flex items-center text-amber-400 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Excellent 4.9/5</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 dark:text-slate-400">
            Trusted by <strong className="text-slate-900 dark:text-slate-100">1,000+ Customers</strong>
          </span>
        </div>
      </div>

      {/* Marquee Container with fade edge masks */}
      <div className="relative w-full overflow-hidden py-2 group">

        {/* Gradient edge masks matching container background */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-slate-50 dark:from-slate-900/90 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-slate-50 dark:from-slate-900/90 to-transparent z-10" />

        {/* Continuous Moving Track (Right to Left - Non-stop) */}
        <div className="flex gap-6 animate-marquee-left w-max">
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="w-[300px] sm:w-[340px] md:w-[370px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between group/card select-none"
            >
              {/* Giant background quotation mark */}
              <Quote className="absolute top-4 right-5 w-10 h-10 text-slate-100 dark:text-slate-800 pointer-events-none group-hover/card:text-amber-100 dark:group-hover/card:text-slate-700 transition-colors" />

              <div>
                {/* Header row: Verified badge & Stars */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  {item.verified && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
                      <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Verified Purchase
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 text-amber-400 ml-auto">
                    {[...Array(item.rating)].map((_, r) => (
                      <Star key={r} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Review Title & Text */}
                <h3 className="font-serif font-extrabold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  "{item.comment}"
                </p>
              </div>

              {/* Bottom Row: User Avatar & Name */}
              <div className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div
                  className={`w-10 h-10 rounded-full ${item.avatarBg || "bg-[#1b3b2b] text-white"
                    } font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0`}
                >
                  {item.initial}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-serif">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-slate-400">Verified Rastogi Customer</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Helper caption */}
      <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 font-medium">
        Real reviews from verified Rastogi buyers • 100% Genuine Experiences
      </p>

    </section>
  );
}
