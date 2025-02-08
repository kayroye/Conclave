import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";
import { FormEvent } from "react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
}: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <Input
        value={input}
        onChange={handleInputChange}
        placeholder="Message the group..."
        className="flex-1"
      />
      <Button type="submit" size="icon">
        <SendHorizontal className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
} 