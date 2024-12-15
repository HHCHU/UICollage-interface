import React, { useState } from "react";
import Image from "next/image";
import { ImageData } from "../types";

interface ImagePreviewProps {
  images: ImageData[];
  onRemove: (id: string) => void;
  isLoading: boolean;
}

export function ImagePreview({
  images,
  onRemove,
  isLoading,
}: ImagePreviewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleNavigateImage = (direction: "prev" | "next") => {
    if (!selectedImage) return;

    const currentIndex = images.findIndex(
      (img) => img.preview === selectedImage
    );

    if (direction === "prev" && currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1].preview);
    } else if (direction === "next" && currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1].preview);
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 h-full">
        {images.map((image, idx) => (
          <div
            key={image.id}
            className="group relative rounded-xl overflow-hidden shadow-md border-2 
              border-blue-100 hover:border-blue-300 transition-all duration-200 
              cursor-pointer hover:scale-[1.02] aspect-[9/16]"
            onClick={() => setSelectedImage(image.preview)}
          >
            <div
              className="absolute top-2 left-2 z-10 bg-blue-500 text-white 
              rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium"
            >
              {idx + 1}
            </div>
            <div className="relative w-full h-full">
              <Image
                src={image.preview}
                alt="Input image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            {!isLoading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(image.id);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1
              opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <svg
                  className="w-3 h-3"
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
            )}
          </div>
        ))}
        {[...Array(3 - images.length)].map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 
              flex flex-col items-center justify-center relative gap-1 aspect-[9/16]"
          >
            <div
              className="absolute top-2 left-2 z-10 bg-gray-300 text-white 
              rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium"
            >
              {images.length + index + 1}
            </div>
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs text-gray-400 text-center">
              {images.length + index + 1}번째
              <br />
              이미지
            </span>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-3xl h-[80vh]">
            <Image
              src={selectedImage}
              alt="확대된 이미지"
              fill
              className="object-contain"
            />

            {/* 네비게이션 버튼 */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
              {images.findIndex((img) => img.preview === selectedImage) > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateImage("prev");
                  }}
                  className="bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              {images.findIndex((img) => img.preview === selectedImage) <
                images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateImage("next");
                  }}
                  className="bg-white/80 hover:bg-white rounded-full p-2 transition-colors ml-auto"
                >
                  <svg
                    className="w-6 h-6 text-gray-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* 기존 닫기 버튼 */}
            <button
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg
                hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <svg
                className="w-6 h-6 text-gray-600"
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
        </div>
      )}
    </>
  );
}
