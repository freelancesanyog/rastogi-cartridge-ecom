import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Rastogi Cartridge",
  description: "Find answers to common questions about cartridge compatibility, shipping, payment methods, and return policies.",
};

const faqs = [
  {
    q: "How do I know which cartridge fits my printer?",
    a: "Use our Printer Cartridge Finder on the homepage or header. Simply select your printer brand (e.g. HP, Canon, Epson) and model number, and we will display guaranteed fitting cartridges.",
  },
  {
    q: "What is the difference between OEM and Compatible cartridges?",
    a: "OEM (Original Equipment Manufacturer) cartridges are manufactured by your printer brand. Compatible cartridges are brand-new third-party cartridges built to the exact same specifications at a lower price point.",
  },
  {
    q: "What payment methods are supported?",
    a: "We currently support Cash on Delivery (COD) across all eligible shipping zones. Online payment gateway integration (Cards, UPI, Netbanking) is scheduled for our next update.",
  },
  {
    q: "What is your return policy if a cartridge fails?",
    a: "We offer a 30-day money-back / replacement guarantee on all cartridges. If a cartridge is defective or unrecognized, contact support for a hassle-free replacement.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Answers to common inquiries about orders, fitting, and delivery.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <div key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.q}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
