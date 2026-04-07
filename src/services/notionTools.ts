import { logger } from '../utils/logger';

const TASKS_DB = '2c013215d8274015b39a184debe778ba';
const PROJECTS_DB = '16f98a53858d45d39d86ae8d6ace5244';

const notionFetch = async (endpoint: string, body: object): Promise<any> => {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN not set');
  const res = await fetch(`https://api.notion.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res.json();
};

export const getPendingTasks = async (): Promise<string> => {
  try {
    const data = await notionFetch('databases/' + TASKS_DB + '/query', {
      filter: { property: 'Estado', select: { does_not_equal: 'Hecha' } },
      page_size: 10
    });
    if (!data.results || data.results.length === 0) return 'Sin tareas pendientes.';
    return data.results.map((page: any) => {
      const p = page.properties;
      const title = p.Tarea?.title?.[0]?.plain_text || 'Sin titulo';
      const proyecto = p.Proyecto?.select?.name || '';
      const prioridad = p.Prioridad?.select?.name || '';
      const estado = (p.Estado?.select?.name || p.Estado?.status?.name || '');
      const emoji = estado === 'En progreso' ? '🔄' : estado === 'Bloqueada' ? '🚫' : '⏳';
      return emoji + ' ' + title + (proyecto ? ' — ' + proyecto : '') + (prioridad ? ' · ' + prioridad : '');
    }).join('\n');
  } catch (e: any) {
    logger.error('Notion tasks error', e);
    return 'Error: ' + e.message;
  }
};

export const getActiveProjects = async (): Promise<string> => {
  try {
    const data = await notionFetch('databases/' + PROJECTS_DB + '/query', {
      page_size: 15
    });
    
    if (!data.results || data.results.length === 0) return 'Sin proyectos encontrados en Notion.';
    
    return data.results
      .map((page: any) => {
        const p = page.properties;
        const name = p.Nombre?.title?.[0]?.plain_text || '?';
        const estado = (p.Estado?.select?.name || p.Estado?.status?.name || '');
        
        if (estado === 'Activo' || estado === 'En construcción' || estado === 'En construccion') {
          return (estado === 'Activo' ? '🟢' : '🔨') + ' ' + name;
        }
        return null;
      })
      .filter((x: string | null): x is string => x !== null)
      .join('\n') || 'Sin proyectos activos (filtrados).';
    
  } catch (e: any) {
    logger.error('Notion projects error', e);
    return 'Error: ' + e.message;
  }
};

export const createTask = async (title: string, project?: string, priority?: string): Promise<string> => {
  const token = process.env.NOTION_TOKEN;
  if (!token) return 'Error: NOTION_TOKEN not set';
  const TASKS_DB = '2c013215d8274015b39a184debe778ba';
  const projectMap: Record<string, string> = {
    vaperia: 'VaperIA', itopy: 'itopy.ai', beautia: 'BeautIA',
    hair: 'hAIr', trasteando: 'Trasteando.cloud', itopyzone: 'itopyzone.com', general: 'General',
  };
  const priorityMap: Record<string, string> = { urgente: 'Urgente', alta: 'Alta', media: 'Media', baja: 'Baja' };
  const notionProject = project ? (projectMap[project.toLowerCase()] || 'General') : 'General';
  const notionPriority = priority ? (priorityMap[priority.toLowerCase()] || 'Media') : 'Media';
  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: TASKS_DB },
        properties: {
          'Tarea': { title: [{ text: { content: title } }] },
          'Estado': { select: { name: 'Por hacer' } },
          'Prioridad': { select: { name: notionPriority } },
          'Proyecto': { select: { name: notionProject } },
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json() as any;
      return `❌ Error Notion: ${err.message || res.status}`;
    }
    return `✅ Tarea creada: "${title}"\n📁 ${notionProject} · ⚡ ${notionPriority}`;
  } catch (error: any) {
    return `❌ Error: ${error.message}`;
  }
};
