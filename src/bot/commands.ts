import { Telegraf } from 'telegraf';
import { getOrCreateConversation } from '../db/repositories/conversation';
import { clearMessages } from '../db/repositories/message';
import { clearMemories, getMemories } from '../db/repositories/memory';
import { logger } from '../utils/logger';
import {
  isOwner, vpsStatus, restartContainer,
  stopContainer, startContainer, getContainerLogs, deployProject
} from '../services/vpsManager';
import { getPendingTasks, getActiveProjects, createTask } from '../services/notionTools';
import { googleCalendarListEvents, googleCalendarCreateEvent, googleGmailListMessages } from '../services/googleTools';

export const setupCommands = (bot: Telegraf) => {
  bot.start((ctx) => {
    ctx.reply('Hello! I am your personal AI assistant. Send me a text message or a voice note to get started.');
  });

  bot.help((ctx) => {
    ctx.reply(
      'Available commands:\n' +
      '/start - Start interacting\n' +
      '/help - Show this message\n' +
      '/status - Check bot status\n' +
      '/memory - Show extracted memories\n' +
      '/clear - Clear conversation history\n\n' +
      '🖥️ VPS Commands (owner only):\n' +
      '/vps - Show container status\n' +
      '/restart <container> - Restart a container\n' +
      '/stop <container> - Stop a container\n' +
      '/start_container <container> - Start a container\n' +
      '/logs <container> - Show last 20 log lines\n' +
      '/deploy <project> - Deploy a project'
    );
  });

  bot.command('status', (ctx) => {
    ctx.reply('Bot is running properly. Database and AI connection active.');
  });

  bot.command('memory', (ctx) => {
    try {
      const memories = getMemories(ctx.chat.id);
      if (memories.length === 0) return ctx.reply('No memories stored yet.');
      const memText = memories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
      ctx.reply(`Here is what I remember:\n\n${memText}`);
    } catch (e) {
      logger.error('Error fetching memory', e);
      ctx.reply('Error fetching memory.');
    }
  });

  bot.command('clear', (ctx) => {
    try {
      const conv = getOrCreateConversation(ctx.chat.id);
      clearMessages(conv.id);
      clearMemories(ctx.chat.id);
      ctx.reply('Memory cleared. Starting fresh!');
    } catch (e) {
      logger.error('Error clearing memory', e);
      ctx.reply('Error clearing memory.');
    }
  });

  // --- VPS COMMANDS (owner only) ---

  bot.command('vps', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    await ctx.sendChatAction('typing');
    const result = await vpsStatus();
    ctx.reply(`🖥️ VPS Status\n\n${result}`);
  });

  bot.command('restart', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Usage: /restart <container_name>');
    await ctx.sendChatAction('typing');
    const result = await restartContainer(args[1]);
    ctx.reply(result);
  });

  bot.command('stop', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Usage: /stop <container_name>');
    await ctx.sendChatAction('typing');
    const result = await stopContainer(args[1]);
    ctx.reply(result);
  });

  bot.command('start_container', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Usage: /start_container <container_name>');
    await ctx.sendChatAction('typing');
    const result = await startContainer(args[1]);
    ctx.reply(result);
  });

  bot.command('logs', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Usage: /logs <container_name>');
    await ctx.sendChatAction('typing');
    const result = await getContainerLogs(args[1]);
    ctx.reply(result);
  });

  bot.command('deploy', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Usage: /deploy <project>');
    await ctx.reply(`🚀 Deploying '${args[1]}'... this may take a moment.`);
    const result = await deployProject(args[1]);
    ctx.reply(result);
  });

  bot.command('resumen', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('Unauthorized.');
    await ctx.sendChatAction('typing');
    const today = new Date();
    const in48h = new Date(today.getTime() + 48 * 60 * 60 * 1000);
    const [tasks, projects, eventsRaw] = await Promise.all([
      getPendingTasks(),
      getActiveProjects(),
      googleCalendarListEvents(today.toISOString(), in48h.toISOString())
    ]);
    let calendarText = 'Sin eventos proximos.';
    try {
      const eventsData = JSON.parse(eventsRaw);
      if (Array.isArray(eventsData) && eventsData.length > 0) {
        calendarText = eventsData.map((e: any) => {
          const start = new Date(e.start);
          const timeStr = start.toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
          return `${timeStr} - ${e.summary}`;
        }).join('\n');
      }
    } catch {}
    const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
    const message = `Resumen - ${dateStr}\n\nTareas pendientes:\n${tasks}\n\nProximos eventos (48h):\n${calendarText}\n\nProyectos activos:\n${projects}`;
    ctx.reply(message);
  });


  bot.command('tarea', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    const raw = ctx.message.text.replace(/^\/tarea\s*/i, '').trim();
    if (!raw) return ctx.reply('Uso: /tarea <texto> [#proyecto] [!prioridad]\n\nEjemplo: /tarea Revisar propuesta #vaperia !alta\n\nProyectos: #vaperia #itopy #beautia #hair\nPrioridad: !urgente !alta !media !baja');
    const projectMatch = raw.match(/#(\w+)/);
    const priorityMatch = raw.match(/!(\w+)/);
    const project = projectMatch?.[1];
    const priority = priorityMatch?.[1];
    const title = raw.replace(/#\w+/g, '').replace(/!\w+/g, '').replace(/\s+/g, ' ').trim();
    if (!title) return ctx.reply('❌ Escribe el título de la tarea.');
    await ctx.sendChatAction('typing');
    const result = await createTask(title, project, priority);
    ctx.reply(result);
  });

  bot.command('evento', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    const raw = ctx.message.text.replace(/^\/evento\s*/i, '').trim();
    if (!raw) return ctx.reply('Uso: /evento <título> <YYYY-MM-DD> <HH:MM> [min]\n\nEjemplo: /evento Reunión cliente 2026-04-07 10:00 60');
    const parts = raw.split(' ');
    const dateIdx = parts.findIndex((p: string) => /^\d{4}-\d{2}-\d{2}$/.test(p));
    if (dateIdx < 1) return ctx.reply('❌ Incluye la fecha en formato YYYY-MM-DD\n\nEjemplo: /evento Reunión 2026-04-07 10:00');
    const title = parts.slice(0, dateIdx).join(' ');
    const date = parts[dateIdx];
    const time = parts[dateIdx + 1] || '10:00';
    const duration = parseInt(parts[dateIdx + 2] || '60');
    const [hh, mm] = time.split(':').map(Number);
    const totalMin = hh * 60 + mm + duration;
    const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
    const endM = String(totalMin % 60).padStart(2, '0');
    const startISO = `${date}T${time}:00+02:00`;
    const endISO = `${date}T${endH}:${endM}:00+02:00`;
    await ctx.sendChatAction('typing');
    const result = await googleCalendarCreateEvent(title, '', startISO, endISO);
    ctx.reply(result);
  });

  bot.command('email', async (ctx) => {
    if (!isOwner(ctx.chat.id)) return ctx.reply('❌ Unauthorized.');
    const query = ctx.message.text.replace(/^\/email\s*/i, '').trim();
    if (!query) return ctx.reply('Uso: /email <búsqueda>\n\nEjemplo: /email propuesta Manuel');
    await ctx.sendChatAction('typing');
    const raw = await googleGmailListMessages(query, 5);
    try {
      const msgs = JSON.parse(raw);
      if (!Array.isArray(msgs) || msgs.length === 0) return ctx.reply('📭 Sin resultados para: ' + query);
      const text = msgs.map((m: any, i: number) =>
        `${i + 1}. ${m.subject}\n   De: ${m.from}\n   ${(m.snippet || '').substring(0, 120)}...`
      ).join('\n\n');
      ctx.reply(`📧 "${query}":\n\n${text}`);
    } catch {
      ctx.reply(raw);
    }
  });

};
