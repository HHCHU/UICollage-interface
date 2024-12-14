import { NextRequest, NextResponse } from "next/server";
import { GeminiMessage } from "@/types/api";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

const BASE_SYSTEM_PROMPT = `당신은 모바일 앱 UI/UX 디자인을 전문으로 하는 UX 연구원입니다. 
사용자와 협력적으로 소통하며, 시퀀스 기반 UI 개선을 위한 실질적인 조언을 제공합니다. 
항상 친근하고 전문적인 한국어로 대화하며, 구체적인 예시를 들어 설명합니다.`;

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
    }

    const body = await request.json();
    console.log("Received request body:", body);

    const { images, prompt, isReference, messages } = body;

    // 이미지 검증
    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "이미지 데이터가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 이미지 데이터 형식 검증
    for (const image of images) {
      if (!image.startsWith("data:image")) {
        console.error("Invalid image format:", image.substring(0, 100));
        return NextResponse.json(
          {
            error:
              "이미지 형식이 올바르지 않습니다. Base64 데이터 URL이 필요합니다.",
          },
          { status: 400 }
        );
      }
    }

    let userPrompt = BASE_SYSTEM_PROMPT;

    // 채팅 메시지가 있는 경우 이전 대화 내용 포함
    if (messages && Array.isArray(messages)) {
      userPrompt +=
        "\n\n이전 대화 내용:\n" +
        messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    }

    // 새로운 프롬프트 추가
    userPrompt +=
      "\n\n" +
      (prompt ||
        (isReference
          ? "이 레퍼런스 이미지들을 분석하고 UX 관점에서 피드백을 제공해주세요."
          : "이 UI 디자인들을 분석하고 UX 관점에서 피드백을 제공해주세요."));

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userPrompt },
            ...images.map((url: string) => ({
              inline_data: {
                mime_type: "image/jpeg",
                data: url.split(",")[1],
              },
            })),
          ],
        },
      ],
      generation_config: {
        temperature: 0.7,
        top_k: 40,
        top_p: 0.95,
        max_output_tokens: 2048,
      },
    };

    console.log("Sending request to Gemini API...");
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("Gemini API response:", responseText);

    if (!response.ok) {
      console.error("Gemini API Error:", responseText);
      throw new Error(
        `Gemini API 호출 중 오류가 발생했습니다: ${response.status}`
      );
    }

    const data = JSON.parse(responseText);

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("Invalid Gemini API response format:", data);
      throw new Error("Gemini API 응답 형식이 올바르지 않습니다.");
    }

    return NextResponse.json({
      analysis: data.candidates[0].content.parts[0].text,
    });
  } catch (error) {
    console.error("Detailed API Error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "디자인 분석 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
