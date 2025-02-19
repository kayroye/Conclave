import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { AIProvider } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (chatConfig: {
    name: string;
    isPublic: boolean;
    aiParticipants: {
      name: string;
      provider: AIProvider;
      model: string;
    }[];
  }) => void;
}

export function NewChatDialog({ isOpen, onClose, onCreateChat }: NewChatDialogProps) {
  const [chatName, setChatName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [aiParticipants, setAiParticipants] = useState<{
    name: string;
    provider: AIProvider;
    model: string;
  }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateChat({
      name: chatName,
      isPublic,
      aiParticipants,
    });
    // Reset form
    setChatName("");
    setIsPublic(false);
    setAiParticipants([]);
    onClose();
  };

  const addAIParticipant = () => {
    setAiParticipants([
      ...aiParticipants,
      { name: "", provider: "openai", model: "gpt-4" },
    ]);
  };

  const updateAIParticipant = (
    index: number,
    field: "name" | "provider" | "model",
    value: string
  ) => {
    const newParticipants = [...aiParticipants];
    newParticipants[index] = { ...newParticipants[index], [field]: value };
    setAiParticipants(newParticipants);
  };

  const removeAIParticipant = (index: number) => {
    setAiParticipants(aiParticipants.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription>
            Configure your new chat settings below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chatName">Chat Name</Label>
              <Input
                id="chatName"
                placeholder="Enter chat name"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Make chat public</Label>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>AI Participants</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAIParticipant}
                >
                  Add AI
                </Button>
              </div>

              {aiParticipants.map((participant, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <Label>AI Participant {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAIParticipant(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    placeholder="AI Name"
                    value={participant.name}
                    onChange={(e) =>
                      updateAIParticipant(index, "name", e.target.value)
                    }
                    required
                  />
                  <Select
                    value={participant.provider}
                    onValueChange={(value) =>
                      updateAIParticipant(index, "provider", value as AIProvider)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Model (e.g., gpt-4)"
                    value={participant.model}
                    onChange={(e) =>
                      updateAIParticipant(index, "model", e.target.value)
                    }
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Create Chat</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



