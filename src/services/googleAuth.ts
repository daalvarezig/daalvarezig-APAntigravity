import { google } from 'googleapis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

const getGoogleAuth = () => {
  const dataDir = path.resolve(process.cwd(), 'data');
  const tokenPath = path.join(dataDir, 'token.json');
  const credentialsPath = path.join(dataDir, 'credentials.json');
  const altCredentialsPath = path.join(dataDir, 'client_secret.json');

  // 1. Try OAuth2 first (User's personal account)
  if (fs.existsSync(tokenPath) && (fs.existsSync(credentialsPath) || fs.existsSync(altCredentialsPath))) {
    try {
      logger.info('OAuth2 files found. Attempting personal account authentication...');
      const credentialsFile = fs.existsSync(credentialsPath) ? credentialsPath : altCredentialsPath;
      const credentials = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
      const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      oAuth2Client.setCredentials(token);
      
      logger.info('Google OAuth2 (Personal Account) initialized successfully.');
      return oAuth2Client;
    } catch (err) {
      logger.error('Failed to initialize Google OAuth2 from files', err);
    }
  }

  // 2. Fallback to Service Account (Shared access)
  if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    logger.warn('Google Auth environment variables and OAuth2 files are missing.');
    return null;
  }

  try {
    logger.info('Using Service Account for Google authentication.');
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
    logger.error('Failed to initialize Google Service Account Auth', err);
    return null;
  }
};

export const googleAuthClient = getGoogleAuth();
export const calendarClient = googleAuthClient ? google.calendar({ version: 'v3', auth: googleAuthClient }) : null;
export const docsClient = googleAuthClient ? google.docs({ version: 'v1', auth: googleAuthClient }) : null;
export const sheetsClient = googleAuthClient ? google.sheets({ version: 'v4', auth: googleAuthClient }) : null;
export const gmailClient = googleAuthClient ? google.gmail({ version: 'v1', auth: googleAuthClient }) : null;
export const driveClient = googleAuthClient ? google.drive({ version: 'v3', auth: googleAuthClient }) : null;
