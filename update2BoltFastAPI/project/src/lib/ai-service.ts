import { Together } from 'together';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a talented expert specializing in crafting captivating short-form content 
for platforms like YouTube Shorts and TikTok. Based on the following text, write a short executive summary.
Make sure there is some pop to the opening of the summary. Be concise but get the idea of the topic.`;

export type AIModel = 'groq' | 'openai' | 'gemini';

interface AIServiceConfig {
  apiKey: string;
  model: AIModel;
}

export async function generateScript(text: string, config: AIServiceConfig): Promise<string> {
  const message = {
    role: 'user',
    content: `Create a short executive summary of:\n\n${text}`,
  };

  try {
    switch (config.model) {
      case 'groq':
        const groq = new Groq(config.apiKey);
        const groqResponse = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            message,
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.4,
          max_tokens: 1500,
        });
        return groqResponse.choices[0].message.content;

      case 'openai':
        const openai = new OpenAI(config.apiKey);
        const openaiResponse = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            message,
          ],
          model: 'gpt-3.5-turbo',
          temperature: 0.4,
          max_tokens: 1500,
        });
        return openaiResponse.choices[0].message.content;

      case 'gemini':
        // Using the same interface for consistency
        const gemini = new OpenAI(config.apiKey);
        const geminiResponse = await gemini.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            message,
          ],
          model: 'gemini-pro',
          temperature: 0.4,
          max_tokens: 1500,
        });
        return geminiResponse.choices[0].message.content;

      default:
        throw new Error('Unsupported AI model');
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your API key and try again.');
    }
    throw new Error('Failed to generate script. Please try again later.');
  }
}