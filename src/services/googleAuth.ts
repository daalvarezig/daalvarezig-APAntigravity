import { google } from 'googleapis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const getGoogleAuth = () => {
  if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    logger.warn('Google Auth environment variables are not set. Google integrations will fail.');
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: env.GOOGLE_CLIENT_EMAIL,
      key: env.GOOGLE_PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/gmail.readonly'
      ],
    });
    return auth;
  } catch (err) {
    logger.error('Failed to initialize Google Auth', err);
    return null;
  }
};

export const googleAuthClient = getGoogleAuth();
export const calendarClient = googleAuthClient ? google.calendar({ version: 'v3', auth: googleAuthClient }) : null;
export const docsClient = googleAuthClient ? google.docs({ version: 'v1', auth: googleAuthClient }) : null;
export const sheetsClient = googleAuthClient ? google.sheets({ version: 'v4', auth: googleAuthClient }) : null;
export const gmailClient = googleAuthClient ? google.gmail({ version: 'v1', auth: googleAuthClient }) : null;
