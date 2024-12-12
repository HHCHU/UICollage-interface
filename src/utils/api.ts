import { APIResponse, ServerConfig } from "@/types/api";

export const getBaseURL = (config: ServerConfig) => {
  return config.host;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // 이미지 크기 조정
      let width = img.width;
      let height = img.height;
      const maxSize = 800; // 최대 크기 제한

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // 흰색 배경으로 캔버스를 채워서 알파 채널 제거
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG 품질을 0.7로 설정하여 압축
        const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
};

export const pingServer = async (config: ServerConfig): Promise<string> => {
  const response = await fetch(`${getBaseURL(config)}/ping`);
  const data: APIResponse = await response.json();
  return data.message;
};

export const sendImageTest = async (
  config: ServerConfig
): Promise<string[]> => {
  const response = await fetch(`${getBaseURL(config)}/calculation-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: APIResponse = await response.json();

  if (!data.images || data.images.length !== 9) {
    throw new Error("Invalid response format from server");
  }

  return data.images;
};

export const sendImages = async (
  files: File[],
  config: ServerConfig
): Promise<string[]> => {
  try {
    // 디버깅을 위한 로그
    console.log("Converting files to base64...");
    const base64Images = await Promise.all(files.map(fileToBase64));
    console.log("Files converted successfully");

    const response = await fetch(`${getBaseURL(config)}/calculation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ images: base64Images }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (
      !data.images ||
      !Array.isArray(data.images) ||
      data.images.length !== 9
    ) {
      throw new Error("Invalid response format from server");
    }

    return data.images;
  } catch (error) {
    console.error("Error in sendImages:", error);
    throw error;
  }
};
