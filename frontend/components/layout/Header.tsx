"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Printer,
  Sparkles,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { fetchApi } from "@/lib/api-client";

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);
  const { itemCount, openCart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedCategory !== "all") {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      router.push(`/catalog?${params.toString()}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchApi("/users/logout/", { method: "POST" });
    } catch {
      // Ignore errors on logout
    } finally {
      clearAuth();
      setIsUserDropdownOpen(false);
      router.push("/login");
    }
  };

  return (
    <header className="w-full bg-[#131921] text-white sticky top-0 z-50 shadow-md select-none">

      {/* Top Header Bar */}
      <div className="max-w-[1500px] mx-auto px-4 py-2 flex items-center justify-between gap-4">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group py-1">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md group-hover:scale-105 transition-transform">
            <Printer className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-xl tracking-tight text-white leading-tight">
                Rastogi<span className="text-amber-400">Cartridge</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1 rounded">.com</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-slate-300 font-medium -mt-0.5">
              Genuine Cartridges & Electronics
            </span>
          </div>
        </Link>

        {/* Location Picker (Amazon style) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 rounded border border-transparent hover:border-white/40 cursor-pointer text-xs transition-colors">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-slate-300">Deliver to</span>
            <span className="font-bold text-white">India / Select Pincode</span>
          </div>
        </div>

        {/* Amazon Wide Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-3xl hidden md:flex items-center">
          <div className="flex w-full rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-500">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2.5 border-r border-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="printer-cartridges">Cartridges & Toners</option>
              <option value="monitors">Monitors & Displays</option>
              <option value="keyboards">Keyboards & Mice</option>
              <option value="desktops">Desktops & PCs</option>
            </select>

            {/* Input */}
            <input
              type="text"
              placeholder="Search Rastogi Cartridge (e.g. HP 88A toner, 24-inch monitor, wireless mouse)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />

            {/* Search Button (Amazon Yellow) */}
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 flex items-center justify-center transition-colors font-bold"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right Navigation & Action Icons */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">


          {/* User Account / Auth Dropdown */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1.5 rounded border border-transparent hover:border-white/40 transition-colors text-left"
              >
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-slate-300">Hello, {user.first_name || user.email.split("@")[0]}</span>
                  <span className="font-bold text-white flex items-center gap-0.5">
                    Account & Orders <ChevronDown className="w-3 h-3 text-slate-400" />
                  </span>
                </div>
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-slate-900 shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/account/orders"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-100 font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Orders & Returns</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex flex-col px-2 py-1.5 rounded border border-transparent hover:border-white/40 transition-colors leading-tight"
            >
              <span className="text-[10px] text-slate-300">Hello, sign in</span>
              <span className="font-bold text-white flex items-center gap-0.5">
                Account & Lists <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </Link>
          )}

          {/* Cart Icon (Amazon Style) */}
          <button
            onClick={openCart}
            className="flex items-center gap-2 px-2 py-1.5 rounded border border-transparent hover:border-white/40 transition-colors relative"
            aria-label="Open Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-7 h-7 text-white" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center border-2 border-[#131921]">
                {itemCount}
              </span>
            </div>
            <span className="hidden sm:inline font-extrabold text-white text-xs pt-2">Cart</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-white hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Sub-Header Navigation Bar (Amazon #232f3e style) */}
      <div className="bg-[#232f3e] border-t border-slate-700/60 px-4 py-1.5 text-xs font-semibold overflow-x-auto scrollbar-none flex items-center gap-6 whitespace-nowrap text-slate-200">

        <Link href="/catalog" className="flex items-center gap-1.5 text-amber-400 hover:text-white font-extrabold">
          <Menu className="w-4 h-4" />
          <span>All Products</span>
        </Link>

        <Link href="/catalog?category=printer-cartridges" className="hover:text-amber-400 transition-colors">
          Cartridges & Toners
        </Link>

        <Link
          href="/catalog?category=monitor-accessories" className="hover:text-amber-400 transition-colors">
          Monitor Accessories
        </Link>

        <Link href="/catalog?category=keyboards" className="hover:text-amber-400 transition-colors">
          Keyboards & Mice
        </Link>

        <Link
          href="/catalog?category=accessories" className="hover:text-amber-400 transition-colors">
          PC Accessories
        </Link>

        <Link href="/compatibility" className="flex items-center gap-1 text-emerald-400 hover:text-white font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Printer Cartridge Finder</span>
        </Link>

        <Link href="/catalog?in_stock=true" className="hover:text-amber-400 transition-colors text-amber-300 font-bold">
          Today&apos;s Deals
        </Link>


        <Link href="/contact" className="hover:text-amber-400 transition-colors">
          Customer Service
        </Link>


      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#131921] border-t border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Search Rastogi Cartridge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded bg-white text-slate-900 text-xs"
            />
            <button
              type="submit"
              className="w-full bg-amber-400 text-slate-950 font-bold py-2 rounded text-xs"
            >
              Search Catalog
            </button>
          </form>

          <div className="flex flex-col gap-2 text-xs font-semibold text-slate-200">
            <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)}>All Categories</Link>
            <Link href="/catalog?category=printer-cartridges" onClick={() => setIsMobileMenuOpen(false)}>Cartridges & Toners</Link>
            <Link href="/catalog?category=monitors" onClick={() => setIsMobileMenuOpen(false)}>Monitors & Displays</Link>
            <Link href="/catalog?category=keyboards" onClick={() => setIsMobileMenuOpen(false)}>Keyboards & Mice</Link>
            <Link href="/catalog?category=desktops" onClick={() => setIsMobileMenuOpen(false)}>Desktops & Hardware</Link>
            <Link href="/compatibility" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-400 font-bold">Printer Cartridge Finder</Link>
          </div>
        </div>
      )}

    </header>
  );
}
