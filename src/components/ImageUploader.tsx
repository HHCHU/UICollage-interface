import { useState } from "react";

interface ImageUploaderProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement> | DragEvent) => void;
  disabled: boolean;
}

export function ImageUploader({ onImageUpload, disabled }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div
      className={`mb-6 relative ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      onDragEnter={handleDrag}
    >
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center w-full h-40 
          border-2 ${
            dragActive ? "border-blue-400 bg-blue-50" : "border-blue-200"
          } 
          border-dashed rounded-lg cursor-pointer 
          bg-gray-50 hover:bg-blue-50 transition-colors`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => {
          handleDrag(e);
          onImageUpload(e);
        }}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className="w-8 h-8 mb-4 text-blue-500"
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
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">클릭하여 업로드</span> 또는 드래그
            앤 드롭
          </p>
        </div>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={onImageUpload}
          className="hidden"
        />
      </label>
    </div>
  );
}
