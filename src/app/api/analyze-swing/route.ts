import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, stats } = await req.json();
    if (!videoUrl) return NextResponse.json({ error: 'No videoUrl provided' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Server missing GEMINI_API_KEY' }, { status: 500 });
    
    const ai = new GoogleGenAI({ apiKey });
    
    // 1. Download the video from Firebase Storage URL
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error("Failed to download video");
    
    const buffer = Buffer.from(await res.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `swing-${Date.now()}.mp4`);
    fs.writeFileSync(tempFilePath, buffer);

    // 2. Upload the file to Gemini via File API
    const uploadResult = await ai.files.upload({ file: tempFilePath, mimeType: "video/mp4" });
    
    // 3. Wait for Google's video processing
    let fileState = await ai.files.get({ name: uploadResult.name });
    while (fileState.state === 'PROCESSING') {
      await new Promise(r => setTimeout(r, 2000));
      fileState = await ai.files.get({ name: uploadResult.name });
    }
    
    if (fileState.state === 'FAILED') {
      fs.unlinkSync(tempFilePath);
      return NextResponse.json({ error: 'Video processing failed in Gemini' }, { status: 500 });
    }

    // 4. Build prompt using the user's hard birdiview statistics
    const prompt = `Du är BirdieView Pro's inbyggda AI Swing Coach, en världsledande golfinstruktör.
Här är en uppladdad video på min golfsving.

Samtidigt säger min historiska BirdieView-data följande om mina missar på banan just nu:
- Driver: ${stats.missLeftRate > stats.missRightRate ? 'Missar mest vänster (' + stats.missLeftRate.toFixed(0) + '%)' : 'Missar mest höger (' + stats.missRightRate.toFixed(0) + '%)'}.
- Järnslag: ${stats.approachMissLeftRate.toFixed(0)}% missas vänster, ${stats.approachMissRightRate.toFixed(0)}% höger, ${stats.approachMissShortRate.toFixed(0)}% kort.
- Bollträff: ${stats.approachDuffRate.toFixed(0)}% duffar och ${stats.approachTopRate.toFixed(0)}% toppar.

Baserat på min sving i videon OCH min hårda data ovan, vad gör jag rent tekniskt fel i svingen som orsakar mina vanligaste problem och missar? 
Ge mig 3 konkreta, hands-on tekniktips för att reparera dessa exakta problem. Håll tonen uppmuntrande, modern, pedagogisk och rimligt kortfattad. Formatera ditt utfall snyggt med punkter.`;

    // 5. Generate Content
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        uploadResult,
        prompt
      ]
    });

    // Cleanup temp file
    fs.unlinkSync(tempFilePath);

    return NextResponse.json({ analysis: response.text });
  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
