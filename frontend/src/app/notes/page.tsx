'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, Note } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { NoteSettingsModal } from '@/components/ui/note-settings-modal';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
const lowlight = createLowlight(all);
import { TextSelection } from '@tiptap/pm/state';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import {
  MoreVertical,
  Underline,
  Type,
  Paintbrush,
  Image,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
  Eye,
  MessageCircle,
  Bold,
  Italic,
  ArrowLeft,
  Send,
  Sparkles,
  Volume2,
  Mic,
  Play,
  RotateCw,
  HelpCircle,
  Plus,
  Trash2,
  Check,
  FileDown,
  ExternalLink,
  ChevronDown,
  Layers,
  Code,
  Eraser
} from 'lucide-react';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Table as TiptapTable } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';

// FontFamilyExt — registers fontFamily as a TextStyle attribute so setMark works
const FontFamilyExt = Extension.create({
  name: 'fontFamily',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontFamily: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontFamily || null,
          renderHTML: (attrs: Record<string, any>) => {
            if (!attrs.fontFamily) return {};
            return { style: `font-family: ${attrs.fontFamily}` };
          },
        },
      },
    }];
  },
});

// FontSizeExt — registers fontSize as a TextStyle attribute so setMark works
const FontSizeExt = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize || null,
          renderHTML: (attrs: Record<string, any>) => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ─── Custom Code Block NodeView — Notion-style ───────────────────────────────
const LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'abap', label: 'ABAP' },
  { value: 'arduino', label: 'Arduino' },
  { value: 'bash', label: 'Bash' },
  { value: 'basic', label: 'BASIC' },
  { value: 'c', label: 'C' },
  { value: 'clojure', label: 'Clojure' },
  { value: 'coffeescript', label: 'CoffeeScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'css', label: 'CSS' },
  { value: 'dart', label: 'Dart' },
  { value: 'diff', label: 'Diff' },
  { value: 'docker', label: 'Docker' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'elm', label: 'Elm' },
  { value: 'erlang', label: 'Erlang' },
  { value: 'flow', label: 'Flow' },
  { value: 'fortran', label: 'Fortran' },
  { value: 'fsharp', label: 'F#' },
  { value: 'gherkin', label: 'Gherkin' },
  { value: 'glsl', label: 'GLSL' },
  { value: 'go', label: 'Go' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'groovy', label: 'Groovy' },
  { value: 'haskell', label: 'Haskell' },
  { value: 'html', label: 'HTML' },
  { value: 'ini', label: 'Ini' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'julia', label: 'Julia' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'latex', label: 'LaTeX' },
  { value: 'less', label: 'Less' },
  { value: 'lisp', label: 'Lisp' },
  { value: 'lua', label: 'Lua' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'markup', label: 'Markup' },
  { value: 'matlab', label: 'MATLAB' },
  { value: 'mermaid', label: 'Mermaid' },
  { value: 'nix', label: 'Nix' },
  { value: 'objectivec', label: 'Objective-C' },
  { value: 'ocaml', label: 'OCaml' },
  { value: 'pascal', label: 'Pascal' },
  { value: 'perl', label: 'Perl' },
  { value: 'php', label: 'PHP' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'prolog', label: 'Prolog' },
  { value: 'protobuf', label: 'Protobuf' },
  { value: 'python', label: 'Python' },
  { value: 'r', label: 'R' },
  { value: 'reason', label: 'Reason' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' },
  { value: 'sass', label: 'Sass' },
  { value: 'scala', label: 'Scala' },
  { value: 'scheme', label: 'Scheme' },
  { value: 'scss', label: 'SCSS' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'swift', label: 'Swift' },
  { value: 'toml', label: 'TOML' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'vbnet', label: 'VB.Net' },
  { value: 'verilog', label: 'Verilog' },
  { value: 'vhdl', label: 'VHDL' },
  { value: 'visual-basic', label: 'Visual Basic' },
  { value: 'webassembly', label: 'WebAssembly' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
];


function CodeBlockComponent({ node, updateAttributes }: any) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const currentLang = node.attrs.language || 'plaintext';
  const currentLabel = LANGUAGES.find(l => l.value === currentLang)?.label || 'Plain Text';
  const filtered = LANGUAGES.filter(l => l.label.toLowerCase().includes(search.toLowerCase()));

  React.useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = () => {
    const codeEl = dropdownRef.current?.closest('.notion-code-block')?.querySelector('code');
    const text = codeEl?.innerText || node.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <NodeViewWrapper className="notion-code-block">
      {/* VS Code-style title bar */}
      <div className="vscode-titlebar" contentEditable={false}>
        <span className="vscode-dot" style={{ background: '#FF5F57' }} />
        <span className="vscode-dot" style={{ background: '#FEBC2E' }} />
        <span className="vscode-dot" style={{ background: '#28C840' }} />
        <span className="vscode-lang-badge">{currentLabel}</span>
      </div>

      {/* Editor area with line numbers */}
      <div className="vscode-editor-area" style={isMinimized ? { height: '0px', minHeight: '0px', overflow: 'hidden' } : {}}>
        <div className="vscode-line-numbers" aria-hidden="true" contentEditable={false} style={isMinimized ? { borderRight: 'none', padding: 0 } : {}}>
          {(node.textContent || '\n').split('\n').map((_: string, i: number) => (
            <span key={i} className="vscode-line-num">{i + 1}</span>
          ))}
        </div>
        <div className="vscode-code-area" style={isMinimized ? { padding: 0 } : {}}>
          <NodeViewContent as={"code" as any} />
        </div>
      </div>

      {/* Bottom Notion-style toolbar */}
      <div className="notion-code-toolbar" contentEditable={false}>
        <div className="notion-lang-wrapper" ref={dropdownRef}>
          <button className="notion-lang-btn" onClick={() => { setOpen(o => !o); setSearch(''); }}>
            <span>{currentLabel}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, flexShrink: 0 }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {open && (
            <div className="notion-lang-dropdown">
              <div className="notion-lang-search-wrap">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: '#6B7280' }}>
                  <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M9 9L11.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchRef}
                  className="notion-lang-search"
                  placeholder="Search for a language..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  onKeyUp={e => e.stopPropagation()}
                  onKeyPress={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
              </div>
              <div className="notion-lang-list">
                {filtered.length === 0
                  ? <div className="notion-lang-empty">No languages found</div>
                  : filtered.map(l => (
                    <div key={l.value}
                      className={`notion-lang-item${currentLang === l.value ? ' notion-lang-item--active' : ''}`}
                      onMouseDown={e => { e.preventDefault(); updateAttributes({ language: l.value }); setOpen(false); setSearch(''); }}
                    >
                      <span>{l.label}</span>
                      {currentLang === l.value && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <button className="notion-code-btn" onClick={handleCopy} title="Copy">
          {copied
            ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7L5 10L11 4" stroke="#5DB075" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4" y="4" width="7" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3" /><path d="M4 3.5V3A1.5 1.5 0 0 1 5.5 1.5H10A1.5 1.5 0 0 1 11.5 3V8.5A1.5 1.5 0 0 1 10 10H9.5" stroke="currentColor" strokeWidth="1.3" /></svg>
          }
        </button>

        <button className="notion-code-btn" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "Maximize" : "Minimize"}>
          {isMinimized ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20"></polyline>
              <polyline points="20 10 14 10 14 4"></polyline>
              <line x1="14" y1="10" x2="21" y2="3"></line>
              <line x1="10" y1="14" x2="3" y2="21"></line>
            </svg>
          )}
        </button>

      </div>
    </NodeViewWrapper>
  );
}

const ImageComponent = ({ node, updateAttributes, selected, deleteNode }: any) => {
  const src = node.attrs.src;
  const width = node.attrs.width || '100%';

  const handleZoom = (amount: number) => {
    let currentWidthNum = 100;
    if (typeof width === 'string') {
      if (width.endsWith('%')) {
        currentWidthNum = parseInt(width, 10);
      } else if (width.endsWith('px')) {
        currentWidthNum = Math.round((parseInt(width, 10) / 800) * 100);
      }
    } else if (typeof width === 'number') {
      currentWidthNum = width;
    }

    let newWidth = Math.max(10, Math.min(100, currentWidthNum + amount));
    updateAttributes({ width: `${newWidth}%` });
  };

  return (
    <NodeViewWrapper className="editor-image-wrapper" style={{ display: 'block', position: 'relative', maxWidth: '100%', margin: '16px auto', textAlign: 'center' }}>
      <img
        src={src}
        alt={node.attrs.alt}
        style={{
          width: width,
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px',
          border: selected ? '2px solid #7C3AED' : 'none',
          cursor: 'pointer',
          transition: 'all 0.15s',
          display: 'inline-block'
        }}
      />
      {selected && (
        <div
          contentEditable={false}
          style={{
            position: 'absolute',
            top: '-42px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '4px 6px',
            zIndex: 100,
            userSelect: 'none'
          }}
        >
          {/* Zoom Out */}
          <button
            onClick={() => handleZoom(-10)}
            title="Zoom Out"
            style={{
              border: 'none', background: 'none', cursor: 'pointer', color: '#374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '26px', height: '26px', borderRadius: '5px', transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>

          {/* Width Badge */}
          <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, padding: '0 4px', fontFamily: 'sans-serif' }}>
            {width}
          </span>

          {/* Zoom In */}
          <button
            onClick={() => handleZoom(10)}
            title="Zoom In"
            style={{
              border: 'none', background: 'none', cursor: 'pointer', color: '#374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '26px', height: '26px', borderRadius: '5px', transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>

          <div style={{ width: '1px', height: '16px', backgroundColor: '#E5E7EB', margin: '0 4px' }} />

          {/* Delete */}
          <button
            onClick={() => deleteNode()}
            title="Delete Image"
            style={{
              border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '26px', height: '26px', borderRadius: '5px', transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default function NotesWorkspace() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    notes,
    activeNoteId,
    updateNote,
    deleteNote,
    setActiveNoteId,
    activeNotesTab,
    setActiveNotesTab,
    addDeck,
    addCard,
    decks,
    quizzes,
    addQuiz,
    addQuizResult,
    folders
  } = useAppStore();

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Split-screen state
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(true);
  const [lastSyncedContent, setLastSyncedContent] = useState('');

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    setIsSettingsModalOpen(false);
    router.push('/dashboard');
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    updateNote(id, updates);
  };

  // Notion notepad states
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const imageFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src && editor) {
        editor.chain().focus().setImage({ src }).run();
      }
      setIsImageModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  // ─── Toolbar State ───────────────────────────────────────────────────────────
  const [fontFamily, setFontFamily] = useState("'Clarika', 'Outfit', 'Inter', sans-serif");
  const [fontSize, setFontSize] = useState(12);
  const [activePopover, setActivePopover] = useState<'color' | 'highlight' | 'align' | 'font' | 'table' | 'list' | null>(null);
  const [hoveredTableGrid, setHoveredTableGrid] = useState({ rows: 0, cols: 0 });

  const TEXT_COLORS = [
    // Row 1
    '#4B5563', '#9CA3AF', '#FFFFFF', '#EF4444', '#F97316', '#FACC15', '#A3E635', '#4ADE80', '#2DD4BF', '#38BDF8', '#818CF8', '#F472B6',
    // Row 2
    '#374151', '#6B7280', '#F3F4F6', '#DC2626', '#EA580C', '#EAB308', '#84CC16', '#22C55E', '#0D9488', '#0EA5E9', '#4F46E5', '#EC4899',
    // Row 3
    '#000000', '#4B5563', '#D1D5DB', '#991B1B', '#9A3412', '#A16207', '#4D7C0F', '#15803D', '#115E59', '#0369A1', '#3730A3', '#9D174D'
  ];

  const HIGHLIGHT_COLORS = [
    // Row 1
    '#F3F4F6', '#E5E7EB', '#FEE2E2', '#FEF3C7', '#FEF9C3', '#ECFCCB', '#D1FAE5', '#E0F2FE', '#E0E7FF', '#F5F3FF', '#FAE8FF', '#FCE7F3',
    // Row 2
    '#E5E7EB', '#D1D5DB', '#FCA5A5', '#FCD34D', '#FEF08A', '#D9F99D', '#A7F3D0', '#BAE6FD', '#C7D2FE', '#DDD6FE', '#F5D0FE', '#FBCFE8',
    // Row 3
    '#D1D5DB', '#9CA3AF', '#F87171', '#F59E0B', '#FDE047', '#A3E635', '#34D399', '#38BDF8', '#818CF8', '#A78BFA', '#E879F9', '#F472B6'
  ];

  // ─── Refs for Tiptap circular references ─────────────────────────────────────
  const checkSlashCommandRef = React.useRef<any>(null);
  const executeCommandRef = React.useRef<any>(null);

  // ─── TipTap WYSIWYG Editor ─────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }).extend({
        addNodeView() { return ReactNodeViewRenderer(CodeBlockComponent); },
        addKeyboardShortcuts() {
          return {
            Tab: ({ editor }) => {
              if (editor.isActive('codeBlock')) {
                return editor.commands.insertContent('    ');
              }
              return false;
            },
            Enter: ({ editor }) => {
              if (editor.isActive('codeBlock')) {
                const { state } = editor;
                const { selection } = state;
                const { $from } = selection;

                // Get current block content up to cursor position
                const textBefore = $from.parent.textContent.substring(0, $from.parentOffset);
                const lines = textBefore.split('\n');
                const currentLine = lines[lines.length - 1] || '';

                // Determine current indentation
                const match = currentLine.match(/^(\s+)/);
                let indent = match ? match[1] : '';

                // Indent further if previous line ends with a colon
                if (currentLine.trim().endsWith(':')) {
                  indent += '    ';
                }

                return editor.commands.insertContent('\n' + indent);
              }
              return false;
            },
            'Mod-a': ({ editor }) => {
              if (editor.isActive('codeBlock')) {
                const { state, dispatch } = editor.view;
                const { selection } = state;
                const { $from } = selection;
                let depth = $from.depth;
                while (depth > 0) {
                  const node = $from.node(depth);
                  if (node.type.name === 'codeBlock') {
                    const start = $from.before(depth);
                    const end = $from.after(depth);
                    const newSelection = TextSelection.create(state.doc, start + 1, end - 1);
                    dispatch(state.tr.setSelection(newSelection));
                    return true;
                  }
                  depth--;
                }
              }
              return false;
            }
          };
        }
      }),
      UnderlineExt,
      Placeholder.configure({
        placeholder: "Type / for command menu",
      }),
      TextStyle,
      FontFamilyExt,
      FontSizeExt,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapImage.configure({
        allowBase64: true,
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: '100%',
              renderHTML: attributes => ({
                width: attributes.width,
              }),
              parseHTML: element => element.getAttribute('width'),
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageComponent);
        },
      }),
      TiptapTable.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorContent(html);
      if (activeNote) updateNote(activeNote.id, { content: html });
      checkSlashCommandRef.current?.(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      checkSlashCommandRef.current?.(editor);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      handleKeyDown: (view, event) => {
        const menu = slashMenuRef.current;
        if (!menu.isOpen) return false;

        const commandsCount = filteredCommandsRef.current.length;

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSlashMenu(prev => ({
            ...prev,
            selectedIndex: (prev.selectedIndex + 1) % commandsCount
          }));
          return true;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSlashMenu(prev => ({
            ...prev,
            selectedIndex: (prev.selectedIndex - 1 + commandsCount) % commandsCount
          }));
          return true;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          const command = filteredCommandsRef.current[menu.selectedIndex];
          if (command) {
            executeCommandRef.current?.(command);
          }
          return true;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setSlashMenu(prev => ({ ...prev, isOpen: false }));
          return true;
        }

        return false;
      }
    },
  });

  // ─── Speech Dictation helper ─────────────────────────────────────────────────
  const startDictation = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('Speech Recognition not supported in this browser.', 'info');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    toast('Listening... Speak now!', 'success');
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (editor) {
        editor.chain().focus().insertContent(transcript).run();
      }
    };
    recognition.onerror = (err: any) => {
      console.error(err);
      toast('Speech dictation failed or timed out.', 'error');
    };
    recognition.start();
  }, [editor, toast]);

  const insertMathBlock = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertContent('$$ f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx $$').run();
    }
  }, [editor]);

  // ─── Slash command state ─────────────────────────────────────────────────────
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    query: string;
    selectedIndex: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    query: '',
    selectedIndex: 0,
  });

  const checkSlashCommand = useCallback((editorInstance: any) => {
    if (!editorInstance) return;
    const { selection } = editorInstance.state;
    const $from = selection.$from;

    // Check if we are inside a paragraph or text node
    const parentNode = $from.parent;
    if (parentNode.type.name !== 'paragraph') {
      setSlashMenu(prev => prev.isOpen ? { ...prev, isOpen: false } : prev);
      return;
    }

    const textContent = parentNode.textContent;
    const textBefore = textContent.slice(0, $from.parentOffset);

    const match = textBefore.match(/\/(\w*)$/);
    if (match) {
      const query = match[1];
      try {
        const domRect = editorInstance.view.coordsAtPos(selection.from);
        const editorParent = document.getElementById('editor-parent-container');
        if (editorParent) {
          const parentRect = editorParent.getBoundingClientRect();
          const x = domRect.left - parentRect.left;
          const y = domRect.bottom - parentRect.top + editorParent.scrollTop;

          setSlashMenu({
            isOpen: true,
            x,
            y: y + 8,
            query,
            selectedIndex: 0
          });
        }
      } catch (e) {
        console.error("Error getting cursor coordinates", e);
      }
    } else {
      setSlashMenu(prev => prev.isOpen ? { ...prev, isOpen: false } : prev);
    }
  }, []);

  checkSlashCommandRef.current = checkSlashCommand;

  // ─── Get all slash commands ──────────────────────────────────────────────────
  interface SlashCommand {
    name: string;
    icon: string;
    description: string;
    action: (chain: any) => void;
  }

  const allCommands = React.useMemo<SlashCommand[]>(() => [
    {
      name: 'Dictate',
      icon: '🎤',
      description: 'Dictate text using Speech-to-Text',
      action: () => startDictation()
    },
    {
      name: 'Heading 1',
      icon: 'H1',
      description: 'Big heading style',
      action: (chain) => {
        chain.toggleHeading({ level: 1 });
      }
    },
    {
      name: 'Heading 2',
      icon: 'H2',
      description: 'Medium heading style',
      action: (chain) => {
        chain.toggleHeading({ level: 2 });
      }
    },
    {
      name: 'Heading 3',
      icon: 'H3',
      description: 'Sub-heading style',
      action: (chain) => {
        chain.toggleHeading({ level: 3 });
      }
    },
    {
      name: 'Checklist',
      icon: '☑️',
      description: 'Insert checklist task block',
      action: (chain) => {
        chain.toggleTaskList();
      }
    },
    {
      name: 'Bullet List',
      icon: '•',
      description: 'Bulleted list',
      action: (chain) => {
        chain.toggleBulletList();
      }
    },
    {
      name: 'Numbered List',
      icon: '1.',
      description: 'Ordered list',
      action: (chain) => {
        chain.toggleOrderedList();
      }
    },
    {
      name: 'Blockquote',
      icon: '“',
      description: 'Emphasized blockquote quote',
      action: (chain) => {
        chain.toggleBlockquote();
      }
    },
    {
      name: 'Code Block',
      icon: '</>',
      description: 'Code input block',
      action: (chain) => {
        chain.toggleCodeBlock();
      }
    },
    {
      name: 'Table',
      icon: '田',
      description: 'Grid layout table',
      action: (chain) => {
        chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
      }
    }
  ], [startDictation]);

  const filteredCommands = React.useMemo(() => {
    if (!slashMenu.query) return allCommands;
    return allCommands.filter(c => c.name.toLowerCase().includes(slashMenu.query.toLowerCase()));
  }, [allCommands, slashMenu.query]);

  const filteredCommandsRef = React.useRef(filteredCommands);
  filteredCommandsRef.current = filteredCommands;

  const slashMenuRef = React.useRef(slashMenu);
  slashMenuRef.current = slashMenu;

  const executeCommand = useCallback((command: SlashCommand) => {
    if (!editor) return;
    const { selection } = editor.state;
    const textBefore = selection.$from.parent.textBetween(0, selection.$from.parentOffset);
    const match = textBefore.match(/\/(\w*)$/);

    let chain = editor.chain().focus();
    if (match) {
      const from = selection.from - match[0].length;
      chain = chain.deleteRange({ from, to: selection.from });
    }

    command.action(chain);
    chain.run();
    setSlashMenu(prev => ({ ...prev, isOpen: false }));
  }, [editor]);

  executeCommandRef.current = executeCommand;

  const applyFormat = useCallback((tag: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    switch (tag) {
      case 'bold': chain.toggleBold().run(); break;
      case 'italic': chain.toggleItalic().run(); break;
      case 'underline': chain.toggleUnderline().run(); break;
      case 'strike': chain.toggleStrike().run(); break;
      case 'code': chain.toggleCode().run(); break;
      case 'h1': chain.toggleHeading({ level: 1 }).run(); break;
      case 'h2': chain.toggleHeading({ level: 2 }).run(); break;
      case 'h3': chain.toggleHeading({ level: 3 }).run(); break;
      case 'quote': chain.toggleBlockquote().run(); break;
      case 'list': chain.toggleBulletList().run(); break;
      case 'orderedList': chain.toggleOrderedList().run(); break;
      case 'code-block': chain.toggleCodeBlock().run(); break;
      case 'hr': chain.setHorizontalRule().run(); break;
    }
  }, [editor]);

  const { user } = useAppStore();



  // Chat Tab States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your Aora AI tutor. Ask me anything about this document.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Flashcards States
  const activeDeck = decks.find(d => d.name.includes(activeNote?.title || ''));
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz States
  const activeQuiz = quizzes.find(q => q.title.includes(activeNote?.title || ''));
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Audio Podcast States
  const [podcastVoices, setPodcastVoices] = useState('academic');
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);

  // Polling logic for processing documents
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('Uploading your content...');

  useEffect(() => {
    if (!activeNote || !activeNote.documentId || activeNote.status !== 'processing') {
      setProcessingProgress(0);
      return;
    }

    setProcessingProgress(0);
    setProcessingStep('Ingesting document data...');

    let pollIntervalId: any;
    let progressIntervalId: any;

    let currentProgress = 0;
    let isCompleted = false;
    let documentData: any = null;
    let msSinceLastStep = 0;

    // Progress interval (runs every 100ms for stepped updates of 5%)
    progressIntervalId = setInterval(() => {
      if (isCompleted) {
        // Fast-forward: step by 5% every 100ms
        msSinceLastStep += 100;
        if (msSinceLastStep >= 100) {
          msSinceLastStep = 0;
          currentProgress = Math.min(100, currentProgress + 5);
          setProcessingProgress(currentProgress);

          if (currentProgress >= 100) {
            clearInterval(progressIntervalId);
            setProcessingStep('Finished compiling study notes!');

            if (documentData) {
              updateNote(activeNote.id, {
                content: documentData.summary || `## ${activeNote.title}\n\nNotes compilation completed.`,
                status: 'completed'
              });
              toast('Study guide generated successfully!', 'success');
            }
          }
        }
      } else {
        // Normal simulation: check step duration based on current progress
        let stepDuration = 3000; // default 3s per 5%
        if (currentProgress < 15) {
          stepDuration = 600; // 0.6s per 5% (reaches 15% in 1.8s)
        } else if (currentProgress < 40) {
          stepDuration = 1500; // 1.5s per 5% (reaches 40% in 7.5s)
        } else if (currentProgress < 75) {
          stepDuration = 3000; // 3s per 5% (reaches 75% in 21s)
        } else if (currentProgress < 95) {
          stepDuration = 6000; // 6s per 5% (reaches 95% in 24s)
        } else {
          stepDuration = 5000; // Tick slowly at 95%+ every 5 seconds
        }

        msSinceLastStep += 100;
        if (msSinceLastStep >= stepDuration) {
          msSinceLastStep = 0;
          if (currentProgress < 95) {
            currentProgress = Math.min(95, currentProgress + 5);
          } else {
            // Crawl slowly from 95 to 98 so the user sees activity
            currentProgress = Math.min(98, currentProgress + 1);
          }
          setProcessingProgress(currentProgress);

          // Update step text based on progress
          if (currentProgress < 15) {
            setProcessingStep('Ingesting document data...');
          } else if (currentProgress < 40) {
            setProcessingStep('Extracting audio/text transcripts...');
          } else if (currentProgress < 75) {
            setProcessingStep('Structuring outline sections and key takeaways...');
          } else if (currentProgress < 95) {
            setProcessingStep('Formatting premium notes page...');
          } else {
            // Alternate engaging messages when at 95%+
            const messages = [
              'Analyzing video segments for key concepts...',
              'Drafting textbook-depth explanations...',
              'Generating custom tables and code blocks...',
              'Consolidating topics and removing duplication...',
              'Compiling final reference cheat sheets...',
              'Finishing touches on study guide layout...',
              'Almost ready! Finalizing generated text...'
            ];
            const msgIdx = Math.floor(Math.random() * messages.length);
            setProcessingStep(messages[msgIdx]);
          }
        }
      }
    }, 100);

    const pollDocumentStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/documents/${activeNote.documentId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'completed') {
          isCompleted = true;
          documentData = data;
          clearInterval(pollIntervalId);
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalId);
          clearInterval(progressIntervalId);
          updateNote(activeNote.id, { status: 'failed' });
          toast('Notes generation failed. Please try again.', 'error');
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    pollDocumentStatus();
    pollIntervalId = setInterval(pollDocumentStatus, 2500);

    return () => {
      clearInterval(pollIntervalId);
      clearInterval(progressIntervalId);
    };
  }, [activeNoteId, activeNote?.status, activeNote?.documentId]);

  // Sync state with active note selection
  useEffect(() => {
    if (activeNote) {
      setEditorTitle(activeNote.title);
      setEditorContent(activeNote.content);
      setLastSyncedContent(activeNote.documentId ? activeNote.content : '');
      // Sync TipTap content when switching notes
      if (editor && editor.getHTML() !== activeNote.content) {
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(activeNote.content || '', { emitUpdate: false });
          }
        }, 0);
      }
    } else {
      setEditorTitle('');
      setEditorContent('');
      setLastSyncedContent('');
      if (editor) {
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent('', { emitUpdate: false });
          }
        }, 0);
      }
    }
    // Reset internal tab subviews on note change
    setActiveCardIndex(0);
    setIsFlipped(false);
    setSelectedAnswers({});
    setQuizScore(null);
    setIsPreviewMode(false);
  }, [activeNoteId, activeNote?.id, activeNote?.content, editor]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditorTitle(val);
    if (activeNote) {
      updateNote(activeNote.id, { title: val });
    }
  };

  // Helper to parse **bold** text in chunks
  const parseInlineStyles = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ fontWeight: 700, color: 'inherit' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderChatMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, index) => {
      let trimmed = line.trim();
      if (!trimmed) {
        return <div key={index} style={{ height: '8px' }} />;
      }

      // Headings
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={index} style={{ fontSize: '13px', fontWeight: 700, margin: '8px 0 4px', color: 'inherit' }}>
            {parseInlineStyles(trimmed.slice(5))}
          </h4>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} style={{ fontSize: '14px', fontWeight: 800, margin: '12px 0 6px', color: 'inherit' }}>
            {parseInlineStyles(trimmed.slice(4))}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} style={{ fontSize: '15px', fontWeight: 800, margin: '14px 0 8px', color: 'inherit' }}>
            {parseInlineStyles(trimmed.slice(3))}
          </h2>
        );
      }

      // Bullet items
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '4px 0 4px 8px' }}>
            <span style={{ color: 'inherit', fontSize: '12px', marginTop: '2px' }}>•</span>
            <span style={{ fontSize: '13px' }}>{parseInlineStyles(trimmed.slice(2))}</span>
          </div>
        );
      }

      // Numbered items
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '4px 0 4px 8px' }}>
            <span style={{ color: 'inherit', fontSize: '13px', fontWeight: 600 }}>{numMatch[1]}.</span>
            <span style={{ fontSize: '13px' }}>{parseInlineStyles(numMatch[2])}</span>
          </div>
        );
      }

      // Normal paragraph
      return (
        <p key={index} style={{ margin: '0 0 8px', fontSize: '13px', lineHeight: '1.6' }}>
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  // ─── Notion Live Preview Parser ──────────────────────────────────────────────
  const renderNotionMarkdown = (text: string) => {
    if (!text.trim()) {
      return <p style={{ color: '#9090A8', fontStyle: 'italic', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>Empty page. Switch to edit mode to type notes.</p>;
    }

    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent = '';

    return lines.map((line, idx) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const displayCode = codeContent;
          codeContent = '';
          return (
            <pre key={idx} style={{
              backgroundColor: 'var(--background)', border: '1px solid var(--brand-border)',
              borderRadius: '8px', padding: '16px', overflowX: 'auto',
              fontFamily: "'Courier New', Courier, monospace", fontSize: '13px',
              textAlign: 'left', color: '#10B981', margin: '12px 0'
            }}>
              <code>{displayCode}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return null;
      }

      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} style={{
            fontSize: '22px', fontWeight: 700, color: 'var(--foreground)',
            fontFamily: "'Outfit', sans-serif", margin: '20px 0 8px', borderBottom: '1px solid var(--brand-border)',
            paddingBottom: '6px', textAlign: 'left'
          }}>
            {line.slice(2)}
          </h1>
        );
      }

      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} style={{
            fontSize: '18px', fontWeight: 700, color: 'var(--foreground)',
            fontFamily: "'Outfit', sans-serif", margin: '16px 0 6px', textAlign: 'left'
          }}>
            {line.slice(3)}
          </h2>
        );
      }

      const isTodoUnchecked = line.startsWith('- [ ] ');
      const isTodoChecked = line.startsWith('- [x] ') || line.startsWith('- [X] ');
      if (isTodoChecked || isTodoUnchecked) {
        const todoText = line.slice(6);
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0', textAlign: 'left' }}>
            <input
              type="checkbox"
              checked={isTodoChecked}
              onChange={() => {
                const newLines = [...lines];
                newLines[idx] = isTodoChecked ? `- [ ] ${todoText}` : `- [x] ${todoText}`;
                const updatedVal = newLines.join('\n');
                setEditorContent(updatedVal);
                if (activeNote) updateNote(activeNote.id, { content: updatedVal });
              }}
              style={{
                width: '15px', height: '15px', cursor: 'pointer',
                accentColor: '#7C3AED'
              }}
            />
            <span style={{
              fontSize: '14px', color: isTodoChecked ? '#9090A8' : 'var(--foreground)',
              textDecoration: isTodoChecked ? 'line-through' : 'none',
              fontFamily: "'Inter', sans-serif"
            }}>
              {todoText}
            </span>
          </div>
        );
      }

      if (line.startsWith('> ')) {
        return (
          <div key={idx} style={{
            backgroundColor: 'var(--brand-accent)', borderLeft: '4px solid #7C3AED',
            borderRadius: '0 8px 8px 0', padding: '12px 16px', margin: '12px 0',
            textAlign: 'left', fontSize: '13.5px', color: 'var(--foreground)',
            lineHeight: '1.5', fontFamily: "'Inter', sans-serif"
          }}>
            💡 {line.slice(2)}
          </div>
        );
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0 4px 12px', textAlign: 'left' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#7C3AED', marginTop: '7px', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', color: 'var(--foreground)', fontFamily: "'Inter', sans-serif" }}>
              {line.slice(2)}
            </span>
          </div>
        );
      }

      return (
        <p key={idx} style={{
          fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.7',
          margin: '0 0 12px', textAlign: 'left', fontFamily: "'Inter', sans-serif"
        }}>
          {line}
        </p>
      );
    });
  };

  const syncNoteToAiIfNeeded = async (): Promise<number | null> => {
    if (!activeNote) return null;

    // Check if we need to sync
    const needsSync = !activeNote.documentId || editorContent !== lastSyncedContent;
    if (!needsSync) {
      return activeNote.documentId || null;
    }

    try {
      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          name: activeNote.title,
          doc_type: 'note',
          raw_text: editorContent
        })
      });

      const data = await response.json();
      if (!response.ok || !data.document_id) {
        throw new Error(data.message || 'Failed to sync note');
      }

      const docId = data.document_id;

      // Update store so it is aware of the new documentId
      updateNote(activeNote.id, { documentId: docId });

      // Poll until document processing is completed
      let isCompleted = false;
      let attempts = 0;
      while (!isCompleted && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        const checkRes = await fetch(`${API_URL}/documents/${docId}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.status === 'completed') {
            isCompleted = true;
          }
        }
      }

      setLastSyncedContent(editorContent);
      return docId;
    } catch (err: any) {
      console.error("Auto-sync error:", err);
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: `Failed to sync latest note content: ${err.message || 'connection failed'}`
      }]);
      return activeNote.documentId || null;
    }
  };

  const runAiSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      // 1. Automatically sync note first if needed
      const docId = await syncNoteToAiIfNeeded();

      // 2. Query chat message endpoint with the active docId
      const url = new URL(`${API_URL}/chat/threads/1/messages`);
      url.searchParams.append('text', userMsg);
      if (docId) {
        url.searchParams.append('document_id', docId.toString());
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.ai_response) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.ai_response.text }]);
      } else {
        throw new Error(data.detail || 'Failed to retrieve AI response');
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: `Sorry, I encountered an error: ${err.message || 'connection failed'}. Please verify that your backend service is running.`
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const runAiGeneratePodcast = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      setIsPodcastPlaying(true);
      toast('AI Podcast generated successfully! Playback started.');
    }, 1500);
  };

  const runAiExtractFlashcards = () => {
    if (!activeNote) return;
    setIsAiLoading(true);
    setTimeout(() => {
      const deckId = addDeck(`AI Deck: ${activeNote.title}`);
      addCard(deckId, 'Summarize primary concept from this note', 'Parsed details: core structures are built in nested components.');
      addCard(deckId, 'What is the main topic covered in this outline?', `${activeNote.title}`);
      setIsAiLoading(false);
      toast(`Successfully generated and saved 2 flashcards in deck "AI Deck: ${activeNote.title}"!`);
    }, 1200);
  };

  const runAiCreateQuiz = async () => {
    if (!activeNote) return;
    setIsAiLoading(true);
    try {
      const docId = activeNote.documentId || (await syncNoteToAiIfNeeded());
      if (!docId) {
        toast('Please upload your document first before generating a quiz.', 'error');
        return;
      }

      const url = new URL(`${API_URL}/study/quizzes/generate`);
      url.searchParams.set('document_id', String(docId));
      url.searchParams.set('title', `Quiz: ${activeNote.title}`);
      url.searchParams.set('category', 'AI Generated');

      const res = await fetch(url.toString(), { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (data?.quiz) {
        addQuiz(data.quiz);
        toast(`Quiz "${data.quiz.title}" with ${data.quiz.questions.length} questions generated!`, 'success');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error(err);
      toast(`Failed to generate quiz: ${err.message}`, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderPreview = () => {
    if (!editorContent) {
      return <p style={{ color: '#9090A8', fontStyle: 'italic', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>Empty page. Switch to edit mode to type notes.</p>;
    }

    const isHtml = editorContent.trim().startsWith('<') || editorContent.includes('</');
    if (isHtml) {
      return (
        <div
          className="tiptap-editor"
          dangerouslySetInnerHTML={{ __html: editorContent }}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            lineHeight: 1.7,
            color: '#1F2937'
          }}
        />
      );
    }

    return renderNotionMarkdown(editorContent);
  };

  const renderDocumentView = (forceChatVisible = false) => {
    if (!activeNote) return renderNoNoteSelected();

    const showChat = forceChatVisible || isChatPanelVisible;

    const fonts = [
      { name: 'Clarika', value: "'Clarika', 'Outfit', 'Inter', sans-serif" },
      { name: 'Arial', value: "Arial, sans-serif" },
      { name: 'Times New Roman', value: "'Times New Roman', Times, serif" },
      { name: 'Courier New', value: "'Courier New', Courier, monospace" },
      { name: 'Georgia', value: "Georgia, serif" },
      { name: 'Verdana', value: "Verdana, Geneva, sans-serif" },
    ];

    return (
      <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', gap: '12px' }}>

        {/* Left Panel: Notepad Editor */}
        <div
          id="editor-parent-container"
          className={`${activeNotesTab === 'chat' ? 'hidden lg:flex' : 'flex'} ${showChat ? 'w-full lg:w-3/5 lg:flex-none' : 'w-full flex-1'
            } flex-col h-full bg-white border border-[#E5E7EB] rounded-xl shadow-xs relative overflow-y-auto box-border`}
          style={{ scrollPaddingTop: '90px' }}
        >
          {/* Sticky wrapper to center the floating pill toolbar */}
          <div style={{
            position: 'sticky',
            top: '0px',
            left: '0px',
            width: '100%',
            zIndex: 50,
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            pointerEvents: 'none',
            padding: '16px 0 0 0',
          }}>
            {/* Centered Top Floating Toolbar */}
            <div 
              className="editor-toolbar no-scrollbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '8px 20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                pointerEvents: 'auto',
                width: 'fit-content',
                maxWidth: 'calc(100vw - 32px)',
                overflowX: activePopover ? 'visible' : 'auto',
                overflowY: activePopover ? 'visible' : 'hidden',
                flexWrap: 'nowrap',
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', sans-serif"
              }}
            >
            {/* Font selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <button
                onClick={() => setActivePopover(activePopover === 'font' ? null : 'font')}
                className="font-select-trigger"
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  outline: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontFamily: fontFamily,
                }}
              >
                <span>{fonts.find(f => f.value === fontFamily)?.name || 'Clarika'}</span>
                <ChevronDown style={{ width: '12px', height: '12px', color: '#6B7280' }} />
              </button>

              {activePopover === 'font' && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  zIndex: 60,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  width: '180px',
                }}>
                  {fonts.map(f => {
                    const isSelected = fontFamily === f.value;
                    return (
                      <button
                        key={f.value}
                        onClick={() => {
                          setFontFamily(f.value);
                          setActivePopover(null);
                          if (editor) {
                            editor.chain().focus().setMark('textStyle', { fontFamily: f.value }).run();
                          }
                        }}
                        style={{
                          border: 'none',
                          background: isSelected ? '#F3F4F6' : 'none',
                          fontSize: '14px',
                          fontWeight: isSelected ? 600 : 500,
                          color: '#374151',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          fontFamily: f.value,
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#E5E7EB' }} />

            {/* Size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  const next = Math.max(8, fontSize - 1);
                  setFontSize(next);
                  if (editor) editor.chain().focus().setMark('textStyle', { fontSize: `${next}px` }).run();
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#6B7280',
                  fontSize: '18px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Decrease font size"
              >
                −
              </button>
              <span className="font-size-display" style={{ fontSize: '13px', fontWeight: 600, color: '#374151', minWidth: '18px', textAlign: 'center', userSelect: 'none' }}>
                {fontSize}
              </span>
              <button
                onClick={() => {
                  const next = Math.min(72, fontSize + 1);
                  setFontSize(next);
                  if (editor) editor.chain().focus().setMark('textStyle', { fontSize: `${next}px` }).run();
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#6B7280',
                  fontSize: '18px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Increase font size"
              >
                +
              </button>
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#E5E7EB' }} />

            {/* Inline Formatting (B, /, U) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                style={{
                  border: 'none',
                  background: editor?.isActive('bold') ? '#F3F4F6' : 'none',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: 800,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => {
                  if (!editor?.isActive('bold')) e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={e => {
                  if (!editor?.isActive('bold')) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Bold"
              >
                B
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                style={{
                  border: 'none',
                  background: editor?.isActive('italic') ? '#F3F4F6' : 'none',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: 600,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => {
                  if (!editor?.isActive('italic')) e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={e => {
                  if (!editor?.isActive('italic')) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Italic"
              >
                /
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                style={{
                  border: 'none',
                  background: editor?.isActive('underline') ? '#F3F4F6' : 'none',
                  color: '#374151',
                  fontSize: '13px',
                  textDecoration: 'underline',
                  fontWeight: 500,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => {
                  if (!editor?.isActive('underline')) e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={e => {
                  if (!editor?.isActive('underline')) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Underline"
              >
                U
              </button>
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#E5E7EB' }} />

            {/* Colors & Code (A, Paintbrush, Code) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Text Color Button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setActivePopover(activePopover === 'color' ? null : 'color')}
                  title="Text Color"
                  style={{
                    border: 'none',
                    background: activePopover === 'color' ? '#F3F4F6' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (activePopover !== 'color') e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={e => {
                    if (activePopover !== 'color') e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#374151', lineHeight: 1.1 }}>A</span>
                  <div style={{ width: '12px', height: '2px', backgroundColor: editor?.getAttributes('textStyle').color || '#7C3AED', marginTop: '1px' }} />
                </button>
                {activePopover === 'color' && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', zIndex: 60,
                    backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '12px', width: '228px', display: 'flex', flexDirection: 'column', gap: '10px'
                  }}>
                    <button
                      onClick={() => {
                        editor?.chain().focus().unsetColor().run();
                        setActivePopover(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        height: '32px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        background: '#FFFFFF',
                        color: '#374151',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      <Eraser style={{ width: '13px', height: '13px' }} />
                      <span>Default Theme</span>
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
                      {TEXT_COLORS.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            editor?.chain().focus().setColor(color).run();
                            setActivePopover(null);
                          }}
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3px',
                            backgroundColor: color,
                            border: color.toLowerCase() === '#ffffff' ? '1px solid #D1D5DB' : 'none',
                            cursor: 'pointer',
                            padding: 0,
                            boxSizing: 'border-box'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Highlight Color Button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setActivePopover(activePopover === 'highlight' ? null : 'highlight')}
                  title="Highlight Text"
                  style={{
                    border: 'none',
                    background: activePopover === 'highlight' ? '#F3F4F6' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (activePopover !== 'highlight') e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={e => {
                    if (activePopover !== 'highlight') e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Paintbrush style={{ width: '13px', height: '13px', color: '#374151' }} />
                </button>
                {activePopover === 'highlight' && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', zIndex: 60,
                    backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '12px', width: '228px', display: 'flex', flexDirection: 'column', gap: '10px'
                  }}>
                    <button
                      onClick={() => {
                        editor?.chain().focus().unsetHighlight().run();
                        setActivePopover(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        height: '32px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        background: '#FFFFFF',
                        color: '#374151',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      <Eraser style={{ width: '13px', height: '13px' }} />
                      <span>Default Theme</span>
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
                      {HIGHLIGHT_COLORS.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            editor?.chain().focus().toggleHighlight({ color }).run();
                            setActivePopover(null);
                          }}
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3px',
                            backgroundColor: color,
                            border: color.toLowerCase() === '#ffffff' ? '1px solid #D1D5DB' : 'none',
                            cursor: 'pointer',
                            padding: 0,
                            boxSizing: 'border-box'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Code Block (Code icon) */}
              <button
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                style={{
                  border: 'none',
                  background: editor?.isActive('codeBlock') ? '#F3F4F6' : 'none',
                  color: editor?.isActive('codeBlock') ? '#7C3AED' : '#374151',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => {
                  if (!editor?.isActive('codeBlock')) e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={e => {
                  if (!editor?.isActive('codeBlock')) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Code Block"
              >
                <Code style={{ width: '13px', height: '13px' }} />
              </button>
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#E5E7EB' }} />

            {/* Insert & Actions (Image, Table, Align, Lists) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setIsImageModalOpen(true)}
                title="Insert Image"
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Image style={{ width: '13px', height: '13px' }} />
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setActivePopover(activePopover === 'table' ? null : 'table')}
                  title="Insert Table"
                  style={{
                    border: 'none',
                    background: activePopover === 'table' ? '#F3F4F6' : 'none',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={e => {
                    if (activePopover !== 'table') e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={e => {
                    if (activePopover !== 'table') e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Table style={{ width: '13px', height: '13px' }} />
                </button>
                {activePopover === 'table' && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', zIndex: 60,
                    backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', userSelect: 'none', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                      {hoveredTableGrid.rows > 0 && hoveredTableGrid.cols > 0
                        ? `Insert Table (${hoveredTableGrid.rows} × ${hoveredTableGrid.cols})`
                        : 'Insert table'
                      }
                    </span>

                    <div
                      onMouseLeave={() => setHoveredTableGrid({ rows: 0, cols: 0 })}
                      style={{
                        display: 'grid',
                        gridTemplateRows: 'repeat(6, 1fr)',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '6px'
                      }}
                    >
                      {Array.from({ length: 6 }).map((_, rIdx) => {
                        const row = rIdx + 1;
                        return Array.from({ length: 6 }).map((_, cIdx) => {
                          const col = cIdx + 1;
                          const isHighlighted = row <= hoveredTableGrid.rows && col <= hoveredTableGrid.cols;
                          return (
                            <div
                              key={`${row}-${col}`}
                              onMouseEnter={() => setHoveredTableGrid({ rows: row, cols: col })}
                              onClick={() => {
                                if (editor) {
                                  editor.chain().focus().insertTable({ rows: row, cols: col, withHeaderRow: true }).run();
                                }
                                setActivePopover(null);
                                setHoveredTableGrid({ rows: 0, cols: 0 });
                              }}
                              style={{
                                width: '18px',
                                height: '18px',
                                border: isHighlighted ? '1px solid #7C3AED' : '1px solid #E5E7EB',
                                borderRadius: '4px',
                                backgroundColor: isHighlighted ? '#F5F3FF' : '#FFFFFF',
                                cursor: 'pointer',
                                transition: 'all 0.10s'
                              }}
                            />
                          );
                        });
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Text Align Button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setActivePopover(activePopover === 'align' ? null : 'align')}
                  title="Align Text"
                  style={{
                    border: 'none',
                    background: activePopover === 'align' ? '#F3F4F6' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (activePopover !== 'align') e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={e => {
                    if (activePopover !== 'align') e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <AlignLeft style={{ width: '13px', height: '13px', color: '#374151' }} />
                </button>
                {activePopover === 'align' && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', zIndex: 60,
                    backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', width: '160px'
                  }}>
                    {([
                      { value: 'left', name: 'Align Left', Icon: AlignLeft },
                      { value: 'center', name: 'Align Center', Icon: AlignCenter },
                      { value: 'right', name: 'Align Right', Icon: AlignRight },
                      { value: 'justify', name: 'Align Justify', Icon: AlignJustify },
                    ] as const).map(item => {
                      const IconComponent = item.Icon;
                      const isActive = editor?.isActive({ textAlign: item.value });
                      return (
                        <button
                          key={item.value}
                          onClick={() => {
                            editor?.chain().focus().setTextAlign(item.value).run();
                            setActivePopover(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: isActive ? '#F3F4F6' : '#FFFFFF',
                            color: isActive ? '#7C3AED' : '#374151',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.backgroundColor = '#F9FAFB';
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <IconComponent style={{ width: '14px', height: '14px' }} />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* List Options */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setActivePopover(activePopover === 'list' ? null : 'list')}
                  title="List Options"
                  style={{
                    border: 'none',
                    background: activePopover === 'list' ? '#F3F4F6' : 'none',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={e => {
                    if (activePopover !== 'list') e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={e => {
                    if (activePopover !== 'list') e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <List style={{ width: '13px', height: '13px' }} />
                </button>
                {activePopover === 'list' && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', zIndex: 60,
                    backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', width: '160px'
                  }}>
                    {([
                      { id: 'bullet', name: 'Bullet List', Icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), activeCheck: 'bulletList' },
                      { id: 'ordered', name: 'Numbered List', Icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), activeCheck: 'orderedList' },
                      { id: 'todo', name: 'Checklist', Icon: ListTodo, action: () => editor?.chain().focus().toggleTaskList().run(), activeCheck: 'taskList' },
                    ] as const).map(item => {
                      const IconComponent = item.Icon;
                      const isActive = item.activeCheck ? editor?.isActive(item.activeCheck) : false;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.action();
                            setActivePopover(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: isActive ? '#F3F4F6' : '#FFFFFF',
                            color: isActive ? '#7C3AED' : '#374151',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.backgroundColor = '#F9FAFB';
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <IconComponent style={{ width: '14px', height: '14px' }} />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#E5E7EB' }} />

            {/* Toggle Preview Mode */}
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              style={{
                border: 'none',
                background: isPreviewMode ? '#F3F0FC' : 'none',
                color: isPreviewMode ? '#7C3AED' : '#374151',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => {
                if (!isPreviewMode) e.currentTarget.style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={e => {
                if (!isPreviewMode) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Toggle Preview Mode"
            >
              <Eye style={{ width: '13px', height: '13px' }} />
            </button>
          </div>
        </div>

          {/* Infinity Page Notepad Area */}
          <div
            onClick={(e) => {
              if (!editor) return;
              const target = e.target as HTMLElement;
              // If click landed directly inside ProseMirror, it already handled cursor placement
              if (target.closest('.ProseMirror')) return;

              // Find the ProseMirror content element to check if click is above it
              const pmEl = target.ownerDocument.querySelector('.ProseMirror');
              if (pmEl) {
                const rect = pmEl.getBoundingClientRect();
                if (e.clientY < rect.top) {
                  // Clicked above the text content (in the top padding / header gap) - focus start
                  editor.commands.focus('start');
                  return;
                }
              }

              // Use ProseMirror's native posAtCoords to find the exact doc position
              // at the pixel coordinates where the user clicked
              const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
              if (pos) {
                editor.commands.setTextSelection(pos.pos);
                editor.commands.focus();
              } else {
                // Clicked outside any text node (below all content) — go to end
                editor.commands.focus('end');
              }
            }}
            className="pt-5 px-4 md:px-8 pb-0"
            style={{
              flex: 1,
              width: '100%',
              maxWidth: '812px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              margin: '0 auto',
              position: 'relative',
              backgroundColor: 'transparent',
              minHeight: '100%',
              cursor: 'text'
            }}
          >
            {/* TipTap WYSIWYG Editor styling */}
            <style>{`
              .tiptap-editor {
                outline: none;
                display: flex;
                flex-direction: column;
                flex: 1;
                width: 100%;
                min-height: 100%;
              }
              /* ProseMirror is the actual contenteditable — give it huge padding-bottom
                 so all the empty canvas space below text is INSIDE it, letting native
                 click-to-cursor work at any Y position */
              .tiptap-editor .ProseMirror {
                flex: 1;
                min-height: 100%;
                padding-bottom: 60vh;
                outline: none;
                cursor: text;
                box-sizing: border-box;
                font-size: ${fontSize}px;
                font-family: ${fontFamily};
                color: #1F2937;
                line-height: 1.7;
                caret-color: #7C3AED;
              }
              .tiptap-editor p { margin: 0 0 8px; }
              .tiptap-editor h1 { font-size: 2em; font-weight: 700; margin: 20px 0 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; }
              .tiptap-editor h2 { font-size: 1.5em; font-weight: 700; margin: 16px 0 6px; }
              .tiptap-editor h3 { font-size: 1.17em; font-weight: 700; margin: 12px 0 4px; }
              .tiptap-editor strong { font-weight: 700; }
              .tiptap-editor em { font-style: italic; }
              .tiptap-editor u { text-decoration: underline; }
              .tiptap-editor s { text-decoration: line-through; }
              .tiptap-editor code { background: #F3F4F6; border-radius: 4px; padding: 1px 5px; font-family: 'Courier New', monospace; font-size: 0.9em; color: #7C3AED; }
              .tiptap-editor pre {
                background: #1a1a1a;
                border: 1.5px solid #2d2d2d;
                border-radius: 10px;
                padding: 42px 20px 20px;
                overflow-x: auto;
                font-family: 'Fira Code', 'JetBrains Mono', 'Courier New', monospace;
                font-size: 0.875em;
                line-height: 1.7;
                color: #e2e8f0;
                position: relative;
                margin: 12px 0;
                white-space: pre;
              }
              .tiptap-editor pre code { background: none; color: inherit; padding: 0; font-family: inherit; white-space: inherit; }
              /* ── Lowlight / hljs Syntax Colors (Dark Theme) ── */
              .tiptap-editor .hljs-comment, .tiptap-editor .hljs-quote { color: #6A737D; font-style: italic; }
              .tiptap-editor .hljs-keyword, .tiptap-editor .hljs-selector-tag { color: #FF7B72; font-weight: 500; }
              .tiptap-editor .hljs-built_in, .tiptap-editor .hljs-builtin-name { color: #79C0FF; }
              .tiptap-editor .hljs-string, .tiptap-editor .hljs-attr { color: #A5D6FF; }
              .tiptap-editor .hljs-template-variable, .tiptap-editor .hljs-template-tag { color: #A5D6FF; }
              .tiptap-editor .hljs-number, .tiptap-editor .hljs-literal { color: #79C0FF; }
              .tiptap-editor .hljs-addition { color: #3FB950; background: rgba(63,185,80,0.1); }
              .tiptap-editor .hljs-title, .tiptap-editor .hljs-section { color: #D2A8FF; font-weight: 600; }
              .tiptap-editor .hljs-class .hljs-title { color: #FFA657; font-weight: 600; }
              .tiptap-editor .hljs-function, .tiptap-editor .hljs-name { color: #D2A8FF; }
              .tiptap-editor .hljs-variable { color: #FFA657; }
              .tiptap-editor .hljs-type, .tiptap-editor .hljs-params { color: #FFA657; }
              .tiptap-editor .hljs-symbol, .tiptap-editor .hljs-bullet { color: #79C0FF; }
              .tiptap-editor .hljs-deletion { color: #FF7B72; background: rgba(255,123,114,0.1); }
              .tiptap-editor .hljs-meta { color: #8B949E; }
              .tiptap-editor .hljs-operator { color: #FF7B72; }
              .tiptap-editor .hljs-punctuation { color: #c9d1d9; }
              .tiptap-editor .hljs-tag { color: #7EE787; }
              .tiptap-editor .hljs-tag .hljs-name { color: #7EE787; font-weight: 500; }
              .tiptap-editor .hljs-tag .hljs-attr { color: #79C0FF; }
              /* ═══════════════════════════════════════════════════════════════
                 VS CODE-STYLE CODE EDITOR BLOCK
                 ═══════════════════════════════════════════════════════════════ */

              /* NodeView wrapper — hides the native <pre> ProseMirror renders */
              .notion-code-block {
                display: block;
                margin: 16px 0;
                border-radius: 10px;
                overflow: visible;
                border: 1.5px solid #2d2d2d;
                background: #1e1e1e;
                font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Courier New', monospace;
                font-size: 13.5px;
                line-height: 1.6;
              }
              /* Hide Tiptap's own <pre> since we render our own layout */
              .notion-code-block pre { display: none !important; }

              /* macOS-style title bar */
              .vscode-titlebar {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 9px 14px;
                background: #2a2a2a;
                border-bottom: 1px solid #333;
                border-radius: 10px 10px 0 0;
                user-select: none;
              }
              .vscode-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                display: inline-block;
                flex-shrink: 0;
              }
              .vscode-lang-badge {
                margin-left: auto;
                font-size: 11px;
                color: #6b7280;
                font-family: 'Inter', sans-serif;
                font-weight: 500;
                letter-spacing: 0.02em;
              }

              /* Editor body: line numbers + code */
              .vscode-editor-area {
                display: flex;
                min-height: 48px;
                overflow-x: auto;
              }
              .vscode-line-numbers {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                padding: 14px 10px 14px 14px;
                background: #1e1e1e;
                color: #4a5568;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
                user-select: none;
                min-width: 38px;
                border-right: 1px solid #2d2d2d;
                flex-shrink: 0;
                box-sizing: border-box;
              }
              .vscode-line-num { display: block; }
              .vscode-code-area {
                flex: 1;
                padding: 14px 18px;
                overflow-x: auto;
                min-width: 0;
              }
              .vscode-code-area code {
                background: none !important;
                color: #e2e8f0;
                padding: 0 !important;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
                white-space: pre;
                display: block;
              }

              /* ── Lowlight / hljs Syntax Colors (VS Code Dark+) ── */
              .vscode-code-area .hljs-comment,
              .vscode-code-area .hljs-quote { color: #6A9955; font-style: italic; }
              .vscode-code-area .hljs-keyword,
              .vscode-code-area .hljs-selector-tag { color: #C586C0; font-weight: 500; }
              .vscode-code-area .hljs-built_in,
              .vscode-code-area .hljs-builtin-name { color: #DCDCAA; }
              .vscode-code-area .hljs-string,
              .vscode-code-area .hljs-attr { color: #CE9178; }
              .vscode-code-area .hljs-template-variable,
              .vscode-code-area .hljs-template-tag { color: #CE9178; }
              .vscode-code-area .hljs-number,
              .vscode-code-area .hljs-literal { color: #B5CEA8; }
              .vscode-code-area .hljs-addition { color: #B5CEA8; background: rgba(155,220,254,0.1); }
              .vscode-code-area .hljs-title,
              .vscode-code-area .hljs-section { color: #DCDCAA; font-weight: 600; }
              .vscode-code-area .hljs-class .hljs-title { color: #4EC9B0; font-weight: 600; }
              .vscode-code-area .hljs-function,
              .vscode-code-area .hljs-name { color: #DCDCAA; }
              .vscode-code-area .hljs-variable { color: #9CDCFE; }
              .vscode-code-area .hljs-type,
              .vscode-code-area .hljs-params { color: #4EC9B0; }
              .vscode-code-area .hljs-symbol,
              .vscode-code-area .hljs-bullet { color: #9CDCFE; }
              .vscode-code-area .hljs-deletion { color: #F44747; background: rgba(244,71,71,0.1); }
              .vscode-code-area .hljs-meta { color: #569CD6; }
              .vscode-code-area .hljs-operator { color: #D4D4D4; }
              .vscode-code-area .hljs-punctuation { color: #D4D4D4; }
              .vscode-code-area .hljs-tag { color: #4EC9B0; }
              .vscode-code-area .hljs-tag .hljs-name { color: #4EC9B0; }
              .vscode-code-area .hljs-tag .hljs-attr { color: #9CDCFE; }
              .vscode-code-area .hljs-selector-class { color: #D7BA7D; }
              .vscode-code-area .hljs-selector-id { color: #D7BA7D; }
              .vscode-code-area .hljs-regexp { color: #D16969; }

              /* ── Bottom Notion-style toolbar ── */
              .notion-code-toolbar {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 5px 10px;
                background: #252525;
                border-top: 1px solid #333;
                border-radius: 0 0 10px 10px;
              }
              .notion-lang-wrapper { position: relative; }
              .notion-lang-btn {
                display: flex;
                align-items: center;
                background: #333;
                border: 1px solid #444;
                border-radius: 5px;
                padding: 3px 9px;
                font-size: 11.5px;
                color: #c9d1d9;
                font-family: 'Fira Code', monospace;
                cursor: pointer;
                outline: none;
                transition: background 0.15s;
              }
              .notion-lang-btn:hover { background: #3a3a3a; }
              .notion-code-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 26px;
                height: 26px;
                background: none;
                border: 1px solid transparent;
                border-radius: 5px;
                color: #6b7280;
                cursor: pointer;
                outline: none;
                transition: all 0.15s;
              }
              .notion-code-btn:hover { background: #333; color: #c9d1d9; border-color: #444; }

              /* Searchable language dropdown */
              .notion-lang-dropdown {
                position: absolute;
                top: calc(100% + 6px);
                left: 0;
                width: 240px;
                background: #252525;
                border: 1px solid #3a3a3a;
                border-radius: 10px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
                z-index: 999;
                overflow: hidden;
              }
              .notion-lang-search-wrap {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 9px 12px;
                border-bottom: 1px solid #333;
              }
              .notion-lang-search {
                flex: 1;
                background: none;
                border: none;
                outline: none;
                font-size: 13px;
                color: #e2e8f0;
                font-family: 'Inter', sans-serif;
              }
              .notion-lang-search::placeholder { color: #4b5563; }
              .notion-lang-list {
                max-height: 280px;
                overflow-y: auto;
                padding: 4px 0;
                scrollbar-width: thin;
                scrollbar-color: #3a3a3a transparent;
              }
              .notion-lang-list::-webkit-scrollbar { width: 5px; }
              .notion-lang-list::-webkit-scrollbar-track { background: transparent; }
              .notion-lang-list::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 4px; }
              .notion-lang-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 14px;
                font-size: 13px;
                color: #c9d1d9;
                font-family: 'Inter', sans-serif;
                cursor: pointer;
                transition: background 0.1s;
              }
              .notion-lang-item:hover { background: #2d2d2d; }
              .notion-lang-item--active { background: #2d4a7a; color: #fff; }
              .notion-lang-item--active:hover { background: #2d4a7a; }
              .notion-lang-empty {
                padding: 12px 14px;
                font-size: 12.5px;
                color: #6b7280;
                font-family: 'Inter', sans-serif;
              }
              .ProseMirror blockquote { border-left: 4px solid #7C3AED; padding: 8px 16px; margin: 12px 0; background: #F5F3FF; border-radius: 0 8px 8px 0; color: #4B5563; }
              .ProseMirror ul { list-style-type: disc !important; padding-left: 24px !important; margin: 8px 0; }
              .ProseMirror ol { list-style-type: decimal !important; padding-left: 24px !important; margin: 8px 0; }
              .ProseMirror li { margin: 4px 0; }
              /* Checklist / Task List styling */
              .ProseMirror ul[data-type*="task" i],
              ul[data-type*="task" i] {
                list-style-type: none !important;
                list-style: none !important;
                padding-left: 0 !important;
                margin: 8px 0 !important;
              }
              .ProseMirror ul[data-type*="task" i] li,
              ul[data-type*="task" i] li {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                align-items: flex-start !important;
                list-style-type: none !important;
                list-style: none !important;
                gap: 8px !important;
                margin: 6px 0 !important;
              }
              .ProseMirror ul[data-type*="task" i] li > label,
              ul[data-type*="task" i] li > label {
                display: flex !important;
                align-items: center !important;
                user-select: none !important;
                margin-top: 4px !important;
                flex-shrink: 0 !important;
              }
              .ProseMirror ul[data-type*="task" i] li > label input[type="checkbox"],
              ul[data-type*="task" i] li > label input[type="checkbox"] {
                width: 15px !important;
                height: 15px !important;
                accent-color: #7C3AED !important;
                cursor: pointer !important;
                margin: 0 !important;
              }
              .ProseMirror ul[data-type*="task" i] li > div,
              ul[data-type*="task" i] li > div {
                flex: 1 1 auto !important;
                min-width: 0 !important;
              }
              .ProseMirror ul[data-type*="task" i] li > div > p,
              ul[data-type*="task" i] li > div > p {
                margin: 0 !important;
                padding: 0 !important;
              }
              .ProseMirror ul[data-type*="task" i] li[data-checked="true"] > div,
              ul[data-type*="task" i] li[data-checked="true"] > div {
                text-decoration: line-through !important;
                color: #9CA3AF !important;
              }
              .tiptap-editor hr { border: none; border-top: 2px solid #E5E7EB; margin: 16px 0; }
              .tiptap-editor p.is-empty:first-child::before,
              .tiptap-editor p.is-editor-empty:first-child::before,
              .ProseMirror p.is-empty:first-child::before,
              .ProseMirror p.is-editor-empty:first-child::before {
                color: #9CA3AF;
                content: attr(data-placeholder);
                float: left;
                height: 0;
                pointer-events: none;
                font-style: italic;
              }
              /* Tables styling */
              .tiptap-editor table {
                border-collapse: collapse;
                table-layout: fixed;
                width: 100%;
                margin: 12px 0;
                overflow: hidden;
              }
              .tiptap-editor table td,
              .tiptap-editor table th {
                min-width: 1em;
                border: 1px solid #D1D5DB;
                padding: 6px 8px;
                vertical-align: top;
                box-sizing: border-box;
                position: relative;
              }
              .tiptap-editor table th {
                font-weight: bold;
                text-align: left;
                background-color: #F3F4F6;
              }
              .tiptap-editor table p {
                margin: 0;
              }
            `}</style>

            {isPreviewMode ? (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {renderPreview()}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <EditorContent editor={editor} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} />
              </div>
            )}
          </div>

          {/* Slash command popover */}
          {slashMenu.isOpen && filteredCommands.length > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${slashMenu.x}px`,
                top: `${slashMenu.y}px`,
                zIndex: 100,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                maxHeight: '280px',
                width: '240px',
                overflowY: 'auto',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {filteredCommands.map((command, idx) => {
                const isSelected = idx === slashMenu.selectedIndex;
                return (
                  <button
                    key={command.name}
                    onClick={() => executeCommand(command)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSelected ? '#F3F0FC' : 'transparent',
                      color: isSelected ? '#7C3AED' : '#374151',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s, color 0.15s'
                    }}
                    onMouseEnter={() => setSlashMenu(prev => ({ ...prev, selectedIndex: idx }))}
                  >
                    <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                      {command.icon}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{command.name}</span>
                      <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{command.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Chatbot Panel */}
        {showChat ? (
          <div
            className={`${activeNotesTab === 'chat' ? 'flex' : 'hidden lg:flex'} w-full lg:w-2/5 lg:flex-none flex-col h-full bg-white border border-[#E5E7EB] rounded-xl shadow-xs box-border`}
            style={{
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {/* Panel Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              padding: '12px 20px', borderBottom: '1px solid var(--brand-border)',
              flexShrink: 0
            }}>
              <button
                onClick={() => setIsChatPanelVisible(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px', border: '1px solid var(--brand-border)',
                  borderRadius: '6px', backgroundColor: 'var(--card-bg)',
                  fontSize: '11px', fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer'
                }}
              >
                Hide &rarr;
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatMessages.length <= 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 16px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B29', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>
                    Hey, I'm Aora
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6B628B', fontWeight: 500, margin: 0, marginBottom: '20px' }}>
                    I can work with you on your doc and answer any questions!
                  </p>

                  {/* Suggestion Shortcut */}
                  <button
                    onClick={() => {
                      setChatMessages(prev => [...prev, { sender: 'user', text: 'Summarize my document outline.' }]);
                      setIsAiLoading(true);
                      setTimeout(() => {
                        const summary = `### Summary Outline\n- **Subject**: ${editorTitle || 'Document'}\n- **Core compilation**: Outlines modular note components and active persistence layers.\n- **Status**: Checked and validated.`;
                        setChatMessages(prev => [...prev, { sender: 'ai', text: summary }]);
                        setIsAiLoading(false);
                      }, 1000);
                    }}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--brand-border)',
                      borderRadius: '24px',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#7C3AED'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brand-border)'}
                  >
                    <Sparkles style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
                    Summarize Document
                  </button>
                </div>
              ) : (
                chatMessages.slice(1).map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '12px 16px', borderRadius: '14px',
                      backgroundColor: m.sender === 'user' ? '#7C3AED' : '#F3F0FC',
                      color: m.sender === 'user' ? '#FFFFFF' : '#1E1B29',
                      fontSize: '13px', lineHeight: '1.5', textAlign: 'left',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                      {m.sender === 'user' ? m.text : renderChatMarkdown(m.text)}
                    </div>
                  </div>
                ))
              )}
              {isAiLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: '#F3F0FC', color: '#6B628B' }}>
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '160ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '320ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--brand-border)', flexShrink: 0 }}>
              <div style={{
                display: 'flex', gap: '10px', alignItems: 'center',
                backgroundColor: 'var(--brand-accent)', border: '1px solid var(--brand-border)',
                borderRadius: '12px', padding: '8px 12px'
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runAiSendMessage()}
                  placeholder="Type a question here or type '@' to reference documents..."
                  className="w-full flex-1 bg-transparent p-1.5 text-[13px] outline-none text-[var(--foreground)]"
                />
                <button
                  onClick={runAiSendMessage}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white"
                >
                  <Send style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Floating Bubble to restore chatbot panel */}
        {!showChat && (
          <button
            onClick={() => setIsChatPanelVisible(true)}
            title="Open AI Chatbot"
            className="hidden lg:flex"
            style={{
              position: 'fixed', right: '16px', top: '50%', transform: 'translateY(-50%)',
              width: '44px', height: '44px', backgroundColor: '#7C3AED', border: 'none',
              borderRadius: '50%', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
              cursor: 'pointer', zIndex: 100, transition: 'transform 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            <MessageCircle style={{ width: '22px', height: '22px' }} />
          </button>
        )}
      </div>
    );
  };

  // 2. Chat Bot View
  const renderChatView = () => {
    return (
      <div style={{ display: 'flex', height: '100%', width: '100%', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--brand-border)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chatMessages.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '12px 16px', borderRadius: '14px',
                  backgroundColor: m.sender === 'user' ? '#7C3AED' : 'var(--card-bg)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--brand-border)',
                  color: m.sender === 'user' ? '#FFFFFF' : 'var(--foreground)',
                  fontSize: '13px', lineHeight: '1.5', textAlign: 'left',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--brand-border)' }}>
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '160ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '320ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--brand-border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAiSendMessage()}
              placeholder="Ask a question about your document..."
              style={{
                flex: 1, height: '42px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--brand-border)',
                borderRadius: '8px', paddingLeft: '14px', paddingRight: '14px', fontSize: '13px', outline: 'none', color: 'var(--foreground)'
              }}
            />
            <button
              onClick={runAiSendMessage}
              style={{
                width: '42px', height: '42px', backgroundColor: '#7C3AED', border: 'none',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', cursor: 'pointer'
              }}
            >
              <Send style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        <div style={{ width: '280px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>AI Workflows</h4>
          <button
            onClick={() => {
              setChatMessages(prev => [...prev, { sender: 'user', text: 'Summarize my document outline.' }]);
              setIsAiLoading(true);
              setTimeout(() => {
                const summary = `### Summary Outline\n- **Subject**: ${editorTitle}\n- **Core compilation**: Outlines modular note components and active persistence layers.\n- **Status**: Checked and validated.`;
                setChatMessages(prev => [...prev, { sender: 'ai', text: summary }]);
                setIsAiLoading(false);
              }, 1000);
            }}
            style={{
              width: '100%', padding: '10px 14px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--brand-border)',
              borderRadius: '8px', color: 'var(--foreground)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
            }}
          >
            <Sparkles style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
            Summarize Document
          </button>
        </div>
      </div>
    );
  };

  // 3. Podcast Studio View
  const renderPodcastView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 24px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{
          width: '100%', maxWidth: '520px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--brand-border)',
          borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Volume2 style={{ width: '26px', height: '26px', color: '#7C3AED' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>AI Podcast Synthesizer</h3>
          <p style={{ fontSize: '12px', color: '#9090A8', margin: '0 0 28px' }}>Generate a conversational audio podcast discussion about your study notes.</p>

          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'var(--foreground)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Speaker Voices</label>
            <select
              value={podcastVoices}
              onChange={e => setPodcastVoices(e.target.value)}
              style={{
                width: '100%', height: '42px', backgroundColor: 'var(--background)', border: '1px solid var(--brand-border)',
                borderRadius: '8px', fontSize: '13px', color: 'var(--foreground)', fontWeight: 600, paddingLeft: '12px', paddingRight: '12px', outline: 'none'
              }}
            >
              <option value="academic">Academic Panel (Male & Female)</option>
              <option value="creative">Creative Dialogue (Two Females)</option>
              <option value="tutor">Solo Instructor (Male)</option>
            </select>
          </div>

          {isAiLoading ? (
            <div style={{ padding: '16px 0' }}>
              <p style={{ color: '#7C3AED', fontSize: '13px', fontWeight: 600 }}>Synthesizing audio workspace... (takes ~5s)</p>
            </div>
          ) : isPodcastPlaying ? (
            <div style={{ border: '1px solid var(--brand-border)', borderRadius: '10px', padding: '16px', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px' }}>Now Playing: {editorTitle}</p>
                <p style={{ fontSize: '10px', color: '#9090A8', margin: 0 }}>Generated by Aora Audio Studio</p>
              </div>
              <button
                onClick={() => setIsPodcastPlaying(false)}
                style={{
                  padding: '6px 14px', backgroundColor: '#7C3AED', border: 'none', borderRadius: '6px',
                  color: '#FFFFFF', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Pause
              </button>
            </div>
          ) : (
            <button
              onClick={runAiGeneratePodcast}
              style={{
                width: '100%', height: '44px', backgroundColor: '#7C3AED', border: 'none',
                borderRadius: '24px', color: '#FFFFFF', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Mic style={{ width: '14px', height: '14px' }} />
              Generate Podcast Discussion
            </button>
          )}
        </div>
      </div>
    );
  };

  // 4. Flashcards View
  const renderFlashcardsView = () => {
    if (!activeDeck || !activeDeck.cards || activeDeck.cards.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 24px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Layers style={{ width: '24px', height: '24px', color: '#D97706' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>No Study Decks Yet</h3>
          <p style={{ fontSize: '12px', color: '#9090A8', margin: '0 0 24px', maxWidth: '320px' }}>Extract key vocabularies and concepts from this document into a structured flashcard study set.</p>
          <button
            onClick={runAiExtractFlashcards}
            style={{
              padding: '10px 24px', backgroundColor: '#7C3AED', border: 'none', borderRadius: '24px',
              color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Extract Study Cards
          </button>
        </div>
      );
    }

    const card = activeDeck.cards[activeCardIndex];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '40px 24px', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', color: '#9090A8', fontWeight: 600 }}>Card {activeCardIndex + 1} of {activeDeck.cards.length}</span>
          <span style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 700 }}>{activeDeck.name}</span>
        </div>

        <div
          onClick={() => setIsFlipped(!isFlipped)}
          style={{
            width: '100%', maxWidth: '480px', height: '260px',
            backgroundColor: 'var(--card-bg)', border: '1px solid var(--brand-border)',
            borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(0,0,0,0.03)', position: 'relative',
            transition: 'transform 0.3s', transformStyle: 'preserve-3d'
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9090A8', letterSpacing: '0.08em', position: 'absolute', top: '24px' }}>
            {isFlipped ? 'Answer' : 'Question'}
          </p>
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', lineHeight: '1.6', margin: '20px 0 0' }}>
            {isFlipped ? card.answer : card.question}
          </p>
          <p style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 600, position: 'absolute', bottom: '24px' }}>
            Click to Flip Card
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '28px', width: '100%', maxWidth: '480px' }}>
          <button
            onClick={() => {
              setIsFlipped(false);
              setActiveCardIndex(prev => (prev > 0 ? prev - 1 : activeDeck.cards.length - 1));
            }}
            style={{
              flex: 1, height: '40px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--brand-border)',
              borderRadius: '8px', color: 'var(--foreground)', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Prev Card
          </button>
          <button
            onClick={() => {
              setIsFlipped(false);
              setActiveCardIndex(prev => (prev < activeDeck.cards.length - 1 ? prev + 1 : 0));
            }}
            style={{
              flex: 1, height: '40px', backgroundColor: '#7C3AED', border: 'none',
              borderRadius: '8px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Next Card
          </button>
        </div>
      </div>
    );
  };

  // 5. Quiz View
  const renderQuizView = () => {
    if (!activeQuiz) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 24px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <HelpCircle style={{ width: '24px', height: '24px', color: '#059669' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>No Active Quiz</h3>
          <p style={{ fontSize: '12px', color: '#9090A8', margin: '0 0 24px', maxWidth: '320px' }}>Generate a multiple-choice practice quiz with detailed explanations directly from your note guide contents.</p>
          <button
            onClick={runAiCreateQuiz}
            disabled={isAiLoading}
            className="generate-quiz-btn"
          >
            {isAiLoading ? 'Generating Quiz...' : 'Generate Quiz'}
          </button>
        </div>
      );
    }

    const checkQuiz = () => {
      let correct = 0;
      activeQuiz.questions.forEach((q, idx) => {
        if (selectedAnswers[q.id] === q.correctAnswer) correct++;
      });
      setQuizScore(correct);
      addQuizResult(activeQuiz.id, activeQuiz.title, correct, activeQuiz.questions.length);
      toast('Quiz completed and score saved!');
    };

    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 24px', width: '100%', maxWidth: '640px', margin: '0 auto', fontFamily: "'Inter', sans-serif", textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>{activeQuiz.title}</h3>
          <button
            onClick={runAiCreateQuiz}
            disabled={isAiLoading}
            className="regenerate-quiz-btn"
          >
            {isAiLoading ? 'Generating...' : 'Regenerate (10 MCQ)'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#9090A8', margin: '0 0 28px' }}>Test your understanding by answering the generated questions below:</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          {activeQuiz.questions.map((q, qIdx) => (
            <div key={q.id} style={{ border: '1px solid var(--brand-border)', borderRadius: '12px', padding: '20px', backgroundColor: 'var(--card-bg)' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 16px' }}>{qIdx + 1}. {q.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {q.options.map((opt, oIdx) => {
                  const isSel = selectedAnswers[q.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => quizScore === null && setSelectedAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                      className={`quiz-option-btn ${isSel ? 'selected' : ''} ${quizScore === null ? 'clickable' : 'disabled-btn'}`}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #C4C2D6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isSel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7C3AED' }} />}
                      </div>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {quizScore !== null && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--brand-border)', fontSize: '11px', color: '#9090A8', lineHeight: '1.5' }}>
                  <span style={{ fontWeight: 700, color: selectedAnswers[q.id] === q.correctAnswer ? '#10B981' : '#EF4444', marginRight: '6px' }}>
                    {selectedAnswers[q.id] === q.correctAnswer ? 'Correct!' : 'Incorrect.'}
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {quizScore !== null ? (
          <div style={{ border: '1px solid var(--brand-border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--card-bg)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>Quiz Results Saved!</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#7C3AED', margin: '0 0 16px' }}>Score: {quizScore} / {activeQuiz.questions.length}</p>
            <button
              onClick={() => { setQuizScore(null); setSelectedAnswers({}); }}
              className="retake-quiz-btn"
            >
              Retake Quiz
            </button>
          </div>
        ) : (
          <button
            onClick={checkQuiz}
            className="submit-quiz-btn"
          >
            Submit Quiz
          </button>
        )}
      </div>
    );
  };

  const renderProcessingLoader = () => {
    const stepCircleStyle = (isCompleted: boolean, isActive: boolean): React.CSSProperties => {
      if (isCompleted) {
        return {
          width: '18px', height: '18px', borderRadius: '50%',
          backgroundColor: '#10B981', color: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        };
      }
      if (isActive) {
        return {
          width: '18px', height: '18px', borderRadius: '50%',
          backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED',
          border: '1px solid #7C3AED',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        };
      }
      return {
        width: '18px', height: '18px', borderRadius: '50%',
        border: '1px solid rgba(30, 27, 41, 0.1)',
        backgroundColor: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      };
    };

    const stepTextStyle = (isCompleted: boolean, isActive: boolean): React.CSSProperties => {
      return {
        fontSize: '12px',
        fontWeight: isActive ? 600 : 500,
        color: isCompleted ? '#1E1B29' : isActive ? '#7C3AED' : '#9090A8',
        transition: 'all 0.3s ease'
      };
    };

    return (
      <div 
        className="flex flex-col items-center justify-center flex-1 p-0 sm:p-6 md:p-8 min-h-[calc(100vh-56px)] bg-gradient-to-br from-[#FAF8FF] via-[#F5F1FD] to-[#ECE5FC] font-sans relative overflow-hidden"
      >
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes floatOrb1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(40px, -40px) scale(1.1); }
          }
          @keyframes floatOrb2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-40px, 40px) scale(1.15); }
          }
          @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 12px rgba(139, 92, 246, 0.3), 0 0 4px rgba(139, 92, 246, 0.2); }
            50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6), 0 0 8px rgba(139, 92, 246, 0.4); }
          }
          @keyframes shimmerSweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        {/* Animated ambient glowing orbs behind the glass card */}
        <div style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)',
          filter: 'blur(40px)',
          top: '5%',
          left: '10%',
          animation: 'floatOrb1 15s infinite ease-in-out',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(40px)',
          bottom: '5%',
          right: '10%',
          animation: 'floatOrb2 18s infinite ease-in-out',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Glass Card */}
        <div className="w-full max-w-[760px] bg-transparent sm:bg-white/45 sm:backdrop-blur-[30px] border-none sm:border sm:border-white/60 rounded-none sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-none sm:shadow-lg sm:shadow-purple-500/5 relative z-10 flex flex-col box-border">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#1E1B29] m-0 font-display">
              Creating Your Notes
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B628B]">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>This should take a few minutes...</span>
            </div>
          </div>

          {/* Two-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-5 md:gap-12 items-center mb-5 sm:mb-8">

            {/* Left Column: Progress Circle/Percentage & Bar */}
            <div className="flex flex-col gap-3.5 sm:gap-5">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl md:text-7xl font-extrabold bg-gradient-to-br from-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent font-display tracking-tight leading-none">
                  {processingProgress}%
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#6B628B] uppercase tracking-wider">
                  Processed
                </span>
              </div>

              {/* Progress Bar Track */}
              <div style={{
                width: '100%', height: '12px',
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                border: '1px solid rgba(124, 58, 237, 0.1)',
                borderRadius: '9999px', overflow: 'hidden',
                position: 'relative', padding: '2px', boxSizing: 'border-box'
              }}>
                <div style={{
                  width: `${processingProgress}%`, height: '100%',
                  background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 50%, #EC4899 100%)',
                  backgroundSize: '200% 100%',
                  borderRadius: '9999px',
                  transition: 'width 0.15s linear',
                  position: 'relative',
                  animation: 'gradientFlow 4s ease infinite, pulseGlow 2s infinite ease-in-out'
                }}>
                  {/* Shimmer sweep effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%)',
                    animation: 'shimmerSweep 2s infinite linear',
                    borderRadius: '9999px'
                  }} />
                  {/* Glowing tip indicator */}
                  {processingProgress > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      right: '2px',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 0 8px #FFFFFF, 0 0 15px #EC4899',
                    }} />
                  )}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-[#6B628B] font-semibold min-h-[18px]">
                {processingStep}
              </div>
            </div>

            {/* Right Column: Processing Pipeline Steps */}
            <div className="flex flex-col gap-3 bg-white/30 border border-[#7C3AED]/10 rounded-2xl p-4 sm:p-5 md:p-6 box-border">
              <span className="text-[10px] sm:text-xs font-bold text-[#7C3AED] uppercase tracking-wider mb-1 block">
                Processing Pipeline
              </span>

              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div style={stepCircleStyle(processingProgress >= 15, processingProgress < 15)}>
                  {processingProgress >= 15 ? <Check size={10} strokeWidth={3} /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#7C3AED' }} />}
                </div>
                <span style={stepTextStyle(processingProgress >= 15, processingProgress < 15)}>
                  Ingesting document content
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div style={stepCircleStyle(processingProgress >= 40, processingProgress >= 15 && processingProgress < 40)}>
                  {processingProgress >= 40 ? <Check size={10} strokeWidth={3} /> : processingProgress >= 15 ? <RotateCw size={10} style={{ animation: 'spin 2s linear infinite' }} /> : null}
                </div>
                <span style={stepTextStyle(processingProgress >= 40, processingProgress >= 15 && processingProgress < 40)}>
                  Transcribing transcripts
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-3">
                <div style={stepCircleStyle(processingProgress >= 75, processingProgress >= 40 && processingProgress < 75)}>
                  {processingProgress >= 75 ? <Check size={10} strokeWidth={3} /> : processingProgress >= 40 ? <RotateCw size={10} style={{ animation: 'spin 2s linear infinite' }} /> : null}
                </div>
                <span style={stepTextStyle(processingProgress >= 75, processingProgress >= 40 && processingProgress < 75)}>
                  Structuring key takeaways
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex items-center gap-3">
                <div style={stepCircleStyle(processingProgress >= 100, processingProgress >= 75 && processingProgress < 100)}>
                  {processingProgress >= 100 ? <Check size={10} strokeWidth={3} /> : processingProgress >= 75 ? <RotateCw size={10} style={{ animation: 'spin 2s linear infinite' }} /> : null}
                </div>
                <span style={stepTextStyle(processingProgress >= 100, processingProgress >= 75 && processingProgress < 100)}>
                  Compiling study guide
                </span>
              </div>
            </div>
          </div>

          {/* Spacer / Tip Line */}
          <div className="h-px bg-[#7C3AED]/10 mb-4 sm:mb-5" />

          <div className="flex items-center justify-center gap-2 text-[#7C3AED] text-xs font-semibold text-center px-4">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>You can ask Aora to explain complex topics right in your notes</span>
          </div>
        </div>
      </div>
    );
  };

  const renderFailedLoader = () => {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flex: 1, padding: '40px 24px', minHeight: 'calc(100vh - 80px)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '100%', maxWidth: '720px', backgroundColor: '#FFFFFF',
          border: '1px solid #FEE2E2', borderRadius: '20px', padding: '48px 56px',
          boxShadow: '0 12px 40px rgba(239, 68, 68, 0.04)', display: 'flex',
          flexDirection: 'column', boxSizing: 'border-box', position: 'relative', textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444', marginBottom: '16px', fontFamily: "'Outfit', sans-serif" }}>
            Failed to Generate Notes
          </h2>
          <p style={{ fontSize: '14px', color: '#6D6D8A', marginBottom: '24px' }}>
            We encountered an unexpected error while processing your YouTube link or document. Please check that the URL is valid and your API keys are active.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 24px', backgroundColor: '#EF4444', border: 'none', borderRadius: '24px',
              color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer', margin: '0 auto'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  const renderNoNoteSelected = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 24px', textAlign: 'center' }}>
        <HelpCircle style={{ width: '48px', height: '48px', color: '#9090A8', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>No Note Active</h3>
        <p style={{ fontSize: '12px', color: '#9090A8', margin: '4px 0 20px' }}>Select an existing document from the Dashboard or create a new blank document.</p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '10px 24px', backgroundColor: '#7C3AED', border: 'none', borderRadius: '24px',
            color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer', margin: '0 auto'
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  };

  const renderSubView = () => {
    if (activeNote && activeNote.status === 'processing') {
      return renderProcessingLoader();
    }
    if (activeNote && activeNote.status === 'failed') {
      return renderFailedLoader();
    }

    switch (activeNotesTab) {
      case 'document':
        return renderDocumentView();
      case 'chat':
        return renderDocumentView(true);
      case 'podcast':
        return renderPodcastView();
      case 'flashcards':
        return renderFlashcardsView();
      case 'quiz':
        return renderQuizView();
      default:
        return renderDocumentView();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: 'var(--background)', overflow: 'hidden' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="pl-[60px] lg:pl-6 pr-4 lg:pr-6"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          borderBottom: '1px solid var(--brand-border)',
          backgroundColor: 'var(--sidebar-bg)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            title="Back to Dashboard"
            style={{
              background: 'none', border: 'none', color: '#9090A8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
            }}
          >
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </button>
          {activeNote ? (
            <input
              value={editorTitle}
              onChange={handleTitleChange}
              placeholder="Untitled Document"
              className="w-24 sm:w-48 lg:w-80"
              style={{
                fontSize: '14px', fontWeight: 600, color: 'var(--foreground)',
                border: 'none', background: 'none', outline: 'none',
                fontFamily: "'Outfit', sans-serif"
              }}
            />
          ) : (
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', fontFamily: "'Outfit', sans-serif" }}>
              Study Workspace
            </span>
          )}
        </div>

        {activeNote && (
          <div className="flex items-center gap-2.5 lg:gap-3.5">
            {/* More actions */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              style={{ background: 'none', border: 'none', color: '#9090A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MoreVertical style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        )}
      </div>

      {/* ── Document Workspace area ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', outline: 'none', backgroundColor: '#F9FAFB', padding: '12px' }}>
        {renderSubView()}
      </div>

      {/* ── Upload Image Modal (Notion-style) ── */}
      {isImageModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 15, 15, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          fontFamily: "'Outfit', 'Inter', sans-serif"
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            width: '440px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative',
            border: '1px solid #E5E7EB'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: 0 }}>Upload Image</h3>
              <button
                onClick={() => setIsImageModalOpen(false)}
                style={{
                  border: 'none', background: 'none', color: '#9CA3AF', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
                  borderRadius: '6px', transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#4B5563'}
                onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Drag & Drop dotted container */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleImageFile(file);
              }}
              onClick={() => imageFileInputRef.current?.click()}
              style={{
                border: '1.5px dashed #D1D5DB',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#FAFAFA'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#7C3AED';
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.backgroundColor = '#FAFAFA';
              }}
            >
              <input
                type="file"
                ref={imageFileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#4B5563' }}>
                Drag and drop an image here, or click to select
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                Supports JPEG, PNG, GIF, WebP, SVG, and HEIC
              </div>
            </div>
          </div>
        </div>
      )}

      {isSettingsModalOpen && activeNote && (
        <NoteSettingsModal
          note={activeNote}
          folders={folders}
          onClose={() => setIsSettingsModalOpen(false)}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
        />
      )}
    </div>
  );
}
