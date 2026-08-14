import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | Rastogi Cartridge",
  description: "Learn about shipping timelines, dispatch rules, and Cash-on-Delivery payment terms.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Shipping Policy</h1>
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Same-Day Dispatch</h3>
        <p>Orders placed before 2:00 PM EST Monday through Friday are dispatched on the same business day.</p>

        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cash-on-Delivery (COD) Guidelines</h3>
        <p>For Cash-on-Delivery orders, please ensure exact cash is available at the delivery location. Orders up to $50,000 are eligible for COD delivery.</p>

        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Tracking Your Order</h3>
        <p>Once your order is handed over to our courier partner, you can track real-time delivery status under your Account &gt; My Orders section.</p>
      </div>
    </div>
  );
}
