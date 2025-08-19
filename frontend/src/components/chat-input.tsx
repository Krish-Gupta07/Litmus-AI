'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string, thinkingMode: boolean) => void;
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
  const [cacheMode, setCacheMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    onSendMessage(message.trim(), cacheMode);
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
        'bg-muted flex min-h-28 w-2xl max-w-full flex-col justify-between rounded-3xl p-6 ring ring-transparent ring-offset-0 transition-colors',
        'focus-within:ring-ring',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div className="min-h-0 flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          maxLength={maxLength}
          className={cn(
            'text-foreground placeholder:text-muted-foreground w-full resize-none border-0 bg-transparent',
            'focus:ring-0 focus:outline-none',
            'text-sm leading-relaxed',
          )}
          style={{ minHeight: '20px', maxHeight: '120px' }}
          aria-label="Chat message input"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="thinking-mode"
            checked={cacheMode}
            onCheckedChange={setCacheMode}
            disabled={disabled || isLoading}
            className="data-[state=checked]:bg-primary"
          />
          <Label
            htmlFor="cache-mode"
            className="text-muted-foreground cursor-pointer text-xs select-none"
          >
            Cache Mode
          </Label>
        </div>

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
            size="icon"
            disabled={!canSend}
            className={cn(
              'size-10 rounded-full transition-all duration-200',
              canSend
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
                : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed',
            )}
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
          </Button>
        </div>
      </div>
    </form>
  );
}
