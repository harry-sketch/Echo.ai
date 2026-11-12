import type { AuthToken } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const geminiClient = new GoogleGenAI({
  httpOptions: { apiVersion: "v1alpha" },
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

export async function GET() {
  const tokenData: AuthToken = await geminiClient.authTokens.create({
    config: {
      uses: 1,
      expireTime: expireTime,
      newSessionExpireTime: new Date(Date.now() + 1 * 60 * 1000).toISOString(),
    },
  });

  if (!tokenData.name) {
    return NextResponse.json(
      { message: "Error in generating token" },
      { status: 400 },
    );
  }

  const token = tokenData.name;

  return NextResponse.json(token, { status: 200 });
}
