"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Message,
  getMessages,
  sendMessage,
  sendImageMessage,
  sendVoiceMessage,
  getListing,
  Listing,
  updateTypingStatus,
  getTypingStatus,
  TypingStatus
} from "@/lib/api";
import {
  ApiOffline, EmptyState, Spinner,
} from "@/components/ui";
import RouteGuard from "@/components/RouteGuard";
import { useAuth } from "@/lib/auth";
import { MessageCircle, ArrowLeft } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";

function ChatContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = parseInt(params.id as string);
  const otherUserId = parseInt(params.userId as string);

  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingPollRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const filterMessagesForConversation = useCallback((allMessages: Message[]) => {
    if (!user) return [];
    return allMessages.filter(msg =>
        (msg.sender === user.id && msg.recipient === otherUserId) ||
        (msg.sender === otherUserId && msg.recipient === user.id)
    );
  }, [user, otherUserId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    setError("");

    try {
      const [listingData, allMessages] = await Promise.all([
        getListing(listingId),
        getMessages(listingId)
      ]);

      setListing(listingData);
      const conversationMessages = filterMessagesForConversation(allMessages);
      setMessages(conversationMessages);
    } catch (err) {
      console.error("Failed to load chat data:", err);
      setOffline(true);
      setError(err instanceof Error ? err.message : "Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [listingId, filterMessagesForConversation]);

  const pollForMessages = useCallback(async () => {
    if (loading || offline) return;

    try {
      const allMessages = await getMessages(listingId);
      const conversationMessages = filterMessagesForConversation(allMessages);

      setMessages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(conversationMessages)) {
          return conversationMessages;
        }
        return prev;
      });
    } catch (err) {
      console.error("Polling failed:", err);
    }
  }, [listingId, loading, offline, filterMessagesForConversation]);

  const pollTypingStatus = useCallback(async () => {
    if (loading || offline) return;

    try {
      const typingStatuses = await getTypingStatus(listingId);
      const names = typingStatuses
          .filter((status: TypingStatus) => status.user !== user?.id)
          .map((status: TypingStatus) => status.user_name);
      setTypingUsers(names);
    } catch (err) {
      // Ignore
    }
  }, [listingId, loading, offline, user]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (typingPollRef.current) clearInterval(typingPollRef.current);

    pollIntervalRef.current = setInterval(pollForMessages, 3000);
    typingPollRef.current = setInterval(pollTypingStatus, 2000);
  }, [pollForMessages, pollTypingStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading && !offline) {
      startPolling();
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (typingPollRef.current) clearInterval(typingPollRef.current);
    };
  }, [loading, offline, startPolling]);

  const handleSendText = useCallback(async (text: string) => {
    const newMessage = await sendMessage(listingId, text, otherUserId);
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id);
      return exists ? prev : [...prev, newMessage];
    });
  }, [listingId, otherUserId]);

  const handleSendImage = useCallback(async (image: File) => {
    const newMessage = await sendImageMessage(listingId, image, otherUserId);
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id);
      return exists ? prev : [...prev, newMessage];
    });
  }, [listingId, otherUserId]);

  const handleSendVoice = useCallback(async (voice: Blob, duration: number) => {
    const newMessage = await sendVoiceMessage(listingId, voice, duration, otherUserId);
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id);
      return exists ? prev : [...prev, newMessage];
    });
  }, [listingId, otherUserId]);

  const handleTyping = useCallback(async (isTyping: boolean) => {
    try {
      await updateTypingStatus(listingId, isTyping);
    } catch (err) {
      // Ignore
    }
  }, [listingId]);

  const otherUserName = messages.find(msg => msg.sender === otherUserId)?.sender_name || "User";

  const messagesWithAvatars = messages.map((msg, index) => {
    const prevMsg = messages[index - 1];
    const showAvatar = !prevMsg || prevMsg.sender !== msg.sender;
    return { ...msg, showAvatar };
  });

  if (loading) return <Spinner />;
  if (offline) return <ApiOffline onRetry={loadData} />;
  if (!listing) return <EmptyState message="Listing not found" icon={<MessageCircle className="h-7 w-7" />} />;

  return (
      <div className="fixed inset-0 top-16 flex flex-col bg-white dark:bg-neutral-950">
        <div className="flex-shrink-0 border-b border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <button
                onClick={() => router.push('/chats')}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {listing.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                Chat with {otherUserName}
              </p>
            </div>

            <div className="flex-shrink-0 text-right">
            <span className="text-lg font-bold text-green-700 dark:text-green-400">
              PKR {Number(listing.price).toLocaleString()}
            </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900 chat-scrollbar">
          <div className="mx-auto max-w-4xl p-4">
            {messages.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <EmptyState
                      message="No messages yet. Start the conversation!"
                      icon={<MessageCircle className="h-7 w-7" />}
                  />
                </div>
            ) : (
                <div className="space-y-4">
                  {messagesWithAvatars.map((message, index) => (
                      <ChatMessage
                          key={`${message.id}-${index}`}
                          message={message}
                          isMine={message.is_mine}
                          showAvatar={message.showAvatar}
                      />
                  ))}

                  <TypingIndicator userNames={typingUsers} />
                  <div ref={messagesEndRef} />
                </div>
            )}
          </div>
        </div>

        <ChatInput
            onSendText={handleSendText}
            onSendImage={handleSendImage}
            onSendVoice={handleSendVoice}
            onTyping={handleTyping}
            disabled={offline}
        />
      </div>
  );
}

export default function SpecificChatPage() {
  return (
      <RouteGuard>
        <ChatContent />
      </RouteGuard>
  );
}
