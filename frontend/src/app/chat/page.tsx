'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import {
  Sparkles,
  Plus,
  Send,
  Trash2,
  Paperclip,
  CheckCircle,
  FileText,
  User,
  ExternalLink,
  MessageSquare,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AIWorkspaceChat() {
  const { toast } = useToast();
  const { chats, activeChatId, activePersona, addChat, deleteChat, sendMessage, setActiveChatId, setActivePersona } = useAppStore();

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0] || null;
  const [chatInput, setChatInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !attachedFile) return;

    if (activeChat) {
      sendMessage(activeChat.id, chatInput);
      setChatInput('');
      setAttachedFile(null);
      toast('Message dispatched to Aora AI');
    } else {
      const newId = addChat(chatInput.slice(0, 24) || 'New Study Conversation');
      sendMessage(newId, chatInput);
      setChatInput('');
      setAttachedFile(null);
      toast('Conversation initialized');
    }
  };

  const handleNewChat = () => {
    addChat('New Study Conversation');
    toast('New AI Chat session initialized');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChat(id);
    toast('Conversation deleted', 'info');
  };

  const handleAttachMock = () => {
    setAttachedFile({ name: 'Cellular_Respiration_Draft.docx', size: '14.2 KB' });
    toast('Attached document to chat context');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden max-w-7xl mx-auto">
      
      {/* 1. Left Sidebar: Chat History */}
      <div className="w-80 border-r border-brand-border/60 pr-6 flex flex-col justify-between shrink-0 h-full">
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-foreground">Conversations</h3>
            <Button variant="outline" size="icon" onClick={handleNewChat} className="h-8 w-8 rounded-lg">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {chats.map((c) => {
              const isActive = c.id === activeChat?.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveChatId(c.id)}
                  className={`group w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left ${
                    isActive
                      ? 'bg-brand-accent/55 border-brand-primary/30 text-brand-primary'
                      : 'bg-white hover:bg-brand-muted border-brand-border/60'
                  }`}
                >
                  <div className="space-y-1 truncate pr-2">
                    <p className="text-sm font-semibold truncate leading-tight">{c.title}</p>
                    <p className="text-[10px] text-foreground/40 font-medium">
                      {c.messages.length} messages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(c.id, e)}
                    className="h-7 w-7 rounded-full text-foreground/30 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}

            {chats.length === 0 && (
              <p className="text-xs text-foreground/40 text-center py-8">No chats active</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Chat Workspace */}
      <div className="flex-1 flex flex-col bg-white border border-brand-border/60 rounded-3xl overflow-hidden shadow-xs relative">
        
        {/* Chat window Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 p-4 bg-brand-muted/20">
          <div className="flex items-center gap-2 text-left">
            <Bot className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Aora Assistant</p>
              <p className="text-[10px] font-semibold text-brand-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Active Persona: {activePersona}</span>
              </p>
            </div>
          </div>

          {/* Persona toggles */}
          <div className="flex bg-brand-muted border border-brand-border/60 p-0.5 rounded-lg">
            {[
              { id: 'academic', label: 'Academic' },
              { id: 'tutor', label: 'Tutor' },
              { id: 'creative', label: 'Creative' }
            ].map((p) => {
              const active = activePersona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePersona(p.id as any);
                    toast(`AI Persona set to: ${p.label}`);
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    active ? 'bg-white text-brand-primary shadow-xs' : 'text-foreground/45 hover:text-foreground/80'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
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
                      <p className="whitespace-pre-wrap font-medium">{m.text}</p>
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
        </div>

        {/* Input box */}
        <div className="border-t border-brand-border/40 p-4 bg-brand-muted/20">
          <form onSubmit={handleSend} className="space-y-3">
            {/* Attachment preview banner */}
            {attachedFile && (
              <div className="flex items-center justify-between p-2.5 bg-brand-accent/40 border border-brand-primary/20 rounded-xl max-w-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-primary" />
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-foreground">{attachedFile.name}</p>
                    <p className="text-[9px] font-semibold text-foreground/40 mt-0.5">{attachedFile.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="w-4 h-4 rounded-full bg-red-50 text-red-500 text-[9px] font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAttachMock}
                className="h-11 w-11 border border-brand-border bg-white rounded-xl text-foreground/40 hover:text-brand-primary shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <div className="flex-1 relative flex items-center">
                <input
                  required={!attachedFile}
                  placeholder="Ask Aora AI to synthesize literature, explain steps..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full h-11 border border-brand-border bg-white rounded-xl px-4 py-2 text-sm placeholder:text-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary text-foreground text-left"
                />
              </div>

              <Button type="submit" className="h-11 w-11 p-0 rounded-xl shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
