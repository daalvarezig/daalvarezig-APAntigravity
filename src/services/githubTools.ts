import axios from 'axios';
import { logger } from '../utils/logger';

export const listUserRepos = async (): Promise<string> => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return 'Error: GITHUB_TOKEN not set in .env';
  try {
    const res = await axios.get('https://api.github.com/user/repos?sort=updated&per_page=10', {
      headers: { 'Authorization': `token ${token}` }
    });
    return res.data.map((r: any) => `📦 ${r.name}: ${r.description || 'Sin descripción'}\nLast Update: ${r.updated_at}`).join('\n\n');
  } catch (e: any) {
    logger.error('Github error', e);
    return `Error: ${e.message}`;
  }
};

export const getRepoLatestCommit = async (repoName: string): Promise<string> => {
  const token = process.env.GITHUB_TOKEN;
  const username = 'tudominio'; // Cambia esto o haz que lo busque la IA
  if (!token) return 'Error: GITHUB_TOKEN not set';
  try {
    const res = await axios.get(`https://api.github.com/repos/daalvarezig/${repoName}/commits?per_page=1`, {
      headers: { 'Authorization': `token ${token}` }
    });
    const c = res.data[0];
    return `Último commit en ${repoName}:\n"${c.commit.message}" por ${c.commit.author.name} (${c.commit.author.date})`;
  } catch (e: any) {
    return `Error consultando commit de ${repoName}: ${e.message}`;
  }
};
