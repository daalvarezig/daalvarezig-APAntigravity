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

import { 
  googleCalendarListEvents, 
  googleCalendarCreateEvent, 
  googleDocsGetDocument, 
  googleSheetsGetSpreadsheet 
} from './googleTools';

const GOOGLE_TOOLS: any[] = [
  {
    type: "function",
    function: {
      name: "google_calendar_list_events",
      description: "List upcoming events from Google Calendar.",
      parameters: {
        type: "object",
        properties: {
          timeMin: { type: "string", description: "ISO date string for start time. Defaults to now." },
          timeMax: { type: "string", description: "ISO date string for end time." },
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "google_calendar_create_event",
      description: "Create a new event in Google Calendar.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Event title." },
          description: { type: "string", description: "Event description." },
          startTime: { type: "string", description: "ISO Start Time." },
          endTime: { type: "string", description: "ISO End Time." },
        },
        required: ["summary", "description", "startTime", "endTime"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "google_docs_get_document",
      description: "Get the content of a Google Doc using its document ID.",
      parameters: {
        type: "object",
        properties: {
          documentId: { type: "string", description: "The ID of the document." }
        },
        required: ["documentId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "google_sheets_get_spreadsheet",
      description: "Get the content of a Google Sheet using its spreadsheet ID and range.",
      parameters: {
        type: "object",
        properties: {
          spreadsheetId: { type: "string", description: "The ID of the spreadsheet." },
          range: { type: "string", description: "The range to read, e.g. Sheet1!A1:D10." }
        },
        required: ["spreadsheetId", "range"]
      }
    }
  }
];

export const generateChatResponse = async (
  systemPrompt: string, 
  messages: {role: 'user'|'assistant'|'system'|'tool', content: string, tool_calls?: any, tool_call_id?: string}[]
): Promise<string> => {
  try {
    const apiMessages: any[] = [{ role: 'system', content: systemPrompt }, ...messages];
    
    const response = await openai.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      messages: apiMessages,
      tools: GOOGLE_TOOLS,
      tool_choice: "auto",
    });

    const completionMessage = response.choices[0]?.message;

    if (completionMessage?.tool_calls && completionMessage.tool_calls.length > 0) {
      apiMessages.push(completionMessage);

      for (const rawToolCall of completionMessage.tool_calls) {
        const toolCall: any = rawToolCall;
        const name = toolCall.function.name;
        let args: any = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          logger.error('Failed to parse tool arguments', e);
        }

        let resultText = '';

        if (name === 'google_calendar_list_events') {
          resultText = await googleCalendarListEvents(args.timeMin, args.timeMax);
        } else if (name === 'google_calendar_create_event') {
          resultText = await googleCalendarCreateEvent(args.summary, args.description, args.startTime, args.endTime);
        } else if (name === 'google_docs_get_document') {
          resultText = await googleDocsGetDocument(args.documentId);
        } else if (name === 'google_sheets_get_spreadsheet') {
          resultText = await googleSheetsGetSpreadsheet(args.spreadsheetId, args.range);
        }

        apiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultText.substring(0, 3000) 
        });
      }

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
