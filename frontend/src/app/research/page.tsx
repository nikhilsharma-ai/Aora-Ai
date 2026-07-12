'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import {
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Plus,
  FileText,
  Bookmark,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const mockResearchCitations = [
  { title: 'Attention Is All You Need', source: 'arXiv:1706.03762', url: '#' },
  { title: 'Generative Agents: Interactive Simulacra', source: 'arXiv:2304.03442', url: '#' },
  { title: 'Cognitive architectures in LLMs', source: 'Nature Machine Intelligence', url: '#' },
  { title: 'Self-Attention mechanics for education', source: 'IEEE Computer', url: '#' }
];

export default function ResearchWorkspace() {
  const { toast } = useToast();
  const { addNote } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [synthesisContent, setSynthesisContent] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setHasResults(true);
      setSynthesisContent(
        `# Research Synthesis: ${searchQuery}\n\n## Overview\nBased on literature from Vaswani et al. and recent IEEE annotations, this concept is characterized by queries, keys, and values. It maps sequences in parallel, allowing significant optimizations in hardware layouts.\n\n## Core Findings\n1. **Parallelization**: Eliminates recurrence limitations.\n2. **Long-Range Dependencies**: Attention spans preserve relationships across thousands of words.\n3. **Scaling**: Adapts dynamically based on parameters and layer allocations.`
      );
      toast('Research query completed. Synthesis draft populated.');
    }, 2000);
  };

  const handleExport = () => {
    if (!synthesisContent) return;
    const title = searchQuery ? `Research: ${searchQuery}` : 'Research Synthesis';
    addNote(title, synthesisContent, ['Research']);
    toast('Synthesis exported to Notes Workspace successfully!');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden max-w-7xl mx-auto">
      
      {/* Left Column: Search & Citations */}
      <div className="flex-1 border-r border-brand-border/60 pr-6 flex flex-col justify-between h-full overflow-y-auto">
        <div className="space-y-6 text-left">
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Search className="w-5 h-5 text-brand-primary" />
              <span>Aora Research Engine</span>
            </h2>
            <p className="text-xs text-foreground/45 leading-relaxed font-semibold">
              Query cross-referenced literature across academic networks (arXiv, PubMed, OpenAlex) in real-time.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <Input
                required
                placeholder="Ask Aora to compile citations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                className="bg-white border-brand-border shadow-xs h-11"
              />
              <Button type="submit" disabled={isSearching} className="h-11 shrink-0 px-5">
                Search
              </Button>
            </div>
          </form>

          {isSearching && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-brand-primary text-xs font-bold animate-pulse">
                <Sparkles className="w-4 h-4 text-brand-primary animate-spin" />
                <span>Crawling academic catalogs...</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-foreground/5 h-16 rounded-xl border border-brand-border/40" />
                ))}
              </div>
            </div>
          )}

          {hasResults && !isSearching && (
            <div className="space-y-6 pt-2">
              
              {/* Citations cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Verified Citations ({mockResearchCitations.length})</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mockResearchCitations.map((citation, idx) => (
                    <Card key={idx} className="p-3 bg-white border border-brand-border hover:border-brand-primary/20 transition-all flex flex-col justify-between shadow-xs">
                      <div>
                        <p className="text-xs font-bold text-foreground truncate">{citation.title}</p>
                        <p className="text-[10px] text-brand-primary font-semibold mt-1">{citation.source}</p>
                      </div>
                      <a href={citation.url} className="text-[9px] font-bold text-foreground/35 hover:text-brand-primary flex items-center gap-0.5 justify-end mt-4">
                        <span>External Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Synthesized overview preview */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">AI Synopsis</h3>
                <Card className="p-4 bg-brand-primary/[0.02] border border-brand-primary/10 rounded-2xl text-xs md:text-sm text-foreground/60 leading-relaxed space-y-3">
                  <p>
                    Synthesis shows high alignment on Transformer architectures replacing recurrent limitations. It is recommended to compile notes immediately.
                  </p>
                </Card>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Right Column: Editable compiled Document */}
      <div className="w-[450px] shrink-0 bg-white border border-brand-border/60 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between h-full">
        {hasResults ? (
          <>
            {/* Header info */}
            <div className="border-b border-brand-border/40 p-4 bg-brand-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <FileText className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-bold text-foreground">Synthesis Document</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs font-semibold rounded-lg bg-white">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Export to Note</span>
              </Button>
            </div>

            {/* Document editable content */}
            <textarea
              value={synthesisContent}
              onChange={(e) => setSynthesisContent(e.target.value)}
              className="flex-1 p-6 text-sm outline-none resize-none leading-relaxed text-foreground placeholder:text-foreground/20 text-left whitespace-pre-wrap focus:outline-none"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <FileText className="w-12 h-12 text-foreground/20 mb-3" />
            <h4 className="text-base font-bold text-foreground">Synthesis Editor</h4>
            <p className="text-xs text-foreground/45 mt-1 max-w-xs leading-relaxed">
              Submit a research query on the left. Aora AI will draft an aggregated study guide draft here for your modifications.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
