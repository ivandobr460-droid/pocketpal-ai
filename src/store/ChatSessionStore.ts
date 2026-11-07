import { makeAutoObservable, runInAction } from 'mobx';
import { makePersistable } from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { modelStore } from './ModelStore';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: number;
  timings?: {
    predicted_per_second?: number;
    predicted_ms?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  system_prompt: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export const defaultSystemPrompt =
  'Ты — бортовой автономный ИИ и персональный советник владельца Nubia Red Magic 10 Pro (Snapdragon 8 Elite). Работаешь 100% офлайн на чипе Adreno 830. Стиль: краткий, ёмкий, ироничный русский язык. Отвечай строго по существу (1-3 предложения), без шаблонных фраз и воды. Обращайся на \'ты\'.';

export class ChatSessionStore {
  sessions: ChatSession[] = [];
  activeSessionId: string | null = null;
  isGenerating: boolean = false;
  currentResponse: string = '';

  constructor() {
    makeAutoObservable(this);

    makePersistable(this, {
      name: 'ChatSessionStore',
      properties: ['sessions', 'activeSessionId'],
      storage: AsyncStorage,
    });
  }

  get activeSession(): ChatSession | undefined {
    return this.sessions.find((s) => s.id === this.activeSessionId);
  }

  createSession(title?: string, systemPrompt?: string): ChatSession {
    const session: ChatSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || 'Новый чат',
      system_prompt: systemPrompt || defaultSystemPrompt,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    runInAction(() => {
      this.sessions.unshift(session);
      this.activeSessionId = session.id;
    });

    return session;
  }

  setActiveSession(id: string) {
    this.activeSessionId = id;
  }

  deleteSession(id: string) {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    if (this.activeSessionId === id) {
      this.activeSessionId = this.sessions[0]?.id || null;
    }
  }

  updateSessionSystemPrompt(sessionId: string, newPrompt: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.system_prompt = newPrompt;
      session.updatedAt = Date.now();
    }
  }

  async sendMessage(content: string): Promise<void> {
    if (!content.trim() || this.isGenerating) return;

    let session = this.activeSession;
    if (!session) {
      session = this.createSession();
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: content.trim(),
      createdAt: Date.now(),
    };

    runInAction(() => {
      session!.messages.push(userMessage);
      session!.updatedAt = Date.now();
      this.isGenerating = true;
      this.currentResponse = '';
    });

    if (!modelStore.context && modelStore.activeModel) {
      await modelStore.loadModel(modelStore.activeModel);
    }

    if (!modelStore.context) {
      runInAction(() => {
        this.isGenerating = false;
      });
      throw new Error('No active model context available');
    }

    try {
      const formattedMessages = [
        { role: 'system', content: session.system_prompt },
        ...session.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const result = await modelStore.context.completion(
        {
          messages: formattedMessages,
          n_predict: 512,
        },
        (data: { token: string }) => {
          runInAction(() => {
            this.currentResponse += data.token;
          });
        }
      );

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: result.text || this.currentResponse,
        createdAt: Date.now(),
        timings: result.timings,
      };

      runInAction(() => {
        session!.messages.push(assistantMessage);
        session!.updatedAt = Date.now();
        this.isGenerating = false;
        this.currentResponse = '';
      });
    } catch (err) {
      runInAction(() => {
        this.isGenerating = false;
        this.currentResponse = '';
      });
      throw err;
    }
  }

  stopGeneration() {
    if (this.isGenerating && modelStore.context) {
      modelStore.context.stopCompletion();
      this.isGenerating = false;
    }
  }
}

export const chatSessionStore = new ChatSessionStore();
export default chatSessionStore;