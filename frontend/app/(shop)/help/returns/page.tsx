import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Replacement Policy | Rastogi Cartridge",
  description: "Read about our 30-day money-back guarantee and hassle-free defective cartridge replacement process.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Return & Replacement Policy</h1>
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">30-Day Money-Back Guarantee</h3>
        <p>If you are not 100% satisfied with your cartridge or tech supply purchase, you can return unopened items within 30 days of delivery for a full refund.</p>

        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Defective Cartridge Replacement</h3>
        <p>In the rare event of a defective or unrecognized cartridge chip, contact support with your order number. We will dispatch a replacement free of charge.</p>
      </div>
    </div>
  );
}
