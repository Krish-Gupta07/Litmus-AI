'use client';

import { useState } from 'react';
import ChatInput from '@/components/chat-input';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; cached: boolean }>({
    text: '',
    cached: false,
  });
  const router = useRouter();

  const mockResponse = {
    id: crypto.randomUUID(),
    status: 'success',
    payload: {
      title: 'AI in Healthcare Report',
      body: 'Well-structured report with moderate technical accuracy',
    },
    message: 'Content analyzed successfully',
  };

  const handleSendMessage = async (message: string, cacheMode: boolean) => {
    console.log('Sending message:', { message, cacheMode });

    setMessage({ text: message, cached: cacheMode });

    setIsLoading(true);
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
      router.push(`/chat/${mockResponse.id}`);
    });

    setIsLoading(false);
  };

  return (
    <main className="bg-background flex min-h-[91vh] flex-col">
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
    </main>
  );
}
