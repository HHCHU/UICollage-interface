import React, { useState } from "react";
import Image from "next/image";

interface ResultSectionProps {
  images: string[];
  hasValidInput: boolean;
  isLoading?: boolean;
}

export function ResultSection({
  images,
  hasValidInput,
  isLoading = false,
}: ResultSectionProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 이미지를 3개씩 그룹화하는 함수
  const groupedImages = images.reduce((acc: string[][], curr, i) => {
    if (i % 3 === 0) acc.push([]);
    acc[Math.floor(i / 3)].push(curr);
    return acc;
  }, []);

  return (
    <section
      className={`w-[55%] bg-white rounded-2xl shadow-lg p-8 transition-all duration-200
        ${!hasValidInput ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center justify-between">
          <span>레퍼런스 결과</span>
          {!hasValidInput && images.length > 0 && (
            <span className="text-sm font-normal text-amber-500">
              입력 이미지를 모두 선택해주세요
            </span>
          )}
        </h2>

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
            <div className="mt-8 flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-20 h-32 bg-gray-100 rounded-lg animate-pulse"
                  style={{
                    animationDelay: `${i * 200}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : images.length > 0 ? (
          <>
            <div className="flex gap-2 mb-6">
              {groupedImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTab(index)}
                  disabled={!hasValidInput}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors
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

            <div className="grid grid-cols-3 gap-4">
              {groupedImages[selectedTab]?.map((image, index) => (
                <div
                  key={index}
                  onClick={() => hasValidInput && setSelectedImage(image)}
                  className={`relative rounded-xl overflow-hidden shadow-md 
                    border-2 border-blue-100 hover:border-blue-300 
                    transition-all duration-200
                    ${
                      hasValidInput
                        ? "cursor-pointer hover:scale-[1.02]"
                        : "cursor-not-allowed"
                    }`}
                  style={{ aspectRatio: "9/16" }}
                >
                  <div
                    className="absolute top-2 left-2 z-10 bg-black/20 backdrop-blur-sm text-white/90 
                    rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium"
                  >
                    {index + 1}
                  </div>
                  <Image
                    src={image}
                    alt={`Result image ${selectedTab * 3 + index + 1}`}
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">
              이미지를 업로드하고 레퍼런스를 찾아보세요
            </p>
          </div>
        )}
      </div>

      {/* 이미지 확대 모달 */}
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
    </section>
  );
}
