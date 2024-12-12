import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// OPTIONS 메서드 핸들러 추가
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST",
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
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Server responded with ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
