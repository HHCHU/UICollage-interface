"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { ImagePreview } from "@/components/ImagePreview";
import { ResultSection } from "@/components/ResultSection";
import { ImageData, Rating, ReferenceSet } from "@/types";
import { ServerConfig } from "@/types/api";
import { sendImages } from "@/utils/api";
import { saveReferenceSet, saveRating } from "@/utils/firebase";
import { useSearchParams } from "next/navigation";
import { UXAgentChat } from "@/components/UXAgentChat";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-500">
          UI Collage
        </h1>
        <div className="flex gap-8">
          <Suspense fallback={<div>Loading...</div>}>
            <HomeContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user") || "anonymous";

  const [inputImages, setInputImages] = useState<ImageData[]>([]);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalyzedImages, setLastAnalyzedImages] = useState<string[]>([]);
  const [currentReferenceSet, setCurrentReferenceSet] =
    useState<ReferenceSet | null>(null);
  const [shouldStartAnalysis, setShouldStartAnalysis] = useState(false);

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

    const currentImageIds = inputImages
      .map((img) => img.id)
      .sort()
      .join(",");
    if (currentImageIds === lastAnalyzedImages.sort().join(",")) {
      return;
    }

    // 분석 시작 전에 먼저 로딩 상태를 true로 설정
    setIsLoading(true);
    setShouldStartAnalysis(true);
    // 결과 이미지를 초기화하여 로딩 UI가 보이도록 함
    setResultImages([]);

    try {
      // 1. 서버에 이미지 분석 요청
      const images = await sendImages(inputImages.map((img) => img.file));

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
        referenceImages: resultImageUrls.map((url: string, i: number) => ({
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
      setShouldStartAnalysis(false);
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
    <div className="container mx-auto px-8">
      <div className="flex gap-8 h-[calc(100vh-8rem)]">
        <div className="w-[55%] flex flex-col gap-4">
          <section className="bg-white rounded-2xl shadow-lg p-6 h-[calc(45%-0.5rem)]">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
              입력 이미지
              <span className="text-sm font-normal text-gray-500">
                ({inputImages.length}/3)
              </span>
            </h2>

            <div className="flex gap-4 h-[calc(100%-6rem)]">
              <div className="w-[50%]">
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  disabled={inputImages.length >= 3}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isAnalyzeDisabled}
                  className={`mt-2 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
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
              </div>

              <div className="w-[65%] h-full">
                <ImagePreview images={inputImages} onRemove={removeImage} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6 h-[calc(55%-0.5rem)]">
            <ResultSection
              images={resultImages}
              hasValidInput={inputImages.length === 3}
              isLoading={isLoading}
              onRate={handleRating}
              initialRating={currentReferenceSet?.rating}
            />
          </section>
        </div>

        <section className="w-[45%] bg-white rounded-2xl shadow-lg p-6 h-full">
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-semibold 4 text-gray-700">
              에이전트 조언
            </h2>
            <div className="flex-1 overflow-hidden">
              {inputImages.length > 0 ? (
                <UXAgentChat
                  userId={userId}
                  inputImages={inputImages}
                  referenceImages={resultImages}
                  shouldStartAnalysis={shouldStartAnalysis}
                  onError={(error) => {
                    console.error("UX Agent Error:", error);
                    alert("UX 에이전트와의 대화 중 오류가 발생했습니다.");
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400 text-center">
                    이미지를 업로드하면 UX 연구원이 조언을 제공합니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
