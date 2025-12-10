import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || '';
const geminiModel = "gemini-2.5-flash-lite";
const systemInstruction = "You are a helpful assistant. Follow the user's instructions precisely and provide only the requested output without additional explanations or comments.";

if (!apiKey) {
  console.error('GEMINI_API_KEY is not set. Please create a .env file with GEMINI_API_KEY=your_api_key');
}

// Google GenAI クライアントの初期化
const ai = new GoogleGenAI({ apiKey: apiKey });

/** Gemini モデルを使用してレスポンスを取得 */
async function generateAIResponse(prompt: string): Promise<GenerateContentResponse> {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response;
}

/** 指定したプロンプトからテキストを生成 */
export async function generateText(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const response = await generateAIResponse(prompt);
  const text = response.text;

  if (!text) {
    throw new Error("No text generated");
  }

  return text;
}