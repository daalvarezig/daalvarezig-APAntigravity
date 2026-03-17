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
  googleSheetsGetSpreadsheet,
  googleGmailListMessages,
  googleDriveListFiles,
  googleDriveSearchFiles
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
  },
  {
    type: "function",
    function: {
      name: "google_gmail_list_messages",
      description: "Search or list recent emails from Gmail.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Gmail search query (e.g. 'from:boss', 'is:unread')." },
          maxResults: { type: "number", description: "Max results to return. Default 5." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "google_drive_list_files",
      description: "List files and folders in Google Drive.",
      parameters: {
        type: "object",
        properties: {
          folderId: { type: "string", description: "Optional folder ID to list contents of." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "google_drive_search_files",
      description: "Search for files in Google Drive by name.",
      parameters: {
        type: "object",
        properties: {
          fileName: { type: "string", description: "Part of the file name to search for." }
        },
        required: ["fileName"]
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
    
    logger.info(`Sending request to OpenAI with ${GOOGLE_TOOLS.length} tools...`);
    const response = await openai.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      messages: apiMessages,
      tools: GOOGLE_TOOLS,
      tool_choice: "auto",
    });

    const completionMessage = response.choices[0]?.message;
    logger.info(`OpenAI response role: ${completionMessage?.role}, content: ${completionMessage?.content?.substring(0, 100)}...`);
    
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

        logger.info(`AI requested tool call: ${name} with args: ${JSON.stringify(args)}`);
        let resultText = '';

        if (name === 'google_calendar_list_events') {
          resultText = await googleCalendarListEvents(args.timeMin, args.timeMax);
        } else if (name === 'google_calendar_create_event') {
          resultText = await googleCalendarCreateEvent(args.summary, args.description, args.startTime, args.endTime);
        } else if (name === 'google_docs_get_document') {
          resultText = await googleDocsGetDocument(args.documentId);
        } else if (name === 'google_sheets_get_spreadsheet') {
          resultText = await googleSheetsGetSpreadsheet(args.spreadsheetId, args.range);
        } else if (name === 'google_gmail_list_messages') {
          resultText = await googleGmailListMessages(args.query, args.maxResults);
        } else if (name === 'google_drive_list_files') {
          resultText = await googleDriveListFiles(args.folderId);
        } else if (name === 'google_drive_search_files') {
          resultText = await googleDriveSearchFiles(args.fileName);
        }

        logger.info(`Tool ${name} result: ${resultText.substring(0, 100)}...`);

        apiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultText.substring(0, 3000) 
        });
      }

      logger.info('Re-sending conversation to OpenAI with tool results...');
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
