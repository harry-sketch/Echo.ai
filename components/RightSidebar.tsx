"use client";

import { LucideLanguages } from "lucide-react";
import { cleanText } from "../lib/utils";
import { useEchoStore } from "../store/useEchoStore";
import SidebarHeader from "./SidebarHeader";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "./ui/conversation";
import { Message, MessageAvatar, MessageContent } from "./ui/message";

function RightSidebar() {
  const { transcription } = useEchoStore();

  return (
    <aside className="flex h-full w-full flex-col bg-black text-white">
      {/* Header */}
      <SidebarHeader icon={LucideLanguages} title="Transcript" />

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        <Conversation className="h-full overflow-y-auto px-3 py-2">
          {/* Tighter Vertical Spacing (space-y-2) */}
          <ConversationContent className="space-y-2">
            {transcription.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center opacity-50">
                <ConversationEmptyState
                  title=""
                  description="Start speaking..."
                  className="text-center text-xs"
                />
              </div>
            ) : (
              transcription.map((message, i) => {
                const cleanedText = cleanText(message.transcription);
                if (!cleanedText && !message.isPartial) return null;
                const isUser = message.sender === "user";
                return (
                  <Message
                    key={message.id || i}
                    from={isUser ? "user" : "assistant"}
                  >
                    <MessageContent
                      className={
                        !isUser
                          ? `bg-primary! text-primary-foreground!`
                          : "bg-secondary! text-secondary-foreground!"
                      }
                      // variant="contained"
                    >
                      {cleanedText}
                      {message.isPartial && !isUser && (
                        <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full opacity-60 animate-bounce align-baseline" />
                      )}
                    </MessageContent>

                    {!isUser && (
                      <MessageAvatar src="/logo.png" name="TalkGyan" />
                    )}
                  </Message>
                );
              })
            )}
          </ConversationContent>
        </Conversation>
      </div>
    </aside>
  );
}

export default RightSidebar;
