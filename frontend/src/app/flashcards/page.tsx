'use client';

import React, { useState } from 'react';
import { useAppStore, Deck, Flashcard } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Plus,
  ArrowLeft,
  RotateCw,
  CheckCircle,
  AlertCircle,
  Copy,
  FolderPlus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function FlashcardsModule() {
  const { toast } = useToast();
  const { decks, addDeck, addCard, rateCard, deleteDeck } = useAppStore();

  // Selected state
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCompleted, setStudyCompleted] = useState(false);

  // Dialog states
  const [isDeckDialogOpen, setIsDeckDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  const activeDeck = decks.find((d) => d.id === activeDeckId) || null;
  const currentCard = activeDeck?.cards[currentCardIdx] || null;

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    const id = addDeck(newDeckName);
    toast(`Deck "${newDeckName}" created!`);
    setNewDeckName('');
    setIsDeckDialogOpen(false);
    setActiveDeckId(id);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setStudyCompleted(false);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeckId || !newCardFront.trim() || !newCardBack.trim()) return;
    addCard(activeDeckId, newCardFront, newCardBack);
    toast('Flashcard saved successfully');
    setNewCardFront('');
    setNewCardBack('');
    setIsCardDialogOpen(false);
  };

  const handleDeleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDeck(id);
    if (activeDeckId === id) {
      setActiveDeckId(null);
    }
    toast('Deck deleted', 'info');
  };

  const handleRate = (rating: 'easy' | 'medium' | 'hard') => {
    if (!activeDeckId || !currentCard) return;
    
    rateCard(activeDeckId, currentCard.id, rating);
    setIsFlipped(false);

    setTimeout(() => {
      if (activeDeck && currentCardIdx < activeDeck.cards.length - 1) {
        setCurrentCardIdx(currentCardIdx + 1);
      } else {
        setStudyCompleted(true);
        toast('Deck review complete!', 'success');
      }
    }, 150);
  };

  const resetStudy = () => {
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setStudyCompleted(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left border-b border-brand-border/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground">Gamified Flashcards</h2>
          <p className="text-sm text-foreground/60">
            Train your memory using spaced repetition Leitner box methodology.
          </p>
        </div>
        <div className="flex gap-2">
          {activeDeck && (
            <Button
              variant="outline"
              onClick={() => setIsCardDialogOpen(true)}
              className="h-10 text-xs font-semibold rounded-xl flex items-center gap-1.5 bg-white"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => setIsDeckDialogOpen(true)}
            className="h-10 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Deck</span>
          </Button>
        </div>
      </div>

      {/* 2. Study Session Dashboard or Deck Selector */}
      {!activeDeckId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              onClick={() => {
                setActiveDeckId(deck.id);
                setCurrentCardIdx(0);
                setIsFlipped(false);
                setStudyCompleted(false);
              }}
              className="p-6 bg-white border border-brand-border/60 hover:border-brand-primary/30 shadow-sm cursor-pointer transition-all hover:translate-y-[-2px]"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-muted text-[10px] font-bold text-brand-primary rounded-md">
                    Spaced Repetition
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-2">{deck.name}</h3>
                  <p className="text-xs text-foreground/40 font-semibold">{deck.cards.length} cards in deck</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteDeck(deck.id, e)}
                  className="h-8 w-8 rounded-full text-foreground/30 hover:text-red-500 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <CardFooter className="p-0 border-t-0 mt-6 flex justify-end">
                <Button variant="secondary" size="sm" className="h-9 px-4 text-xs font-bold rounded-lg flex items-center gap-1">
                  <span>Start Practice</span>
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}

          {decks.length === 0 && (
            <div className="col-span-full py-16 border border-dashed border-brand-border bg-white rounded-3xl flex flex-col items-center justify-center text-center">
              <Copy className="w-12 h-12 text-foreground/20 mb-3" />
              <h4 className="text-base font-bold text-foreground">No Decks Active</h4>
              <p className="text-xs text-foreground/45 mt-1 max-w-xs">
                Create a flashcard deck using the top button, or generate them automatically from your workspace notes.
              </p>
            </div>
          )}
        </div>
      ) : activeDeck ? (
        /* Study Workspace Mode */
        <div className="space-y-8">
          <div className="flex items-center justify-between text-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveDeckId(null)}
              className="text-foreground/50 hover:text-brand-primary gap-1 h-9 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Decks</span>
            </Button>
            
            <p className="text-sm font-semibold text-foreground/40">
              {activeDeck.name} • Card {studyCompleted ? activeDeck.cards.length : currentCardIdx + 1} of {activeDeck.cards.length}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {studyCompleted ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-brand-border/60 p-8 rounded-3xl text-center shadow-md space-y-6 max-w-md mx-auto"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-foreground">Deck Review Complete!</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">
                    Nicely done. You have studied all card cycles inside this Leitner system schedule.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetStudy} className="flex-1 font-semibold">
                    Study Again
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setActiveDeckId(null)} className="flex-1 font-semibold">
                    Return to Decks
                  </Button>
                </div>
              </motion.div>
            ) : currentCard ? (
              <div className="space-y-8 flex flex-col items-center">
                {/* 3D Flipping Card Container */}
                <div
                  className="w-full max-w-[500px] h-[300px] cursor-pointer relative select-none"
                  style={{ perspective: 1200 }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="w-full h-full relative"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Front Face */}
                    <Card
                      className="absolute inset-0 bg-white border border-brand-border p-8 rounded-3xl flex flex-col justify-between shadow-lg"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest text-left">Question</span>
                      <p className="text-lg md:text-xl font-extrabold text-foreground text-center leading-relaxed my-auto">
                        {currentCard.question}
                      </p>
                      <span className="text-[10px] text-foreground/40 font-semibold flex items-center gap-1 justify-center">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Click card to reveal answer</span>
                      </span>
                    </Card>

                    {/* Back Face */}
                    <Card
                      className="absolute inset-0 bg-brand-primary border border-brand-primary p-8 rounded-3xl flex flex-col justify-between shadow-lg text-white"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <span className="text-[10px] font-bold text-brand-accent/50 uppercase tracking-widest text-left">Answer</span>
                      <p className="text-base md:text-lg font-bold text-center leading-relaxed my-auto overflow-y-auto max-h-[160px] pr-1">
                        {currentCard.answer}
                      </p>
                      <span className="text-[10px] text-brand-accent/50 font-semibold flex items-center gap-1 justify-center">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Click card to see question</span>
                      </span>
                    </Card>
                  </motion.div>
                </div>

                {/* Leitner Box Spaced Repetition Rating Panel */}
                <div className="w-full max-w-[500px] bg-white border border-brand-border/60 p-5 rounded-2xl shadow-xs text-center space-y-4">
                  <p className="text-xs text-foreground/45 font-bold uppercase tracking-wider">
                    Rate recall difficulty to scheduling next repeat:
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleRate('hard')}
                      className="h-10 text-xs font-bold rounded-xl border border-red-100 hover:bg-red-50 text-red-500 hover:border-red-300"
                    >
                      Hard (Box 1)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRate('medium')}
                      className="h-10 text-xs font-bold rounded-xl border border-amber-100 hover:bg-amber-50 text-amber-500 hover:border-amber-300"
                    >
                      Medium (+1 Box)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRate('easy')}
                      className="h-10 text-xs font-bold rounded-xl border border-emerald-100 hover:bg-emerald-50 text-emerald-500 hover:border-emerald-300"
                    >
                      Easy (Max Box)
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <AlertCircle className="w-12 h-12 text-foreground/20 mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground/50">This deck is empty</p>
                <Button variant="outline" size="sm" onClick={() => setIsCardDialogOpen(true)} className="mt-3">
                  Create First Card
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : null}

      {/* 3. Create Deck Dialog */}
      <Dialog isOpen={isDeckDialogOpen} onClose={() => setIsDeckDialogOpen(false)} title="Create Spaced Repetition Deck">
        <form onSubmit={handleCreateDeck} className="space-y-4 pt-2 text-left">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Deck Name</label>
            <Input
              required
              placeholder="e.g. MCAT Biology Chapter 4, NextJS concepts"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-brand-border/40">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsDeckDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="px-5">
              Create Deck
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Add Card Dialog */}
      <Dialog isOpen={isCardDialogOpen} onClose={() => setIsCardDialogOpen(false)} title="Add Card to Active Deck">
        <form onSubmit={handleCreateCard} className="space-y-4 pt-2 text-left">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Question (Front)</label>
            <textarea
              required
              placeholder="e.g. What does DNA stand for?"
              value={newCardFront}
              onChange={(e) => setNewCardFront(e.target.value)}
              className="w-full h-20 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary placeholder:text-foreground/30 focus:outline-none text-left"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Answer (Back)</label>
            <textarea
              required
              placeholder="e.g. Deoxyribonucleic acid"
              value={newCardBack}
              onChange={(e) => setNewCardBack(e.target.value)}
              className="w-full h-24 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary placeholder:text-foreground/30 focus:outline-none text-left"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-brand-border/40">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCardDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="px-5">
              Save Card
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
