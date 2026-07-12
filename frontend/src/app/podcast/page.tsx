'use client';

import React, { useState } from 'react';
import { useAppStore, Podcast } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Play,
  Pause,
  Mic,
  Volume2,
  ListRestart,
  RotateCcw,
  CheckCircle,
  FileText,
  VolumeX,
  FileAudio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function PodcastStudio() {
  const { toast } = useToast();
  const { podcasts, addPodcast, notes } = useAppStore();

  const [activePodcastId, setActivePodcastId] = useState<string | null>(podcasts[0]?.id || null);
  
  // Form states
  const [podTitle, setPodTitle] = useState('');
  const [hostA, setHostA] = useState('Conversational Host');
  const [hostB, setHostB] = useState('Technical Expert');
  const [sourceNoteId, setSourceNoteId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState('1.0x');
  const [isMuted, setIsMuted] = useState(false);

  const activePodcast = podcasts.find((p) => p.id === activePodcastId) || null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podTitle.trim()) return;

    const matchedNote = notes.find(n => n.id === sourceNoteId);
    const sourceText = matchedNote ? matchedNote.content : 'Cell theory is the historical scientific theory, now universally accepted, that living organisms are made up of cells.';
    
    setIsGenerating(true);
    toast('Drafting study script outline...');

    setTimeout(() => {
      addPodcast(podTitle, hostA, hostB, sourceText);
      setIsGenerating(false);
      
      // Select the newly created podcast
      const state = useAppStore.getState();
      const latestPod = state.podcasts[0];
      if (latestPod) {
        setActivePodcastId(latestPod.id);
      }

      setPodTitle('');
      toast('Podcast script compiled successfully!', 'success');
    }, 2000);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    toast(isPlaying ? 'Audio paused' : 'AI Audio stream active');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden max-w-7xl mx-auto">
      
      {/* 1. Left Column: Generation Settings & List */}
      <div className="w-96 border-r border-brand-border/60 pr-6 flex flex-col justify-between shrink-0 h-full overflow-y-auto">
        <div className="space-y-6 text-left">
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Mic className="w-5 h-5 text-brand-primary" />
              <span>AI Podcast Studio</span>
            </h2>
            <p className="text-xs text-foreground/45 leading-relaxed font-semibold">
              Convert written study summaries into high-fidelity dialogue podcasts.
            </p>
          </div>

          {/* Form to generate */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Podcast Episode Title</label>
              <input
                required
                placeholder="e.g. Mitochondria Deep Dive"
                value={podTitle}
                onChange={(e) => setPodTitle(e.target.value)}
                className="w-full h-11 border border-brand-border bg-white rounded-xl px-4 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary text-foreground text-left"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Host A Voice</label>
                <select
                  value={hostA}
                  onChange={(e) => setHostA(e.target.value)}
                  className="w-full h-11 border border-brand-border bg-white rounded-xl px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary text-foreground text-left font-semibold"
                >
                  <option value="Conversational Host">Conversational Host</option>
                  <option value="Academic Host">Academic Host</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Host B Voice</label>
                <select
                  value={hostB}
                  onChange={(e) => setHostB(e.target.value)}
                  className="w-full h-11 border border-brand-border bg-white rounded-xl px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary text-foreground text-left font-semibold"
                >
                  <option value="Technical Expert">Technical Expert</option>
                  <option value="Socratic Tutor">Socratic Tutor</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Sync Outline Source Note</label>
              <select
                value={sourceNoteId}
                onChange={(e) => setSourceNoteId(e.target.value)}
                className="w-full h-11 border border-brand-border bg-white rounded-xl px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary text-foreground text-left font-semibold"
              >
                <option value="">Select a note...</option>
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>{n.title}</option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={isGenerating} className="w-full rounded-xl h-11 text-xs font-bold flex items-center justify-center gap-1">
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Synthesizing Podcast script...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compile Studio Podcast</span>
                </>
              )}
            </Button>
          </form>

          {/* Generated Podcast queue list */}
          <div className="space-y-3 pt-4 border-t border-brand-border/40">
            <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Generated Audios</h3>
            <div className="space-y-2">
              {podcasts.map((pod) => {
                const isActive = pod.id === activePodcast?.id;
                return (
                  <div
                    key={pod.id}
                    onClick={() => {
                      setActivePodcastId(pod.id);
                      setIsPlaying(false);
                    }}
                    className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left ${
                      isActive 
                        ? 'bg-brand-accent/55 border-brand-primary/30 text-brand-primary shadow-xs' 
                        : 'bg-white border-brand-border/60 hover:bg-brand-muted'
                    }`}
                  >
                    <div className="p-2 bg-white rounded-lg text-brand-primary border border-brand-border">
                      <FileAudio className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold truncate leading-tight">{pod.title}</p>
                      <p className="text-[9px] text-foreground/45 mt-0.5">{pod.duration} mins • {pod.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Right Column: Studio player & Interactive script view */}
      <div className="flex-1 bg-white border border-brand-border/60 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between h-full">
        {activePodcast ? (
          <>
            {/* Player details panel */}
            <div className="border-b border-brand-border/40 p-6 bg-brand-muted/20 flex flex-col gap-4 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{activePodcast.title}</h3>
                  <p className="text-xs text-foreground/40 font-semibold mt-0.5">
                    Hosts: {activePodcast.hostA} & {activePodcast.hostB}
                  </p>
                </div>
                
                {/* Audio waves */}
                <div className="flex items-center gap-0.5 h-6">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={isPlaying ? { height: [4, 20, 4] } : { height: 4 }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                      className="w-1 bg-brand-primary rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* Player deck controls */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-border/40">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={togglePlay}
                    className="w-11 h-11 p-0 rounded-full flex items-center justify-center shadow-md shrink-0"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                  </Button>

                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-foreground/40 leading-none">Duration</p>
                    <p className="text-sm font-black text-foreground mt-0.5">{activePodcast.duration}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed factors */}
                  <select
                    value={playSpeed}
                    onChange={(e) => {
                      setPlaySpeed(e.target.value);
                      toast(`Speed factor updated to ${e.target.value}`);
                    }}
                    className="h-8 border border-brand-border bg-white rounded-lg px-2 text-[10px] font-bold text-foreground/60 focus:outline-none"
                  >
                    <option value="1.0x">1.0x Speed</option>
                    <option value="1.25x">1.25x Speed</option>
                    <option value="1.5x">1.5x Speed</option>
                  </select>

                  {/* Volume Mute toggler */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      toast(isMuted ? 'Volume unmuted' : 'Volume muted');
                    }}
                    className="h-8 w-8 rounded-lg text-foreground/50 hover:bg-brand-muted"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Script log transcript panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              {activePodcast.script.map((line, idx) => {
                const isHost = line.speaker === activePodcast.hostA;
                return (
                  <div key={idx} className="space-y-1.5 max-w-xl">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider leading-none ${
                      isHost ? 'text-brand-primary' : 'text-indigo-600'
                    }`}>
                      {line.speaker}
                    </span>
                    <div className="p-4 bg-brand-muted/40 border border-brand-border/40 rounded-2xl">
                      <p className="text-xs md:text-sm text-foreground/75 leading-relaxed">{line.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Mic className="w-12 h-12 text-foreground/20 mb-3" />
            <h4 className="text-base font-bold text-foreground">Podcast Player</h4>
            <p className="text-xs text-foreground/45 mt-1 max-w-xs leading-relaxed">
              Compile a podcast from your outlines on the left. Aora AI will draft a generated conversation transcript and play simulation here.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
