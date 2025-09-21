import ChatLayout from "@/components/chat-layout";
import PageHeader from "@/components/page-header";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        title="AI Language Practice"
        description="Chat in your target language. Our AI will provide corrections and suggestions."
      />
      <div className="mt-4 h-[calc(100vh-10rem)]">
        <ChatLayout />
      </div>
    </>
  );
}
