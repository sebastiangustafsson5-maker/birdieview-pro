"use client";

import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { auth, db, doc, setDoc, logout } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserProfile } from '@/types';

export const Profile = ({ profile, onUpdate }: { profile: UserProfile | null; onUpdate: (p: UserProfile) => void }) => {
  const [handicapStr, setHandicapStr] = useState(profile?.handicap?.toString() || '20.0');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    const hcp = parseFloat(handicapStr.replace(',', '.')) || 0;
    const newProfile = {
      ...profile,
      uid: auth.currentUser.uid,
      handicap: hcp,
      displayName: auth.currentUser.displayName || '',
      email: auth.currentUser.email || '',
      photoURL: auth.currentUser.photoURL || ''
    };
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), newProfile);
      onUpdate(newProfile);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-3">
      <header className="text-center">
        <div className="inline-block p-1 rounded-full bg-golf-beige/10 mb-1.5">
          <img 
            src={auth.currentUser?.photoURL || 'https://picsum.photos/seed/golf/200'} 
            alt="Profile" 
            className="w-14 h-14 rounded-full border-2 border-golf-dark object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-golf-beige leading-tight">{auth.currentUser?.displayName}</h2>
        <p className="text-[9px] text-golf-beige/60">{auth.currentUser?.email}</p>
      </header>

      <Card className="space-y-2.5 p-3">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-golf-beige/60 uppercase tracking-widest block text-center">Ditt aktuella Handicap</label>
          <div className="flex items-center justify-center">
            <input 
              type="text"
              inputMode="decimal"
              value={handicapStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,\-]/g, '');
                setHandicapStr(val);
              }}
              onFocus={(e) => e.target.select()}
              className="bg-black/20 text-4xl font-black text-golf-beige text-center w-32 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-golf-beige/50 outline-none tabular-nums"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-full py-2 text-xs font-bold">
          {isSaving ? 'Sparar...' : 'Uppdatera Profil'}
        </Button>
      </Card>

      <Button variant="danger" onClick={logout} className="w-full h-9 text-xs font-bold">
        <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logga ut
      </Button>
    </div>
  );
};
