import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, ImageData } from "@/types";
import { getUXFeedback, chatWithUXAgent } from "@/utils/ai-utils";
import {
  saveChatMessage,
  createChatSession,
  getChatSession,
} from "@/utils/firebase";

interface UXAgentChatProps {
  userId: string;
  inputImages: ImageData[];
  referenceImages?: string[];
  onError?: (error: Error) => void;
  shouldStartAnalysis?: boolean;
}

export function UXAgentChat({
  userId,
  inputImages,
  referenceImages,
  onError,
  shouldStartAnalysis = false,
}: UXAgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 채팅창 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 분석 시작 트리거 감지
  useEffect(() => {
    if (
      shouldStartAnalysis &&
      !hasStartedAnalysis &&
      inputImages.length === 3
    ) {
      setHasStartedAnalysis(true);
      generateInitialFeedback();
    }
  }, [shouldStartAnalysis, inputImages, hasStartedAnalysis]);

  // 레퍼런스 이미지 분석
  useEffect(() => {
    if (referenceImages && referenceImages.length === 9 && sessionId) {
      generateReferenceFeedback();
    }
  }, [referenceImages, sessionId]);

  const generateInitialFeedback = async () => {
    try {
      setIsLoading(true);

      // File 객체에서 직접 Base64 문자열 생성
      const base64Images = await Promise.all(
        inputImages.map(async (img) => {
          try {
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String);
              };
              reader.onerror = () => reject(new Error("Failed to read image"));
              reader.readAsDataURL(img.file);
            });
          } catch (error) {
            console.error("Error processing image:", error);
            return null;
          }
        })
      );

      const validImages = base64Images.filter(
        (img): img is string => img !== null
      );

      if (validImages.length !== inputImages.length) {
        throw new Error("일부 이미지를 처리할 수 없습니다.");
      }

      const feedback = await getUXFeedback(validImages);

      // 이미지 URL을 base64 문자열로 저장
      const initialMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: feedback,
        timestamp: Date.now(),
        imageUrls: validImages, // base64 이미지 문자열 사용
      };

      const newSessionId = await createChatSession(userId, initialMessage);
      setSessionId(newSessionId);
      setMessages([initialMessage]);
    } catch (error) {
      console.error("Error in generateInitialFeedback:", error);
      onError?.(error as Error);
      setHasStartedAnalysis(false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferenceFeedback = async () => {
    if (!sessionId || !referenceImages) return;

    try {
      setIsLoading(true);

      // 이미지를 Base64로 변환
      const base64Images = await Promise.all(
        referenceImages.map(async (url) => {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        })
      );

      const feedback = await getUXFeedback(base64Images, undefined, true);

      const referenceMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: feedback,
        timestamp: Date.now(),
        imageUrls: referenceImages,
      };

      await saveChatMessage(userId, sessionId, referenceMessage);
      setMessages((prev) => [...prev, referenceMessage]);
      setIsChatEnabled(true);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !isChatEnabled) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: Date.now(),
    };

    try {
      setIsLoading(true);
      setMessages((prev) => [...prev, userMessage]);
      await saveChatMessage(userId, sessionId, userMessage);
      setInputMessage("");

      // File 객체에서 직접 Base64 문자열 생성
      const base64Images = await Promise.all(
        inputImages.map(async (img) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(img.file);
          });
        })
      );

      const response = await chatWithUXAgent(
        messages.concat(userMessage).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        base64Images
      );

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      await saveChatMessage(userId, sessionId, assistantMessage);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 mb-4"
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.isNewImageSet && index > 0 && (
                <div className="border-t border-gray-300 my-2" />
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.imageUrls && message.imageUrls.length > 0 && (
                <div className="mt-2 space-y-4">
                  {Array.from({
                    length: Math.ceil(message.imageUrls.length / 3),
                  }).map((_, groupIndex) => (
                    <div key={groupIndex} className="flex gap-2 flex-wrap">
                      {message.imageUrls
                        ?.slice(groupIndex * 3, (groupIndex + 1) * 3)
                        .map((url, i) => {
                          const imageUrl = url.startsWith("data:image")
                            ? url
                            : message.role === "assistant"
                            ? url
                            : inputImages[groupIndex * 3 + i]?.file
                            ? URL.createObjectURL(
                                inputImages[groupIndex * 3 + i].file
                              )
                            : url;

                          return (
                            <img
                              key={groupIndex * 3 + i}
                              src={imageUrl}
                              alt={`Reference ${groupIndex * 3 + i + 1}`}
                              className="w-20 h-20 object-cover rounded"
                              onError={(e) => {
                                console.error(
                                  `Error loading image: ${imageUrl}`
                                );
                                e.currentTarget.src = "/placeholder-image.png";
                              }}
                            />
                          );
                        })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={
              isChatEnabled
                ? "UX 에이전트와 대화하기..."
                : "분석이 완료되면 대화할 수 있습니다."
            }
            className="flex-1 p-2 border rounded-lg focus:ring-1 focus:ring-blue-400 text-black placeholder:text-gray-400"
            disabled={isLoading || !isChatEnabled}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !isChatEnabled || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
