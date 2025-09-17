import ChatLayout from "@/components/chat-layout";
import PageHeader from "@/components/page-header";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="AI Language Practice"
        description="Chat in your target language. Our AI will provide corrections and suggestions."
      />
      <div className="flex-1 min-h-0 mt-4">
        <ChatLayout />
      </div>
    </div>
  );
}
