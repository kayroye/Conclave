import { Message } from "ai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn("flex items-start space-x-4", {
            "justify-end space-x-reverse": message.role === "user",
          })}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={message.role === "user" ? "/avatars/01.png" : "/avatars/02.png"}
              alt={message.role}
            />
            <AvatarFallback>
              {message.role === "user" ? "U" : "AI"}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "rounded-lg px-4 py-2 max-w-[80%]",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 