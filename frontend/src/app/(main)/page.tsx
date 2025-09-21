'use client';

import { useState } from 'react';
import ChatInput from '@/components/chat-input';
import { useRouter } from 'next/navigation';
import { postApi } from '@/helpers/api';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import ShinyText from '@/components/common/shiny-text';
import LightRays from '@/components/common/light-rays';

interface IPayload {
  url?: string;
  text?: string;
  userId: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleSendMessage = async (input: string) => {
    if (user?.id === null || user?.id === undefined || !user?.id) {
      toast.error('User not found. Cannot send message.');
      return;
    }

    setIsLoading(true);

    let payload: IPayload;

    try {
      new URL(input);
      payload = { url: input, userId: user.id };
    } catch (error) {
      payload = { text: input, userId: user.id };
    }

    console.log('Payload', payload);

    const response = await postApi('/api/analysis/analyze', payload);

    if (response.status !== 202) {
      console.error('Failed to queue analysis job:', {
        response: response.data,
        status: response.status,
      });
      toast.error('Failed to queue analysis job.');
      setIsLoading(false);
      return;
    }

    // window.dispatchEvent(new CustomEvent('new-analysis-created'))
    // localStorage.setItem('new-analysis-created', Date.now().toString())
    toast.success('Analysis job queued successfully.');
    router.push(`/chat/${response.data.data.jobId}`);

    setIsLoading(false);
  };

  return (
    <main className="bg-background flex min-h-[91vh] flex-col">
      <div
        style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
        className='pointer-events-none'
      >
        <LightRays
          raysOrigin="top-center"
          raysColor="#000"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.05}
          noiseAmount={0.1}
          distortion={0.05}
        />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4 z-10">
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
