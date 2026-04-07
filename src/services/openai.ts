import OpenAI from 'openai';
import { env } from '../config/env';
import fs from 'fs';
import { logger } from '../utils/logger';
import { gmailSearchApi } from './n8n';
import { getPendingTasks, getActiveProjects, createTask } from './notionTools';
import { googleCalendarListEvents, googleCalendarCreateEvent, googleDriveSearchFiles } from './googleTools';
import { vpsStatus, restartContainer, stopContainer, startContainer, getContainerLogs, deployProject } from './vpsManager';
import { listUserRepos, getRepoLatestCommit } from './githubTools';

export const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const transcribeAudio = async (filePath: string): Promise<string> => {
  try {
    const transcription = await openai.audio.transcriptions.create({ file: fs.createReadStream(filePath), model: env.OPENAI_TRANSCRIPTION_MODEL });
    return transcription.text;
  } catch (error) { logger.error('Error transcribing audio', error); throw error; }
};

const TOOLS: any[] = [
  { type: "function", function: { name: "gmail_search", description: "Search for emails in Gmail.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "notion_get_tasks", description: "Get pending tasks from Notion.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "notion_get_projects", description: "Get the list of active projects from Notion.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "notion_create_task", description: "Create a new Notion task.", parameters: { type: "object", properties: { title: { type: "string" }, project: { type: "string" }, priority: { type: "string" } }, required: ["title"] } } },
  { type: "function", function: { name: "calendar_list_events", description: "List upcoming events from Calendar.", parameters: { type: "object", properties: { timeMin: { type: "string" }, timeMax: { type: "string" } } } } },
  { type: "function", function: { name: "calendar_create_event", description: "Create a new event in Google Calendar.", parameters: { type: "object", properties: { summary: { type: "string" }, description: { type: "string" }, startTime: { type: "string" }, endTime: { type: "string" } }, required: ["summary", "startTime", "endTime"] } } },
  { type: "function", function: { name: "drive_search", description: "Search for files in Google Drive.", parameters: { type: "object", properties: { fileName: { type: "string" } }, required: ["fileName"] } } },
  { type: "function", function: { name: "vps_status", description: "Get the real-time status of all Docker containers on the VPS.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "vps_manage_container", description: "Restart, Stop or Start a container.", parameters: { type: "object", properties: { action: { type: "string", enum: ["restart", "stop", "start"] }, name: { type: "string" } }, required: ["action", "name"] } } },
  { type: "function", function: { name: "vps_deploy", description: "Deploy a project (VaperIA or n8n) executing its git push or pull scripts.", parameters: { type: "object", properties: { project: { type: "string", enum: ["VaperIA", "n8n"] } }, required: ["project"] } } },
  { type: "function", function: { name: "vps_logs", description: "Get the last 20 log lines of a specific container.", parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "github_list_repos", description: "List my GitHub repositories.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "github_last_commit", description: "Get latest commit message for a repository.", parameters: { type: "object", properties: { repoName: { type: "string" } }, required: ["repoName"] } } }
];

export const generateChatResponse = async (systemPrompt: string, messages: any[]): Promise<string> => {
  try {
    const apiMessages: any[] = [{ role: 'system', content: systemPrompt }, ...messages];
    const response = await openai.chat.completions.create({ model: env.OPENAI_CHAT_MODEL, messages: apiMessages, tools: TOOLS, tool_choice: "auto" });
    const completionMessage = response.choices[0]?.message;

    if (completionMessage?.tool_calls && completionMessage.tool_calls.length > 0) {
      apiMessages.push(completionMessage);
      for (const rawToolCall of completionMessage.tool_calls) {
        const toolCall: any = rawToolCall; // <-- Aquí estaba el fallo, forzado a any
        const args = JSON.parse(toolCall.function.arguments);
        let result = "";
        try {
          if (toolCall.function.name === 'gmail_search') result = await gmailSearchApi(args.query || '');
          else if (toolCall.function.name === 'notion_get_tasks') result = await getPendingTasks();
          else if (toolCall.function.name === 'notion_get_projects') result = await getActiveProjects();
          else if (toolCall.function.name === 'notion_create_task') result = await createTask(args.title, args.project, args.priority);
          else if (toolCall.function.name === 'calendar_list_events') result = await googleCalendarListEvents(args.timeMin, args.timeMax);
          else if (toolCall.function.name === 'calendar_create_event') result = await googleCalendarCreateEvent(args.summary, args.description, args.startTime, args.endTime);
          else if (toolCall.function.name === 'drive_search') result = await googleDriveSearchFiles(args.fileName);
          else if (toolCall.function.name === 'vps_status') result = await vpsStatus();
          else if (toolCall.function.name === 'vps_manage_container') {
             if (args.action === 'restart') result = await restartContainer(args.name);
             else if (args.action === 'stop') result = await stopContainer(args.name);
             else if (args.action === 'start') result = await startContainer(args.name);
          }
          else if (toolCall.function.name === 'vps_deploy') result = await deployProject(args.project);
          else if (toolCall.function.name === 'vps_logs') result = await getContainerLogs(args.name);
          else if (toolCall.function.name === 'github_list_repos') result = await listUserRepos();
          else if (toolCall.function.name === 'github_last_commit') result = await getRepoLatestCommit(args.repoName);
        } catch (e: any) { result = `Error: ${e.message}`; }
        apiMessages.push({ role: "tool", tool_call_id: toolCall.id, content: result.substring(0, 4000)});
      }
      const finalRes = await openai.chat.completions.create({ model: env.OPENAI_CHAT_MODEL, messages: apiMessages });
      return finalRes.choices[0]?.message?.content || '';
    }
    return completionMessage?.content || '';
  } catch (error) { logger.error('Error generating chat response', error); throw error; }
};
