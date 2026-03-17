import { getOrCreateConversation, updateConversationSummary, Conversation } from '../db/repositories/conversation';
import { getRecentMessages, addMessage, countMessages, getAllMessages, deleteOldMessages } from '../db/repositories/message';
import { getMemories, addMemory } from '../db/repositories/memory';
import { generateChatResponse } from './openai';
import { logger } from '../utils/logger';

// 20 messages between user and bot means it's time to summarize the older ones
const SUMMARIZATION_THRESHOLD = 20;
// Keep the last 10 messages untouched in the DB when we decide to delete the rest
const KEEP_LAST_N_MESSAGES = 10;

export const buildContextPrompt = (conversation: Conversation, memories: string[]): string => {
  let prompt = `You are a helpful, intelligent personal AI assistant in Telegram. 
Respond concisely but comprehensively. Use markdown for formatting. You have a persistent memory of past conversations.

`;

  if (memories.length > 0) {
    prompt += `[IMPORTANT MEMORIES ABOUT THE USER (DO NOT FORGET THESE)]:\n`;
    memories.forEach((m, i) => {
      prompt += `${i + 1}. ${m}\n`;
    });
    prompt += `\n`;
  }

  if (conversation.summary) {
    prompt += `[SUMMARY OF PAST CONVERSATIONS]:\n${conversation.summary}\n\n`;
  }

  prompt += `[RECENT MESSAGES]:\n(Follow the flow of the recent messages below)\n`;
  return prompt;
};

export const manageMemoryAndContext = async (chatId: number, newUserMessage: string): Promise<string> => {
  const conversation = getOrCreateConversation(chatId);
  const convId = conversation.id;
  
  // Save user message
  addMessage(convId, 'user', newUserMessage);

  // Check if we need to summarize
  const totalMsgs = countMessages(convId);
  if (totalMsgs > SUMMARIZATION_THRESHOLD) {
    await summarizeAndExtractMemories(chatId, conversation);
  }

  // Refetch conversation in case summary was updated
  const updatedConv = getOrCreateConversation(chatId);
  
  // Get recent messages for context
  const recentMsgs = getRecentMessages(convId, KEEP_LAST_N_MESSAGES);
  
  // Format for OpenAI
  const apiMessages = recentMsgs.map(m => ({
    role: m.role as 'user'|'assistant'|'system',
    content: m.content
  }));

  const memories = getMemories(chatId).map(m => m.content);
  const systemPrompt = buildContextPrompt(updatedConv, memories);

  // Generate response
  const responseText = await generateChatResponse(systemPrompt, apiMessages);

  // Save assistant message
  addMessage(convId, 'assistant', responseText);

  return responseText;
};

const summarizeAndExtractMemories = async (chatId: number, conversation: Conversation) => {
  try {
    const allMsgs = getAllMessages(conversation.id);
    const textLog = allMsgs.map(m => `${m.role}: ${m.content}`).join('\n');

    const prompt = `You are an AI tasked with managing conversation memory.
    
Here is the previous summary of the conversation:
${conversation.summary || 'None'}

Here are the recent messages:
${textLog}

Task 1: Write a concise, updated summary of the entire conversation combining the previous summary and the new messages.
Task 2: Identify any NEW, strictly important permanent facts about the user (e.g., name, allergies, preferences, relationships). Do not extract transient info. Format them as a list.

Output EXACTLY in this format:
SUMMARY: [your concise summary]
FACTS:
- [fact 1]
- [fact 2]
(if no new facts, just output FACTS: NONE)
`;

    const result = await generateChatResponse('You are an internal memory-management bot.', [{role: 'user', content: prompt}]);
    
    // Parse result
    const summaryMatch = result.match(/SUMMARY:\s*([\s\S]*?)\nFACTS:/);
    const factsMatch = result.match(/FACTS:\s*([\s\S]*)$/);

    if (summaryMatch && summaryMatch[1]) {
      const newSummary = summaryMatch[1].trim();
      updateConversationSummary(conversation.id, newSummary);
    }

    if (factsMatch && factsMatch[1]) {
      const factsText = factsMatch[1].trim();
      if (factsText.toUpperCase() !== 'NONE') {
        const facts = factsText.split('\n').map(f => f.replace(/^- /, '').trim()).filter(f => f.length > 0);
        for (const f of facts) {
          addMemory(chatId, f);
        }
      }
    }

    // Cleanup old messages, keeping the very last few for continuity
    deleteOldMessages(conversation.id, KEEP_LAST_N_MESSAGES / 2);

  } catch (error) {
    logger.error('Error during summarization', error);
  }
};
