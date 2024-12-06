import React from "react";
import Image from "next/image";

interface ResultSectionProps {
  images: string[];
}

export function ResultSection({ images }: ResultSectionProps) {
  return (
    <section className="w-[55%] bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-700">결과 이미지</h2>
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative rounded-xl overflow-hidden shadow-md 
                border-2 border-blue-100"
              style={{ aspectRatio: "9/16" }}
            >
              <Image
                src={image}
                alt={`Result image ${index + 1}`}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[calc(100%-4rem)] flex items-center justify-center">
          <p className="text-gray-400">
            이미지를 업로드하고 레퍼런스를 찾아보세요
          </p>
        </div>
      )}
    </section>
  );
}
