import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();

  const response = await fetch("http://143.248.48.96:7887/calculation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  return NextResponse.json(result);
}
