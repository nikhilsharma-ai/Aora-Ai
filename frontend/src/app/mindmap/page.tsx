'use client';

import React, { useState } from 'react';
import { useAppStore, MindMapNode } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import {
  Sparkles,
  Plus,
  GitMerge,
  Maximize2,
  Minimize2,
  HelpCircle,
  Play,
  Settings,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function MindMapBuilder() {
  const { toast } = useToast();
  const { mindMaps, activeMindMapId, addMindMap, setActiveMindMapId, addMindMapNode, updateMindMapNode } = useAppStore();

  const activeMap = mindMaps.find((m) => m.id === activeMindMapId) || mindMaps[0] || null;

  // Selected node state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Dialog states
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');

  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');

  const handleCreateMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapTitle.trim()) return;
    const newId = addMindMap(newMapTitle);
    toast(`Mind Map "${newMapTitle}" initialized`);
    setNewMapTitle('');
    setIsMapDialogOpen(false);
    setActiveMindMapId(newId);
    setSelectedNodeId(null);
  };

  const handleAddChildNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMindMapId || !selectedNodeId || !newNodeLabel.trim()) return;
    
    addMindMapNode(activeMindMapId, selectedNodeId, newNodeLabel);
    toast(`Added node "${newNodeLabel}"`);
    setNewNodeLabel('');
    setIsNodeDialogOpen(false);
  };

  const handleAiExpand = () => {
    if (!activeMap || !selectedNodeId) return;
    const parentNode = activeMap.nodes.find((n) => n.id === selectedNodeId);
    if (!parentNode) return;

    toast('AI is brainstorming sub-topics...');
    setTimeout(() => {
      // Add two mock nodes
      addMindMapNode(activeMap.id, selectedNodeId, `AI Sub-topic A for ${parentNode.label}`);
      addMindMapNode(activeMap.id, selectedNodeId, `AI Sub-topic B for ${parentNode.label}`);
      toast('AI expanded 2 new sub-topics successfully!', 'success');
    }, 1200);
  };

  // Find connections to render SVG lines
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; id: string }> = [];
  if (activeMap) {
    activeMap.nodes.forEach((node) => {
      node.children.forEach((childId) => {
        const childNode = activeMap.nodes.find((n) => n.id === childId);
        if (childNode) {
          lines.push({
            x1: node.x,
            y1: node.y,
            x2: childNode.x,
            y2: childNode.y,
            id: `${node.id}-${childNode.id}`,
          });
        }
      });
    });
  }

  const selectedNode = activeMap?.nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden max-w-7xl mx-auto">
      
      {/* 1. Left Sidebar: Mind Map manager */}
      <div className="w-80 border-r border-brand-border/60 pr-6 flex flex-col justify-between shrink-0 h-full">
        <div className="space-y-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-foreground">Mind Maps</h3>
            <Button variant="outline" size="icon" onClick={() => setIsMapDialogOpen(true)} className="h-8 w-8 rounded-lg bg-white">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {mindMaps.map((map) => {
              const isActive = map.id === activeMap?.id;
              return (
                <div
                  key={map.id}
                  onClick={() => {
                    setActiveMindMapId(map.id);
                    setSelectedNodeId(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left ${
                    isActive
                      ? 'bg-brand-accent/55 border-brand-primary/30 text-brand-primary'
                      : 'bg-white hover:bg-brand-muted border-brand-border/60'
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <p className="text-sm font-semibold truncate leading-tight">{map.title}</p>
                    <p className="text-[10px] text-foreground/40 font-medium">
                      {map.nodes.length} nodes
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Active Node details panel */}
          {selectedNode && (
            <div className="border-t border-brand-border/40 pt-4 space-y-4 text-left">
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Node Controls</h4>
              <Card className="p-4 bg-white border border-brand-border shadow-xs space-y-3">
                <p className="text-sm font-bold text-foreground truncate">{selectedNode.label}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="primary"
                    onClick={handleAiExpand}
                    className="h-9 text-xs font-bold flex items-center justify-center gap-1 w-full rounded-lg"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Expand Node (AI)</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsNodeDialogOpen(true)}
                    className="h-9 text-xs font-bold w-full rounded-lg bg-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Child Node</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Canvas: interactive SVG workspace */}
      <div className="flex-1 bg-white border border-brand-border/60 rounded-3xl overflow-hidden shadow-xs relative flex flex-col justify-between">
        
        {/* Canvas controls banner */}
        <div className="border-b border-brand-border/40 p-4 bg-brand-muted/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-bold text-foreground">{activeMap ? activeMap.title : 'No map selected'}</span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 border border-brand-border bg-white rounded-lg p-0.5 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-foreground/50"
              onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.1))}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] font-bold text-foreground/45 px-1">{Math.round(zoomScale * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-foreground/50"
              onClick={() => setZoomScale(Math.min(1.5, zoomScale + 0.1))}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* SVG Container */}
        {activeMap ? (
          <div className="flex-1 w-full h-full relative overflow-auto bg-slate-50/50">
            <svg
              className="w-[1000px] h-[600px] transition-transform origin-top-left"
              style={{ transform: `scale(${zoomScale})` }}
            >
              {/* Grid pattern background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Render Connection Lines */}
              {lines.map((line) => (
                <line
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#7C3AED"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="animate-[pulse_2s_infinite]"
                />
              ))}

              {/* Render Node Circles and Labels */}
              {activeMap.nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer select-none group"
                  >
                    {/* Node Shadow / outer glow */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="22"
                      className={`transition-all duration-300 fill-brand-accent/30 ${
                        isSelected ? 'stroke-brand-primary stroke-2' : 'stroke-transparent'
                      }`}
                    />
                    
                    {/* Core node */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="16"
                      className={`transition-all duration-300 ${
                        isSelected 
                          ? 'fill-brand-primary stroke-brand-primary' 
                          : 'fill-white stroke-brand-border hover:stroke-brand-primary/60'
                      }`}
                      strokeWidth="1.5"
                    />

                    {/* Text block background */}
                    <rect
                      x={node.x - 60}
                      y={node.y + 24}
                      width="120"
                      height="24"
                      rx="6"
                      className={`fill-white border filter drop-shadow-xs transition-colors ${
                        isSelected ? 'stroke-brand-primary stroke-1' : 'stroke-brand-border/40'
                      }`}
                      strokeWidth="0.5"
                    />

                    {/* Node Label */}
                    <text
                      x={node.x}
                      y={node.y + 40}
                      textAnchor="middle"
                      className={`text-[9px] font-bold ${isSelected ? 'fill-brand-primary' : 'fill-foreground'}`}
                    >
                      {node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            
            <p className="absolute bottom-4 left-4 text-[10px] text-foreground/45 font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-brand-border shadow-xs">
              Click on a node circle to view options or expand with AI.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <GitMerge className="w-12 h-12 text-foreground/20 mb-3" />
            <h4 className="text-base font-bold text-foreground">No Mind Map selected</h4>
            <Button variant="primary" size="sm" onClick={() => setIsMapDialogOpen(true)} className="mt-4">
              Create Mind Map
            </Button>
          </div>
        )}
      </div>

      {/* 3. Create Map Dialog */}
      <Dialog isOpen={isMapDialogOpen} onClose={() => setIsMapDialogOpen(false)} title="Initialize Mind Map">
        <form onSubmit={handleCreateMap} className="space-y-4 pt-2 text-left">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Mind Map Topic</label>
            <Input
              required
              placeholder="e.g. NextJS layouts, Biochemistry overview"
              value={newMapTitle}
              onChange={(e) => setNewMapTitle(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-brand-border/40">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsMapDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="px-5">
              Create Map
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Add Child Node Dialog */}
      <Dialog isOpen={isNodeDialogOpen} onClose={() => setIsNodeDialogOpen(false)} title="Add Child Node">
        <form onSubmit={handleAddChildNode} className="space-y-4 pt-2 text-left">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Node Label</label>
            <Input
              required
              placeholder="e.g. Server vs Client, Secondary metabolism"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-brand-border/40">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsNodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="px-5">
              Save Node
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
