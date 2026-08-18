import { Metadata } from "next";
import { ShieldCheck, Award, Users, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Rastogi Cartridge",
  description: "Learn about Rastogi Cartridge's commitment to high-quality OEM & compatible printer cartridges and computer electronics.",
};

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20">
          <Sparkles className="w-4 h-4" />
          <span>Our Story & Mission</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight sm:text-5xl">
          Empowering Offices & Homes with Guaranteed Printing & Tech Supplies
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          Founded to eliminate the frustration of incorrect printer cartridges and overpriced supplies, Rastogi Cartridge provides exact-fit cartridges alongside top-tier monitors, keyboards, mice, and custom desktop hardware.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">100% Fit Guarantee</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our compatibility engine guarantees that every cartridge listed for your printer model fits seamlessly without error codes.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <Award className="w-8 h-8 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">OEM & Verified Quality</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            We stock original manufacturer supplies (HP, Canon, Epson, Brother) plus ISO 9001 certified compatible alternatives.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <Users className="w-8 h-8 text-purple-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customer First</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enjoy Cash on Delivery checkout, same-day dispatch, and dedicated phone and email support.
          </p>
        </div>
      </div>

    </div>
  );
}
