import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { transcribeAudio } from './openai';
import { logger } from '../utils/logger';

export const processTelegramAudio = async (fileUrl: string | URL): Promise<string> => {
  const tempFilePath = path.join(os.tmpdir(), `audio_${Date.now()}.ogg`);
  
  try {
    const urlStr = fileUrl.toString();
    const response = await axios({
      method: 'get',
      url: urlStr,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(tempFilePath);
    
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error: Error | null = null;
      writer.on('error', (err: any) => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) resolve(true);
      });
    });

    const text = await transcribeAudio(tempFilePath);
    return text;
  } catch (error) {
    logger.error('Error processing audio file:', error);
    throw error;
  } finally {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        logger.error('Failed to cleanup temp audio file', e);
      }
    }
  }
};
