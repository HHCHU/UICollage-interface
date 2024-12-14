import { GeminiMessage, GeminiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getUXFeedback(
  imageUrls: string[],
  prompt?: string,
  isReference: boolean = false
): Promise<string> {
  try {
    const processedImages = await Promise.all(
      imageUrls.map(async (url) => {
        if (url.startsWith("data:")) {
          return url;
        }
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      })
    );

    const response = await fetch(`/api/ux-feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: processedImages,
        prompt,
        isReference,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "디자인 분석 중 오��가 발생했습니다.");
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("디자인 분석 중 오류:", error);
    throw error;
  }
}

export async function chatWithUXAgent(
  messages: { role: string; content: string }[],
  imageUrls: string[]
): Promise<string> {
  try {
    const processedImages = await Promise.all(
      imageUrls.map(async (url) => {
        if (url.startsWith("data:")) {
          return url;
        }
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      })
    );

    const response = await fetch(`/api/ux-feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: processedImages,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "디자인 분석 중 오류가 발생했습니다.");
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("디자인 에이전트 응답 생성 중 오류:", error);
    throw error;
  }
}
