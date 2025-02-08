import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import { AvatarCircles } from "@/components/magicui/avatar-circles";

export function ChatHeader() {
  const avatars = [
    {
      imageUrl: "/avatars/01.png",
      profileUrl: "#",
    },
    {
      imageUrl: "/avatars/02.png",
      profileUrl: "#",
    },
    {
      imageUrl: "/avatars/03.png",
      profileUrl: "#",
    },
  ];

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center space-x-4">
        <AvatarCircles 
          avatarUrls={avatars}
          numPeople={1}
          className="scale-90"
        />
        <div>
          <h2 className="text-lg font-semibold">Group Chat</h2>
          <p className="text-sm text-muted-foreground">4 members</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
        <Separator orientation="vertical" className="h-6" />
      </div>
    </div>
  );
} 