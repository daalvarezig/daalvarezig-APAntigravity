import { calendarClient, docsClient, sheetsClient, gmailClient } from './googleAuth';
import { logger } from '../utils/logger';

export const googleCalendarListEvents = async (timeMin?: string, timeMax?: string): Promise<string> => {
  logger.info(`googleCalendarListEvents called: timeMin=${timeMin}, timeMax=${timeMax}`);
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
    const result = JSON.stringify(events.map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description
    })));
    logger.info(`googleCalendarListEvents success: found ${events.length} events`);
    return result;
  } catch (error: any) {
    logger.error('Error listing calendar events', error);
    return `Error: ${error.message}`;
  }
};

export const googleCalendarCreateEvent = async (summary: string, description: string, startTime: string, endTime: string): Promise<string> => {
  logger.info(`googleCalendarCreateEvent called: summary=${summary}`);
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
    logger.info(`googleCalendarCreateEvent success: ${res.data.htmlLink}`);
    return `Event created successfully: ${res.data.htmlLink}`;
  } catch (error: any) {
    logger.error('Error creating calendar event', error);
    return `Error: ${error.message}`;
  }
};

export const googleDocsGetDocument = async (documentId: string): Promise<string> => {
  logger.info(`googleDocsGetDocument called: id=${documentId}`);
  if (!docsClient) return 'Google Docs API is not configured.';
  try {
    const res = await docsClient.documents.get({
      documentId: documentId,
    });
    return `Document Title: ${res.data.title}\nGoogle Docs JSON Data: (Truncated) ${JSON.stringify(res.data.body).substring(0, 1000)}`;
  } catch (error: any) {
    logger.error('Error getting document', error);
    return `Error: ${error.message}`;
  }
};

export const googleSheetsGetSpreadsheet = async (spreadsheetId: string, range: string): Promise<string> => {
  logger.info(`googleSheetsGetSpreadsheet called: id=${spreadsheetId}, range=${range}`);
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

export const googleGmailListMessages = async (query?: string, maxResults: number = 5): Promise<string> => {
  logger.info(`googleGmailListMessages called: query=${query}`);
  if (!gmailClient) return 'Google Gmail API is not configured.';
  try {
    const res = await gmailClient.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults,
    });
    const messages = res.data.messages || [];
    if (messages.length === 0) return 'No messages found.';

    // Fetch details for each message
    const details = await Promise.all(messages.map(async (m) => {
      const msg = await gmailClient!.users.messages.get({ userId: 'me', id: m.id! });
      const subject = msg.data.payload?.headers?.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
      const from = msg.data.payload?.headers?.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown';
      const date = msg.data.payload?.headers?.find(h => h.name?.toLowerCase() === 'date')?.value || 'Unknown Date';
      return { id: m.id, from, subject, date, snippet: msg.data.snippet };
    }));

    return JSON.stringify(details);
  } catch (error: any) {
    logger.error('Error listing Gmail messages', error);
    return `Error: ${error.message}`;
  }
};
