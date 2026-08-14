import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import QueryProvider from "@/lib/query-provider";
import Link from "next/link";
import { Package, User, MapPin } from "lucide-react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Account Sidebar Navigation */}
            <aside className="md:col-span-1 space-y-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
                  My Account
                </h3>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span>My Orders</span>
                </Link>
                <Link
                  href="/account/profile"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Profile Info</span>
                </Link>
                <Link
                  href="/account/addresses"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Saved Addresses</span>
                </Link>
              </div>
            </aside>

            {/* Account Main Content */}
            <div className="md:col-span-3">{children}</div>

          </div>
        </main>
        <Footer />
      </div>
    </QueryProvider>
  );
}
