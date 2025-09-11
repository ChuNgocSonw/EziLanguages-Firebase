import ChatInterface from "@/components/chat-interface";
import PageHeader from "@/components/page-header";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        title="AI Language Practice"
        description="Chat in your target language. Our AI will provide corrections and suggestions."
      />
      <div className="flex-1 flex flex-col">
        <ChatInterface />
      </div>
    </>
  );
}
