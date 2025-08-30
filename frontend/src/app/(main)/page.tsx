'use client';

import { useState } from 'react';
import ChatInput from '@/components/chat-input';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; cached: boolean }>({
    text: '',
    cached: false,
  });
  const [hasMessages, setHasMessages] = useState(false);

  const handleSendMessage = async (message: string, thinkingMode: boolean) => {
    console.log('Sending message:', { message, thinkingMode });

    if (!hasMessages) {
      setHasMessages(true);
    }

    setMessage({ text: message, cached: thinkingMode });

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };


  return (
    <main className="bg-background flex min-h-[91vh] flex-col">
      {!hasMessages ? (
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-foreground text-5xl font-medium">Litmus AI</h1>
              <p className="text-muted-foreground mx-auto max-w-lg">
                Advanced AI-powered content analysis to detect misinformation and assess credibility
                with precision{' '}
              </p>
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
          <main className="mx-auto max-w-6xl">
            <div className="border-border bg-muted rounded-xl border p-4">
              <h2>Analyzed Content</h2>
              <div>
                <p>{message.text}</p>
              </div>
            </div>
          </main>
        </>
      )}
    </main>
  );
}
