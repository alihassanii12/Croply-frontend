"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatThread, getChatThreads } from "@/lib/api";
import {
  ApiOffline, Card, EmptyState, PageHeader, Spinner, formatDate,
} from "@/components/ui";
import RouteGuard from "@/components/RouteGuard";
import { useAuth } from "@/lib/auth";
import {
  MessageCircle, ArrowRight, User,
} from "lucide-react";

function ChatsContent() {
  const router = useRouter();
  const { user, isFarmer } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const loadThreads = useCallback(() => {
    setLoading(true);
    setOffline(false);
    getChatThreads()
      .then(setThreads)
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadThreads, 30000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  if (loading) return <Spinner />;
  if (offline) return <ApiOffline onRetry={loadThreads} />;

  return (
    <div>
      <PageHeader
        title="My Chats"
        subtitle={`${threads.length} conversation${threads.length !== 1 ? 's' : ''}`}
      />

      {threads.length === 0 ? (
        <EmptyState
          message={
            isFarmer 
              ? "No chat conversations yet. When buyers message you about your listings, they'll appear here."
              : "No chat conversations yet. Start chatting with farmers about their listings."
          }
          icon={<MessageCircle className="h-7 w-7" />}
        />
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Card key={`${thread.listing_id}-${thread.other_user_id}`}>
              <div 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors -m-6 p-6 rounded-lg"
                onClick={() => router.push(`/marketplace/${thread.listing_id}/chat/${thread.other_user_id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {thread.listing_title}
                      </h3>
                      {thread.unread > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {thread.unread}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-neutral-700">
                        {thread.other_user_name?.[0]?.toUpperCase() ?? <User className="h-3 w-3" />}
                      </span>
                      <span className="font-medium">
                        {thread.other_user_name || 'Unknown User'}
                      </span>
                    </div>

                    {thread.last_message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {thread.last_message}
                      </p>
                    )}
                    
                    {thread.last_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(thread.last_at)}
                      </p>
                    )}
                  </div>
                  
                  <ArrowRight className="h-5 w-5 text-gray-400 shrink-0" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatsPage() {
  return (
    <RouteGuard>
      <ChatsContent />
    </RouteGuard>
  );
}
