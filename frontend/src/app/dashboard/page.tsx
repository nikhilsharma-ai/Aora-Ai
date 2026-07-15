'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, Note, Folder } from '@/store/useAppStore';
import {
  FileText,
  Mic,
  ChevronRight,
  Search,
  FolderPlus,
  FolderOpen,
  Plus,
  FileUp,
  X,
  MoreVertical,
  FileDown,
  Trash2,
  ExternalLink,
} from 'lucide-react';

// ─── YouTube / Play Icon ──────────────────────────────────────────────────────
function YoutubeIcon({ size = 18, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={color} style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
    </svg>
  );
}

// ─── Custom SVG Document Icons matching design ────────────────────────────────
function DocIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M15 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7L15 2Z" fill="#7C3AED" />
      <path d="M15 2V7H20L15 2Z" fill="#9061F9" />
      <text x="12" y="17.5" fill="#FFFFFF" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" letterSpacing="0.05em">DOC</text>
    </svg>
  );
}

function PdfIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M15 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7L15 2Z" fill="#EF4444" />
      <path d="M15 2V7H20L15 2Z" fill="#F87171" />
      <text x="12" y="17.5" fill="#FFFFFF" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" letterSpacing="0.05em">PDF</text>
    </svg>
  );
}

function Mp3Icon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M15 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7L15 2Z" fill="#EC4899" />
      <path d="M15 2V7H20L15 2Z" fill="#F472B6" />
      <text x="12" y="17.5" fill="#FFFFFF" fontSize="5.2" fontWeight="900" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" letterSpacing="0.03em">MP3</text>
    </svg>
  );
}

function NoteIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M15 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7L15 2Z" fill="#10B981" />
      <path d="M15 2V7H20L15 2Z" fill="#34D399" />
      <text x="12" y="17.5" fill="#FFFFFF" fontSize="5.2" fontWeight="900" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" letterSpacing="0.03em">NOTE</text>
    </svg>
  );
}

// ─── Custom Folder Icon ──────────────────────────────────────────────────────
function FolderIcon({ color = '#7C3AED', size = 18 }: { color?: string; size?: number }) {
  const fillColor = color.startsWith('conic-gradient') ? '#7C3AED' : color;
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size, flexShrink: 0 }}>
      {/* Back flap and tab */}
      <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4H4Z" fill={fillColor} />
      {/* Front flap overlay with a tiny offset opacity for depth */}
      <path d="M2 10C2 8.89543 2.89543 8 4 8H20C21.1046 8 22 8.89543 22 10V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V10Z" fill={fillColor} opacity="0.85" />
      {/* Front lip highlight */}
      <path d="M4 8H12L14 10H20" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'my-notes' | 'shared';
type ModalType = 'blank' | 'audio' | 'document' | 'website' | null;

// ─── Modal configs ────────────────────────────────────────────────────────────
const MODAL_CONFIG = {
  blank: {
    title: 'New Blank Document',
    inputLabel: 'Document Title',
    placeholder: 'e.g. Organic Chemistry Notes',
    accentColor: '#7C3AED',
    iconBg: '#EDE9FE',
    icon: <FileText style={{ width: 22, height: 22, color: '#7C3AED' }} />,
  },
  audio: {
    title: 'Record or Upload Audio',
    inputLabel: 'Recording Title',
    placeholder: 'e.g. Lecture Recording — Week 4',
    accentColor: '#EC4899',
    iconBg: '#FCE7F3',
    icon: <Mic style={{ width: 22, height: 22, color: '#EC4899' }} />,
  },
  document: {
    title: 'Upload Document',
    inputLabel: 'Document Title',
    placeholder: 'e.g. Research Paper on Neural Networks',
    accentColor: '#3B82F6',
    iconBg: '#DBEAFE',
    icon: <FileUp style={{ width: 22, height: 22, color: '#3B82F6' }} />,
  },
  website: {
    title: 'Import from YouTube / Website',
    inputLabel: 'Page Title',
    placeholder: 'e.g. Machine Learning Crash Course',
    accentColor: '#EF4444',
    iconBg: '#FEE2E2',
    icon: <YoutubeIcon size={22} color="#EF4444" />,
  },
} as const;

// ─── Creation Cards configuration ─────────────────────────────────────────────
const CARDS = [
  {
    type: 'blank' as const,
    title: 'Blank document',
    subtitle: 'Start from scratch',
    icon: <FileText style={{ width: 18, height: 18, color: '#FFFFFF' }} />,
    iconBg: '#7C3AED',
    border: 'var(--brand-border)',
  },
  {
    type: 'audio' as const,
    title: 'Record or upload audio',
    subtitle: 'Upload an audio file',
    icon: <Mic style={{ width: 18, height: 18, color: '#FFFFFF' }} />,
    iconBg: '#7C3AED',
    border: 'var(--brand-border)',
  },
  {
    type: 'document' as const,
    title: 'Document upload',
    subtitle: 'Any PDF, DOC, PPT, etc',
    icon: <FileUp style={{ width: 18, height: 18, color: '#FFFFFF' }} />,
    iconBg: '#7C3AED',
    border: 'var(--brand-border)',
  },
  {
    type: 'website' as const,
    title: 'Website link',
    subtitle: 'YouTube or website link',
    icon: <YoutubeIcon size={18} color="#FFFFFF" />,
    iconBg: '#EF4444',
    border: 'var(--brand-border)',
  },
];

const FOLDER_COLORS = [
  { name: 'purple', value: '#7C3AED' },
  { name: 'orange', value: '#EA580C' },
  { name: 'pink', value: '#EC4899' },
  { name: 'lime', value: '#84CC16' },
  { name: 'red', value: '#EF4444' },
  { name: 'rainbow', value: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }
];

// ─── Input Style ──────────────────────────────────────────────────────────────
const inputStyle = (): React.CSSProperties => ({
  width: '100%',
  height: '42px',
  backgroundColor: 'var(--brand-accent)',
  border: '1px solid var(--brand-border)',
  borderRadius: '8px',
  padding: '0 14px',
  color: 'var(--foreground)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'Inter', sans-serif",
  transition: 'border-color 0.15s',
});

// ─── Create / Upload Modal ────────────────────────────────────────────────────
function CreateModal({ type, onClose, activeFolderName }: { type: ModalType; onClose: () => void; activeFolderName?: string }) {
  const { addNote } = useAppStore();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(50).fill(2));
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (err) {
          // ignore
        }
      }
      audioContextRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map frequency bands directly to 50 levels
        const nextLevels = [];
        const step = Math.floor(bufferLength / 50) || 1;
        for (let i = 0; i < 50; i++) {
          const val = dataArray[i * step] || 0;
          // Scale 0-255 to 3px - 28px
          const level = Math.max(3, Math.min(28, (val / 255) * 28));
          nextLevels.push(level);
        }
        
        setAudioLevels(nextLevels);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      animationFrameRef.current = requestAnimationFrame(updateVolume);
      
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `Recording-${new Date().toLocaleTimeString().replace(/:/g, '-')}.wav`, { type: 'audio/wav' });
        setSelectedFiles([file]);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (err) {
        // ignore
      }
    }
    audioContextRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsRecording(false);
  };

  React.useEffect(() => {
    if (type !== 'website' || !url) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (!targetUrl.includes('.')) return; // Wait until they type/paste a valid domain name
      targetUrl = 'https://' + targetUrl;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const controller = new AbortController();

    const fetchTitle = async () => {
      setIsFetchingTitle(true);
      try {
        const res = await fetch(`${API_URL}/documents/fetch-title?url=${encodeURIComponent(targetUrl)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (data.title && data.title !== 'Web Resource') {
            setTitle(data.title);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch title:", err);
        }
      } finally {
        setIsFetchingTitle(false);
      }
    };

    const timer = setTimeout(fetchTitle, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, type]);

  if (!type) return null;
  const cfg = MODAL_CONFIG[type];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const noteTags = activeFolderName ? [type, activeFolderName] : [type];

    if (type === 'website') {
      const noteTitle = title.trim() || cfg.placeholder;
      let finalUrl = url.trim();
      if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      const content = `## ${noteTitle}\n\n**Source:** ${finalUrl}\n\nContent imported from website / video.`;
      const newId = addNote(noteTitle, content, noteTags, 'youtube', finalUrl);
      useAppStore.setState({ activeNoteId: newId });
      onClose();
      router.push('/notes');
      return;
    }

    if (type === 'blank') {
      const noteTitle = title.trim() || cfg.placeholder;
      const newId = addNote(noteTitle, '', noteTags, 'blank', '');
      useAppStore.setState({ activeNoteId: newId });
      onClose();
      router.push('/notes');
      return;
    }

    // For file-based types (document, audio)
    if (selectedFiles.length === 0) return;

    let firstNoteId = '';
    selectedFiles.forEach((file, index) => {
      // If single file and title is provided, use title. Otherwise use file.name
      const noteTitle = (selectedFiles.length === 1 && title.trim()) ? title.trim() : file.name;

      let backendDocType = 'pdf';
      if (type === 'audio') {
        backendDocType = 'mp3';
      } else {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'docx' || ext === 'doc') {
          backendDocType = 'doc';
        }
      }

      const noteId = addNote(noteTitle, '', noteTags, backendDocType, '', file);
      if (index === 0) {
        firstNoteId = noteId;
      }
    });

    if (firstNoteId) {
      useAppStore.setState({ activeNoteId: firstNoteId });
    }
    onClose();
    router.push('/notes');
  };

  const isSubmitDisabled = (type === 'document' || type === 'audio') && selectedFiles.length === 0;
  const acceptTypes = type === 'audio' ? '.mp3,.wav,.m4a,audio/*' : '.pdf,.docx,.doc';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '460px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--brand-border)', borderRadius: '16px', padding: '28px', fontFamily: "'Inter', sans-serif", boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', backgroundColor: cfg.iconBg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cfg.icon}
          </div>
          <div>
            <h2 style={{ color: 'var(--foreground)', fontSize: '16px', fontWeight: 700, margin: 0, fontFamily: "'Outfit', sans-serif" }}>{cfg.title}</h2>
            <p style={{ color: '#9090A8', fontSize: '12px', margin: '2px 0 0' }}>
              {activeFolderName ? (
                <>
                  Creating note in folder <span style={{ color: cfg.accentColor, fontWeight: 600 }}>{activeFolderName}</span>
                </>
              ) : (
                'Fill in the details below to get started'
              )}
            </p>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--brand-border)', marginBottom: '20px' }} />

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {type === 'website' ? (
            <>
              <div>
                <label style={{ display: 'block', color: '#6B6B8A', fontSize: '11px', fontWeight: 600, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>URL</label>
                <input
                  type="url"
                  autoFocus
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  style={inputStyle()}
                  onFocus={e => (e.currentTarget.style.borderColor = '#EF4444')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#6B6B8A', fontSize: '11px', fontWeight: 600, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.inputLabel}</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={isFetchingTitle ? 'Detecting title...' : cfg.placeholder}
                  style={{
                    ...inputStyle(),
                    opacity: isFetchingTitle ? 0.75 : 1,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = cfg.accentColor)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
                />
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: 'block', color: '#6B6B8A', fontSize: '11px', fontWeight: 600, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.inputLabel}</label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isFetchingTitle ? 'Detecting title...' : cfg.placeholder}
                style={{
                  ...inputStyle(),
                  opacity: isFetchingTitle ? 0.75 : 1,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = cfg.accentColor)}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
              />
            </div>
          )}

          {(type === 'document' || type === 'audio') && (
            <>
              {type === 'audio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Make a Recording Container */}
                  <div style={{
                    border: '1px solid var(--brand-border)',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: 'var(--brand-accent)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 600 }}>Make a recording</span>
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: isRecording ? '#EF4444' : 'var(--card-bg)',
                          border: '1px solid var(--brand-border)',
                          borderRadius: '20px',
                          color: isRecording ? '#FFFFFF' : 'var(--foreground)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      >
                        {isRecording ? 'Stop recording' : 'Select microphone'}
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: isRecording ? '#EF4444' : '#EC4899',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
                          flexShrink: 0
                        }}
                      >
                        {isRecording ? (
                          <div style={{ width: '12px', height: '12px', backgroundColor: '#FFFFFF', borderRadius: '2px' }} />
                        ) : (
                          <Mic style={{ width: '18px', height: '18px', color: '#FFFFFF' }} />
                        )}
                      </button>
                      
                      {/* Waveform Visualizer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: isRecording ? '3px' : '4px', height: '32px', flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
                        {audioLevels.map((level, i) => (
                          <div
                            key={i}
                            style={{
                              width: '3px',
                              height: isRecording ? `${level}px` : '3px',
                              backgroundColor: isRecording ? '#EC4899' : '#C4C2D6',
                              borderRadius: isRecording ? '1.5px' : '50%',
                              transition: 'all 0.05s ease',
                              flexShrink: 0
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Or separator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#9090A8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--brand-border)' }} />
                    Or
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--brand-border)' }} />
                  </div>
                </div>
              )}

              {/* Upload Dropzone Container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${isDragging ? cfg.accentColor : 'var(--brand-border)'}`,
                  borderRadius: '10px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  backgroundColor: isDragging ? `${cfg.accentColor}10` : 'var(--brand-accent)'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple={type !== 'audio'}
                  accept={acceptTypes}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>{cfg.icon}</div>
                <p style={{ color: 'var(--foreground)', fontSize: '13px', margin: '0 0 4px', fontWeight: 500 }}>
                  {type === 'audio' ? 'Drop audio file or click to record' : 'Drop PDF, DOCX here or click to browse'}
                </p>
                <p style={{ color: '#AAA8C0', fontSize: '11px', margin: 0 }}>
                  {type === 'audio' ? 'MP3, WAV, M4A · Max 100MB' : 'PDF, DOCX · Max 50MB per file'}
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                  <p style={{ color: '#6B6B8A', fontSize: '10px', fontWeight: 600, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected Files ({selectedFiles.length})</p>
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--brand-accent)',
                        border: '1px solid var(--brand-border)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <FileText style={{ width: '16px', height: '16px', color: cfg.accentColor, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                          <p style={{ color: '#9090A8', fontSize: '10px', margin: 0 }}>{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9090A8',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <X style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, height: '42px', backgroundColor: 'var(--brand-accent)', border: '1px solid var(--brand-border)', borderRadius: '8px', color: '#6B6B8A', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Inter', sans-serif" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              style={{
                flex: 2,
                height: '42px',
                backgroundColor: isSubmitDisabled ? 'var(--brand-border)' : cfg.accentColor,
                border: 'none',
                borderRadius: '8px',
                color: isSubmitDisabled ? '#6B6B8A' : '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: isSubmitDisabled ? 'none' : `0 4px 14px ${cfg.accentColor}35`,
                fontFamily: "'Inter', sans-serif"
              }}
              onMouseEnter={e => { if (!isSubmitDisabled) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { if (!isSubmitDisabled) e.currentTarget.style.opacity = '1'; }}
            >
              Create →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Folder Modal (Create folder) ─────────────────────────────────────────────
const GRID_COLORS = [
  ['#4B5563', '#9CA3AF', '#FFFFFF', '#F87171', '#FB923C', '#FBBF24', '#A3E635', '#4ADE80', '#2DD4BF', '#38BDF8', '#818CF8', '#F472B6'],
  ['#374151', '#6B7280', '#E5E7EB', '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4', '#6366F1', '#EC4899'],
  ['#000000', '#1F2937', '#D1D5DB', '#B91C1C', '#C2410C', '#D97706', '#4D7C0F', '#15803D', '#0F766E', '#0891B2', '#4338CA', '#D01C8B']
];

function FolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#7C3AED');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), selectedColor);
      onClose();
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--brand-border)',
          borderRadius: '16px',
          padding: '32px',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#9090A8', cursor: 'pointer', padding: '4px' }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>

        {/* Folder Icon Header */}
        <div style={{
          width: '48px',
          height: '48px',
          backgroundColor: selectedColor.startsWith('conic-gradient') ? 'rgba(124, 58, 237, 0.15)' : `${selectedColor}15`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px',
          transition: 'all 0.15s ease'
        }}>
          <FolderIcon color={selectedColor} size={26} />
        </div>

        <h2 style={{ color: 'var(--foreground)', fontSize: '20px', fontWeight: 700, margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>Create folder</h2>
        <p style={{ color: '#9090A8', fontSize: '13px', margin: '0 0 24px' }}>Use folders to organize notes.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Color choice dots */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-start', margin: '4px 0 8px' }}>
            {FOLDER_COLORS.map(c => {
              const isSelected = selectedColor === c.value;
              const isRainbow = c.name === 'rainbow';
              
              if (isRainbow) {
                return (
                  <div key={c.name} style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: c.value,
                        border: 'none',
                        cursor: 'pointer',
                        outline: 'none',
                        boxShadow: isSelected ? '0 0 0 2px #3B82F6, 0 0 0 4px rgba(59,130,246,0.2)' : 'none',
                        transform: isSelected ? 'scale(1.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    />

                    {/* Custom Grid Color Picker Popover */}
                    {showColorPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '36px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 70,
                          backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--brand-border)',
                          borderRadius: '8px',
                          padding: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          width: '216px',
                          boxSizing: 'border-box'
                        }}
                      >
                        {GRID_COLORS.map((row, rowIdx) => (
                          <div key={rowIdx} style={{ display: 'flex', gap: '4px' }}>
                            {row.map(colorHex => {
                              const isColorSelected = selectedColor === colorHex;
                              return (
                                <button
                                  key={colorHex}
                                  type="button"
                                  onClick={() => {
                                    setSelectedColor(colorHex);
                                    setShowColorPicker(false);
                                  }}
                                  style={{
                                    width: '13px',
                                    height: '13px',
                                    backgroundColor: colorHex,
                                    border: isColorSelected ? '1px solid var(--foreground)' : 'none',
                                    borderRadius: '2.5px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transform: isColorSelected ? 'scale(1.1)' : 'none',
                                    transition: 'all 0.1s'
                                  }}
                                  title={colorHex}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.value);
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c.value,
                    border: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: isSelected ? '0 0 0 2px #3B82F6, 0 0 0 4px rgba(59,130,246,0.2)' : 'none',
                    transform: isSelected ? 'scale(1.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
              );
            })}
          </div>

          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter folder name (Ex: CS 101)"
            style={inputStyle()}
            onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
          />

          <button
            type="submit"
            disabled={!name.trim()}
            style={{
              width: '100%',
              height: '42px',
              backgroundColor: '#EDE9FE',
              border: 'none',
              borderRadius: '24px',
              color: '#7C3AED',
              fontSize: '13px',
              fontWeight: 700,
              cursor: name.trim() ? 'pointer' : 'default',
              fontFamily: "'Inter', sans-serif",
              opacity: name.trim() ? 1 : 0.6,
              transition: 'opacity 0.15s',
            }}
          >
            Create folder
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Creation Cards ───────────────────────────────────────────────────────────
function CreateCard({ card, onClick }: { card: typeof CARDS[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3"
      style={{
        padding: '14px 16px',
        backgroundColor: hovered ? 'var(--brand-accent)' : 'var(--card-bg)',
        border: `1px solid ${hovered ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
        borderRadius: '12px',
        cursor: 'pointer', textAlign: 'left',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 6px 20px rgba(0,0,0,0.06)` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ width: '38px', height: '38px', borderRadius: '9px', backgroundColor: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {card.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</p>
        <p style={{ color: '#9090A8', fontSize: '11px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.subtitle}</p>
      </div>
      <ChevronRight style={{ width: '14px', height: '14px', color: hovered ? 'var(--brand-primary)' : '#C4C2D6', flexShrink: 0, transition: 'color 0.15s' }} />
    </button>
  );
}

// ─── Note Row ─────────────────────────────────────────────────────────────────
interface NoteRowProps {
  note: Note;
  folders: Folder[];
  onClick: () => void;
  onOpenSettings: (e: React.MouseEvent, note: Note) => void;
}

function NoteRow({ note, folders, onClick, onOpenSettings }: NoteRowProps) {
  const [hovered, setHovered] = useState(false);

  const timeText = note.lastModified
    ? `Last modified ${new Date(note.lastModified).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'Last opened recently';

  const isYoutube = note.tags?.includes('website') || note.tags?.includes('youtube') || note.tags?.includes('youtube-link') || note.content?.includes('Source:') || note.content?.includes('youtube.com') || note.content?.includes('youtu.be') || note.content?.includes('website / video');
  const isPdf = note.tags?.includes('pdf') || note.title.toLowerCase().endsWith('.pdf');
  const isDoc = note.tags?.includes('doc') || note.tags?.includes('docx') || note.title.toLowerCase().endsWith('.docx') || note.title.toLowerCase().endsWith('.doc');
  const isAudio = note.tags?.includes('audio') || note.tags?.includes('mp3') || note.title.toLowerCase().endsWith('.mp3') || note.title.toLowerCase().endsWith('.wav') || note.title.toLowerCase().endsWith('.m4a');

  const folderTag = note.tags?.find(tag => folders.some(f => f.name === tag));
  const folder = folderTag ? folders.find(f => f.name === folderTag) : null;

  const getNoteIcon = () => {
    if (isYoutube) {
      return <YoutubeIcon size={18} color="#FFFFFF" />;
    }
    if (isPdf) {
      return <PdfIcon size={32} />;
    }
    if (isDoc) {
      return <DocIcon size={32} />;
    }
    if (isAudio) {
      return <Mp3Icon size={32} />;
    }
    return <FileText style={{ width: '18px', height: '18px', color: '#7C3AED' }} />;
  };

  const getIconBg = () => {
    if (isYoutube) return '#EF4444';
    if (isPdf || isDoc || isAudio) return 'transparent';
    return '#EDE9FE';
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
        padding: '12px 16px',
        backgroundColor: hovered ? 'var(--brand-accent)' : 'var(--card-bg)',
        border: `1px solid ${hovered ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
        borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s', fontFamily: "'Inter', sans-serif",
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.02)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '38px', height: '38px', backgroundColor: getIconBg(), borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {getNoteIcon()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {note.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#9090A8', fontSize: '11px' }}>{timeText}</span>
          {folder && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: `${folder.color}12`,
              color: folder.color,
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif"
            }}>
              <FolderIcon color={folder.color} size={10} />
              {folder.name}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => onOpenSettings(e, note)}
        style={{
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
          color: '#9090A8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background-color 0.15s',
          zIndex: 10
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-accent)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MoreVertical style={{ width: '16px', height: '16px', color: 'var(--foreground)' }} />
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ tab, isSearch, onCreateNote }: { tab: TabType; isSearch?: boolean; onCreateNote: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '64px 20px', textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--brand-accent)', border: '1px solid var(--brand-border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FolderOpen style={{ width: '26px', height: '26px', color: 'var(--brand-primary)' }} />
      </div>
      <div>
        <p style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>
          {isSearch ? 'No notes found' : tab === 'my-notes' ? 'No notes yet' : 'Nothing shared with you yet'}
        </p>
        <p style={{ color: '#9090A8', fontSize: '12px', margin: 0 }}>
          {isSearch ? "We couldn't find any notes matching your search terms" : tab === 'my-notes' ? 'Pick a creation type above to get started' : 'Notes shared by teammates will appear here'}
        </p>
      </div>
      {!isSearch && tab === 'my-notes' && (
        <button
          onClick={onCreateNote}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 20px',
            backgroundColor: '#7C3AED', border: 'none', borderRadius: '8px',
            color: '#ffffff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.15s',
            boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus style={{ width: '14px', height: '14px' }} /> Create Note
        </button>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { notes, folders, addFolder, deleteFolder, searchQuery } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('my-notes');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [activeSettingsNote, setActiveSettingsNote] = useState<Note | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const activeFolder = folders.find(f => f.id === selectedFolderId) || null;

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFolder) {
      return n.tags?.includes(activeFolder.name);
    }
    return true;
  });

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (confirm(`Are you sure you want to delete folder "${folderName}"? Notes inside the folder will not be deleted.`)) {
      deleteFolder(folderId, folderName);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      // Untag all notes with this folder name tag
      notes.forEach(note => {
        if (note.tags?.includes(folderName)) {
          useAppStore.getState().updateNote(note.id, {
            tags: note.tags.filter(t => t !== folderName)
          });
        }
      });
    }
  };

  const tabBtn = (tab: TabType): React.CSSProperties => ({
    padding: '6px 16px',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', background: 'none', border: 'none',
    borderRadius: '7px',
    color: activeTab === tab ? 'var(--foreground)' : '#9090A8',
    backgroundColor: activeTab === tab ? 'var(--card-bg)' : 'transparent',
    boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
    transition: 'all 0.15s',
    fontStyle: activeTab === tab ? 'italic' : 'normal',
    fontFamily: "'Inter', sans-serif",
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'var(--foreground)', fontSize: '26px', fontWeight: 700, margin: '0 0 4px', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em' }}>Dashboard</h1>
          <p style={{ color: '#9090A8', fontSize: '13px', margin: 0 }}>Create new notes</p>
        </div>
      </div>

      {/* ── Creation Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7 w-full">
        {CARDS.map(card => (
          <CreateCard key={card.type} card={card} onClick={() => setActiveModal(card.type)} />
        ))}
      </div>

      {/* ── Tabs + New Folder ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--brand-accent)', borderRadius: '9px', padding: '3px' }}>
          <button style={tabBtn('my-notes')} onClick={() => setActiveTab('my-notes')}>My Notes</button>
          <button style={tabBtn('shared')} onClick={() => setActiveTab('shared')}>Shared with Me</button>
        </div>

        {activeTab === 'my-notes' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedFolderId && activeFolder && (
              <button
                onClick={() => handleDeleteFolder(activeFolder.id, activeFolder.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: '#EF4444', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'; }}
                title="Delete Active Folder"
              >
                <Trash2 style={{ width: '13px', height: '13px' }} />
                Delete Folder
              </button>
            )}

            <button
              onClick={() => setShowFolderModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--brand-border)',
                borderRadius: '8px',
                color: '#6B6B8A', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.backgroundColor = 'var(--brand-accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.color = '#6B6B8A'; e.currentTarget.style.backgroundColor = 'var(--card-bg)'; }}
            >
              <FolderPlus style={{ width: '13px', height: '13px' }} />
              New Folder
            </button>
          </div>
        )}
      </div>

      {/* ── Folders list ──────────────────────────────────────────────────── */}
      {folders.length > 0 && activeTab === 'my-notes' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {folders.map(f => {
            const isSelected = selectedFolderId === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setSelectedFolderId(prev => prev === f.id ? null : f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  backgroundColor: isSelected ? `${f.color}15` : 'var(--card-bg)',
                  border: `1px solid ${isSelected ? f.color : 'var(--brand-border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = f.color;
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--brand-border)';
                }}
              >
                <FolderIcon color={f.color} size={15} />
                <span style={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: isSelected ? 600 : 500 }}>{f.name}</span>
                {isSelected && (
                  <span style={{ fontSize: '10px', color: f.color, marginLeft: '2px', fontWeight: 700 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Notes List ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }}>
        {activeTab === 'my-notes' ? (
          filteredNotes.length === 0 ? (
            <EmptyState tab="my-notes" isSearch={!!searchQuery} onCreateNote={() => setActiveModal('blank')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredNotes.map(note => (
                <NoteRow
                  key={note.id}
                  note={note}
                  folders={folders}
                  onClick={() => {
                    useAppStore.setState({ activeNoteId: note.id });
                    router.push('/notes');
                  }}
                  onOpenSettings={(e, note) => {
                    e.stopPropagation();
                    setActiveSettingsNote(note);
                  }}
                />
              ))}
            </div>
          )
        ) : (
          <EmptyState tab="shared" onCreateNote={() => setActiveModal('blank')} />
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {activeModal && (
        <CreateModal
          type={activeModal}
          onClose={() => setActiveModal(null)}
          activeFolderName={activeFolder?.name}
        />
      )}
      {showFolderModal && (
        <FolderModal
          onClose={() => setShowFolderModal(false)}
          onCreate={(name, color) => addFolder(name, color)}
        />
      )}
      {activeSettingsNote && (
        <NoteSettingsModal
          note={activeSettingsNote}
          folders={folders}
          onClose={() => setActiveSettingsNote(null)}
          onUpdate={(id, updates) => useAppStore.getState().updateNote(id, updates)}
          onDelete={(id) => {
            useAppStore.getState().deleteNote(id);
            setActiveSettingsNote(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Note Settings Modal ─────────────────────────────────────────────────────
import { useToast } from '@/components/ui/toast';
import { useUIStore } from '@/store/useUIStore';

interface NoteSettingsModalProps {
  note: Note;
  folders: Folder[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

function NoteSettingsModal({ note, folders, onClose, onUpdate, onDelete }: NoteSettingsModalProps) {
  const [title, setTitle] = useState(note.title);
  const [selectedFolder, setSelectedFolder] = useState(note.tags[0] || '');
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const folderDropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAppStore();
  const { openUpgradeModal } = useUIStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target as Node)) {
        setIsFolderDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    onUpdate(note.id, { title: val });
  };

  const handleFolderChange = (val: string) => {
    setSelectedFolder(val);
    const folderNames = folders.map(f => f.name);
    const existingTags = note.tags || [];
    const nonFolderTags = existingTags.filter(t => !folderNames.includes(t));
    const newTags = val ? [...nonFolderTags, val] : nonFolderTags;
    onUpdate(note.id, { tags: newTags });
  };

  const handleExportPdf = async () => {
    onClose(); // close the modal immediately
    toast('Exporting document as PDF...');
    try {
      // Dynamically import jsPDF and html2canvas (installed via npm — no CDN needed)
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      // Sanitize filename
      const sanitizedTitle = (title || 'document')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, ' ')
        .trim() || 'document';

      // ── Build a clean, self-contained HTML snippet ────────────────────────
      // Strip Tiptap custom node wrappers (VS Code code-block chrome, image
      // toolbar overlays, etc.) and keep only the readable content.
      const rawContent = (note.content || '')
        // Remove the VS Code-style title bar + line-number chrome injected by
        // the custom CodeBlock NodeView (they contain no text value anyway)
        .replace(/<div[^>]*class="vscode-titlebar"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="vscode-line-numbers"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="notion-code-toolbar"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Unwrap any remaining NodeViewWrapper divs injected by Tiptap React
        .replace(/<div[^>]*data-node-view-wrapper[^>]*>/gi, '')
        // Remove contenteditable="false" overlays (image toolbar, etc.)
        .replace(/<div[^>]*contenteditable="false"[^>]*>[\s\S]*?<\/div>/gi, '');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0; padding: 48px 56px;
    background: #ffffff;
    color: #1e1b29;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    line-height: 1.7;
    width: 794px; /* A4 at 96dpi */
  }
  h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 28px; font-weight: 800;
    margin: 0 0 8px; color: #1e1b29;
    border-bottom: 3px solid #8b5cf6;
    padding-bottom: 14px;
  }
  .meta {
    font-size: 11px; color: #9090a8;
    margin-bottom: 32px;
    display: flex; gap: 20px;
  }
  h2 { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; margin: 28px 0 10px; color: #1e1b29; }
  h3 { font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; margin: 20px 0 8px; color: #1e1b29; }
  h4, h5, h6 { font-family: 'Outfit', sans-serif; font-weight: 600; margin: 16px 0 6px; color: #1e1b29; }
  p  { margin: 0 0 14px; }
  ul, ol { margin: 0 0 14px; padding-left: 26px; }
  li { margin-bottom: 5px; }
  strong { font-weight: 700; }
  em     { font-style: italic; }
  u      { text-decoration: underline; }
  s      { text-decoration: line-through; }
  a      { color: #7c3aed; text-decoration: underline; }

  /* ── Code blocks ── */
  pre {
    background: #1e1b2e;
    color: #e2e8f0;
    border-radius: 8px;
    padding: 16px 20px;
    font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    overflow: hidden;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 16px 0;
  }
  code {
    font-family: 'Fira Code', 'Consolas', monospace;
    background: rgba(139, 92, 246, 0.1);
    color: #7c3aed;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
  pre code { background: transparent; color: inherit; padding: 0; border-radius: 0; }

  /* ── Blockquote ── */
  blockquote {
    border-left: 4px solid #8b5cf6;
    margin: 16px 0; padding: 4px 0 4px 18px;
    color: #6b6b8a; font-style: italic;
    background: rgba(139,92,246,0.04);
    border-radius: 0 6px 6px 0;
  }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; vertical-align: top; }
  th { background: #f9f5ff; font-weight: 700; color: #1e1b29; }
  tr:nth-child(even) td { background: #fafafa; }

  /* ── Task list ── */
  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  li[data-type="taskItem"] { display: flex; align-items: flex-start; gap: 9px; }
  li[data-type="taskItem"] > label { display: flex; align-items: center; gap: 7px; cursor: default; }
  li[data-type="taskItem"] input[type="checkbox"] { width: 14px; height: 14px; accent-color: #7c3aed; pointer-events: none; }
  li[data-type="taskItem"][data-checked="true"] > div { text-decoration: line-through; color: #9ca3af; }

  /* ── Images ── */
  img { max-width: 100%; height: auto; border-radius: 6px; margin: 12px 0; display: block; }

  /* ── Horizontal rule ── */
  hr { border: none; border-top: 2px solid #e5e7eb; margin: 24px 0; }

  /* ── Page break helpers ── */
  h1,h2,h3,h4,h5,h6 { page-break-after: avoid; break-after: avoid; }
  pre, table, blockquote, img { page-break-inside: avoid; break-inside: avoid; }
</style>
</head>
<body>
  <h1>${sanitizedTitle}</h1>
  <div class="meta">
    <span><strong>Last modified:</strong> ${new Date(note.lastModified).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    ${note.tags.length ? `<span><strong>Tags:</strong> ${note.tags.join(', ')}</span>` : ''}
  </div>
  <div class="content-body">${rawContent}</div>
</body>
</html>`;

      // ── Render off-screen in an <iframe> for full CSS isolation ─────────────
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden;';
      document.body.appendChild(iframe);

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.srcdoc = htmlContent;
      });

      // Give fonts and images extra time to settle
      await new Promise<void>((res) => setTimeout(res, 600));

      const iframeDoc = iframe.contentDocument!;
      const body = iframeDoc.body;

      // ── html2canvas → whitespace-aware multi-page A4 jsPDF ───────────────────
      // Strategy: render the full document to one tall canvas, then scan pixel
      // rows to find near-white gaps (paragraph spacing, section breaks).
      // Page cuts are placed at those safe gaps — never mid-glyph.
      const A4_WIDTH_MM       = 210;
      const A4_HEIGHT_MM      = 297;
      const MARGIN_MM         = 15;
      const CONTENT_WIDTH_MM  = A4_WIDTH_MM  - MARGIN_MM * 2;
      const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2;

      // Render full document to one tall canvas (scale=2 for sharp text)
      const fullCanvas = await html2canvas(body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
      });

      document.body.removeChild(iframe);

      // px-per-mm ratio: how many canvas pixels equal 1 mm of PDF width
      const pxPerMm          = fullCanvas.width / CONTENT_WIDTH_MM;
      // Ideal page height in canvas pixels (= one A4 content area)
      const idealPageHeightPx = Math.round(CONTENT_HEIGHT_MM * pxPerMm);

      // ── Row-level whitespace scanner ─────────────────────────────────────────
      // Read raw RGBA pixels once for fast random access
      const ctx2d   = fullCanvas.getContext('2d')!;
      const imgData = ctx2d.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
      const pixels  = imgData.data;
      const W       = fullCanvas.width;

      // Returns true when a horizontal row is near-white (safe to cut here).
      // We sample every 6th pixel for speed; threshold=242 allows slight shadows.
      function isRowSafe(y: number): boolean {
        if (y <= 0 || y >= fullCanvas.height) return true;
        const base = y * W * 4;
        for (let x = 0; x < W; x += 6) {
          const i = base + x * 4;
          if (pixels[i] < 242 || pixels[i + 1] < 242 || pixels[i + 2] < 242) return false;
        }
        return true;
      }

      // Walk backward from idealCutY to find the closest safe gap (up to ~4 text
      // lines back ≈ 100px at scale=2 / 14px line-height). Falls back to exact
      // cut only if no whitespace row is found.
      function findSafeCut(idealY: number): number {
        const lookback = Math.min(120, idealY);
        for (let y = idealY; y >= idealY - lookback; y--) {
          if (isRowSafe(y)) return y;
        }
        return idealY;
      }

      // ── Build page boundaries ─────────────────────────────────────────────────
      const pageBoundaries: number[] = [0];
      let next = idealPageHeightPx;
      while (next < fullCanvas.height) {
        const cut = findSafeCut(next);
        pageBoundaries.push(cut);
        next = cut + idealPageHeightPx;
      }
      pageBoundaries.push(fullCanvas.height);

      // ── Assemble A4 PDF ───────────────────────────────────────────────────────
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      for (let i = 0; i < pageBoundaries.length - 1; i++) {
        if (i > 0) pdf.addPage();

        const startPx      = pageBoundaries[i];
        const endPx        = pageBoundaries[i + 1];
        const sliceHeightPx = endPx - startPx;

        // Crop exactly this slice onto a fresh canvas
        const pageCanvas    = document.createElement('canvas');
        pageCanvas.width    = W;
        pageCanvas.height   = sliceHeightPx;
        const pCtx          = pageCanvas.getContext('2d')!;
        pCtx.fillStyle      = '#ffffff';
        pCtx.fillRect(0, 0, W, sliceHeightPx);
        pCtx.drawImage(
          fullCanvas,
          0, startPx, W, sliceHeightPx,   // source rect
          0, 0,       W, sliceHeightPx,   // dest rect
        );

        // Height of this slice in mm (last page may be shorter than a full A4)
        const sliceHeightMm = sliceHeightPx / pxPerMm;

        pdf.addImage(
          pageCanvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          MARGIN_MM, MARGIN_MM,
          CONTENT_WIDTH_MM, sliceHeightMm,
        );
      }

      pdf.save(`${sanitizedTitle}.pdf`);
      toast('PDF downloaded successfully!');
    } catch (e) {
      console.error('PDF export error:', e);
      toast('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px',
          backgroundColor: 'var(--card-bg)', border: '1px solid var(--brand-border)',
          borderRadius: '16px', padding: '28px',
          fontFamily: "'Inter', sans-serif", boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: '20px', top: '20px',
            background: 'none', border: 'none', color: '#9090A8',
            cursor: 'pointer', fontSize: '18px'
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>

        <h2 style={{
          color: 'var(--foreground)', fontSize: '20px', fontWeight: 700,
          margin: '0 0 24px', fontFamily: "'Outfit', sans-serif", textAlign: 'left'
        }}>
          Note settings
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Note Title */}
          <div style={{ textAlign: 'left' }}>
            <label style={{
              display: 'block', color: '#6B6B8A', fontSize: '11px', fontWeight: 600,
              marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Note Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Note title"
              style={{
                width: '100%', height: '42px', backgroundColor: 'var(--background)',
                border: '1px solid var(--brand-border)', borderRadius: '8px',
                padding: '0 14px', fontSize: '13px', color: 'var(--foreground)',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Add note to folder */}
          <div style={{ textAlign: 'left' }}>
            <label style={{
              display: 'block', color: '#6B6B8A', fontSize: '11px', fontWeight: 600,
              marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Add note to folder
            </label>
            <div ref={folderDropdownRef} style={{ position: 'relative', width: '100%' }}>
              <div
                onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                style={{
                  width: '100%', height: '42px', backgroundColor: 'var(--background)',
                  border: '1px solid var(--brand-border)', borderRadius: '8px',
                  padding: '0 14px 0 40px', fontSize: '13px', color: 'var(--foreground)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', boxSizing: 'border-box',
                  borderColor: isFolderDropdownOpen ? '#7C3AED' : 'var(--brand-border)',
                  boxShadow: isFolderDropdownOpen ? '0 0 0 3px rgba(124, 58, 237, 0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FolderIcon color={folders.find(f => f.name === selectedFolder)?.color || '#7C3AED'} size={16} />
                  <span style={{ fontWeight: selectedFolder ? 600 : 400 }}>
                    {selectedFolder || 'Select folder'}
                  </span>
                </div>
                <div style={{
                  color: '#9090A8', fontSize: '10px',
                  transform: isFolderDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  userSelect: 'none'
                }}>
                  ▼
                </div>
              </div>

              {isFolderDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '46px',
                    left: 0,
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(124, 58, 237, 0.12)',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(124, 58, 237, 0.1), 0 2px 8px rgba(0,0,0,0.02)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    padding: '6px 0',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Default / Clear Folder */}
                  <div
                    onClick={() => {
                      handleFolderChange('');
                      setIsFolderDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#6B6B8A',
                      transition: 'background-color 0.15s',
                      backgroundColor: selectedFolder === '' ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
                      fontWeight: selectedFolder === '' ? 600 : 400
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.06)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedFolder === '' ? 'rgba(124, 58, 237, 0.05)' : 'transparent'}
                  >
                    <FolderIcon color="#9090A8" size={15} />
                    <span>Select folder</span>
                  </div>

                  {/* Folders List */}
                  {folders.map(f => {
                    const isSelected = selectedFolder === f.name;
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          handleFolderChange(f.name);
                          setIsFolderDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: 'var(--foreground)',
                          transition: 'background-color 0.15s',
                          backgroundColor: isSelected ? `${f.color}15` : 'transparent',
                          fontWeight: isSelected ? 600 : 400
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.06)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? `${f.color}15` : 'transparent'}
                      >
                        <FolderIcon color={f.color} size={15} />
                        <span>{f.name}</span>
                        {isSelected && (
                          <span style={{ marginLeft: 'auto', fontSize: '11px', color: f.color, fontWeight: 700 }}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>



          {/* Export note */}
          <div style={{ textAlign: 'left' }}>
            <label style={{
              display: 'block', color: '#6B6B8A', fontSize: '11px', fontWeight: 600,
              marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Export note
            </label>
            <button
              onClick={handleExportPdf}
              style={{
                width: '100%', height: '42px', backgroundColor: 'var(--background)',
                border: '1px solid var(--brand-border)', borderRadius: '8px',
                color: 'var(--foreground)', fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', cursor: 'pointer', boxSizing: 'border-box',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-accent)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--background)'}
            >
              <FileDown style={{ width: '16px', height: '16px', color: '#6B6B8A' }} />
              Export note as PDF
            </button>
          </div>

          {/* Delete note */}
          <button
            onClick={() => onDelete(note.id)}
            style={{
              width: '100%', height: '42px', backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px',
              color: '#EF4444', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', cursor: 'pointer', marginTop: '12px', boxSizing: 'border-box',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'}
          >
            <Trash2 style={{ width: '16px', height: '16px' }} />
            Delete note
          </button>
        </div>
      </div>
    </div>
  );
}
