import React, { useState } from "react";

interface VideoUploaderProps {
  onVideoUpload: (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>
  ) => void;
  disabled: boolean;
}

export function VideoUploader({ onVideoUpload, disabled }: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div className="h-full flex flex-col" onDragEnter={handleDrag}>
      <label
        htmlFor="video-upload"
        className={`flex-1 flex items-center justify-center w-full min-h-0
          border-2 ${
            dragActive ? "border-blue-400 bg-blue-50" : "border-blue-200"
          } 
          border-dashed rounded-lg cursor-pointer 
          bg-gray-50 hover:bg-blue-50 transition-colors
          ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          handleDrag(e);
          onVideoUpload(e);
        }}
      >
        <div className="flex flex-col items-center gap-2 p-4">
          <svg
            className="w-6 h-6 text-blue-500 shrink-0"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="text-xs text-gray-500 text-center">
            <span className="font-semibold">클릭하여 업로드</span>
            <br />
            또는 드래그앤 드롭
          </p>
        </div>
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={(e) => {
            onVideoUpload(e);
            (e.target as HTMLInputElement).value = "";
          }}
          className="hidden"
        />
      </label>
    </div>
  );
}
