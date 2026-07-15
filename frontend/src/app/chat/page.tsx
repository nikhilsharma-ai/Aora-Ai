'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import {
  Plus,
  Send,
  Trash2,
  User,
  ExternalLink,
  MessageSquare,
  Bot,
  MoreVertical,
  Pencil,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AIWorkspaceChat() {
  const { toast } = useToast();
  const { chats, activeChatId, activePersona, addChat, deleteChat, renameChat, sendMessage, setActiveChatId } = useAppStore();

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0] || null;
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Mobile view toggle state ('list' showing conversations or 'chat' showing messages)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isLoading]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const messageText = chatInput;
    setChatInput('');
    setIsLoading(true);

    try {
      if (activeChat) {
        await sendMessage(activeChat.id, messageText);
        toast('Message dispatched to Aora AI');
      } else {
        const newId = addChat(messageText.slice(0, 24) || 'New Study Conversation');
        await sendMessage(newId, messageText);
        toast('Conversation initialized');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    addChat('New Study Conversation');
    setMobileView('chat');
    toast('New AI Chat session initialized');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    deleteChat(id);
    toast('Conversation deleted', 'info');
  };

  const handleRenameStart = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      renameChat(id, renameValue.trim());
      toast('Conversation renamed');
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleAttachMock = () => {
    toast('Attached document to chat context');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 lg:gap-6 overflow-hidden max-w-7xl mx-auto px-4">
      
      {/* 1. Left Sidebar: Chat History */}
      <div className={`w-full lg:w-80 border-r-0 lg:border-r border-brand-border/60 pr-0 lg:pr-6 flex flex-col justify-between shrink-0 h-full ${
        mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
      }`}>
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-foreground">Conversations</h3>
            <Button variant="outline" size="icon" onClick={handleNewChat} className="h-8 w-8 rounded-lg">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
 
          <div className="space-y-2" ref={menuRef}>
            {chats.map((c) => {
              const isActive = c.id === activeChat?.id;
              const isMenuOpen = openMenuId === c.id;
              const isRenaming = renamingId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (!isRenaming) {
                      setActiveChatId(c.id);
                      setMobileView('chat');
                    }
                  }}
                  className={`group relative w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left ${
                    isActive
                      ? 'bg-brand-accent/55 border-brand-primary/30 text-brand-primary'
                      : 'bg-white hover:bg-brand-muted border-brand-border/60'
                  }`}
                >
                  <div className="space-y-1 truncate pr-2 flex-1">
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(c.id);
                          if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                        }}
                        className="w-full text-sm font-semibold bg-white border border-brand-primary/40 rounded-md px-2 py-0.5 outline-none focus:ring-1 focus:ring-brand-primary text-foreground"
                      />
                    ) : (
                      <p className="text-sm font-semibold truncate leading-tight">{c.title}</p>
                    )}
                    <p className="text-[10px] text-foreground/40 font-medium">
                      {c.messages.length} messages
                    </p>
                  </div>

                  {/* 3-dot menu button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : c.id); }}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-foreground/30 hover:text-brand-primary hover:bg-brand-accent/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-9 z-50 w-36 bg-white border border-brand-border/60 rounded-xl shadow-lg overflow-hidden"
                    >
                      <button
                        onClick={(e) => handleRenameStart(c.id, c.title, e)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-brand-muted transition-colors"
                      >
                        <Pencil className="h-3 w-3 text-brand-primary" />
                        Rename
                      </button>
                      <button
                        onClick={(e) => handleDelete(c.id, e)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {chats.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4 border border-dashed border-brand-border/80 rounded-2xl bg-brand-muted/10 my-4">
                <p className="text-sm font-medium text-foreground/45 mb-3.5">No chats active</p>
                <Button onClick={handleNewChat} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-xs shadow-md transition-transform hover:scale-[1.02]">
                  <Plus className="w-4 h-4" /> Start New Chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Chat Workspace */}
      <div className={`flex-1 flex flex-col bg-white border border-brand-border/60 rounded-3xl overflow-hidden shadow-xs relative ${
        mobileView === 'list' ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Chat window Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 p-4 bg-brand-muted/20">
          <div className="flex items-center gap-2 text-left">
            {/* Mobile Back Button */}
            <button
              onClick={() => setMobileView('list')}
              className="lg:hidden p-1 mr-1 text-foreground/60 hover:text-foreground cursor-pointer flex items-center justify-center"
              title="Back to Conversations"
              type="button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Bot className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Aora Assistant</p>
              <p className="text-[10px] font-semibold text-brand-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Active Persona: {activePersona}</span>
              </p>
            </div>
          </div>


        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeChat ? (
            activeChat.messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar */}
                  {!isUser && (
                    <div className="h-9 w-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-brand-primary" />
                    </div>
                  )}

                  {/* Bubble content */}
                  <div className={`space-y-2 max-w-[70%] text-left ${isUser ? 'order-1' : 'order-2'}`}>
                    <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                      isUser
                        ? 'bg-brand-primary border-brand-primary text-white rounded-tr-none'
                        : 'bg-[#FAF9FD] border-brand-border text-foreground rounded-tl-none'
                    }`}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                      ) : (
                        <div className="ai-markdown-body">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Sources inline panel (if present in AI response) */}
                    {!isUser && m.sources && m.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-1.5">
                        <span className="text-[9px] uppercase font-bold text-foreground/30 leading-none">Citations:</span>
                        {m.sources.map((src, i) => (
                          <div key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand-muted border border-brand-border rounded text-[9px] text-brand-primary font-semibold">
                            <span>{src}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <p className={`text-[9px] font-semibold text-foreground/30 px-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
                      {m.timestamp}
                    </p>
                  </div>

                  {/* User avatar */}
                  {isUser && (
                    <div className="h-9 w-9 rounded-xl bg-brand-accent/50 border border-brand-accent flex items-center justify-center shrink-0 order-3">
                      <User className="w-4 h-4 text-brand-primary" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MessageSquare className="w-12 h-12 text-foreground/20 mb-3" />
              <h4 className="text-base font-bold text-foreground">Aora AI Workspace Chat</h4>
              <p className="text-xs text-foreground/45 mt-1 max-w-xs">
                Select an existing conversation, or type a query below to start a learning workspace chat thread.
              </p>
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="h-9 w-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="bg-[#FAF9FD] border border-brand-border rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '160ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-primary/60 animate-typing-dot" style={{ animationDelay: '320ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="border-t border-brand-border/40 p-4 bg-brand-muted/20">
          <form onSubmit={handleSend} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative flex items-center">
                <input
                  required
                  disabled={isLoading}
                  placeholder={isLoading ? 'Aora is thinking...' : 'Ask Aora AI to synthesize literature, explain steps...'}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full h-11 border border-brand-border bg-white rounded-xl px-4 py-2 text-sm placeholder:text-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary text-foreground text-left disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="h-11 w-11 p-0 rounded-xl shrink-0 disabled:opacity-60">
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
