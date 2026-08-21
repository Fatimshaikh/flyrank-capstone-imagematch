import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function classifyImage(base64Image, mimeType) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          {
            text: `Look at this image and respond with ONLY valid JSON, no markdown, no explanation, in exactly this shape:
{"subject": string, "category": string, "attributes": string[], "caption": string, "confidence": number between 0 and 1}`,
          },
        ],
      },
    ],
  });
  return response.text;
}

export async function embedText(text) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
  });
  return response.embeddings[0].values;
}

export { ai };
