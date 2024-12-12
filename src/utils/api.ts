import { APIResponse, ServerConfig } from "@/types/api";

export const getBaseURL = (config: ServerConfig) =>
  `${config.ip}:${config.port}`;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // 흰색 배경으로 캔버스를 채워서 알파 채널 제거
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // base64 문자열에서 헤더 제거
        const base64 = canvas.toDataURL("image/jpeg", 1.0).split(",")[1];
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
