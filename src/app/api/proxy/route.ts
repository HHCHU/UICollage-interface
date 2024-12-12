import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// OPTIONS 메서드 핸들러 추가
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const response = await fetch("http://143.248.48.96:7887/calculation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://143.248.48.96:7887", // 서버의 origin 추가
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Server error:", response.status, await response.text());
      return NextResponse.json(
        { error: `Server responded with ${response.status}` },
        {
          status: response.status,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
