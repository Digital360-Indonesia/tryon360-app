const STORAGE_KEYS = {
  GENERATION_HISTORY: 'tryon_generation_history',
  USER_PREFERENCES: 'tryon_user_preferences',
  SAVED_MODELS: 'tryon_saved_models',
  GENERATION_LOGS: 'tryon_generation_logs'
};

export const storageService = {
  // Generation History
  saveGeneration: (result) => {
    try {
      const history = storageService.getGenerationHistory();
      
      // Add timestamp if not present
      const generation = {
        ...result,
        savedAt: result.savedAt || new Date().toISOString(),
        id: result.id || `gen_${Date.now()}`
      };
      
      // Add to beginning of array and limit to 50 items
      const updatedHistory = [generation, ...history].slice(0, 50);
      
      localStorage.setItem(STORAGE_KEYS.GENERATION_HISTORY, JSON.stringify(updatedHistory));
      return true;
    } catch (error) {
      console.error('Failed to save generation:', error);
      return false;
    }
  },

  getGenerationHistory: () => {
    try {
      const history = localStorage.getItem(STORAGE_KEYS.GENERATION_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to load generation history:', error);
      return [];
    }
  },

  clearGenerationHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GENERATION_HISTORY);
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  },

  // User Preferences
  savePreferences: (preferences) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    }
  },

  getPreferences: () => {
    try {
      const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        defaultProvider: 'replicate',
        autoSave: true,
        quality: 'high'
      };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return {};
    }
  },

  // Saved Models
  saveFavoriteModel: (model) => {
    try {
      const models = storageService.getFavoriteModels();
      if (!models.find(m => m.id === model.id)) {
        models.push(model);
        localStorage.setItem(STORAGE_KEYS.SAVED_MODELS, JSON.stringify(models));
      }
      return true;
    } catch (error) {
      console.error('Failed to save model:', error);
      return false;
    }
  },

  getFavoriteModels: () => {
    try {
      const models = localStorage.getItem(STORAGE_KEYS.SAVED_MODELS);
      return models ? JSON.parse(models) : [];
    } catch (error) {
      console.error('Failed to load favorite models:', error);
      return [];
    }
  },

  removeFavoriteModel: (modelId) => {
    try {
      const models = storageService.getFavoriteModels();
      const filtered = models.filter(m => m.id !== modelId);
      localStorage.setItem(STORAGE_KEYS.SAVED_MODELS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to remove model:', error);
      return false;
    }
  },

  // Generation Logs
  saveGenerationLog: (logData) => {
    try {
      const logs = storageService.getGenerationLogs();

      // Add timestamp and ID
      const log = {
        ...logData,
        timestamp: new Date().toISOString(),
        id: logData.id || `log_${Date.now()}`
      };

      // Add to beginning and keep all logs (no limit for now)
      const updatedLogs = [log, ...logs];

      localStorage.setItem(STORAGE_KEYS.GENERATION_LOGS, JSON.stringify(updatedLogs));
      return true;
    } catch (error) {
      console.error('Failed to save generation log:', error);
      return false;
    }
  },

  getGenerationLogs: () => {
    try {
      const logs = localStorage.getItem(STORAGE_KEYS.GENERATION_LOGS);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to load generation logs:', error);
      return [];
    }
  },

  clearGenerationLogs: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GENERATION_LOGS);
      return true;
    } catch (error) {
      console.error('Failed to clear generation logs:', error);
      return false;
    }
  },

  // Storage info
  getStorageInfo: () => {
    try {
      const historySize = (localStorage.getItem(STORAGE_KEYS.GENERATION_HISTORY) || '').length;
      const prefsSize = (localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES) || '').length;
      const modelsSize = (localStorage.getItem(STORAGE_KEYS.SAVED_MODELS) || '').length;
      const logsSize = (localStorage.getItem(STORAGE_KEYS.GENERATION_LOGS) || '').length;

      return {
        totalSize: historySize + prefsSize + modelsSize + logsSize,
        historySize,
        prefsSize,
        modelsSize,
        logsSize,
        historyCount: storageService.getGenerationHistory().length,
        modelsCount: storageService.getFavoriteModels().length,
        logsCount: storageService.getGenerationLogs().length
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {};
    }
  }
};

export default storageService;