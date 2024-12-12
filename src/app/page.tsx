"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { ImagePreview } from "@/components/ImagePreview";
import { ResultSection } from "@/components/ResultSection";
import { ImageData, Rating, ReferenceSet } from "@/types";
import { ServerConfig } from "@/types/api";
import { sendImages } from "@/utils/api";
import { saveReferenceSet, saveRating } from "@/utils/firebase";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user") || "anonymous";

  const [inputImages, setInputImages] = useState<ImageData[]>([]);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalyzedImages, setLastAnalyzedImages] = useState<string[]>([]);
  const [currentReferenceSet, setCurrentReferenceSet] =
    useState<ReferenceSet | null>(null);

  const [serverConfig] = useState<ServerConfig>({
    ip: "http://143.248.48.96",
    port: "7887",
  });

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>
  ) => {
    e.preventDefault();
    let files: File[];

    if ("dataTransfer" in e) {
      files = Array.from(e.dataTransfer?.files || []);
    } else {
      files = Array.from(e.target.files || []);
    }

    if (inputImages.length + files.length > 3) {
      alert("최대 3개의 이미지만 선택할 수 있습니다.");
      return;
    }

    const newImageData = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));

    setInputImages((prev) => [...prev, ...newImageData].slice(0, 3));
  };

  const removeImage = useCallback(
    (idToRemove: string) => {
      setInputImages((prev) => {
        const filtered = prev.filter((img) => img.id !== idToRemove);
        const removedImage = prev.find((img) => img.id === idToRemove);
        if (removedImage) {
          URL.revokeObjectURL(removedImage.preview);
        }
        return filtered;
      });

      // 이미지가 제거되면 결과도 초기화
      if (inputImages.length <= 1) {
        setResultImages([]);
        setLastAnalyzedImages([]);
        setCurrentReferenceSet(null);
      }
    },
    [inputImages.length]
  );

  const handleSubmit = async () => {
    if (inputImages.length !== 3) {
      alert("3개의 이미지를 모두 선택해주세요.");
      return;
    }

    // 현재 이미지 세트가 마지막으로 분석한 것과 동일한지 확인
    const currentImageIds = inputImages
      .map((img) => img.id)
      .sort()
      .join(",");
    if (currentImageIds === lastAnalyzedImages.sort().join(",")) {
      return; // 동일한 이미지 세트면 분석하지 않음
    }

    setIsLoading(true);

    try {
      // 1. 서버에 이미지 분석 요청
      const images = await sendImages(
        inputImages.map((img) => img.file),
        serverConfig
      );

      // 2. 결과 이미지 설정
      const resultImageUrls = images.map(
        (img) => `data:image/jpg;base64,${img}`
      );
      setResultImages(resultImageUrls);
      setLastAnalyzedImages(inputImages.map((img) => img.id));

      // 3. ReferenceSet 생성 및 저장
      const newReferenceSet: ReferenceSet = {
        id: Date.now().toString(),
        inputImages: inputImages.map((img) => ({
          id: img.id,
          url: img.preview,
        })),
        referenceImages: resultImageUrls.map((url, i) => ({
          id: `result-${i}`,
          url,
          setIndex: Math.floor(i / 3),
          imageIndex: i % 3,
        })),
        timestamp: Date.now(),
      };

      await saveReferenceSet(userId, newReferenceSet);
      setCurrentReferenceSet(newReferenceSet);
    } catch (error) {
      console.error("Error:", error);
      alert("서버와의 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async (rating: Rating) => {
    if (!currentReferenceSet) return;

    try {
      await saveRating(userId, currentReferenceSet.id, rating);
      setCurrentReferenceSet({
        ...currentReferenceSet,
        rating,
      });
    } catch (error) {
      console.error("Error saving rating:", error);
      alert("평가 저장 중 오류가 발생했습니다.");
    }
  };

  // 분석 버튼 활성화 조건
  const isAnalyzeDisabled =
    isLoading ||
    inputImages.length !== 3 ||
    (lastAnalyzedImages.length > 0 &&
      inputImages
        .map((img) => img.id)
        .sort()
        .join(",") === lastAnalyzedImages.sort().join(","));

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      inputImages.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [inputImages]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">UICollage</h1>

        <div className="flex gap-8">
          <section className="w-[25%] bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center gap-2">
              입력 이미지
              <span className="text-sm font-normal text-gray-500">
                ({inputImages.length}/3)
              </span>
            </h2>

            <ImageUploader
              onImageUpload={handleImageUpload}
              disabled={inputImages.length >= 3}
            />

            <ImagePreview images={inputImages} onRemove={removeImage} />

            <button
              onClick={handleSubmit}
              disabled={isAnalyzeDisabled}
              className={`mt-8 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                text-white rounded-xl font-medium shadow-lg relative
                disabled:from-gray-300 disabled:to-gray-400 
                hover:from-blue-600 hover:to-blue-700 
                transition-all duration-200
                disabled:shadow-none disabled:cursor-not-allowed
                flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>분석 중...</span>
                </>
              ) : isAnalyzeDisabled && inputImages.length === 3 ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>분석 완료</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>레퍼런스 찾아보기</span>
                </>
              )}
            </button>
          </section>

          <ResultSection
            images={resultImages}
            hasValidInput={inputImages.length === 3}
            isLoading={isLoading}
            onRate={handleRating}
            initialRating={currentReferenceSet?.rating}
          />

          <section className="w-[20%] bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">
              에이전트 토론
            </h2>
            <div className="h-[calc(100%-4rem)] flex items-center justify-center">
              <p className="text-gray-400 text-center">Coming Soon...</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
