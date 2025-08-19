'use client';

import { useState } from 'react';
import ChatInput from '@/components/chat-input';
import Header from '@/components/header';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; thinking: boolean }>>([]);
  const [hasMessages, setHasMessages] = useState(false);

  const handleSendMessage = async (message: string, thinkingMode: boolean) => {
    console.log('Sending message:', { message, thinkingMode });

    if (!hasMessages) {
      setHasMessages(true);
    }

    setMessages((prev) => [...prev, { text: message, thinking: thinkingMode }]);

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setHasMessages(false);
    setIsLoading(false);
  };

  return (
    <main className="bg-background flex min-h-screen flex-col">
      <Header onNewChat={handleNewChat} />
      {!hasMessages ? (
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-foreground text-3xl font-medium">What&apos;s the real story?</h1>
              {/* <p className="text-muted-foreground mx-auto max-w-sm">
                Get beyond the headline. Let's dig deeper into the context and sources together.
              </p> */}
            </div>
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Place a URl or text to begin analysis"
              maxLength={2000}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto w-full max-w-2xl">
              <div className="animate-in fade-in slide-in-from-top-2 mt-20 space-y-3 duration-500">
                {messages.map((msg, index) => (
                  <div key={index} className="text-right">
                    <div className="mb-1 flex items-center justify-end gap-2">
                      <span className="text-muted-foreground text-sm font-medium">You</span>
                      {msg.thinking && (
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                          Cached response
                        </span>
                      )}
                    </div>
                    <p className="text-card-foreground text-sm">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 p-4">
            <div className="mx-auto w-full max-w-2xl">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Ask a follow-up question"
                maxLength={2000}
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
