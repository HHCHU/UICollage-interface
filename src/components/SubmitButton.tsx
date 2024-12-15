import React from "react";
import { ImageData } from "../types";

interface SubmitButtonProps {
  handleSubmit: () => Promise<void>;

  isAnalyzeDisabled: boolean;

  isLoading: boolean;

  inputImages: ImageData[];
}

export default function SubmitButton({
  handleSubmit,
  isAnalyzeDisabled,
  isLoading,
  inputImages,
}: SubmitButtonProps) {
  return (
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
  );
}
