import ChatContent from "./ChatContent";

type Params = Promise<{ id: string }>

export default async function ChatPage({ params }: { params: Params }) {
  const { id } = await params;

  return (
    <div className="flex-1 h-screen">
      <ChatContent chatId={id} />
    </div>

  );
}
