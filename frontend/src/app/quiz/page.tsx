'use client';

import React, { useState } from 'react';
import { useAppStore, Quiz, QuizQuestion } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  HelpCircle,
  Award,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function QuizModule() {
  const { toast } = useToast();
  const { quizzes, quizResults, addQuizResult } = useAppStore();

  // Active state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || null;
  const currentQuestion = activeQuiz?.questions[currentQuestionIdx] || null;

  const handleOptionClick = (idx: number) => {
    if (isAnswered || !currentQuestion) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const correct = idx === currentQuestion.correctAnswer;
    if (correct) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (!activeQuiz) return;
    
    setIsAnswered(false);
    setSelectedOption(null);

    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Finished quiz!
      setQuizFinished(true);
      addQuizResult(activeQuiz.id, activeQuiz.title, quizScore + (selectedOption === currentQuestion?.correctAnswer ? 1 : 0), activeQuiz.questions.length);
      
      const percentage = ((quizScore + (selectedOption === currentQuestion?.correctAnswer ? 1 : 0)) / activeQuiz.questions.length) * 100;
      if (percentage >= 80) {
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast('Outstanding! Quiz Passed with flying colors!', 'success');
      } else {
        toast('Quiz completed. Keep studying to improve!', 'info');
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left border-b border-brand-border/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground">Interactive Quizzes</h2>
          <p className="text-sm text-foreground/60">
            Validate your comprehension with automated multiple-choice tests.
          </p>
        </div>
      </div>

      {/* 2. Selection view vs Active Quiz view */}
      {!activeQuizId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          {/* Quizzes List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-display text-foreground">Available Quizzes</h3>
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  onClick={() => {
                    setActiveQuizId(quiz.id);
                    resetQuiz();
                  }}
                  className="p-5 bg-white border border-brand-border/60 hover:border-brand-primary/30 shadow-sm cursor-pointer transition-all hover:translate-y-[-2px]"
                >
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-muted text-[10px] font-bold text-brand-primary rounded-md">
                    {quiz.category}
                  </span>
                  <h4 className="text-base font-bold text-foreground mt-2">{quiz.title}</h4>
                  <p className="text-xs text-foreground/40 font-semibold mt-1">{quiz.questions.length} Questions</p>
                  
                  <CardFooter className="p-0 mt-4 border-t-0 flex justify-end">
                    <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold">
                      Start Test
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Quiz Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-display text-foreground">Recent Performance</h3>
            <Card className="p-6 bg-white border-brand-border/60 space-y-4">
              {quizResults.map((res) => {
                const pct = Math.round((res.score / res.total) * 100);
                return (
                  <div key={res.id} className="flex justify-between items-center border-b border-brand-border/40 pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1 truncate max-w-[200px]">
                      <p className="text-xs font-bold text-foreground truncate">{res.quizTitle}</p>
                      <p className="text-[10px] font-semibold text-foreground/45">
                        {new Date(res.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">{res.score} / {res.total}</p>
                      <p className={`text-[10px] font-bold ${pct >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {pct}% Score
                      </p>
                    </div>
                  </div>
                );
              })}

              {quizResults.length === 0 && (
                <p className="text-xs text-foreground/40 text-center py-8">No test attempts logged yet.</p>
              )}
            </Card>
          </div>
        </div>
      ) : activeQuiz ? (
        /* Quiz active workspace */
        <div className="space-y-6">
          <div className="flex items-center justify-between text-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveQuizId(null)}
              className="text-foreground/50 hover:text-brand-primary gap-1 h-9 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Quiz</span>
            </Button>

            <p className="text-sm font-semibold text-foreground/40">
              {activeQuiz.title} • Q{quizFinished ? activeQuiz.questions.length : currentQuestionIdx + 1} of {activeQuiz.questions.length}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {quizFinished ? (
              /* Finish Screen */
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-brand-border/60 p-8 rounded-3xl text-center shadow-md space-y-6 max-w-md mx-auto"
              >
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8" />
                </div>

                <div className="space-y-1.5 text-center">
                  <h3 className="text-xl font-bold text-foreground">Test Finished!</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">
                    You have successfully answered all multiple choice questions.
                  </p>
                  <div className="pt-4">
                    <p className="text-3xl font-black text-brand-primary leading-none">
                      {quizScore} / {activeQuiz.questions.length}
                    </p>
                    <p className="text-xs font-bold text-foreground/40 mt-1 uppercase">
                      Final Score ({Math.round((quizScore / activeQuiz.questions.length) * 100)}%)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetQuiz} className="flex-1 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    <span>Retake</span>
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setActiveQuizId(null)} className="flex-1 font-semibold">
                    Return Home
                  </Button>
                </div>
              </motion.div>
            ) : currentQuestion ? (
              /* Active Question Panel */
              <div className="space-y-6 max-w-2xl mx-auto text-left">
                {/* Progress bar */}
                <div className="w-full bg-brand-muted h-2 rounded-full overflow-hidden border border-brand-border/30">
                  <div
                    className="bg-brand-primary h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx + (isAnswered ? 1 : 0)) / activeQuiz.questions.length) * 100}%` }}
                  />
                </div>

                <Card className="p-6 bg-white border-brand-border/60 shadow-md">
                  <h3 className="text-lg font-bold text-foreground mb-6 leading-relaxed">
                    {currentQuestion.question}
                  </h3>

                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrectAnswer = idx === currentQuestion.correctAnswer;
                      
                      let optionStyles = 'bg-white hover:bg-brand-muted border-brand-border';
                      
                      if (isAnswered) {
                        if (isCorrectAnswer) {
                          optionStyles = 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm';
                        } else if (isSelected) {
                          optionStyles = 'bg-red-50 border-red-300 text-red-800 shadow-sm';
                        } else {
                          optionStyles = 'bg-white border-brand-border/40 text-foreground/40 opacity-70';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => handleOptionClick(idx)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-semibold transition-all duration-150 text-left ${optionStyles} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrectAnswer && (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {isAnswered && isSelected && !isCorrectAnswer && (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Explanation block */}
                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <Card className="p-5 bg-brand-primary/[0.03] border border-brand-primary/10 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-brand-primary" />
                          <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Concept Explanation</span>
                        </div>
                        <p className="text-xs md:text-sm text-foreground/60 leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation triggers */}
                {isAnswered && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleNext} className="flex items-center gap-1 px-6 rounded-xl h-11 font-bold">
                      <span>{currentQuestionIdx === activeQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}

    </div>
  );
}
