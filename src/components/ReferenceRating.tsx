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
  const [rating, setRating] = useState<number>(initialRating?.score ?? 0);
  const [comment, setComment] = useState<string>(initialRating?.comment ?? "");
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleSubmit = () => {
    if (rating === 0) {
      alert("평가 점수를 선택해주세요.");
      return;
    }

    onSubmit({
      score: rating,
      comment: comment.trim(),
      timestamp: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1"
            >
              <svg
                className={`w-8 h-8 transition-colors ${
                  value <= (hoveredRating || rating)
                    ? "text-blue-400"
                    : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="코멘트를 남겨주세요 (선택사항)"
          className="w-full p-3 border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className={`px-4 py-2 rounded-lg font-medium text-white
            ${
              rating === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } transition-colors`}
        >
          평가 완료
        </button>
      </div>
    </div>
  );
}
