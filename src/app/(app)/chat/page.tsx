import ChatLayout from "@/components/chat-layout";
import PageHeader from "@/components/page-header";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-theme(spacing.12))]">
      <div className="mb-2">
        <PageHeader
            title="AI Language Practice"
            description="Chat in your target language. Our AI will provide corrections and suggestions."
        />
      </div>
      <div className="flex-1 min-h-0">
        <ChatLayout />
      </div>
    </div>
  );
}
