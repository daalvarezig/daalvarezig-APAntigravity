import OpenAI from 'openai';
import { env } from '../config/env';
import fs from 'fs';
import { logger } from '../utils/logger';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const transcribeAudio = async (filePath: string): Promise<string> => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: env.OPENAI_TRANSCRIPTION_MODEL,
    });
    return transcription.text;
  } catch (error) {
    logger.error('Error transcribing audio', error);
    throw error;
  }
};

export const generateChatResponse = async (systemPrompt: string, messages: {role: 'user'|'assistant'|'system', content: string}[]): Promise<string> => {
  try {
    const apiMessages: any[] = [{ role: 'system', content: systemPrompt }, ...messages];
    
    const response = await openai.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      messages: apiMessages,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error('Error generating chat response', error);
    throw error;
  }
};
