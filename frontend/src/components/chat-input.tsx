'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, InfoIcon, LinkIcon, Loader2, SendIcon, TypeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export default function ChatInput({
  onSendMessage,
  isLoading = false,
  placeholder = 'Type your message...',
  disabled = false,
  maxLength = 4000,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputType, setInputType] = useState<'text' | 'url'>('text');

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || disabled) return;

    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-muted flex min-h-28 max-w-full flex-col justify-between rounded-3xl p-6 ring ring-transparent ring-offset-0 transition-colors',
        'focus-within:ring-transparent',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div className="min-h-0 flex-1">
        <h1 className="flex items-center gap-2 font-medium">
          <TypeIcon size={16} className="text-accent" /> Analyze Content for Misinformation
        </h1>
        <div className="bg-primary-foreground my-2 flex w-fit items-center gap-2 rounded-xl p-1">
          <button
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors duration-300',
              inputType === 'text' && 'bg-secondary',
            )}
            onClick={() => setInputType('text')}
          >
            <TypeIcon size={16} /> Text
          </button>
          <button
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors duration-300',
              inputType === 'url' && 'bg-secondary',
            )}
            onClick={() => setInputType('url')}
          >
            <LinkIcon size={16} /> URL
          </button>
        </div>
        <p className="mb-2 text-sm">
          {inputType === 'text' ? 'Enter text content to analyze' : 'Enter URL to analyze'}
        </p>
        <textarea
          ref={textareaRef}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            inputType === 'text'
              ? 'Enter text content to analyze for misinformation'
              : 'Enter URL to analyze for misinformation'
          }
          disabled={disabled || isLoading}
          maxLength={maxLength}
          className={cn(
            'text-foreground placeholder:text-muted-foreground bg-primary-foreground w-full resize-none rounded-xl border-0 p-4',
            'focus:ring-0 focus:outline-none',
            'text-sm leading-relaxed',
          )}
          style={{ minHeight: '20px', maxHeight: '120px' }}
          aria-label="Chat message input"
        />
      </div>

      <div className="mt-2 flex items-center justify-end gap-3">
        {/* <div className="flex items-center gap-2">
          <Checkbox
            id="cache-mode"
            checked={false}
            onCheckedChange={() => {}}
            disabled={disabled || isLoading}
            className="data-[state=checked]:!bg-accent data-[state=checked]:!border-accent"
          />
          <Label
            htmlFor="cache-mode"
            className="text-muted-foreground cursor-pointer text-xs select-none"
          >
            Use cached results
            <InfoIcon size={16} className="text-muted-foreground" />
          </Label>
        </div> */}

        <div className="flex items-center gap-3">
          {message.length > maxLength * 0.8 && (
            <span
              className={cn(
                'text-xs tabular-nums',
                message.length >= maxLength ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {message.length}/{maxLength}
            </span>
          )}

          <Button
            type="submit"
            disabled={!canSend}
            className={cn(
              'rounded-xl transition-all duration-200',
              canSend
                ? 'bg-accent hover:bg-accent/90 text-primary-foreground shadow-md hover:shadow-lg'
                : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed',
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <ArrowUp size={18} /> <p>Analyze</p>
              </div>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
