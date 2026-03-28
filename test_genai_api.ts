import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

async function run() {
  const tempFile = 'test_upload.txt';
  fs.writeFileSync(tempFile, 'Hello world');

  try {
    const uploadResult = await ai.files.upload({ file: tempFile, config: { mimeType: 'text/plain' } });
    console.log("Upload result:", uploadResult);

    // Test 1: passing uploadResult directly
    try {
      const response1 = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [uploadResult, "What is in this file?"]
      });
      console.log("Response 1 SUCCESS:", response1.text);
    } catch (e: any) {
      console.error("Response 1 FAILED:", e.message);
    }

    // Test 2: passing fileData directly
    try {
      const response2 = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            fileData: {
              fileUri: uploadResult.uri,
              mimeType: uploadResult.mimeType || 'text/plain'
            }
          },
          "What is in this file?"
        ]
      });
      console.log("Response 2 SUCCESS:", response2.text);
    } catch (e: any) {
      console.error("Response 2 FAILED:", e.message);
    }

  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

run();
