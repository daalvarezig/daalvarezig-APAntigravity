import { calendarClient, docsClient, sheetsClient } from './googleAuth';
import { logger } from '../utils/logger';

export const googleCalendarListEvents = async (timeMin?: string, timeMax?: string): Promise<string> => {
  if (!calendarClient) return 'Google Calendar API is not configured.';
  try {
    const res = await calendarClient.events.list({
      calendarId: 'primary',
      timeMin: timeMin || (new Date()).toISOString(),
      timeMax: timeMax,
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = res.data.items;
    if (!events || events.length === 0) {
      return 'No upcoming events found.';
    }
    return JSON.stringify(events.map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description
    })));
  } catch (error: any) {
    logger.error('Error listing calendar events', error);
    return `Error: ${error.message}`;
  }
};

export const googleCalendarCreateEvent = async (summary: string, description: string, startTime: string, endTime: string): Promise<string> => {
  if (!calendarClient) return 'Google Calendar API is not configured.';
  try {
    const event = {
      summary,
      description,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
    };
    const res = await calendarClient.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    return `Event created successfully: ${res.data.htmlLink}`;
  } catch (error: any) {
    logger.error('Error creating calendar event', error);
    return `Error: ${error.message}`;
  }
};

export const googleDocsGetDocument = async (documentId: string): Promise<string> => {
  if (!docsClient) return 'Google Docs API is not configured.';
  try {
    const res = await docsClient.documents.get({
      documentId: documentId,
    });
    // Extracting text from Google Docs isn't trivial but we can return the raw doc structure
    return `Document Title: ${res.data.title}\nGoogle Docs JSON Data: (Truncated) ${JSON.stringify(res.data.body).substring(0, 1000)}`;
  } catch (error: any) {
    logger.error('Error getting document', error);
    return `Error: ${error.message}`;
  }
};

export const googleSheetsGetSpreadsheet = async (spreadsheetId: string, range: string): Promise<string> => {
  if (!sheetsClient) return 'Google Sheets API is not configured.';
  try {
    const res = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });
    return JSON.stringify(res.data.values || []);
  } catch (error: any) {
    logger.error('Error getting spreadsheet', error);
    return `Error: ${error.message}`;
  }
};
