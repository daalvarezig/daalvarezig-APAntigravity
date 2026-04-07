import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export const OWNER_CHAT_ID = 68673580;

const ALLOWED_CONTAINERS = [
  'vaperia_pwa', 'vaperia_backend', 'vaperia_evolution', 'vaperia_postgres',
  'evolution-api', 'personal_ai_assistant', 'n8n-n8n-1', 'n8n-postgres-n8n-1', 'n8n-redis-n8n-1'
];

const DEPLOY_PROJECTS: Record<string, string> = {
  'VaperIA': 'cd /opt/itopy.ai/apps/VaperIA && git add . && git commit -am "Deploy from Telegram 🚀" && git push origin main',
  'n8n': 'cd /opt/itopy.ai/apps/n8n && docker compose pull && docker compose up -d',
};

export const isOwner = (chatId: number): boolean => chatId === OWNER_CHAT_ID;

export const vpsStatus = async (): Promise<string> => {
  try {
    const { stdout } = await execAsync('docker ps -a --format "{{.Names}}|{{.Status}}"');
    const lines = stdout.trim().split('\n');
    const relevant = lines.filter(l => ALLOWED_CONTAINERS.some(c => l.startsWith(c)));
    if (relevant.length === 0) return 'No containers found.';
    return relevant.map(l => {
      const [name, ...rest] = l.split('|');
      const status = rest.join('|');
      const emoji = status.toLowerCase().includes('up') ? '🟢' : '🔴';
      return `${emoji} ${name}: ${status}`;
    }).join('\n');
  } catch (error: any) {
    logger.error('vpsStatus error', error);
    return `Error: ${error.message}`;
  }
};

export const restartContainer = async (name: string): Promise<string> => {
  if (!ALLOWED_CONTAINERS.includes(name))
    return `❌ '${name}' not allowed.\n\nAllowed: ${ALLOWED_CONTAINERS.join(', ')}`;
  try {
    logger.info(`Restarting container: ${name}`);
    await execAsync(`docker restart ${name}`);
    return `✅ '${name}' restarted.`;
  } catch (error: any) {
    return `❌ Error restarting '${name}': ${error.message}`;
  }
};

export const stopContainer = async (name: string): Promise<string> => {
  if (!ALLOWED_CONTAINERS.includes(name))
    return `❌ '${name}' not allowed.`;
  if (name === 'personal_ai_assistant')
    return `❌ Cannot stop myself.`;
  try {
    logger.info(`Stopping container: ${name}`);
    await execAsync(`docker stop ${name}`);
    return `✅ '${name}' stopped.`;
  } catch (error: any) {
    return `❌ Error stopping '${name}': ${error.message}`;
  }
};

export const startContainer = async (name: string): Promise<string> => {
  if (!ALLOWED_CONTAINERS.includes(name))
    return `❌ '${name}' not allowed.`;
  try {
    logger.info(`Starting container: ${name}`);
    await execAsync(`docker start ${name}`);
    return `✅ '${name}' started.`;
  } catch (error: any) {
    return `❌ Error starting '${name}': ${error.message}`;
  }
};

export const getContainerLogs = async (name: string): Promise<string> => {
  if (!ALLOWED_CONTAINERS.includes(name))
    return `❌ '${name}' not allowed.`;
  try {
    const { stdout, stderr } = await execAsync(`docker logs ${name} --tail 20`);
    const output = (stdout + stderr).replace(/[^\x20-\x7E\n\r\t]/g, "").substring(0, 3000);
    return `📋 Last 20 lines — ${name}:\n${output}`;
  } catch (error: any) {
    return `❌ Error getting logs for '${name}': ${error.message}`;
  }
};

export const deployProject = async (project: string): Promise<string> => {
  const script = DEPLOY_PROJECTS[project];
  if (!script)
    return `❌ Project '${project}' not found.\n\nAvailable: ${Object.keys(DEPLOY_PROJECTS).join(', ')}`;
  try {
    logger.info(`Deploying project: ${project}`);
    const { stdout } = await execAsync(script, { timeout: 120000 });
    return `✅ '${project}' deployed.\n\`\`\`\n${stdout.substring(0, 1000)}\n\`\`\``;
  } catch (error: any) {
    return `❌ Error deploying '${project}': ${error.message}`;
  }
};
