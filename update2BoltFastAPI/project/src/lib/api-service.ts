import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5050',  // Updated to FastAPI's default port
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface VideoGenerationOptions {
  theme: string;
  addSubtitles: boolean;
}

export const apiService = {
  async extractText(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/extract-text/', formData);
    return response.data.text;
  },

  async generateScript(text: string): Promise<string> {
    const response = await api.post('/generate-script/', { text });
    return response.data.script;
  },

  async generateVideo(script: string, options: VideoGenerationOptions): Promise<void> {
    // Generate speech
    await api.post('/text-to-speech/', { text: script });
    
    // Get background video
    await api.get('/background-video/', { params: { query: options.theme } });
    
    // Create video
    await api.post('/create-video/');

    if (options.addSubtitles) {
      // Generate and add subtitles
      await api.post('/generate-subtitles/');
      await api.post('/add-hard-subtitles/');
    }
  },

  async cleanup(): Promise<void> {
    await api.post('/clean-up/');
  }
};