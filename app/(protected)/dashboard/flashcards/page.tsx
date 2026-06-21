"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { Flashcard } from "@/features/study/components/flashcard";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  getFlashcards, 
  generateFlashcardsAction, 
  reviewFlashcardAction, 
  deleteFlashcardAction, 
  createFlashcardAction 
} from "@/lib/actions/flashcards";
import { 
  BrainCircuit, 
  Sparkles, 
  Plus, 
  Trash2, 
  Layers, 
  BookOpen, 
  RotateCcw, 
  CheckCircle,
  Calendar,
  Flame,
  Award,
  Search,
  BookOpenCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface FlashcardType {
  id: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  nextReviewDate: Date | string;
  createdAt: Date | string;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<FlashcardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Custom card form state
  const [customFront, setCustomFront] = useState("");
  const [customBack, setCustomBack] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Study Mode State
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [studySessionCompleted, setStudySessionCompleted] = useState(false);
  const [studyStats, setStudyStats] = useState({ again: 0, good: 0, easy: 0 });

  // Navigation Filter
  const [activeTab, setActiveTab] = useState<"all" | "due" | "mastered">("all");

  const [isPending, startTransition] = useTransition();

  // Load cards from DB on mount
  const loadCards = async () => {
    try {
      const dbCards = await getFlashcards();
      // Ensure typescript compatibility for dates
      const formatted = dbCards.map(c => ({
        ...c,
        nextReviewDate: new Date(c.nextReviewDate),
        createdAt: new Date(c.createdAt),
      })) as FlashcardType[];
      setCards(formatted);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  // Check if a card is due for review
  const isCardDue = (card: FlashcardType) => {
    return new Date(card.nextReviewDate) <= new Date() || card.interval === 0;
  };

  // Check if a card is mastered
  const isCardMastered = (card: FlashcardType) => {
    return card.interval >= 7;
  };

  // Filter & Search cards
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // 1. Tab filter
      if (activeTab === "due" && !isCardDue(card)) return false;
      if (activeTab === "mastered" && !isCardMastered(card)) return false;

      // 2. Search filter
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        return (
          card.front.toLowerCase().includes(query) ||
          card.back.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [cards, activeTab, searchTerm]);

  // AI flashcard generator handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    try {
      const newCards = await generateFlashcardsAction(topic.trim());
      // format and merge new cards
      const formatted = newCards.map(c => ({
        ...c,
        nextReviewDate: new Date(c.nextReviewDate),
        createdAt: new Date(c.createdAt),
      })) as FlashcardType[];
      
      setCards(prev => [...formatted, ...prev]);
      setTopic("");
    } catch (err) {
      console.error("Failed to generate flashcards:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Custom flashcard creation handler
  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFront.trim() || !customBack.trim()) return;

    setIsAdding(true);
    try {
      const newCard = await createFlashcardAction(customFront.trim(), customBack.trim());
      const formatted = {
        ...newCard,
        nextReviewDate: new Date(newCard.nextReviewDate),
        createdAt: new Date(newCard.createdAt),
      } as FlashcardType;
      
      setCards(prev => [...prev, formatted]);
      setCustomFront("");
      setCustomBack("");
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Failed to add custom card:", err);
    } finally {
      setIsAdding(false);
    }
  };

  // Delete card handler
  const handleDeleteCard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent flipping the card if in a flip layout
    try {
      await deleteFlashcardAction(id);
      setCards(prev => prev.filter(c => c.id !== id));
      // Adjust index if in study mode
      if (studyMode) {
        if (currentIndex >= cards.length - 1 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    } catch (err) {
      console.error("Failed to delete card:", err);
    }
  };

  // Review (Again, Good, Easy) card handler
  const handleReview = (id: string, grade: "again" | "good" | "easy") => {
    // Record stat
    setStudyStats(prev => ({
      ...prev,
      [grade]: prev[grade] + 1
    }));

    startTransition(async () => {
      await reviewFlashcardAction(id, grade);
      
      // Update local state card variables so stats reflect instantly without full refresh
      setCards(prev => prev.map(c => {
        if (c.id === id) {
          let interval = c.interval;
          let easeFactor = c.easeFactor;
          if (grade === "again") {
            interval = 0;
            easeFactor = Math.max(130, easeFactor - 20);
          } else if (grade === "good") {
            interval = interval === 0 ? 1 : interval === 1 ? 3 : Math.round(interval * (easeFactor / 100));
          } else if (grade === "easy") {
            interval = interval === 0 ? 3 : interval === 1 ? 5 : Math.round(interval * (easeFactor / 100) * 1.5);
            easeFactor = Math.min(300, easeFactor + 15);
          }
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + (interval === 0 ? 1 : interval));
          return { ...c, interval, easeFactor, nextReviewDate: nextDate };
        }
        return c;
      }));

      // Next card logic
      setCardFlipped(false);
      setTimeout(() => {
        if (currentIndex < filteredCards.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setStudySessionCompleted(true);
        }
      }, 200);
    });
  };

  // Toggle study mode
  const startStudying = () => {
    if (filteredCards.length === 0) return;
    setStudyMode(true);
    setCurrentIndex(0);
    setCardFlipped(false);
    setStudySessionCompleted(false);
    setStudyStats({ again: 0, good: 0, easy: 0 });
  };

  // Spaced Repetition Stats
  const stats = useMemo(() => {
    const due = cards.filter(isCardDue).length;
    const mastered = cards.filter(isCardMastered).length;
    return { total: cards.length, due, mastered };
  }, [cards]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading your flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="flex flex-col gap-6 pb-12">
        
        {/* Header */}
        {!studyMode && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">Flashcards</h1>
              <p className="text-muted-foreground text-sm">
                Master any topic through structured spaced repetition active recall.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Custom Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateCustom}>
                    <DialogHeader>
                      <DialogTitle>Create Custom Flashcard</DialogTitle>
                      <DialogDescription>
                        Manually add a card to your study deck.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="front">Front (Question or Term)</Label>
                        <Input
                          id="front"
                          placeholder="e.g. What is the Big O complexity of QuickSort in the worst case?"
                          value={customFront}
                          onChange={(e) => setCustomFront(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="back">Back (Answer or Explanation)</Label>
                        <Input
                          id="back"
                          placeholder="e.g. O(n^2), which happens when the pivot chosen is always the smallest or largest element."
                          value={customBack}
                          onChange={(e) => setCustomBack(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isAdding}>
                        {isAdding ? "Adding..." : "Add Flashcard"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {filteredCards.length > 0 && (
                <Button onClick={startStudying} className="flex items-center gap-2 bg-primary">
                  <BrainCircuit className="h-4 w-4" /> Study Now ({filteredCards.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STUDY MODE LAYOUT */}
        {studyMode && (
          <SlideUp>
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-lg">Study Session</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStudyMode(false)}>
                  Exit Study Mode
                </Button>
              </div>

              {!studySessionCompleted ? (
                <div className="space-y-6">
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Card {currentIndex + 1} of {filteredCards.length}</span>
                      <span>{Math.round(((currentIndex) / filteredCards.length) * 100)}% complete</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* The Flipped Flashcard */}
                  <div className="py-4">
                    <Flashcard 
                      front={filteredCards[currentIndex].front} 
                      back={filteredCards[currentIndex].back} 
                      flipped={cardFlipped}
                      onFlip={setCardFlipped}
                    />
                  </div>

                  {/* Instructions / Controls */}
                  <div className="text-center">
                    {!cardFlipped ? (
                      <p className="text-xs text-muted-foreground animate-pulse">
                        Click card to flip and reveal the answer
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">How well did you recall this card?</p>
                        <div className="grid grid-cols-3 gap-3">
                          <Button 
                            variant="outline" 
                            className="border-destructive/30 hover:bg-destructive/10 text-destructive flex flex-col h-14"
                            onClick={() => handleReview(filteredCards[currentIndex].id, "again")}
                          >
                            <span className="font-semibold">Again</span>
                            <span className="text-[10px] opacity-80">Soon</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 flex flex-col h-14"
                            onClick={() => handleReview(filteredCards[currentIndex].id, "good")}
                          >
                            <span className="font-semibold">Good</span>
                            <span className="text-[10px] opacity-80">Got it</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-green-500/30 hover:bg-green-500/10 text-green-600 dark:text-green-500 flex flex-col h-14"
                            onClick={() => handleReview(filteredCards[currentIndex].id, "easy")}
                          >
                            <span className="font-semibold">Easy</span>
                            <span className="text-[10px] opacity-80">Mastered</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* STUDY COMPLETED SCREEN */
                <FadeIn>
                  <Card className="border-2 border-primary/20 bg-primary/5 text-center p-8 space-y-6">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="h-10 w-10 animate-bounce" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-bold">Session Completed!</CardTitle>
                      <CardDescription className="text-base">
                        Great job exercising your brain today! Spaced repetition updates successfully applied.
                      </CardDescription>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-y py-4 my-2">
                      <div>
                        <div className="text-2xl font-bold text-destructive">{studyStats.again}</div>
                        <div className="text-xs text-muted-foreground">Reviewed Again</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{studyStats.good}</div>
                        <div className="text-xs text-muted-foreground">Good Recall</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-500">{studyStats.easy}</div>
                        <div className="text-xs text-muted-foreground">Easy / Mastered</div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={() => setStudyMode(false)}>
                        Return to Deck
                      </Button>
                      <Button onClick={startStudying} className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" /> Study Again
                      </Button>
                    </div>
                  </Card>
                </FadeIn>
              )}
            </div>
          </SlideUp>
        )}

        {/* REGULAR DASHBOARD VIEW */}
        {!studyMode && (
          <div className="grid gap-6 lg:grid-cols-4">
            
            {/* Sidebar controls (Generate and stats) */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Generate Input Card */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    AI Flashcard Generator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Type a topic to generate active-recall cards instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="topic" className="text-xs font-semibold text-muted-foreground">Topic</Label>
                      <Input
                        id="topic"
                        placeholder="e.g. React hooks, photosynthesis"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={generating}
                        className="text-sm"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={generating} className="w-full text-xs">
                      {generating ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Generating...
                        </>
                      ) : (
                        "Generate Cards"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Stats overview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Deck Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Total Cards</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Review Due</span>
                    <span className={`font-semibold ${stats.due > 0 ? "text-primary" : "text-muted-foreground"}`}>{stats.due}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> Mastered</span>
                    <span className="font-semibold text-green-600 dark:text-green-500">{stats.mastered}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              {cards.length === 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">Suggested Topics:</span>
                  <div className="flex flex-wrap gap-2">
                    {["React Hooks", "Quantum Computing", "French Vocabulary", "Photosynthesis", "Photosynthesis Formulas"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTopic(t)}
                        className="text-xs px-2.5 py-1 bg-muted/60 hover:bg-muted border rounded-full text-muted-foreground transition-colors"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Flashcard list grid */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Filters and search */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-muted/20 p-2.5 rounded-xl border">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-background rounded-lg border p-1 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeTab === "all" ? "bg-primary text-primary-foreground shadow-sm" : "hover:text-foreground text-muted-foreground"
                    }`}
                  >
                    All Cards ({cards.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("due")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeTab === "due" ? "bg-primary text-primary-foreground shadow-sm" : "hover:text-foreground text-muted-foreground"
                    }`}
                  >
                    Due ({stats.due})
                  </button>
                  <button
                    onClick={() => setActiveTab("mastered")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeTab === "mastered" ? "bg-primary text-primary-foreground shadow-sm" : "hover:text-foreground text-muted-foreground"
                    }`}
                  >
                    Mastered ({stats.mastered})
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-xs h-9 bg-background"
                  />
                </div>
              </div>

              {/* Cards Grid */}
              {filteredCards.length === 0 ? (
                <EmptyState
                  icon={BrainCircuit}
                  title={
                    searchTerm 
                      ? "No cards match your search" 
                      : activeTab === "due" 
                      ? "All caught up!" 
                      : activeTab === "mastered"
                      ? "No mastered cards yet"
                      : "No flashcards generated yet"
                  }
                  description={
                    searchTerm
                      ? "Try searching for a different term or clear the search query."
                      : activeTab === "due"
                      ? "There are no due cards in your study deck. Great job keeping up!"
                      : activeTab === "mastered"
                      ? "Keep studying cards to increase their recall intervals and master them."
                      : "Type a topic in the AI Generator on the left to start building your study deck."
                  }
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredCards.map((card, idx) => (
                    <SlideUp key={card.id || idx} delay={0.05 * Math.min(idx, 6)}>
                      <div className="relative group">
                        
                        {/* Delete action overlay */}
                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 shadow-md"
                            onClick={(e) => handleDeleteCard(card.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Spaced Repetition Indicator */}
                        <div className="absolute bottom-3 left-3 z-10 flex gap-1.5 items-center bg-background/85 backdrop-blur-sm px-2 py-0.5 rounded-full border text-[10px] text-muted-foreground font-medium shadow-sm">
                          {isCardMastered(card) ? (
                            <span className="text-green-600 dark:text-green-500 font-semibold flex items-center gap-0.5"><Award className="h-3 w-3" /> Mastered</span>
                          ) : isCardDue(card) ? (
                            <span className="text-primary font-semibold flex items-center gap-0.5"><AlertCircle className="h-3 w-3" /> Due Review</span>
                          ) : (
                            <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> Interval: {card.interval}d</span>
                          )}
                        </div>

                        <Flashcard front={card.front} back={card.back} />
                      </div>
                    </SlideUp>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </FadeIn>
  );
}
