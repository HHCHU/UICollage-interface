import React from "react";
import Image from "next/image";
import { ImageData } from "../types";

interface ImagePreviewProps {
  images: ImageData[];
  onRemove: (id: string) => void;
}

export function ImagePreview({ images, onRemove }: ImagePreviewProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="group relative rounded-xl overflow-hidden shadow-md border-2 
            border-blue-100 hover:border-blue-300 transition-colors"
          style={{ aspectRatio: "9/16" }}
        >
          <Image
            src={image.preview}
            alt="Input image"
            fill
            className="object-contain"
          />
          <button
            onClick={() => onRemove(image.id)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1
              opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
      {[...Array(3 - images.length)].map((_, index) => (
        <div
          key={`empty-${index}`}
          className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 
            flex items-center justify-center"
          style={{ aspectRatio: "9/16" }}
        >
          <span className="text-gray-400 text-sm">빈 슬롯</span>
        </div>
      ))}
    </div>
  );
}
