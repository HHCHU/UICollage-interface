export async function getUXFeedback(
  imageUrls: string[],
  prompt?: string,
  isReference: boolean = false
) {
  try {
    const response = await fetch("/api/ux-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: imageUrls,
        prompt,
        analysisType: isReference ? "reference" : "initial",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "API 요청 실패");
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.text;
  } catch (error) {
    console.error("UX Feedback API Error:", error);
    throw error;
  }
}

export async function chatWithUXAgent(
  messages: { role: string; content: string }[],
  imageUrls?: string[]
) {
  try {
    const response = await fetch("/api/ux-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: imageUrls,
        messages,
        analysisType: "chat",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "API 요청 실패");
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.text;
  } catch (error) {
    console.error("Chat API Error:", error);
    throw error;
  }
}
