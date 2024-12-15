import React, { useState } from "react";
import Image from "next/image";
import { ReferenceRating } from "./ReferenceRating";
import { Rating } from "@/types";

interface ResultSectionProps {
  images: string[];
  hasValidInput: boolean;
  isLoading?: boolean;
  onRate?: (rating: Rating) => void;
  initialRating?: Rating;
}

export function ResultSection({
  images,
  hasValidInput,
  isLoading = false,
  onRate,
  initialRating,
}: ResultSectionProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);

  const handleRatingSubmit = (rating: Rating) => {
    onRate?.(rating);
    setShowRating(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">레퍼런스 결과</h2>
        {hasValidInput && images.length > 0 && !isLoading && (
          <button
            onClick={() => setShowRating(true)}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            {initialRating ? "평가 수정하기" : "평가하기"}
          </button>
        )}
      </div>

      {!hasValidInput && images.length > 0 && (
        <p className="text-sm font-normal text-amber-500 mb-4">
          입력 이미지를 모두 선택해주세요
        </p>
      )}

      <div className="flex-1 flex">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg font-medium text-gray-700">
                레퍼런스 검색 중...
              </p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
            </div>
          </div>
        ) : images.length > 0 ? (
          <div className="flex gap-6 w-full">
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTab(index)}
                  disabled={!hasValidInput}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors w-24
                    ${
                      selectedTab === index
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                    ${
                      !hasValidInput
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                >
                  세트 {index + 1}
                </button>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-3 gap-4">
              {images
                .slice(selectedTab * 3, (selectedTab + 1) * 3)
                .map((image, index) => (
                  <div
                    key={index}
                    onClick={() => hasValidInput && setSelectedImage(image)}
                    className={`relative rounded-xl overflow-hidden shadow-md 
                      border-2 border-blue-100 hover:border-blue-300 
                      transition-all duration-200 aspect-[9/16]
                      ${
                        hasValidInput
                          ? "cursor-pointer hover:scale-[1.02]"
                          : "cursor-not-allowed"
                      }`}
                  >
                    <div
                      className="absolute top-2 left-2 z-10 bg-black/20 backdrop-blur-sm text-white/90 
                      rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium"
                    >
                      {index + 1}
                    </div>
                    <div className="relative w-full h-full">
                      <Image
                        src={image}
                        alt={`Result image ${selectedTab * 3 + index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">
              이미지를 업로드하고 레퍼런스를 찾아보세요
            </p>
          </div>
        )}
      </div>

      {showRating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                레퍼런스 평가
              </h3>
              <button
                onClick={() => setShowRating(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
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
            <ReferenceRating
              onSubmit={handleRatingSubmit}
              initialRating={initialRating}
            />
          </div>
        </div>
      )}

      {selectedImage && hasValidInput && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-3xl h-[80vh]">
            <Image
              src={selectedImage}
              alt="Enlarged image"
              fill
              className="object-contain"
            />
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
    </div>
  );
}
