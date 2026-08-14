"use client";

import Link from "next/link";
import { Printer, ShieldCheck, Truck, Clock, RefreshCw, ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#131921] text-slate-300 select-none">

      {/* Back to Top Button (Amazon Style) */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#37475a] hover:bg-[#485769] text-white py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1"
      >
        <ArrowUp className="w-3.5 h-3.5" />
        <span>Back to top</span>
      </button>

      {/* Trust Badges Bar */}
      <div className="bg-[#232f3e] border-b border-slate-700/60 py-6">
        <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">Express Delivery</h4>
              <p className="text-[11px] text-slate-400">Fast dispatch across India</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">100% Genuine Guarantee</h4>
              <p className="text-[11px] text-slate-400">OEM & Verified Compatible</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-400/10 text-blue-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">Pay Cash on Delivery</h4>
              <p className="text-[11px] text-slate-400">Available on all orders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-purple-400/10 text-purple-400 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">Hassle-Free Returns</h4>
              <p className="text-[11px] text-slate-400">Easy replacement guarantee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Column Amazon Footer */}
      <div className="max-w-[1400px] mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 border-b border-slate-800 text-xs">

        {/* Column 1: Get to Know Us */}
        <div className="space-y-3">
          <h3 className="font-bold text-white uppercase text-xs tracking-wider">Get to Know Us</h3>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/about" className="hover:underline">About Rastogi Cartridge</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact Customer Service</Link></li>
            <li><Link href="/compatibility" className="hover:underline text-emerald-400 font-medium">Printer Cartridge Finder</Link></li>
          </ul>
        </div>

        {/* Column 2: Connect & Shop */}
        <div className="space-y-3">
          <h3 className="font-bold text-white uppercase text-xs tracking-wider">Shop Categories</h3>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/catalog?category=printer-cartridges" className="hover:underline">Printer Cartridges & Toners</Link></li>
            <li><Link href="/catalog?category=monitors" className="hover:underline">Monitors & Displays</Link></li>
            <li><Link href="/catalog?category=keyboards" className="hover:underline">Keyboards & Wireless Mice</Link></li>
            <li><Link href="/catalog?category=desktops" className="hover:underline">Desktops & Hardware</Link></li>
          </ul>
        </div>

        {/* Column 3: Customer Care */}
        <div className="space-y-3">
          <h3 className="font-bold text-white uppercase text-xs tracking-wider">Let Us Help You</h3>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/account/orders" className="hover:underline">Your Account & Orders</Link></li>
            <li><Link href="/help/shipping" className="hover:underline">Shipping & Delivery Policy</Link></li>
            <li><Link href="/help/returns" className="hover:underline">Returns & Replacement Policy</Link></li>
            <li><Link href="/faq" className="hover:underline">FAQ & Help Center</Link></li>
          </ul>
        </div>

        {/* Column 4: Company Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-amber-400 flex items-center justify-center text-slate-950 font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-white">Rastogi Cartridge</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Rastogi Cartridge is India&apos;s leading e-commerce marketplace for genuine OEM and compatible printer cartridges, toners, monitors, and computer accessories.
          </p>
          <div className="text-[11px] text-slate-400 pt-1">
            <p>Support: <span className="text-white font-medium">rastogicartridge@gmail.com</span></p>
            <p>Helpline: <span className="text-white font-medium">+91 9910776261 &nbsp; +91 9899526872</span></p>
          </div>
        </div>

      </div>

      {/* Copyright & Legal Bar */}
      <div className="bg-[#131921] py-6 text-center text-[11px] text-slate-400 space-y-2">
        <p>© {new Date().getFullYear()} Rastogi Cartridge Inc. or its affiliates. All rights reserved.</p>
        <p className="text-slate-500">Conditions of Use & Sale | Privacy Notice | Interest-Based Ads</p>
      </div>

    </footer>
  );
}
