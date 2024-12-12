import React, { useState } from "react";
import { Rating } from "@/types";

interface ReferenceRatingProps {
  onSubmit: (rating: Rating) => void;
  initialRating?: Rating;
}

export function ReferenceRating({
  onSubmit,
  initialRating,
}: ReferenceRatingProps) {
  const [score, setScore] = useState(initialRating?.score || 0);
  const [comment, setComment] = useState(initialRating?.comment || "");
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  const handleSubmit = () => {
    if (score === 0) {
      alert("평가 점수를 선택해주세요.");
      return;
    }

    onSubmit({
      score,
      comment: comment.trim() || undefined,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-gray-700">레퍼런스 평가</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setScore(value)}
              className={`w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-200 ${
                  score >= value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => setIsCommentOpen(!isCommentOpen)}
          className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
        >
          {isCommentOpen ? "코멘트 접기" : "코멘트 작성하기"}
        </button>

        {isCommentOpen && (
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="평가에 대한 코멘트를 작성해주세요 (선택사항)"
            className="w-full h-24 px-3 py-2 text-sm border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none"
          />
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={score === 0}
        className={`w-full py-2 rounded-lg font-medium transition-colors
          ${
            score === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
      >
        평가 제출
      </button>
    </div>
  );
}
