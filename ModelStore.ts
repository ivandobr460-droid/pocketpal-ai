import { makeAutoObservable, runInAction } from 'mobx';
import { makePersistable } from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initLlama, LlamaContext } from '@pocketpalai/llama.rn';

export interface ModelInitParams {
  device: 'gpu' | 'cpu';
  n_gpu_layers: number;
  flash_attn: boolean;
  cache_type_k: 'f16' | 'q8_0' | 'q4_0';
  cache_type_v: 'f16' | 'q8_0' | 'q4_0';
  use_mmap: boolean;
  use_mlock: boolean;
  n_ctx: number;
  n_threads: number;
}

export interface Model {
  id: string;
  name: string;
  filename: string;
  fullPath: string;
  size: number;
  isDownloaded: boolean;
  defaultInitParams?: Partial<ModelInitParams>;
}

/**
 * Default hardware initialization settings for Nubia Red Magic 10 Pro:
 * - Snapdragon 8 Elite (2 Prime + 6 Performance Oryon cores)
 * - Adreno 830 GPU via OpenCL acceleration
 * - Fast UFS 4.0 Pro zero-copy storage
 */
export const defaultModelInitParams: ModelInitParams = {
  device: 'gpu',
  n_gpu_layers: 99,
  flash_attn: true,
  cache_type_k: 'q8_0',
  cache_type_v: 'q8_0',
  use_mmap: true,
  use_mlock: false,
  n_ctx: 2048,
  n_threads: 6,
};

export class ModelStore {
  models: Model[] = [];
  activeModelId: string | null = null;
  context: LlamaContext | null = null;
  isContextLoading: boolean = false;
  contextLoadingProgress: number = 0;
  contextError: string | null = null;

  modelInitParams: ModelInitParams = { ...defaultModelInitParams };

  constructor() {
    makeAutoObservable(this);

    makePersistable(this, {
      name: 'ModelStore',
      properties: ['models', 'activeModelId', 'modelInitParams'],
      storage: AsyncStorage,
    });
  }

  get activeModel(): Model | undefined {
    return this.models.find((m) => m.id === this.activeModelId);
  }

  get isModelLoaded(): boolean {
    return this.context !== null;
  }

  setModelInitParams(params: Partial<ModelInitParams>) {
    this.modelInitParams = {
      ...this.modelInitParams,
      ...params,
    };
  }

  resetModelInitParams() {
    this.modelInitParams = { ...defaultModelInitParams };
  }

  async loadModel(model: Model): Promise<LlamaContext | null> {
    if (!model.fullPath) {
      throw new Error(`Model path not found for ${model.name}`);
    }

    if (this.context) {
      await this.releaseContext();
    }

    runInAction(() => {
      this.isContextLoading = true;
      this.contextLoadingProgress = 0;
      this.contextError = null;
      this.activeModelId = model.id;
    });

    try {
      const initParams: ModelInitParams = {
        ...defaultModelInitParams,
        ...this.modelInitParams,
        ...(model.defaultInitParams || {}),
      };

      const ctx = await initLlama({
        model: model.fullPath,
        use_mlock: initParams.use_mlock,
        use_mmap: initParams.use_mmap,
        n_ctx: initParams.n_ctx,
        n_gpu_layers: initParams.n_gpu_layers,
        flash_attn: initParams.flash_attn,
        cache_type_k: initParams.cache_type_k,
        cache_type_v: initParams.cache_type_v,
        n_threads: initParams.n_threads,
      });

      runInAction(() => {
        this.context = ctx;
        this.isContextLoading = false;
        this.contextLoadingProgress = 1;
      });

      return ctx;
    } catch (err: any) {
      runInAction(() => {
        this.context = null;
        this.isContextLoading = false;
        this.contextError = err?.message || 'Failed to initialize model context';
      });
      throw err;
    }
  }

  /**
   * Release context to free 8+ GB RAM and GPU memory when app is backgrounded or inactive
   */
  async releaseContext(): Promise<void> {
    if (!this.context) {
      return;
    }

    try {
      await this.context.release();
    } catch (err) {
      console.warn('Error releasing context:', err);
    } finally {
      runInAction(() => {
        this.context = null;
        this.isContextLoading = false;
        this.contextLoadingProgress = 0;
      });
    }
  }

  /**
   * Unload alias for releaseContext
   */
  async unload(): Promise<void> {
    await this.releaseContext();
  }
}

export const modelStore = new ModelStore();
export default modelStore;