"use client";

import React from 'react';
import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { signInWithGoogle } from '@/lib/firebase';

export const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-golf-dark">
    <Card className="max-w-md w-full text-center space-y-8 py-12">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-golf-beige rounded-3xl flex items-center justify-center rotate-12 shadow-2xl shadow-black/20">
          <Trophy className="w-10 h-10 text-golf-medium -rotate-12" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-golf-beige">BirdieView</h1>
        <p className="text-golf-beige/60">Master your game. Track your shame.</p>
      </div>
      <Button onClick={signInWithGoogle} className="w-full py-4 text-lg">
        Sign in with Google
      </Button>
    </Card>
  </div>
);
