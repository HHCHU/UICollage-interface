import React from "react";
import Image from "next/image";

interface ResultSectionProps {
  images: string[];
}

export function ResultSection({ images }: ResultSectionProps) {
  // 이미지를 3개씩 그룹화하는 함수
  const groupedImages = images.reduce((acc: string[][], curr, i) => {
    if (i % 3 === 0) acc.push([]);
    acc[Math.floor(i / 3)].push(curr);
    return acc;
  }, []);

  return (
    <section className="w-[55%] bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-700">
        레퍼런스 결과
      </h2>
      {images.length > 0 ? (
        <div className="space-y-8">
          {groupedImages.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">
                레퍼런스 세트 {groupIndex + 1}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {group.map((image, index) => (
                  <div
                    key={index}
                    className="relative rounded-xl overflow-hidden shadow-md 
                      border-2 border-blue-100 hover:border-blue-300 transition-colors"
                    style={{ aspectRatio: "9/16" }}
                  >
                    <Image
                      src={image}
                      alt={`Result image ${groupIndex * 3 + index + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
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
