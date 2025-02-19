"use client";

import { useEffect, useRef } from "react";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useChat } from "ai/react";
import { Chat } from "@/lib/types";

interface ChatContainerProps {
  chat: Chat;
}

export function ChatContainer({ chat }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={chat} />
      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessages messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
} 