"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";

interface Address {
  id: number;
  recipient_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_number: string;
  is_default: boolean;
}

export default function SavedAddressesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: "",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "United States",
    phone_number: "",
    is_default: false,
  });

  const { data: addressesRes, isLoading, refetch } = useQuery({
    queryKey: ["user-addresses"],
    queryFn: () => fetchApi("/users/addresses/"),
  });

  const addresses: Address[] = Array.isArray((addressesRes as { results?: Address[] })?.results)
    ? (addressesRes as { results: Address[] }).results
    : Array.isArray(addressesRes)
    ? (addressesRes as Address[])
    : [];

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetchApi("/users/addresses/", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setShowAddForm(false);
      setFormData({
        recipient_name: "",
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "United States",
        phone_number: "",
        is_default: false,
      });
      refetch();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to add address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    confirmAlert({
      title: "Delete Address",
      message: "Are you sure you want to delete this address?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            try {
              await fetchApi(`/users/addresses/${addressId}/`, {
                method: "DELETE",
              });

              toast.success("Address deleted successfully!");
              refetch();
            } catch (err: unknown) {
              const error = err as Error;
              toast.error(error.message || "Failed to delete address.");
            }
          },
        },
        {
          label: "No",
          onClick: () => toast.info("Delete cancelled"),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Saved Addresses ({addresses.length})
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddAddress} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-md animate-in slide-in-from-top-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">New Delivery Address</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Recipient Name"
              value={formData.recipient_name}
              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <input
              type="text"
              required
              placeholder="Street Address"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <input
              type="text"
              required
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <input
              type="text"
              required
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <input
              type="text"
              required
              placeholder="Postal Code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <input
              type="text"
              required
              placeholder="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="is_default" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
              Set as Default Address
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Address"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No Saved Addresses"
          description="You haven't saved any delivery addresses yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr: Address) => (
            <div
              key={addr.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-sm"
            >
              {addr.is_default && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Default Address</span>
                </span>
              )}
              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{addr.recipient_name}</p>
                <p>{addr.street_address}</p>
                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                <p>{addr.country}</p>
                <p className="pt-1 font-mono">Phone: {addr.phone_number}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
