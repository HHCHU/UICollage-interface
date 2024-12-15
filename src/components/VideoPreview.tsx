import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";

interface ImageData {
  id: string;
  preview: string;
}

interface VideoPreviewProps {
  images: ImageData[];
  onVideoEdit: (inputImages: File[]) => void;
  onRemove: (id: string) => void;
  video: File | null;
  isLoading: boolean;
}

export function VideoPreview({
  images,
  onVideoEdit,
  onRemove,
  video,
  isLoading,
}: VideoPreviewProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [chosenTimes, setChosenTimes] = useState<Array<number | null>>([
    null,
    null,
    null,
  ]);
  const [chosenPreviews, setChosenPreviews] = useState<Array<string | null>>([
    null,
    null,
    null,
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [duration, setDuration] = useState(0);

  const videoURL = useMemo(() => {
    if (!video) return "";
    return URL.createObjectURL(video);
  }, [video]);

  useEffect(() => {
    return () => {
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, [videoURL]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const capturePreview = (time: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) {
        resolve("");
        return;
      }
      const videoEl = videoRef.current;
      const canvasEl = canvasRef.current;

      videoEl.currentTime = time;
      videoEl.onseeked = () => {
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        const ctx = canvasEl.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
        const dataUrl = canvasEl.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
      };
    });
  };

  const markFrameForSlot = async (slotIndex: number) => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const previewUrl = await capturePreview(currentTime);
    setChosenTimes((prev) => {
      const newTimes = [...prev];
      newTimes[slotIndex] = currentTime;
      return newTimes;
    });
    setChosenPreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews[slotIndex] = previewUrl;
      return newPreviews;
    });
  };

  const captureFrame = (time: number): Promise<File> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) {
        resolve(new File([], "empty.jpg"));
        return;
      }
      const videoEl = videoRef.current;
      const canvasEl = canvasRef.current;

      videoEl.currentTime = time;
      videoEl.onseeked = () => {
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        const ctx = canvasEl.getContext("2d");
        if (!ctx) {
          resolve(new File([], "empty.jpg"));
          return;
        }
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
        canvasEl.toBlob(
          (blob) => {
            if (blob) {
              const file = new File(
                [blob],
                `frame-${Math.round(time * 1000)}.jpg`,
                {
                  type: "image/jpeg",
                }
              );
              resolve(file);
            } else {
              resolve(new File([], "empty.jpg"));
            }
          },
          "image/jpeg",
          0.9
        );
      };
    });
  };

  const handleSave = async () => {
    const times = chosenTimes.filter((t) => t !== null) as number[];
    if (times.length < 3) return;

    const files: File[] = [];
    for (const t of times) {
      const file = await captureFrame(t);
      files.push(file);
    }

    onVideoEdit(files);
    setShowEditModal(false);
    setChosenTimes([null, null, null]);
    setChosenPreviews([null, null, null]);
  };

  const removeAll = () => {
    images.forEach((image) => onRemove(image.id));
  };

  const canSave = chosenTimes.filter((t) => t !== null).length === 3;

  return (
    <div className="h-full flex flex-col">
      <div
        className="grid grid-cols-3 gap-2 p-2 group relative
        rounded-xl overflow-hidden border-2
        hover:border-blue-300 transition-all duration-200 bg-white
        cursor-pointer hover:scale-[1.02] box-border"
        onClick={(e) => {
          e.stopPropagation();
          if (!video) alert("Please upload the video first.");
          if (isLoading) return;
          setShowEditModal(true);
        }}
      >
        {images.map((image, idx) => (
          <div
            key={image.id}
            className="relative rounded-xl border border-gray-200"
            style={{ aspectRatio: "9/16" }}
          >
            <div
              className="absolute top-2 left-2 z-10 bg-blue-500 text-white 
            rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium"
            >
              {idx + 1}
            </div>
            <div className="relative w-full h-full">
              <Image
                src={image.preview}
                alt="Input image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
        ))}
        {[...Array(3 - images.length)].map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 
          flex flex-col items-center justify-center relative gap-1 aspect-[9/16]"
          >
            <div
              className="absolute top-2 left-2 z-10 bg-gray-300 text-white 
          rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium"
            >
              {images.length + index + 1}
            </div>
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs text-gray-400 text-center">
              {images.length + index + 1}번째
              <br />
              이미지
            </span>
          </div>
        ))}
        {images.length > 0 && !isLoading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeAll();
            }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1
                opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-0"
          >
            <svg
              className="w-4 h-4"
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
        )}
      </div>

      {showEditModal && video && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center
        p-4 max-h-screen overflow-y-auto"
        >
          <div className="relative w-full max-w-3xl bg-white rounded-lg p-6 flex flex-col gap-6">
            <button
              className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full p-2"
              onClick={() => {
                setShowEditModal(false);
                setChosenTimes([null, null, null]);
                setChosenPreviews([null, null, null]);
              }}
            >
              <svg
                className="w-4 h-4 text-gray-600"
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

            <h2 className="text-xl font-semibold text-gray-700">
              Video Marker
            </h2>

            <video
              ref={videoRef}
              src={videoURL}
              className="w-full border rounded h-64 bg-black"
              onLoadedMetadata={handleLoadedMetadata}
              controls
            />

            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((slotIndex) => {
                const preview = chosenPreviews[slotIndex];
                const isMarked = preview !== null;
                return (
                  <div key={slotIndex} className="flex flex-col items-center">
                    <div className="border border-gray-200 rounded w-full h-48 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                      {preview ? (
                        // Display chosen preview image
                        <Image
                          src={preview}
                          alt={`Marked frame ${slotIndex + 1}`}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Image {slotIndex + 1} Empty
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => markFrameForSlot(slotIndex)}
                      className="mt-2 px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 
                      text-white text-sm rounded-lg"
                    >
                      {isMarked
                        ? `Edit Mark ${slotIndex + 1}`
                        : `Add Mark ${slotIndex + 1}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`px-4 py-2 rounded text-white rounded-lg ${
                  canSave
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Save
              </button>
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </div>
      )}
    </div>
  );
}
