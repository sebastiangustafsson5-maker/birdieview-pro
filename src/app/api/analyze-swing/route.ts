import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, stats, club } = await req.json();
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
    const uploadResult = await ai.files.upload({ file: tempFilePath, config: { mimeType: "video/mp4" } });
    
    // 3. Wait for Google's video processing
    let fileState = await ai.files.get({ name: uploadResult.name! });
    while (fileState.state === 'PROCESSING') {
      await new Promise(r => setTimeout(r, 2000));
      fileState = await ai.files.get({ name: uploadResult.name! });
    }
    
    if (fileState.state === 'FAILED') {
      fs.unlinkSync(tempFilePath);
      return NextResponse.json({ error: 'Video processing failed in Gemini' }, { status: 500 });
    }

    // 4. Build prompt using the user's hard birdieview statistics filtered by club
    let statsContext = '';
    if (club === 'Driver' || club === 'Fairwaywood') {
      statsContext = `- Träffsäkerhet: ${stats.fairwayAccuracy.toFixed(0)}% Fairwayträffar.\n- Utslags-missar generellt: ${stats.missLeftRate.toFixed(0)}% missas vänster, ${stats.missRightRate.toFixed(0)}% missas höger.`;
    } else if (club === 'Wedge (Inspelen)') {
      statsContext = `- Greenträffar (GIR): ${stats.girRate.toFixed(0)}%.\n- Inspelsmissar inom 100m tenderar att bli ${stats.approachMissShortRate.toFixed(0)}% korta.\n- Scrambling (Rädda Par): ${stats.totalScrambling.toFixed(0)}%.`;
    } else {
      statsContext = `- Greenträffar (GIR): ${stats.girRate.toFixed(0)}%.\n- Järnmissar: ${stats.approachMissLeftRate.toFixed(0)}% vänster, ${stats.approachMissRightRate.toFixed(0)}% höger.\n- Bollträff: Tenderar att slå ${stats.approachDuffRate.toFixed(0)}% duffar och ${stats.approachTopRate.toFixed(0)}% toppar.`;
    }

    const prompt = `Du är BirdieView Pro's inbyggda AI Swing Coach, en världsledande golfinstruktör.
Här är en uppladdad video på min golfsving med en ${club}.

Samtidigt säger min historiska spårade BirdieView-data följande om mina missar på banan med just denna typ av klubba:
${statsContext}

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
