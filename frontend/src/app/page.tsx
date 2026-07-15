'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  Sparkles,
  ArrowRight,
  Upload,
  BookOpen,
  HelpCircle,
  FileText,
  FileCode,
  Video,
  Mic,
  Check,
  ChevronDown,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// FAQ items
const faqs = [
  {
    q: "What is Aora AI?",
    a: "Aora AI is a premium AI-powered learning and research ecosystem. It ingests lectures, notes, PDFs, and links, and automatically converts them into rich summaries, flashcards, interactive quizzes, mind maps, and podcasts to accelerate your memory and comprehension."
  },
  {
    q: "Is Aora AI free to use?",
    a: "We offer a fully featured free tier that lets you upload up to 5 documents per month and generate basic study aids. Our Premium plan unlocks unlimited workspace capacity, deep research searches, and our AI Podcast generation studio."
  },
  {
    q: "Can I edit my notes and workspaces after they're generated?",
    a: "Yes! Aora AI creates live editable documents. You can customize summaries, add your own flashcards, restructure mind maps, and write custom synthesis documents in your research split-screen view."
  },
  {
    q: "Does it support formulas, math equations, and diagrams?",
    a: "Absolutely. Aora AI natively processes and displays LaTeX formulas and structures technical content in detailed, hierarchical outlines suited for STEM, medicine, law, and business curricula."
  }
];

// Interactive mock card subjects
const mockCards = [
  {
    title: "Interactive Quizzes",
    text: "Instantly generate multiple-choice quizzes with detailed explanations from your notes to test your understanding and pin-point knowledge gaps.",
    emoji: "📝",
    gradient: "from-[#030712] to-[#111827]"
  },
  {
    title: "AI Podcast Studio",
    text: "Transform heavy textbook chapters and long lecture transcripts into engaging, conversational audio shows hosted by two AI personalities.",
    emoji: "🎙️",
    gradient: "from-[#0F172A] to-[#1E1B4B]"
  },
  {
    title: "Interactive Mind Maps",
    text: "Generate dynamic, visual nodes that connect ideas, keywords, and equations from your documents into a beautifully structured knowledge graph.",
    emoji: "🧠",
    gradient: "from-[#0B132B] to-[#1C2541]"
  }
];

export default function LandingPage() {
  const { isAuthenticated, login } = useAppStore();

  // States for interactive demos
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [uploadList, setUploadList] = useState([
    { name: 'Syllabus.docx', type: 'doc' },
    { name: 'Lecture 1 Slides.pdf', type: 'pdf' },
    { name: 'Introduction to Calculus', type: 'youtube' },
    { name: 'Lecture Recording.mp3', type: 'audio' }
  ]);
  const [isStartingLearn, setIsStartingLearn] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  // Scroll handler for animate-in sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setShowStickyHeader(true);
      } else {
        setShowStickyHeader(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const removeUploadItem = (idx: number) => {
    setUploadList(uploadList.filter((_, i) => i !== idx));
  };

  const handleStartLearn = () => {
    setIsStartingLearn(true);
    setTimeout(() => {
      setIsStartingLearn(false);
    }, 2000);
  };

  const nextCard = () => {
    setActiveCardIdx((prev) => (prev + 1) % mockCards.length);
  };

  return (
    <div className="min-h-screen bg-[#EEECF6] relative text-[#1E1B29] font-sans overflow-x-hidden light">

      {/* Decorative Blur Orbs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-violet-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-96 right-[10%] w-96 h-96 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

      {/* 1. Normal Flat Header (Solid White, Thin Capsule layout - Features, Demo, FAQ only) */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 select-none">
        <div className="bg-white border border-[#1E1B29]/10 px-6 sm:px-8 py-2.5 rounded-full flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-1.5 text-[#1E1B29]">
            <Pencil className="w-4 h-4 text-[#7C3AED]" />
            <span className="font-extrabold text-lg font-display tracking-tight text-[#1E1B29] lowercase">aora ai</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-[#1E1B29]/75 hover:text-brand-primary transition-colors">Features</a>
            <a href="#demo" className="text-sm font-semibold text-[#1E1B29]/75 hover:text-brand-primary transition-colors">Interactive Demo</a>
            <a href="#faq" className="text-sm font-semibold text-[#1E1B29]/75 hover:text-brand-primary transition-colors">FAQ</a>
          </nav>
          <div>
            <Link href="/signup">
              <Button className="bg-[#D6C7FF] hover:bg-[#C4B5FD] text-[#1E1B29] border border-[#1E1B29]/10 font-bold h-8 px-5 rounded-full text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Scroll-Triggered Sticky Header (Solid White, Thin Capsule layout - Features, Demo, FAQ only) */}
      <AnimatePresence>
        {showStickyHeader && (
          <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-6 left-4 right-4 z-50 max-w-6xl mx-auto"
          >
            <div className="bg-white border border-[#1E1B29]/10 px-6 sm:px-8 py-2.5 rounded-full flex items-center justify-between shadow-md">
              <div className="flex items-center gap-1.5 text-[#1E1B29]">
                <Pencil className="w-4 h-4 text-[#7C3AED]" />
                <span className="font-extrabold text-lg font-display tracking-tight text-[#1E1B29] lowercase">aora ai</span>
              </div>
              <nav className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-semibold text-[#1E1B29]/75 hover:text-brand-primary transition-colors">Features</a>
                <a href="#demo" className="text-sm font-semibold text-[#1E1B29]/75 hover:text-brand-primary transition-colors">Interactive Demo</a>
                <a href="#faq" className="text-sm font-semibold text-[#1E1B29]/75 hover:text-brand-primary transition-colors">FAQ</a>
              </nav>
              <div>
                <Link href="/signup">
                  <Button className="bg-[#D6C7FF] hover:bg-[#C4B5FD] text-[#1E1B29] border border-[#1E1B29]/10 font-bold h-8 px-5 rounded-full text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* 3. Hero Section (Aligned identically to image) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-24 pb-16 md:pb-28 lg:pb-36 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
        <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] font-extrabold tracking-tight leading-[1.05] text-[#1E1B29] font-display">
            The fastest <br className="hidden sm:inline" />way to learn <br className="hidden sm:inline" />anything.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#1E1B29]/60 max-w-xl font-normal leading-relaxed">
            Turn your study materials into interactive activities that make learning fun.
          </p>
          <div className="pt-2">
            <Link href="/signup">
              <Button className="bg-[#D6C7FF] hover:bg-[#C4B5FD] text-[#1E1B29] border border-[#1E1B29]/10 font-bold h-14 px-10 rounded-2xl text-base shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                <span>Start for free</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Browser Mockup Spaced Repetition Card (Right of Hero) */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="w-full max-w-[480px] bg-white border border-[#1E1B29]/10 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden"
          >
            {/* Mock Window Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1E1B29]/10">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Custom Spaced Repetition Progress Bar */}
            <div className="w-full bg-[#EAE6F4] h-2 rounded-full mb-6 overflow-hidden">
              <div
                className="bg-[#D6C7FF] h-full transition-all duration-300"
                style={{ width: `${((activeCardIdx + 1) / mockCards.length) * 100}%` }}
              />
            </div>

            {/* Flashcard Frame (Centered Image & Text block) */}
            <div className="space-y-4">
              <div className={`w-full aspect-video bg-gradient-to-br ${mockCards[activeCardIdx].gradient} rounded-xl flex items-center justify-center text-5xl relative overflow-hidden border border-slate-800/25`}>
                <span className="animate-float">{mockCards[activeCardIdx].emoji}</span>
              </div>

              {/* Flashcard details */}
              <div className="text-left space-y-2">
                <h3 className="text-base font-bold text-[#1E1B29]">
                  {mockCards[activeCardIdx].title}:
                </h3>
                <p className="text-xs text-[#1E1B29]/60 leading-relaxed min-h-[50px]">
                  {mockCards[activeCardIdx].text}
                </p>
              </div>

              {/* Next trigger button */}
              <Button
                onClick={nextCard}
                className="w-full bg-[#D6C7FF] hover:bg-[#C4B5FD] text-[#1E1B29] border border-[#1E1B29]/10 font-bold h-10 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Next</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Upload Anything Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 lg:py-36 border-t border-[#1E1B29]/10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1E1B29] font-display tracking-tight">
            Aora AI makes learning <span className="text-brand-primary">simple</span>.
          </h2>
          <p className="text-base sm:text-lg text-[#1E1B29]/60">
            Ditch manual study guide compiling. Give our engine any format and unlock automated summaries, cards, and maps.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 xl:gap-16 items-center">
          {/* Text descriptions */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8 text-left">
            <div className="border-l-4 border-brand-primary pl-4 sm:pl-6 space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#1E1B29]">Upload Anything</h3>
              <p className="text-xs sm:text-sm text-[#1E1B29]/60 leading-relaxed">
                Lectures, audio notes, PDFs, YouTube link walkthroughs, or copy-paste text notes. Aora parses them effortlessly.
              </p>
            </div>

            <div className="border-l-4 border-[#1E1B29]/10 pl-4 sm:pl-6 space-y-2 hover:border-brand-primary/40 transition-colors">
              <h3 className="text-lg sm:text-xl font-bold text-[#1E1B29]">Learn the Fun Way</h3>
              <p className="text-xs sm:text-sm text-[#1E1B29]/60 leading-relaxed">
                Unlock gamified flashcard modules, structured study outline editors, multiple-choice quizzes, and professional studio AI podcasts.
              </p>
            </div>
          </div>

          {/* Upload Queue Demo Card */}
          <div className="lg:col-span-7 flex justify-center">
            <Card className="w-full max-w-[500px] p-4 sm:p-6 bg-white border border-[#1E1B29]/10 shadow-sm rounded-3xl">
              <div className="space-y-3 mb-6">
                <AnimatePresence mode="popLayout">
                  {uploadList.map((item, idx) => {
                    const iconMap = {
                      doc: <FileCode className="w-4 h-4 text-blue-500 shrink-0" />,
                      pdf: <FileText className="w-4 h-4 text-red-500 shrink-0" />,
                      youtube: <Video className="w-4 h-4 text-red-600 shrink-0" />,
                      audio: <Mic className="w-4 h-4 text-violet-500 shrink-0" />
                    };

                    return (
                      <motion.div
                        key={item.name}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 sm:p-3.5 bg-[#FAF9FD] border border-[#1E1B29]/10 rounded-xl shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {iconMap[item.type as keyof typeof iconMap]}
                          <span className="text-xs sm:text-sm font-semibold text-[#1E1B29] truncate">{item.name}</span>
                        </div>
                        <button
                          onClick={() => removeUploadItem(idx)}
                          className="w-5 h-5 rounded-full bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 flex items-center justify-center cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {uploadList.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <Upload className="w-8 h-8 text-[#1E1B29]/30 mb-2" />
                    <p className="text-sm text-[#1E1B29]/50 font-medium">All items cleared</p>
                  </motion.div>
                )}
              </div>

              <Button
                variant="primary"
                onClick={handleStartLearn}
                disabled={uploadList.length === 0 || isStartingLearn}
                className="w-full rounded-2xl h-12 text-sm font-bold flex items-center justify-center gap-2"
              >
                {isStartingLearn ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing documents...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Learn Mode</span>
                  </>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Your AI Notetaker Visual Demo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 lg:py-36 border-t border-[#1E1B29]/10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1E1B29] font-display tracking-tight">
            But wait, there's more.
          </h2>
          <p className="text-base sm:text-lg text-[#1E1B29]/60 mt-2">
            Aora fits all study models. Collaborate, customize, and synthesize with state-of-the-art tools.
          </p>
        </div>

        <div className="glass border border-[#1E1B29]/10 rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center bg-[#FAF9FD]/40">
          <div className="lg:col-span-6 space-y-4 text-left">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-[#1E1B29]">Your AI Notetaker</h3>
            <p className="text-sm sm:text-base text-[#1E1B29]/60 leading-relaxed max-w-md">
              Aora listens to your lectures, records transcripts, and compiles perfect structural notes with diagrams. Afterwards, you can review with learning activities of your choice.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 text-xs font-semibold">Lecture Records</span>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold">Diagram Generation</span>
            </div>
          </div>

          {/* SVG Laptop/Audio wave visual mockup */}
          <div className="lg:col-span-6 flex justify-center items-center relative h-64 sm:h-80 bg-white border border-[#1E1B29]/10 rounded-2xl shadow-inner overflow-hidden">
            {/* Audio Wave animation */}
            <div className="flex gap-1 items-center justify-center absolute left-6 sm:left-12 top-1/2 -translate-y-1/2 z-0">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [12, 48, 12] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  className="w-1.5 bg-brand-primary rounded-full"
                />
              ))}
            </div>

            {/* Laptop Vector */}
            <div className="absolute right-6 sm:right-12 bottom-6 sm:bottom-8 z-10 w-44 sm:w-52 h-30 sm:h-36 bg-slate-100 border-4 border-slate-700 rounded-xl flex flex-col justify-between p-2.5 sm:p-3 shadow-lg">
              <div className="flex-1 bg-white border border-slate-200 rounded-md p-1.5 overflow-hidden">
                <div className="w-1/2 h-2.5 bg-brand-primary/20 rounded-md mb-2" />
                <div className="w-full h-1 bg-[#1E1B29]/15 rounded-md mb-1" />
                <div className="w-5/6 h-1 bg-[#1E1B29]/15 rounded-md mb-1" />
                <div className="w-4/5 h-1 bg-[#1E1B29]/15 rounded-md" />
              </div>
              <div className="h-2.5 bg-slate-300 border border-slate-400 rounded-sm" />
            </div>
            {/* Microphone Vector */}
            <div className="absolute left-24 sm:left-32 bottom-6 sm:bottom-8 w-12 h-24 flex flex-col items-center">
              <div className="w-6 h-10 bg-slate-600 rounded-full border border-slate-500 flex items-center justify-center">
                <div className="w-4 h-6 border-b-2 border-slate-400 rounded-b-md" />
              </div>
              <div className="w-1.5 h-6 bg-slate-500" />
              <div className="w-10 h-2 bg-slate-600 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions (FAQ) Accordion */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 border-t border-[#1E1B29]/10">
        <h2 className="text-3xl font-extrabold text-[#1E1B29] font-display text-center mb-10 sm:mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="border border-[#1E1B29]/10 bg-white rounded-2xl overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center p-5 sm:p-6 text-left font-bold text-[#1E1B29] hover:bg-brand-muted/40 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base md:text-lg pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#1E1B29]/40 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-[#1E1B29]/60 leading-relaxed border-t border-[#1E1B29]/10 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CTA Section (Styled exactly as Image 1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 lg:pb-36">
        <Card className="bg-white border border-[#1E1B29]/10 p-6 sm:p-12 md:p-16 lg:p-20 text-center rounded-3xl relative overflow-hidden shadow-sm">
          <div className="relative z-10 space-y-6 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display leading-tight text-[#1E1B29]">
              Start learning <span className="px-2 py-0.5 rounded bg-[#FEF08A] text-[#1E1B29] font-extrabold shadow-sm">3x faster</span> today
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#1E1B29]/60 max-w-md mx-auto font-medium">
              Start study sessions with Aora AI to organize and accelerate your learning workflow.
            </p>
            <div className="pt-2">
              <Link href="/signup">
                <Button
                  className="bg-[#D6C7FF] hover:bg-[#C4B5FD] text-[#1E1B29] border border-[#1E1B29]/10 font-bold h-11 px-8 rounded-xl flex items-center gap-2 mx-auto transition-all shadow-sm cursor-pointer"
                >
                  <span>Start for free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E1B29]/10 py-12 sm:py-16 bg-white text-center text-sm text-[#1E1B29]/50 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-primary rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[#1E1B29] font-display">Aora AI</span>
          </div>
          <p className="font-semibold text-[#1E1B29]/60 italic">Study less. Learn more.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs font-semibold text-[#1E1B29]/40">
            <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
            <a href="#demo" className="hover:text-brand-primary transition-colors">Interactive Demo</a>
            <a href="#faq" className="hover:text-brand-primary transition-colors">FAQ</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
