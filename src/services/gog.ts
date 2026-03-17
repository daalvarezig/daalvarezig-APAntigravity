import { execFile } from 'child_process';
import { logger } from '../utils/logger';

export const executeGogCommand = (args: string[]): Promise<string> => {
  return new Promise((resolve) => {
    logger.info(`Executing gog tool with args: ${args.join(' ')}`);
    execFile('gog', args, {
      env: { ...process.env, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME || '/usr/src/app/data/config' },
      timeout: 30000 // 30 seconds max
    }, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error executing gog: ${stderr || error.message}`);
        resolve(`Error execution failed: ${stderr || error.message}`);
        return;
      }
      resolve(stdout || "Success (no output)");
    });
  });
};
