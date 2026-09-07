"use client";

import { Message } from "@/lib/api";
import { formatDate } from "@/components/ui";
import { Check, CheckCheck, Image as ImageIcon, Mic, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatDuration } from "@/lib/mediaUtils";

interface ChatMessageProps {
  message: Message;
  isMine: boolean;
  showAvatar?: boolean;
}

export default function ChatMessage({ message, isMine, showAvatar = true }: ChatMessageProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const updateProgress = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      const handleEnded = () => {
        setAudioPlaying(false);
        setAudioProgress(0);
      };

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [message.voice_url]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
            <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {message.body}
            </div>
        );

      case 'image':
        return (
            <div className="space-y-2">
              {message.image_url && (
                  <div
                      className="relative cursor-pointer rounded-lg overflow-hidden max-w-xs"
                      onClick={() => setImageModalOpen(true)}
                  >
                    <img
                        src={message.image_url}
                        alt="Shared image"
                        className="w-full h-auto rounded-lg hover:opacity-90 transition-opacity"
                    />
                  </div>
              )}
              {message.body && (
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {message.body}
                  </div>
              )}

              {/* Image Modal */}
              {imageModalOpen && message.image_url && (
                  <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                      onClick={() => setImageModalOpen(false)}
                  >
                    <div className="relative max-w-4xl max-h-full">
                      <img
                          src={message.image_url}
                          alt="Full image"
                          className="max-w-full max-h-[90vh] object-contain rounded-lg"
                      />
                      <button
                          onClick={() => setImageModalOpen(false)}
                          className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
              )}
            </div>
        );

      case 'voice':
        return (
            <div className="space-y-2">
              <div className="flex items-center gap-3 min-w-[200px]">
                <button
                    onClick={toggleAudio}
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                        isMine
                            ? 'bg-white/20 hover:bg-white/30'
                            : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50'
                    }`}
                >
                  {audioPlaying ? (
                      <Pause className="w-5 h-5" />
                  ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="relative h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                            isMine ? 'bg-white' : 'bg-green-600 dark:bg-green-400'
                        }`}
                        style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <div className="text-xs opacity-70">
                    {message.voice_duration ? formatDuration(message.voice_duration) : '0:00'}
                  </div>
                </div>
              </div>

              {message.voice_url && (
                  <audio ref={audioRef} src={message.voice_url} preload="metadata" />
              )}

              {message.body && (
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-2">
                    {message.body}
                  </div>
              )}
            </div>
        );

      default:
        return null;
    }
  };

  const renderStatusIcon = () => {
    if (!isMine) return null;

    switch (message.status) {
      case 'sent':
        return <Check className="w-4 h-4 opacity-60" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 opacity-60" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-green-600 dark:text-green-400" />;
      default:
        return null;
    }
  };

  return (
      <div className={`flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {showAvatar && !isMine && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {message.sender_avatar ? (
                  <img src={message.sender_avatar} alt={message.sender_name} className="w-full h-full object-cover" />
              ) : (
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {message.sender_name[0]?.toUpperCase()}
            </span>
              )}
            </div>
        )}

        {!showAvatar && !isMine && <div className="w-8" />}

        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
          {!isMine && showAvatar && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
            {message.sender_name}
          </span>
          )}

          <div
              className={`rounded-2xl px-4 py-2 ${
                  isMine
                      ? 'bg-green-600 text-white dark:bg-green-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
          >
            {renderMessageContent()}
          </div>

          <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(message.created_at)}
          </span>
            {renderStatusIcon()}
          </div>
        </div>
      </div>
  );
}
