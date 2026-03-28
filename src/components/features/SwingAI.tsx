"use client";

import React, { useState, useEffect } from 'react';
import { Video, UploadCloud, RefreshCw } from 'lucide-react';
import { auth, db, storage, collection, addDoc, query, where, orderBy, onSnapshot } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Card } from '@/components/ui/Card';
import { Stats, SwingAnalysis } from '@/types';

export const SwingAI = ({ stats }: { stats: Stats }) => {
  const [swings, setSwings] = useState<SwingAnalysis[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedClub, setSelectedClub] = useState<string>('Driver');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'swings'), 
      where('uid', '==', auth.currentUser.uid), 
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSwings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SwingAnalysis));
    });
    return unsubscribe;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!auth.currentUser) {
      alert("Fel: Du verkar inte vara inloggad. Ladda om sidan och försök igen.");
      return;
    }
    const file = e.target.files[0];
    
    // Omedelbart nollställ inputen så att man kan välja samma fil flera gånger
    e.target.value = '';
    
    if (file.size > 50 * 1024 * 1024) {
      alert("Filen är för stor. Max 50 MB tillåts just nu.");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Byter ut crypto.randomUUID() mot en tidsstämpel+random sträng eftersom det ibland krashar på mobiler över HTTP
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const storageRef = ref(storage, `swings/${auth.currentUser.uid}/${fileId}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        }, 
        (error) => {
          console.error("Upload error", error);
          alert("Kunde inte ladda upp filen (State Changed Error). Har du rättigheter i Firebase Storage? " + error.message);
          setIsUploading(false);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setIsUploading(false);
            analyzeSwing(downloadURL);
          } catch(err: any) {
            console.error("Fel vid getDownloadURL", err);
            alert("Något gick fel när vi skulle hämta fillänken: " + err.message);
            setIsUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error(err);
      alert("Ett oväntat fel uppstod precis innan uppladdningen startade: " + err.message);
      setIsUploading(false);
    }
  };

  const analyzeSwing = async (videoUrl: string) => {
    if (!auth.currentUser) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-swing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, stats, club: selectedClub })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Något gick fel.');

      await addDoc(collection(db, 'swings'), {
        uid: auth.currentUser.uid,
        videoUrl,
        analysis: data.analysis,
        club: selectedClub,
        date: new Date()
      });

    } catch (err: any) {
      alert("AI Analysen misslyckades: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="px-1">
        <h2 className="text-lg font-black tracking-tighter text-golf-beige uppercase leading-none">Swing AI Coach</h2>
        <p className="text-[10px] text-golf-beige/60 font-medium">Ladda upp din sving & få personliga tips baserade på din riktiga statistik på banan.</p>
      </header>

      <Card className="p-4 border-golf-beige/10 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-golf-beige/5 to-transparent pointer-events-none" />
        <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center mb-1 ring-1 ring-white/10 shadow-lg">
           {(isUploading || isAnalyzing) ? (
             <RefreshCw className="w-8 h-8 text-golf-beige animate-spin" />
           ) : (
             <Video className="w-8 h-8 text-golf-beige" />
           )}
        </div>

        {isUploading ? (
          <div className="w-full space-y-1">
            <h3 className="text-sm font-bold text-golf-beige tracking-tight">Laddar upp...</h3>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-golf-beige transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[9px] text-golf-beige/40 font-bold">{Math.round(progress)}%</p>
          </div>
        ) : isAnalyzing ? (
          <div className="w-full space-y-1">
            <h3 className="text-sm font-bold text-golf-beige animate-pulse tracking-tight">Tränaren analyserar...</h3>
            <p className="text-[9px] text-golf-beige/40">Gemini 2.5 granskar din sving mot din databas-statistik. Magin tar ca 15-30 sekunder.</p>
          </div>
        ) : (
          <div className="w-full space-y-3">
             <div className="space-y-1">
               <h3 className="text-sm font-bold text-golf-beige tracking-tight">Vilken klubba slår du med?</h3>
               <p className="text-[10px] text-golf-beige/60 max-w-[250px] mx-auto mb-2">Välj en film (max 50MB). AI:n kommer granska svingen mot dina riktiga fel-träffar för just den klubbtypen.</p>
           </div>
             
             <div className="flex justify-center mb-3">
               <select 
                 value={selectedClub}
                 onChange={e => setSelectedClub(e.target.value)}
                 className="bg-black/40 text-golf-beige border border-white/10 rounded-lg px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-golf-beige/30 appearance-none text-center"
               >
                 <option value="Driver">Driver</option>
                 <option value="Fairwaywood">Fairwaywood / Hybrid</option>
                 <option value="Järn">Järnklubba (Inspel)</option>
                 <option value="Wedge (Inspelen)">Wedge (Närspel/Kort)</option>
               </select>
             </div>

             <div>
               <label className="inline-flex items-center gap-2 bg-golf-beige text-golf-dark hover:bg-golf-beige/90 px-6 py-2.5 rounded-xl font-black text-xs cursor-pointer active:scale-95 transition-all shadow-xl">
                 <UploadCloud className="w-4 h-4" />
                 Filma Sving / Ladda Upp
                 <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleFileUpload} />
               </label>
             </div>
             <p className="text-[8px] text-golf-beige/40">Max 50 MB (.mp4, .mov)</p>
          </div>
        )}
      </Card>

      <div className="space-y-2 pt-2">
        <h3 className="text-[10px] font-bold px-1 text-golf-beige uppercase tracking-widest flex items-center gap-1.5">
          Tidigare Analyser
          <div className="h-px bg-white/10 flex-1 ml-2" />
        </h3>
        {swings.length === 0 ? (
          <Card className="p-6 text-center border-dashed border-white/10 bg-transparent">
            <p className="text-xs font-bold italic text-golf-beige/40">Inga analyser gjorda ännu.</p>
          </Card>
        ) : (
          swings.map(swing => (
            <Card key={swing.id} className="overflow-hidden border-white/5 bg-black/20 shadow-lg">
              <div className="aspect-video bg-black relative border-b border-white/5">
                <video src={swing.videoUrl} controls className="w-full h-full object-contain" />
              </div>
              <div className="p-4 space-y-3">
                <div className="text-[9px] font-bold text-golf-beige/40 uppercase tracking-widest inline-flex bg-white/5 px-2 py-1 rounded-md">
                  Analys ({swing.club || 'Okänd klubba'}) från {swing.date?.seconds ? new Date(swing.date.seconds * 1000).toLocaleDateString() : 'Okänt datum'}
                </div>
                <div className="text-xs text-golf-beige/90 leading-relaxed whitespace-pre-wrap font-medium">
                  {swing.analysis.replace(/\*/g, '') /* Simple cleanup of markdown bolding if we don't use a library */}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
