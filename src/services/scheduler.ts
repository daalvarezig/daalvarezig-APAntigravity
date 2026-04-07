import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { OWNER_CHAT_ID } from './vpsManager';
import { getPendingTasks, getActiveProjects } from './notionTools';
import { googleCalendarListEvents } from './googleTools';
import { logger } from '../utils/logger';

export const setupScheduler = (bot: Telegraf) => {
  // Reporte diario — 8:00 AM hora Madrid (UTC+2)
  cron.schedule('0 6 * * *', async () => {
    logger.info('Sending daily report...');
    try {
      const today = new Date();
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59);

      const [tasks, projects, eventsRaw] = await Promise.all([
        getPendingTasks(),
        getActiveProjects(),
        googleCalendarListEvents(today.toISOString(), endOfDay.toISOString()),
      ]);

      let calendarText = 'Sin eventos hoy.';
      try {
        const eventsData = JSON.parse(eventsRaw);
        if (Array.isArray(eventsData) && eventsData.length > 0) {
          calendarText = eventsData.map((e: any) => {
            const start = new Date(e.start);
            const timeStr = start.toLocaleString('es-ES', {
              hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid'
            });
            return `${timeStr} — ${e.summary}`;
          }).join('\n');
        }
      } catch {}

      const dateStr = today.toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid'
      });

      const message = `Buenos días David! 👋\n\n📅 ${dateStr}\n\n✅ Tareas pendientes:\n${tasks}\n\n🗓 Agenda de hoy:\n${calendarText}\n\n🚀 Proyectos activos:\n${projects}`;

      await bot.telegram.sendMessage(OWNER_CHAT_ID, message);
      logger.info('Daily report sent.');
    } catch (error: any) {
      logger.error('Error sending daily report', error);
    }
  }, { timezone: 'Europe/Madrid' });

  logger.info('Scheduler initialized — daily report at 08:00 Europe/Madrid');
};
