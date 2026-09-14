import { STORAGE_KEYS } from "@/lib/storage/keys";
import { readJSON, writeJSON } from "@/lib/storage/storage";
import type { StoredConversation } from "@/lib/storage/types";
import type { ChatMessage, Language } from "@/lib/chat/types";
import { generateId } from "@/lib/utils/id";

export function getConversations(): StoredConversation[] {
  return readJSON<StoredConversation[]>(STORAGE_KEYS.conversations, []);
}

function saveConversations(conversations: StoredConversation[]): void {
  writeJSON(STORAGE_KEYS.conversations, conversations);
}

export function createConversation(language: Language): StoredConversation {
  const conversation: StoredConversation = {
    id: generateId("conv"),
    startedAt: Date.now(),
    updatedAt: Date.now(),
    language,
    messages: [],
  };
  const conversations = getConversations();
  conversations.push(conversation);
  saveConversations(conversations);
  return conversation;
}

export function appendMessage(conversationId: string, message: ChatMessage): void {
  const conversations = getConversations();
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) return;
  conversation.messages.push(message);
  conversation.updatedAt = Date.now();
  if (message.language) {
    conversation.language = message.language;
  }
  saveConversations(conversations);
}

export function linkLead(conversationId: string, leadId: string): void {
  const conversations = getConversations();
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) return;
  conversation.leadId = leadId;
  saveConversations(conversations);
}

export function clearConversations(): void {
  saveConversations([]);
}
