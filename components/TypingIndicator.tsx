"use client";

interface TypingIndicatorProps {
    userNames: string[];
}

export default function TypingIndicator({ userNames }: TypingIndicatorProps) {
    if (userNames.length === 0) return null;

    const displayText = userNames.length === 1
        ? `${userNames[0]} is typing...`
        : userNames.length === 2
            ? `${userNames[0]} and ${userNames[1]} are typing...`
            : "Multiple people are typing...";

    return (
        <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8" /> {/* Spacer for alignment with messages */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{displayText}</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
