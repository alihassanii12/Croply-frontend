"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Message, getMessages, sendMessage, getListing, Listing } from "@/lib/api";
import {
  ApiOffline, Card, EmptyState, ErrorBanner, PageHeader,
  Spinner, btnCls, inputCls, formatDate,
} from "@/components/ui";
import RouteGuard from "@/components/RouteGuard";
import { useAuth } from "@/lib/auth";
import {
  MessageCircle, Send, ArrowLeft, User,
} from "lucide-react";

function ChatContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isFarmer } = useAuth();
  const listingId = parseInt(params.id as string);
  const otherUserId = parseInt(params.userId as string);
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [error, setError] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Filter messages for this specific conversation
  const filterMessagesForConversation = useCallback((allMessages: Message[]) => {
    if (!user) return [];
    
    return allMessages.filter(msg => {
      // Show messages where current user talks to otherUser OR otherUser talks to current user
      return (
        (msg.sender === user.id && msg.recipient === otherUserId) ||
        (msg.sender === otherUserId && msg.recipient === user.id)
      );
    });
  }, [user, otherUserId]);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    setError("");
    
    try {
      // Load listing and messages in parallel
      const [listingData, allMessages] = await Promise.all([
        getListing(listingId),
        getMessages(listingId)
      ]);
      
      setListing(listingData);
      // Filter messages for this specific conversation
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

  // Poll for new messages
  const pollForMessages = useCallback(async () => {
    if (loading || offline) return;
    
    try {
      const allMessages = await getMessages(listingId);
      const conversationMessages = filterMessagesForConversation(allMessages);
      
      setMessages(prev => {
        // Only update if we have new messages
        if (JSON.stringify(prev) !== JSON.stringify(conversationMessages)) {
          return conversationMessages;
        }
        return prev;
      });
    } catch (err) {
      console.error("Polling failed:", err);
      // Don't show error for polling failures - they're non-critical
    }
  }, [listingId, loading, offline, filterMessagesForConversation]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(pollForMessages, 3000);
  }, [pollForMessages]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Start polling when data is loaded
  useEffect(() => {
    if (!loading && !offline) {
      startPolling();
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [loading, offline, startPolling]);

  // Send message
  const handleSend = useCallback(async () => {
    const content = messageContent.trim();
    if (!content || sending) return;

    setSending(true);
    setError("");
    
    try {
      // For this specific conversation, the recipient is always the other user
      const newMessage = await sendMessage(listingId, content, otherUserId);
      // Add new message to state immediately for better UX
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (!exists) {
          return [...prev, newMessage];
        }
        return prev;
      });
      setMessageContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }, [messageContent, sending, listingId, otherUserId]);

  // Handle Enter key (using onKeyDown instead of deprecated onKeyPress)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Get other user's name from messages
  const otherUserName = messages.find(msg => msg.sender === otherUserId)?.sender_name || "User";

  if (loading) return <Spinner />;
  if (offline) return <ApiOffline onRetry={loadData} />;
  if (!listing) return <EmptyState message="Listing not found" icon={<MessageCircle className="h-7 w-7" />} />;

  return (
    <div className="fixed inset-0 top-16 flex flex-col bg-white dark:bg-neutral-950">
      {/* Chat Header - Fixed at top */}
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

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900">
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
              {messages.map((message, index) => (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.is_mine 
                          ? "bg-green-600 text-white" 
                          : "bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100"
                      }`}
                    >
                      {/* Sender info */}
                      <div className="mb-2 flex items-center gap-2">
                        {message.sender_avatar ? (
                          <img 
                            src={message.sender_avatar} 
                            alt={message.sender_name}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                            message.is_mine 
                              ? "bg-green-700 text-green-100" 
                              : "bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-gray-300"
                          }`}>
                            {message.sender_name?.[0]?.toUpperCase() ?? <User className="h-3 w-3" />}
                          </span>
                        )}
                        <span className={`text-xs font-medium ${
                          message.is_mine ? "text-green-100" : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {message.sender_name}
                        </span>
                      </div>
                      
                      {/* Message body */}
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.body}
                      </p>
                      
                      {/* Timestamp */}
                      <div className={`mt-2 text-xs ${
                        message.is_mine ? "text-green-100" : "text-gray-400 dark:text-gray-500"
                      }`}>
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl">
          {error && (
            <div className="mb-3">
              <ErrorBanner message={error} />
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className={`${inputCls} min-h-[44px] max-h-32 resize-none`}
                  disabled={sending}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!messageContent.trim() || sending}
                className={`${btnCls} flex h-11 w-11 items-center justify-center rounded-full p-0 disabled:opacity-50`}
              >
                <Send className="h-5 w-5" />
              </button>
clear            </div>
          </form>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
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
