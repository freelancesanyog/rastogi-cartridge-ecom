"use client";

import { useState } from "react";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

export interface ProductImage {
  id?: number;
  image: string;
  alt_text?: string;
  is_primary?: boolean;
}

export default function ProductImageGallery({
  images,
  primaryImage,
  productName,
}: {
  images: ProductImage[];
  primaryImage?: ProductImage | null;
  productName: string;
}) {
  const allImages = images && images.length > 0 ? images : primaryImage ? [primaryImage] : [];
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentImage = allImages?.[selectedIndex] || allImages?.[0];

  return (
    <div className="space-y-4">
      
      {/* Main Reserved Aspect Ratio Image Frame (Zero CLS) */}
      <div className="relative aspect-square w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex items-center justify-center">
        {currentImage?.image ? (
          <Image
            src={getImageUrl(currentImage.image)}
            alt={currentImage.alt_text || productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-contain p-6 transition-all duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 space-y-2">
            <ImageIcon className="w-16 h-16 stroke-1" />
            <span className="text-xs font-medium">No Image Available</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images && images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border overflow-hidden transition-all shrink-0 ${
                selectedIndex === idx
                  ? "border-indigo-600 ring-2 ring-indigo-600/30 scale-95"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-400 opacity-70"
              }`}
            >
              <Image
                src={getImageUrl(img.image)}
                alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
