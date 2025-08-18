'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { UIMessage } from "ai";

export default function Chat() {
    const [input, setInput] = useState('');
    const { messages, sendMessage } = useChat();
    return (
        <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
            {messages.map(message => (
                <div key={message.id} className="whitespace-pre-wrap">
                    {message.role === 'user' ? 'User: ' : 'AI: '}
                    {message.parts.map((part, i) => {
                        switch (part.type) {
                            case 'text':
                                return <div key={`${message.id}-${i}`}>{part.text}</div>;
                        }
                    })}
                </div>
            ))}

            <form
                onSubmit={async e => {
                    e.preventDefault();

                    const userMessage: UIMessage = {
                        id: Date.now().toString(),
                        role: 'user',
                        parts: [{ type: 'text', text: input }],
                    };

                    setInput('');

                    try {
                        const response = await fetch('/api/query-transformer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messages: [...messages, userMessage] }),
                        });

                        if (!response.ok) {
                            throw new Error('Failed to fetch response from AI');
                        }

                        const data = await response.json();
                        console.log("AI Response:", data);

                        const formattedText = `
      User Query: ${data.user_query}
      
      Related Questions:
      ${data.rag_question.map((q: string) => `- ${q}`).join('\n')}
      
      Search Topics:
      • Entities: ${data.search_topics.entities.join(', ')}
      • Concepts: ${data.search_topics.concepts.join(', ')}
          `;

                        sendMessage({
                            role: 'assistant',
                            parts: [{ type: 'text', text: formattedText }],
                        });

                    } catch (error) {
                        console.error("Error:", error);
                    }
                }}

            >
                <input
                    className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
                    value={input}
                    placeholder="Say something..."
                    onChange={e => setInput(e.currentTarget.value)}
                />
            </form>
        </div>
    );
}
