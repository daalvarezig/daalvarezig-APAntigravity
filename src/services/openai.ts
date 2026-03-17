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

import { executeGogCommand } from './gog';

const GOG_TOOL: any = {
  type: "function",
  function: {
    name: "gog",
    description: "Execute a Google Workspace CLI command (gog) for Gmail/Calendar/Drive/Sheets/Docs. Eg. to search gmail pass args: ['gmail', 'search', 'newer_than:7d', '--max', '10']. DO NOT include 'gog' in the array.",
    parameters: {
      type: "object",
      properties: {
        args: {
          type: "array",
          items: { type: "string" },
          description: "The command arguments to pass to the gog executable."
        }
      },
      required: ["args"]
    }
  }
};

export const generateChatResponse = async (
  systemPrompt: string, 
  messages: {role: 'user'|'assistant'|'system'|'tool', content: string, tool_calls?: any, tool_call_id?: string}[]
): Promise<string> => {
  try {
    const apiMessages: any[] = [{ role: 'system', content: systemPrompt }, ...messages];
    
    // First try mapping everything as sent. Let's make sure role matching is right.
    const response = await openai.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      messages: apiMessages,
      tools: [GOG_TOOL],
      tool_choice: "auto",
    });

    const completionMessage = response.choices[0]?.message;

    // Check if the AI wants to use the tool
    if (completionMessage?.tool_calls && completionMessage.tool_calls.length > 0) {
      // It wants to use a tool! Let's append its message
      apiMessages.push(completionMessage);

      for (const rawToolCall of completionMessage.tool_calls) {
        const toolCall: any = rawToolCall;
        if (toolCall.function.name === 'gog') {
          let args: string[] = [];
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            args = parsed.args || [];
          } catch (e) {
            logger.error('Failed to parse tool arguments', e);
          }

          // Execute the tool
          const resultText = await executeGogCommand(args);
          
          // Append the result to the conversation
          apiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultText.substring(0, 3000) // limit output size to save tokens
          });
        }
      }

      // Ask OpenAI again with the tool results
      const finalResponse = await openai.chat.completions.create({
        model: env.OPENAI_CHAT_MODEL,
        messages: apiMessages,
      });

      return finalResponse.choices[0]?.message?.content || '';
    }

    return completionMessage?.content || '';
  } catch (error) {
    logger.error('Error generating chat response', error);
    throw error;
  }
};
