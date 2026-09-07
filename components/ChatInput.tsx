"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Image as ImageIcon, Mic, X, StopCircle } from "lucide-react";
import { inputCls } from "@/components/ui";
import { AudioRecorder, validateImage, compressImage, formatDuration } from "@/lib/mediaUtils";

interface ChatInputProps {
  onSendText: (message: string) => Promise<void>;
  onSendImage: (image: File) => Promise<void>;
  onSendVoice: (voice: Blob, duration: number) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function ChatInput({
                                    onSendText,
                                    onSendImage,
                                    onSendVoice,
                                    onTyping,
                                    disabled = false
                                  }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user is typing, send typing indicator
    if (value.length > 0) {
      onTyping(true);

      // Clear typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    } else {
      onTyping(false);
    }
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate image
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid image");
      return;
    }

    try {
      // Compress image
      const compressed = await compressImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(compressed);

      setSelectedImage(compressed);
    } catch (err) {
      setError("Failed to process image");
      console.error(err);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartRecording = async () => {
    try {
      setError("");
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 180) { // 3 minutes max
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
      console.error(err);
    }
  };

  const handleStopRecording = async () => {
    if (!audioRecorderRef.current) return;

    try {
      setSending(true);
      const { blob, duration } = await audioRecorderRef.current.stopRecording();

      // Clear interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      setIsRecording(false);
      setRecordingDuration(0);

      // Send voice message
      await onSendVoice(blob, duration);
    } catch (err) {
      setError("Failed to send voice message");
      console.error(err);
    } finally {
      setSending(false);
      audioRecorderRef.current = null;
    }
  };

  const handleCancelRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancelRecording();
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    setIsRecording(false);
    setRecordingDuration(0);
    audioRecorderRef.current = null;
  };

  const handleSend = async () => {
    if (sending || disabled) return;

    // Clear typing indicator
    onTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setSending(true);
    setError("");

    try {
      if (selectedImage) {
        // Send image
        await onSendImage(selectedImage);
        clearImage();
      } else if (message.trim()) {
        // Send text
        await onSendText(message.trim());
        setMessage("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isRecording) {
    return (
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <Mic className="w-5 h-5" />
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Recording: {formatDuration(recordingDuration)}
            </div>
          </div>

          <button
              onClick={handleCancelRecording}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>

          <button
              onClick={handleStopRecording}
              disabled={sending}
              className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50"
              title="Send"
          >
            <StopCircle className="w-5 h-5" />
          </button>
        </div>
    );
  }

  return (
      <div className="border-t border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
        )}

        {imagePreview && (
            <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
              <div className="relative inline-block">
                <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 rounded-lg"
                />
                <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
        )}

        <div className="flex items-end gap-2 p-4">
          <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
          />

          <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || sending || !!imagePreview}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              title="Send image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
              onClick={handleStartRecording}
              disabled={disabled || sending || !!imagePreview}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              title="Send voice message"
          >
            <Mic className="w-5 h-5" />
          </button>

          <textarea
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={disabled || sending || !!imagePreview}
              className={`${inputCls} flex-1 resize-none min-h-[40px] max-h-[120px]`}
              rows={1}
          />

          <button
              onClick={handleSend}
              disabled={disabled || sending || (!message.trim() && !selectedImage)}
              className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
  );
}
