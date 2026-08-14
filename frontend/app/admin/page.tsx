"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  ShoppingBag,
  Package,
  AlertTriangle,
  Plus,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Store,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "orders">("products");

  const DJANGO_ADMIN_URL = "http://127.0.0.1:8001/admin/";

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        fetchApi("/catalog/products/"),
        fetchApi("/catalog/categories/"),
      ]);
      setProducts(prodData.results || prodData || []);
      setCategories(catData.results || catData || []);
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 select-none pb-12">

      {/* Top Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Return to Rastogi Cartridge Shop"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-black">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white leading-tight">
                  Rastogi Cartridge <span className="text-amber-400 text-xs font-bold uppercase bg-amber-400/10 px-1.5 py-0.5 rounded ml-1">Admin Portal</span>
                </h1>
                <p className="text-[10px] text-slate-400">Management & Catalog Control Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Data</span>
            </button>

            <a
              href={`${DJANGO_ADMIN_URL}catalog/product/add/`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-400/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </a>

            <a
              href={DJANGO_ADMIN_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Django Admin (Port 8001)</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1500px] mx-auto px-4 py-8 space-y-8">

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">₹1,48,500</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14.2% from last week
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">154 Orders</p>
            <p className="text-[11px] text-amber-400 font-semibold">12 Cash-on-Delivery pending</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">{products.length} Items</p>
            <p className="text-[11px] text-blue-400 font-semibold">Listed in Catalog</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">{categories.length} Categories</p>
            <p className="text-[11px] text-purple-400 font-semibold">Toners, Displays, PCs</p>
          </div>

        </div>

        {/* Django Admin Quick Access Alert */}
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300">Add or Manage Products in Django Admin</h3>
              <p className="text-xs text-slate-300">
                Products added via Django Admin at <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">http://127.0.0.1:8001/admin/catalog/product/</code> will instantly appear on the Rastogi Cartridge storefront.
              </p>
            </div>
          </div>
          <a
            href={`${DJANGO_ADMIN_URL}catalog/product/add/`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Open Django Add Product Form</span>
          </a>
        </div>

        {/* Catalog Table Section */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">

          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("products")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${activeTab === "products" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
              >
                Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${activeTab === "categories" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
              >
                Categories ({categories.length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Table */}
          {activeTab === "products" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        Loading products...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No products found. Click &quot;Add New Product&quot; to add items from Django Admin.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-4 py-3 font-bold text-white max-w-xs truncate">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{product.sku}</td>
                        <td className="px-4 py-3 text-amber-400">{product.brand?.name || "Rastogi"}</td>
                        <td className="px-4 py-3 text-slate-400">{product.category?.name || "General"}</td>
                        <td className="px-4 py-3 font-black text-white">₹{product.price}</td>
                        <td className="px-4 py-3">
                          {product.stock_status?.in_stock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                              <AlertTriangle className="w-3 h-3" /> Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`${DJANGO_ADMIN_URL}catalog/product/${product.id}/change/`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline"
                          >
                            <span>Edit in Admin</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">Slug: {cat.slug}</p>
                  <a
                    href={`${DJANGO_ADMIN_URL}catalog/category/${cat.id}/change/`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline pt-2"
                  >
                    <span>Edit Category in Admin</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
