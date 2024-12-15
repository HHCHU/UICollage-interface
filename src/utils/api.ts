import { APIResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://143.248.48.96:7887";
const BASELINE_ENDPOINT = "/calculation-baseline";
const OUR_MODEL_ENDPOINT = "/calculation";

// 서버 연결 검증용 ping
export const pingServer = async (): Promise<string> => {
  try {
    console.log("Pinging server...");
    const response = await fetch(`${API_URL}/ping`);
    const data: APIResponse = await response.json();
    console.log("Ping Response:", data.message);
    return data.message;
  } catch (error) {
    console.error("Ping Error:", error);
    throw error;
  }
};

// 테스트용 이미지 요청
export const sendImageTest = async (): Promise<string[]> => {
  try {
    console.log("Requesting test images from server...");
    const response = await fetch(`${API_URL}/calculation-test`, {
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
    console.log("Test images received successfully");

    if (!data.images || data.images.length !== 9) {
      throw new Error("Invalid response format from server");
    }

    return data.images;
  } catch (error) {
    console.error("Error in test request:", error);
    throw error;
  }
};

// 실제 이미지 처리 요청
export const sendImages = async (
  files: File[],
  useBaseline: boolean = false
): Promise<string[]> => {
  try {
    console.log("Converting files to base64...");
    const base64Images = await Promise.all(files.map(fileToBase64));
    console.log("Files converted successfully");

    const endpoint = useBaseline ? BASELINE_ENDPOINT : OUR_MODEL_ENDPOINT;
    console.log(
      `Sending images to server using ${
        useBaseline ? "baseline" : "our"
      } model...`
    );

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ images: base64Images }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error:", response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Server response received");

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

// 이미지를 base64로 변환
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let width = img.width;
      let height = img.height;
      const maxSize = 800;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
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
