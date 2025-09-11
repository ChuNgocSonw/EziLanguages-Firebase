import ChatLayout from "@/components/chat-layout";
import PageHeader from "@/components/page-header";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        title="AI Language Practice"
        description="Chat in your target language. Our AI will provide corrections and suggestions."
      />
      <div className="flex-1 flex flex-col h-[calc(100vh-12rem)]">
        <ChatLayout />
      </div>
    </>
  );
}
