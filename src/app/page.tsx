"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { ImagePreview } from "@/components/ImagePreview";
import { ResultSection } from "@/components/ResultSection";
import { ImageData } from "@/types";

export default function Home() {
  const [inputImages, setInputImages] = useState<ImageData[]>([]);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement> | DragEvent
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

  const removeImage = (idToRemove: string) => {
    setInputImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  const handleSubmit = async () => {
    if (inputImages.length !== 3) {
      alert("3개의 이미지를 모두 선택해주세요.");
      return;
    }

    setIsLoading(true);

    // 임시 결과 데이터
    setTimeout(() => {
      setResultImages([
        "/placeholder1.jpg",
        "/placeholder2.jpg",
        "/placeholder3.jpg",
      ]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <main className="max-w-[1440px] mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">UICollage</h1>

        <div className="flex gap-12">
          <section className="w-[45%] bg-white rounded-2xl shadow-lg p-8">
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
              disabled={isLoading || inputImages.length !== 3}
              className="mt-8 px-8 py-3 bg-blue-500 text-white rounded-lg 
                disabled:bg-gray-300 hover:bg-blue-600 transition-colors
                font-medium w-full shadow-md disabled:shadow-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  분석 중...
                </span>
              ) : (
                "이미지 분석하기"
              )}
            </button>
          </section>

          <ResultSection images={resultImages} />
        </div>
      </main>
    </div>
  );
}
