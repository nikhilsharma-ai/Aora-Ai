'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, FileDown, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore, Note, Folder } from '@/store/useAppStore';

// ─── Custom Folder Icon ──────────────────────────────────────────────────────
export function FolderIcon({ color = '#7C3AED', size = 18 }: { color?: string; size?: number }) {
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

export interface NoteSettingsModalProps {
  note: Note;
  folders: Folder[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export function NoteSettingsModal({ note, folders, onClose, onUpdate, onDelete }: NoteSettingsModalProps) {
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
      // Dynamically import jsPDF and html2canvas
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
      const rawContent = (note.content || '')
        .replace(/<div[^>]*class="vscode-titlebar"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="vscode-line-numbers"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="notion-code-toolbar"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*data-node-view-wrapper[^>]*>/gi, '')
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
    ${note.tags && note.tags.length ? `<span><strong>Tags:</strong> ${note.tags.join(', ')}</span>` : ''}
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

      const pxPerMm          = fullCanvas.width / CONTENT_WIDTH_MM;
      const idealPageHeightPx = Math.round(CONTENT_HEIGHT_MM * pxPerMm);

      const ctx2d   = fullCanvas.getContext('2d')!;
      const imgData = ctx2d.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
      const pixels  = imgData.data;
      const W       = fullCanvas.width;

      function isRowSafe(y: number): boolean {
        if (y <= 0 || y >= fullCanvas.height) return true;
        const base = y * W * 4;
        for (let x = 0; x < W; x += 6) {
          const i = base + x * 4;
          if (pixels[i] < 242 || pixels[i + 1] < 242 || pixels[i + 2] < 242) return false;
        }
        return true;
      }

      function findSafeCut(idealY: number): number {
        const lookback = Math.min(120, idealY);
        for (let y = idealY; y >= idealY - lookback; y--) {
          if (isRowSafe(y)) return y;
        }
        return idealY;
      }

      const pageBoundaries: number[] = [0];
      let next = idealPageHeightPx;
      while (next < fullCanvas.height) {
        const cut = findSafeCut(next);
        pageBoundaries.push(cut);
        next = cut + idealPageHeightPx;
      }
      pageBoundaries.push(fullCanvas.height);

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      for (let i = 0; i < pageBoundaries.length - 1; i++) {
        if (i > 0) pdf.addPage();

        const startPx      = pageBoundaries[i];
        const endPx        = pageBoundaries[i + 1];
        const sliceHeightPx = endPx - startPx;

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
