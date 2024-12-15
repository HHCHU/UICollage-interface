"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { ImagePreview } from "@/components/ImagePreview";
import { ResultSection } from "@/components/ResultSection";
import { ImageData, Rating, ReferenceSet, TabName, VideoData } from "@/types";
import { ServerConfig } from "@/types/api";
import { sendImages } from "@/utils/api";
import { saveReferenceSet, saveRating } from "@/utils/firebase";
import { useSearchParams } from "next/navigation";
import { UXAgentChat } from "@/components/UXAgentChat";
import TabController from "@/components/TabController";
import { VideoUploader } from "@/components/VideoUploader";
import { VideoPreview } from "@/components/VideoPreview";
import SubmitButton from "@/components/SubmitButton";

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
  const inputVideoRef = useRef<VideoData | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalyzedImages, setLastAnalyzedImages] = useState<string[]>([]);
  const [currentReferenceSet, setCurrentReferenceSet] =
    useState<ReferenceSet | null>(null);
  const [shouldStartAnalysis, setShouldStartAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName.Image | TabName.Video>(
    TabName.Image
  );

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

      if (inputImages.length <= 1) {
        setResultImages([]);
        setLastAnalyzedImages([]);
        setCurrentReferenceSet(null);
      }
    },
    [inputImages.length]
  );

  const removeVideo = useCallback(() => {
    if (inputVideoRef.current) {
      URL.revokeObjectURL(inputVideoRef.current.preview);
      inputVideoRef.current = null;
    }
    setInputImages([]);
    setResultImages([]);
    setLastAnalyzedImages([]);
    setCurrentReferenceSet(null);
  }, [inputVideoRef.current]);

  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>
  ) => {
    e.preventDefault();

    const files =
      "dataTransfer" in e
        ? Array.from(e.dataTransfer?.files || [])
        : Array.from(e.target.files || []);

    if (files.length === 0) return;
    const videoFile = files[0];
    if (!videoFile.type.startsWith("video/")) {
      alert("비디오 파일을 업로드해주세요.");
      return;
    }
    if (videoFile.size > 50 * 1024 * 1024) {
      alert("파일 크기가 50MB를 초과합니다.");
      return;
    }

    // 이전 이미지 삭제
    inputImages.forEach((image) => URL.revokeObjectURL(image.preview));
    if (inputVideoRef.current)
      URL.revokeObjectURL(inputVideoRef.current.preview);
    inputVideoRef.current = null;

    // Ref에 File 클래스 저장
    inputVideoRef.current = {
      file: videoFile,
      preview: URL.createObjectURL(videoFile),
      id: Math.random().toString(36).substr(2, 9),
    };

    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);
    video.preload = "metadata";
    video.muted = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        resolve();
      };
      video.onerror = (err) => {
        reject(err);
      };
    });

    const duration = video.duration;
    if (isNaN(duration) || duration <= 0) {
      alert("비디오 정보를 불러올 수 없습니다.");
      return;
    }

    const captureTimes = [0, duration / 2, duration - 0.1];

    const captureFrame = (time: number): Promise<string> => {
      return new Promise((resolve) => {
        video.currentTime = time;
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("");
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL("image/jpeg", 0.9);
          resolve(dataURL);
        };
      });
    };

    const frames = [];
    for (const t of captureTimes) {
      const frameDataURL = await captureFrame(t);
      frames.push(frameDataURL);
    }

    const newImageData: ImageData[] = frames.map((dataUrl) => ({
      file: videoFile,
      preview: dataUrl,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setInputImages(newImageData.slice(0, 3));
    URL.revokeObjectURL(video.src);
  };

  const handleVideoEdit = (inputImages: File[]) => {
    const newImageData: ImageData[] = inputImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));

    setInputImages(newImageData.slice(0, 3));
  };

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

      const resultImageUrls = images.map(
        (img) => `data:image/jpg;base64,${img}`
      );

      setResultImages(resultImageUrls);
      setLastAnalyzedImages(inputImages.map((img) => img.id));

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

  const isAnalyzeDisabled =
    isLoading ||
    inputImages.length !== 3 ||
    (lastAnalyzedImages.length > 0 &&
      inputImages
        .map((img) => img.id)
        .sort()
        .join(",") === lastAnalyzedImages.sort().join(","));

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
          <section className="bg-white rounded-2xl shadow-lg p-6 h-[calc(50%-0.5rem)]">
            <TabController activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === TabName.Image && (
              <div id="image-tab" className="flex flex-col">
                <h2 className="text-m font-semibold mb-4 text-gray-700 flex items-center gap-2">
                  입력 이미지
                  <span className="text-sm font-normal text-gray-500">
                    ({inputImages.length}/3)
                  </span>
                </h2>

                <div className="flex gap-4">
                  <div className="w-2/5 flex flex-col gap-4">
                    <ImageUploader
                      onImageUpload={handleImageUpload}
                      disabled={inputImages.length >= 3}
                    />
                    <SubmitButton
                      handleSubmit={handleSubmit}
                      isAnalyzeDisabled={isAnalyzeDisabled}
                      isLoading={isLoading}
                      inputImages={inputImages}
                    />
                  </div>

                  <div className="w-3/5">
                    <ImagePreview
                      images={inputImages}
                      onRemove={removeImage}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === TabName.Video && (
              <div id="image-tab" className="flex flex-col">
                <h2 className="text-m font-semibold mb-4 text-gray-700 flex items-center gap-2">
                  입력 비디오
                </h2>
                <div className="flex gap-4">
                  <div className="w-2/5 flex flex-col gap-4">
                    <VideoUploader
                      onVideoUpload={handleVideoUpload}
                      disabled={inputImages.length >= 3}
                    />
                    <SubmitButton
                      handleSubmit={handleSubmit}
                      isAnalyzeDisabled={isAnalyzeDisabled}
                      isLoading={isLoading}
                      inputImages={inputImages}
                    />
                  </div>

                  <div className="w-3/5">
                    <VideoPreview
                      images={inputImages}
                      video={inputVideoRef.current}
                      onVideoEdit={handleVideoEdit}
                      onRemove={removeVideo}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
          <section className="bg-white rounded-2xl shadow-lg p-6 h-[calc(50%-0.5rem)]">
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
