import { create } from 'zustand';
import { getApiUrl } from './api';

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  tags: string[];
  documentId?: number;
  status?: 'processing' | 'completed' | 'failed';
}

export interface Folder {
  id: string;
  name: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: string[];
}

export interface Chat {
  id: string;
  title: string;
  lastMessageAt: string;
  messages: ChatMessage[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  box: number; // For spacing repetition Leitner system (1 to 5)
}

export interface Deck {
  id: string;
  name: string;
  cardCount: number;
  lastStudied?: string;
  cards: Flashcard[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
  date: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  children: string[]; // Child node IDs
}

export interface MindMap {
  id: string;
  title: string;
  nodes: MindMapNode[];
}

export interface Podcast {
  id: string;
  title: string;
  hostA: string;
  hostB: string;
  script: Array<{ speaker: string; text: string }>;
  duration: string;
  date: string;
  audioUrl?: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  streak: number;
  plan: string;
  activityHistory?: { date: string; count: number }[];
  notionToken?: string;
  notionDatabaseId?: string;
}

interface AppState {
  // Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (userData?: Partial<UserProfile>) => void;
  logout: () => void;
  updateStreak: (streak: number) => void;
  clearData: () => void;

  // Notes
  notes: Note[];
  activeNoteId: string | null;
  addNote: (title: string, content: string, tags?: string[], docType?: string, fileUrl?: string, file?: File) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNoteId: (id: string | null) => void;

  // Chat
  chats: Chat[];
  activeChatId: string | null;
  activePersona: 'academic' | 'tutor' | 'creative';
  addChat: (title: string) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  setActiveChatId: (id: string | null) => void;
  setActivePersona: (persona: 'academic' | 'tutor' | 'creative') => void;

  // Flashcards
  decks: Deck[];
  addDeck: (name: string) => string;
  deleteDeck: (id: string) => void;
  addCard: (deckId: string, question: string, answer: string) => void;
  rateCard: (deckId: string, cardId: string, rating: 'easy' | 'medium' | 'hard') => void;

  // Quizzes
  quizzes: Quiz[];
  quizResults: QuizResult[];
  addQuiz: (quiz: Quiz) => void;
  addQuizResult: (quizId: string, quizTitle: string, score: number, total: number) => void;

  // Mind Maps
  mindMaps: MindMap[];
  activeMindMapId: string | null;
  addMindMap: (title: string) => string;
  setActiveMindMapId: (id: string | null) => void;
  addMindMapNode: (mapId: string, parentNodeId: string, label: string, x?: number, y?: number) => void;
  updateMindMapNode: (mapId: string, nodeId: string, label: string) => void;

  // Podcast
  podcasts: Podcast[];
  addPodcast: (title: string, hostA: string, hostB: string, sourceText: string) => Promise<void>;

  // Note Workspace Tab
  activeNotesTab: 'document' | 'chat' | 'quiz' | 'podcast' | 'flashcards';
  setActiveNotesTab: (tab: 'document' | 'chat' | 'quiz' | 'podcast' | 'flashcards') => void;

  // Folders
  folders: Folder[];
  addFolder: (name: string, color: string) => void;
  deleteFolder: (id: string, name: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Initialize
  initializeStore: () => void;
}

const API_URL = getApiUrl();

const getInitialAuthState = () => {
  return {
    isAuthenticated: false,
    user: null,
    notes: [],
    chats: [],
    decks: [],
    quizzes: [],
    quizResults: [],
    mindMaps: [],
    podcasts: [],
    folders: [],
    activeNoteId: null,
    activeChatId: null,
    activeMindMapId: null,
  };
};

export const useAppStore = create<AppState>((set, get) => {
  const initialAuthState = getInitialAuthState();
  return {
    ...initialAuthState,
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
    activeNotesTab: 'document',
    setActiveNotesTab: (tab) => set({ activeNotesTab: tab }),
    login: (userData) => {
      const user = {
        name: userData?.name || 'Nikhil Sharma',
        email: userData?.email || 'nikhil@example.com',
        avatarUrl: userData?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        streak: userData?.streak || 5, 
        plan: userData?.plan || 'Free Trial',
        activityHistory: userData?.activityHistory || [
          { date: '2026-06-28', count: 2 },
          { date: '2026-06-29', count: 5 },
          { date: '2026-06-30', count: 0 },
          { date: '2026-07-01', count: 3 },
          { date: '2026-07-02', count: 7 },
          { date: '2026-07-03', count: 4 },
          { date: '2026-07-04', count: 6 },
        ]
      };
      
      const userKey = `aora_data_user_${user.email}`;
      let loadedData: any = {
        notes: [],
        chats: [],
        decks: [],
        quizzes: [],
        quizResults: [],
        mindMaps: [],
        podcasts: [],
        folders: [],
        activeNoteId: null,
        activeChatId: null,
        activeMindMapId: null,
      };
 
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aora_active_user', JSON.stringify(user));
          
          // Load user's existing data
          const stored = localStorage.getItem(userKey);
          if (stored) {
            loadedData = JSON.parse(stored);
          }
          
          // Merge guest data if it exists
          const guestStored = localStorage.getItem('aora_data_guest');
          if (guestStored) {
            const guestData = JSON.parse(guestStored);
            loadedData.notes = [...(loadedData.notes || []), ...(guestData.notes || [])];
            loadedData.chats = [...(loadedData.chats || []), ...(guestData.chats || [])];
            loadedData.decks = [...(loadedData.decks || []), ...(guestData.decks || [])];
            loadedData.quizzes = [...(loadedData.quizzes || []), ...(guestData.quizzes || [])];
            loadedData.quizResults = [...(loadedData.quizResults || []), ...(guestData.quizResults || [])];
            loadedData.mindMaps = [...(loadedData.mindMaps || []), ...(guestData.mindMaps || [])];
            loadedData.podcasts = [...(loadedData.podcasts || []), ...(guestData.podcasts || [])];
            loadedData.folders = [...(loadedData.folders || []), ...(guestData.folders || [])];
            
            if (guestData.activeNoteId) loadedData.activeNoteId = guestData.activeNoteId;
            if (guestData.activeChatId) loadedData.activeChatId = guestData.activeChatId;
            if (guestData.activeMindMapId) loadedData.activeMindMapId = guestData.activeMindMapId;
            
            localStorage.removeItem('aora_data_guest');
          }
        } catch (e) {
          console.error("Failed to load user data from localStorage", e);
        }
      }
 
      set({
        isAuthenticated: true,
        user,
        notes: loadedData.notes || [],
        chats: loadedData.chats || [],
        decks: loadedData.decks || [],
        quizzes: loadedData.quizzes || [],
        quizResults: loadedData.quizResults || [],
        mindMaps: loadedData.mindMaps || [],
        podcasts: loadedData.podcasts || [],
        folders: loadedData.folders || [],
        activeNoteId: loadedData.activeNoteId || null,
        activeChatId: loadedData.activeChatId || null,
        activeMindMapId: loadedData.activeMindMapId || null,
      });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('aora_active_user');
        } catch (e) {
          console.error("Failed to remove active user from localStorage", e);
        }
      }
      set({
        isAuthenticated: false,
        user: null,
        notes: [],
        decks: [],
        chats: [],
        quizzes: [],
        quizResults: [],
        mindMaps: [],
        podcasts: [],
        folders: [],
        activeNoteId: null,
        activeChatId: null,
        activeMindMapId: null,
      });
    },
    updateStreak: (streak) => set((state) => {
      const updatedUser = state.user ? { ...state.user, streak } : null;
      if (updatedUser && typeof window !== 'undefined') {
        try {
          localStorage.setItem('aora_active_user', JSON.stringify(updatedUser));
        } catch (e) {}
      }
      return { user: updatedUser };
    }),
    clearData: () => set({ notes: [], decks: [], chats: [], quizzes: [], quizResults: [], mindMaps: [], podcasts: [], folders: [] }),
    initializeStore: () => {
      if (typeof window === 'undefined') return;
      try {
        const activeUser = localStorage.getItem('aora_active_user');
        if (activeUser) {
          const user = JSON.parse(activeUser);
          const dataKey = `aora_data_user_${user.email}`;
          const storedData = localStorage.getItem(dataKey);
          if (storedData) {
            const loadedData = JSON.parse(storedData);
            set({
              isAuthenticated: true,
              user,
              notes: loadedData.notes || [],
              chats: loadedData.chats || [],
              decks: loadedData.decks || [],
              quizzes: loadedData.quizzes || [],
              quizResults: loadedData.quizResults || [],
              mindMaps: loadedData.mindMaps || [],
              podcasts: loadedData.podcasts || [],
              folders: loadedData.folders || [],
              activeNoteId: loadedData.activeNoteId || null,
              activeChatId: loadedData.activeChatId || null,
              activeMindMapId: loadedData.activeMindMapId || null,
            });
          }
        } else {
          const guestData = localStorage.getItem('aora_data_guest');
          if (guestData) {
            const loadedData = JSON.parse(guestData);
            set({
              isAuthenticated: false,
              user: null,
              notes: loadedData.notes || [],
              chats: loadedData.chats || [],
              decks: loadedData.decks || [],
              quizzes: loadedData.quizzes || [],
              quizResults: loadedData.quizResults || [],
              mindMaps: loadedData.mindMaps || [],
              podcasts: loadedData.podcasts || [],
              folders: loadedData.folders || [],
              activeNoteId: loadedData.activeNoteId || null,
              activeChatId: loadedData.activeChatId || null,
              activeMindMapId: loadedData.activeMindMapId || null,
            });
          }
        }
      } catch (e) {
        console.error("Failed to initialize store", e);
      }
    },

    // Folders
    folders: [],
    addFolder: (name, color) => set((state) => ({
      folders: [...state.folders, { id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name, color }]
    })),
    deleteFolder: (id, name) => set((state) => ({
      folders: state.folders.filter(f => f.id !== id)
    })),

  // Notes state & logic
  notes: [],
  activeNoteId: null,
  addNote: (title, content, tags = [], docType = 'blank', fileUrl = '', file?: File) => {
    const id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNote: Note = {
      id,
      title,
      content,
      lastModified: new Date().toISOString(),
      tags,
      status: docType === 'blank' ? 'completed' : 'processing',
    };
    
    if (docType !== 'blank') {
      let body: FormData | URLSearchParams;
      let headers: HeadersInit = {};
      
      if (file) {
        const formData = new FormData();
        formData.append('name', title);
        formData.append('doc_type', docType);
        if (fileUrl) formData.append('file_url', fileUrl);
        formData.append('file', file);
        body = formData;
      } else {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams({
          name: title,
          doc_type: docType,
          file_url: fileUrl || 'https://mock-supabase.aora.ai/files/notes.pdf'
        });
      }

      fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers,
        body
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Upload failed with status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.document_id) {
          useAppStore.setState((state) => ({
            notes: state.notes.map(n => n.id === id ? { ...n, documentId: data.document_id } : n)
          }));
        } else {
          throw new Error(data.message || 'Missing document ID in response');
        }
      })
      .catch((err) => {
        console.error("Failed to upload document", err);
        useAppStore.setState((state) => ({
          notes: state.notes.map(n => n.id === id ? { ...n, status: 'failed' } : n)
        }));
      });
    }

    set((state) => ({
      notes: [newNote, ...state.notes],
      activeNoteId: id,
    }));
    return id;
  },
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((note) =>
      note.id === id
        ? { ...note, ...updates, lastModified: new Date().toISOString() }
        : note
    ),
  })),
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((note) => note.id !== id),
    activeNoteId: state.activeNoteId === id ? (state.notes.length > 1 ? state.notes[0].id : null) : state.activeNoteId,
  })),
  setActiveNoteId: (id) => set({ activeNoteId: id }),

  // AI Chat state & logic
  chats: [],
  activeChatId: null,
  activePersona: 'academic',
  addChat: (title) => {
    const id = `chat-${Date.now()}`;
    const newChat: Chat = {
      id,
      title,
      lastMessageAt: new Date().toISOString(),
      messages: [
        {
          id: `m-init-${Date.now()}`,
          sender: 'ai',
          text: `Hello! I'm Aora, your AI companion. I'm configured as a **${get().activePersona}** specialist. How can I help you learn, organize, or write today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ],
    };
    
    fetch(`${API_URL}/chat/threads?title=${encodeURIComponent(title)}&persona=${get().activePersona}`, {
      method: 'POST'
    }).catch(() => {});

    set((state) => ({
      chats: [newChat, ...state.chats],
      activeChatId: id,
    }));
    return id;
  },
  deleteChat: (id) => set((state) => ({
    chats: state.chats.filter((c) => c.id !== id),
    activeChatId: state.activeChatId === id ? (state.chats.length > 1 ? state.chats[0].id : null) : state.activeChatId,
  })),
  renameChat: (id, title) => set((state) => ({
    chats: state.chats.map((c) => c.id === id ? { ...c, title } : c),
  })),
  sendMessage: async (chatId, text) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `m-u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: timeStr,
    };
    
    set((state) => ({
      chats: state.chats.map((c) => 
        c.id === chatId ? { ...c, messages: [...c.messages, userMsg] } : c
      )
    }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout
      // Derive a stable numeric thread ID from the chatId string
      const numericThreadId = parseInt(chatId.replace(/\D/g, '').slice(-6) || '1', 10) || 1;
      let response: Response;
      try {
        response = await fetch(`${API_URL}/chat/threads/${numericThreadId}/messages?text=${encodeURIComponent(text)}`, {
          method: 'POST',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      const data = await response.json();
      
      const rawSources = data.ai_response?.sources;
      const aiMsg: ChatMessage = {
        id: `m-a-${Date.now()}`,
        sender: 'ai',
        text: data.ai_response?.text || 'Sorry, I could not generate a response.',
        timestamp: timeStr,
        sources: Array.isArray(rawSources) ? rawSources.map((s: any) => typeof s === 'string' ? s : s.text) : []
      };

      set((state) => ({
        chats: state.chats.map((c) => 
          c.id === chatId ? { ...c, lastMessageAt: new Date().toISOString(), messages: [...c.messages, aiMsg] } : c
        )
      }));
    } catch (e) {
      const getAiResponse = (persona: string, query: string): Partial<ChatMessage> => {
        if (persona === 'academic') {
          return {
            text: `Here is an academic perspective on "${query}". Synthesizing current concepts, this is closely linked to core structural principles. Let me know if you would like me to break down this logic step-by-step.`,
            sources: [],
          };
        } else if (persona === 'tutor') {
          return {
            text: `Great question about "${query}"! Let's break this down into simple steps so it's easy to master. What specific part would you like to explore first?`,
            sources: [],
          };
        } else {
          return {
            text: `Here is a clear summary of "${query}". Let's outline the core sections and key takeaways to help you study efficiently.`,
            sources: [],
          };
        }
      };

      const aiResponseDetails = getAiResponse(get().activePersona, text);
      const fallbackAiMsg: ChatMessage = {
        id: `m-a-${Date.now()}`,
        sender: 'ai',
        text: aiResponseDetails.text || '',
        timestamp: timeStr,
        sources: aiResponseDetails.sources,
      };

      set((state) => ({
        chats: state.chats.map((c) => 
          c.id === chatId ? { ...c, lastMessageAt: new Date().toISOString(), messages: [...c.messages, fallbackAiMsg] } : c
        )
      }));
    }
  },
  setActiveChatId: (id) => set({ activeChatId: id }),
  setActivePersona: (persona) => set({ activePersona: persona }),

  // Flashcards state & logic
  decks: [],
  addDeck: (name) => {
    const id = `deck-${Date.now()}`;
    const newDeck: Deck = {
      id,
      name,
      cardCount: 0,
      cards: [],
    };
    
    fetch(`${API_URL}/study/decks?name=${encodeURIComponent(name)}`, {
      method: 'POST'
    }).catch(() => {});

    set((state) => ({
      decks: [...state.decks, newDeck],
    }));
    return id;
  },
  deleteDeck: (id) => set((state) => ({
    decks: state.decks.filter((d) => d.id !== id),
  })),
  addCard: (deckId, question, answer) => set((state) => ({
    decks: state.decks.map((deck) => {
      if (deck.id === deckId) {
        const newCard: Flashcard = {
          id: `card-${Date.now()}`,
          question,
          answer,
          box: 1,
        };
        return {
          ...deck,
          cardCount: deck.cardCount + 1,
          cards: [...deck.cards, newCard],
        };
      }
      return deck;
    }),
  })),
  rateCard: (deckId, cardId, rating) => set((state) => ({
    decks: state.decks.map((deck) => {
      if (deck.id === deckId) {
        return {
          ...deck,
          lastStudied: new Date().toISOString(),
          cards: deck.cards.map((card) => {
            if (card.id === cardId) {
              let nextBox = card.box;
              if (rating === 'easy') nextBox = Math.min(5, card.box + 1);
              if (rating === 'hard') nextBox = 1;
              return { ...card, box: nextBox };
            }
            return card;
          }),
        };
      }
      return deck;
    }),
  })),

  // Quizzes state & logic
  quizzes: [],
  quizResults: [],
  addQuiz: (quiz) => set((state) => ({
    quizzes: [quiz, ...state.quizzes],
  })),
  addQuizResult: (quizId, quizTitle, score, total) => set((state) => ({
    quizResults: [
      {
        id: `qr-${Date.now()}`,
        quizId,
        quizTitle,
        score,
        total,
        date: new Date().toISOString(),
      },
      ...state.quizResults,
    ],
  })),

  // Mind Maps state & logic
  mindMaps: [],
  activeMindMapId: null,
  addMindMap: (title) => {
    const id = `map-${Date.now()}`;
    const newMap: MindMap = {
      id,
      title,
      nodes: [
        { id: 'root', label: title, x: 250, y: 150, children: [] },
      ],
    };
    
    fetch(`${API_URL}/mindmap/generate?text_content=Init&root_title=${encodeURIComponent(title)}`, {
      method: 'POST'
    }).catch(() => {});

    set((state) => ({
      mindMaps: [...state.mindMaps, newMap],
      activeMindMapId: id,
    }));
    return id;
  },
  setActiveMindMapId: (id) => set({ activeMindMapId: id }),
  addMindMapNode: (mapId, parentNodeId, label, x, y) => set((state) => ({
    mindMaps: state.mindMaps.map((map) => {
      if (map.id === mapId) {
        const parentNode = map.nodes.find((n) => n.id === parentNodeId);
        if (!parentNode) return map;
        const newId = `node-${Date.now()}`;
        const newX = x !== undefined ? x : parentNode.x + (Math.random() * 120 - 60);
        const newY = y !== undefined ? y : parentNode.y + 100;
        
        const newNode: MindMapNode = {
          id: newId,
          label,
          x: newX,
          y: newY,
          children: [],
        };
        
        return {
          ...map,
          nodes: [
            ...map.nodes.map((n) =>
              n.id === parentNodeId ? { ...n, children: [...n.children, newId] } : n
            ),
            newNode,
          ],
        };
      }
      return map;
    }),
  })),
  updateMindMapNode: (mapId, nodeId, label) => set((state) => ({
    mindMaps: state.mindMaps.map((map) => {
      if (map.id === mapId) {
        return {
          ...map,
          nodes: map.nodes.map((n) => (n.id === nodeId ? { ...n, label } : n)),
        };
      }
      return map;
    }),
  })),

  // AI Podcast Studio state & logic
  podcasts: [],
  addPodcast: async (title, hostA, hostB, sourceText) => {
    const id = `pod-${Date.now()}`;
    const sentences = sourceText.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
    const script = sentences.map((sentence, idx) => ({
      speaker: idx % 2 === 0 ? hostA : hostB,
      text: sentence.length > 80 ? sentence : `Let's dive into that: ${sentence}. It represents a key concept for this lesson.`,
    }));
    
    if (script.length === 0) {
      script.push(
        { speaker: hostA, text: `Hello and welcome. Let's cover our study material on "${title}".` },
        { speaker: hostB, text: `Indeed. This topic contains deep concepts. We should break it down segment by segment.` }
      );
    }

    try {
      const response = await fetch(`${API_URL}/podcast/generate?title=${encodeURIComponent(title)}&topic=${encodeURIComponent(sourceText)}&host_a=${encodeURIComponent(hostA)}&host_b=${encodeURIComponent(hostB)}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      const newPod: Podcast = {
        id,
        title,
        hostA,
        hostB,
        script,
        duration: `${Math.floor(script.length * 8 / 60)}:${String((script.length * 8) % 60).padStart(2, '0')}`,
        date: new Date().toISOString().split('T')[0],
        audioUrl: `https://mock-storage.aora.ai/files/podcasts/user-mock-123-pod-${data.podcast_id}.mp3`
      };

      set((state) => ({
        podcasts: [newPod, ...state.podcasts],
      }));
    } catch (e) {
      const fallbackPod: Podcast = {
        id,
        title,
        hostA,
        hostB,
        script,
        duration: `${Math.floor(script.length * 8 / 60)}:${String((script.length * 8) % 60).padStart(2, '0')}`,
        date: new Date().toISOString().split('T')[0],
      };

      set((state) => ({
        podcasts: [fallbackPod, ...state.podcasts],
      }));
    }
  }
};
});

if (typeof window !== 'undefined') {
  useAppStore.subscribe((state) => {
    try {
      const dataToSave = {
        notes: state.notes,
        chats: state.chats,
        decks: state.decks,
        quizzes: state.quizzes,
        quizResults: state.quizResults,
        mindMaps: state.mindMaps,
        podcasts: state.podcasts,
        folders: state.folders,
        activeNoteId: state.activeNoteId,
        activeChatId: state.activeChatId,
        activeMindMapId: state.activeMindMapId,
      };

      if (state.isAuthenticated && state.user?.email) {
        localStorage.setItem('aora_active_user', JSON.stringify(state.user));
        const key = `aora_data_user_${state.user.email}`;
        localStorage.setItem(key, JSON.stringify(dataToSave));
      } else {
        // Safe sync to prevent wiping out data during initial render/hydration race conditions
        localStorage.setItem('aora_data_guest', JSON.stringify(dataToSave));
      }
    } catch (e) {
      console.error("Failed to sync store state to localStorage", e);
    }
  });
}

