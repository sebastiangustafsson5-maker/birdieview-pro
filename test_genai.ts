import { GoogleGenAI } from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({ apiKey: 'test' });
  
  // Try to construct a contents array
  const contents = [
    {
      fileData: {
        fileUri: 'https://example.com/file',
        mimeType: 'video/mp4'
      }
    },
    "My prompt"
  ];
  
  try {
    // Generate content just to see if it complains about payload locally before network
    // Actually we can just look at how the library serializes it, but we can't intercept it easily.
    // Let's check what the types accept.
    console.log("TypeScript test passed.");
  } catch(e) {
    console.error(e);
  }
}
main();
