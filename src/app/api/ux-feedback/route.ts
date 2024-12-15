import { NextRequest, NextResponse } from "next/server";
import { GeminiMessage } from "@/types/api";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

const BASE_SYSTEM_PROMPT = `당신은 UX 전문가입니다. 다음 규칙을 반드시 따라주세요:
1. 인사말이나 맺음말 없이 핵심적인 UX 평가와 개선점만 제시합니다.
2. 총 6문장 이내의 간단명료한 존댓말로 답변합니다.
3. 제시된 이미지들은 3장씩 하나의 시퀀스(순차적 사용자 플로우)를 구성합니다.`;
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

    // 시나리오별 프롬프트 생성
    if (messages && Array.isArray(messages) && messages.length > 0) {
      // 3. 채팅 지속 시나리오
      const chatContext = messages
        .slice(-3)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
      userPrompt += `\n\n대화 컨텍스트:\n${chatContext}\n\n${prompt}`;
    } else if (isReference) {
      // 2. 레퍼런스 분석 시나리오 (9장의 이미지 = 3개의 시퀀스)
      userPrompt += `\n\n제시된 9장의 레퍼런스 이미지는 3개의 서로 다른 시퀀스입니다. 각 시퀀스(3장씩)의 장점을 분석하고, 이전에 검토한 사용자의 UI 시퀀스에 적용할 수 있는 가장 적절한 개선방안을 제시해주세요.
      
첫 번째 시퀀스(1-3번 이미지): 플로우와 장점 분석
두 번째 시퀀스(4-6번 이미지): 플로우와 장점 분석
세 번째 시퀀스(7-9번 이미지): 플로우와 장점 분석

위 레퍼런스들의 장점을 사용자의 UI 시퀀스에 어떻게 적용할 수 있을지 구체적으로 제안해주세요.`;
    } else {
      // 1. 초기 사용자 이미지 분석 시나리오
      userPrompt += `\n\n이 UI 시퀀스의 UX를 분석하고 개선이 필요한 부분을 지적해주세요.`;
    }

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
        max_output_tokens: 1024,
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
