import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const gmailSearchApi = async (query: string): Promise<string> => {
  try {
    const response = await axios.post(env.N8N_WEBHOOK_URL, { query });
    return JSON.stringify(response.data, null, 2);
  } catch (error: any) {
    logger.error('Error calling n8n API', error);
    return `Error calling Gmail Search API: ${error.message}`;
  }
};
