import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatCompletionContentPart } from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BASE_SYSTEM_PROMPT = `당신은 모바일 앱 UI/UX 디자인을 전문으로 하는 UX 연구원입니다. 
사용자와 협력적으로 소통하며, 시퀀스 기반 UI 개선을 위한 실질적인 조언을 제공합니다. 
항상 친근하고 전문적인 한국어로 대화하며, 구체적인 예시를 들어 설명합니다.`;

const INITIAL_ANALYSIS_PROMPT = `${BASE_SYSTEM_PROMPT}

입력된 3장의 시퀀스 이미지를 분석하여:
- 화면 간 전환 흐름의 자연스러움
- 사용자 동작의 연속성
- 정보 구조의 일관성
- 핵심 기능의 접근성

다음 형식으로 답변:
1. 잘된 점 1가지
2. 개선 제안 2가지
3. 디자이너의 의도를 묻는 문장 한 문장`;

const REFERENCE_ANALYSIS_PROMPT = `${BASE_SYSTEM_PROMPT}

3세트의 레퍼런스 시퀀스를 분석하여:
- 각 시퀀스의 주요 장점
- 사용자의 디자인에 적용 가능한 요���
- 구체적인 적용 방안`;

const CHAT_PROMPT = `${BASE_SYSTEM_PROMPT}

대화 지침:
- 이전 맥락 유지하며 대화
- 구체적 예시 제공
- 간단한 후속 질문으로 대화 유도

새로운 시퀀스가 입력되면:
"새로운 디자인을 살펴보겠습니다. 이전 버전과 비교하여..."`;

export async function POST(request: Request) {
  try {
    const { images, prompt, messages, analysisType } = await request.json();

    console.log("Received request:", {
      imageCount: images?.length,
      hasPrompt: !!prompt,
      hasMessages: !!messages,
      analysisType,
    });

    // 이미지 개수 검증
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "이미지가 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    if (analysisType === "initial" && images.length !== 3) {
      return NextResponse.json(
        { error: "초기 분석을 위해서는 3장의 이미지가 필요합니다." },
        { status: 400 }
      );
    }

    if (analysisType === "reference" && images.length !== 9) {
      return NextResponse.json(
        { error: "레퍼런스 분석을 위해서는 9장의 이미지가 필요합니다." },
        { status: 400 }
      );
    }

    // Base64로 이미지 변환
    const base64Images = await Promise.all(
      images.map(async (imageUrl: string) => {
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error("이미지 로드 실패");
          const buffer = await response.arrayBuffer();
          return Buffer.from(buffer).toString("base64");
        } catch (error) {
          console.error("Image processing error:", error);
          throw new Error("이미지 처리 중 오류가 발생했습니다.");
        }
      })
    );

    let systemPrompt;
    let userContent;

    if (messages) {
      systemPrompt = CHAT_PROMPT;
      userContent = messages
        .map((m: { content: string }) => m.content)
        .join("\n");
    } else {
      systemPrompt =
        analysisType === "reference"
          ? REFERENCE_ANALYSIS_PROMPT
          : INITIAL_ANALYSIS_PROMPT;
      userContent = prompt || "이미지를 분석해주세요.";
    }

    console.log("Preparing GPT request:", {
      mode: messages ? "chat" : "analysis",
      analysisType,
      imageCount: base64Images.length,
    });

    const userMessage: ChatCompletionContentPart[] = [
      { type: "text", text: userContent },
      ...base64Images.map(
        (base64) =>
          ({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
            },
          } as ChatCompletionContentPart)
      ),
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 4096,
    });

    return NextResponse.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "UX 피드백을 생성하는 중 오류가 발생했습니다.";
    console.error("Detailed error:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
