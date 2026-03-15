'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bolt,
  FileCode,
  Github,
  Image,
  Lightbulb,
  Paperclip,
  Plus,
  SendHorizontal,
} from 'lucide-react';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

type ChatAttachment = {
  id: string;
  name: string;
  size: number;
  kind: 'file' | 'image' | 'code';
  content?: string;
};

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M8 24C10.208 24 12 22.208 12 20V16H8C5.792 16 4 17.792 4 20C4 22.208 5.792 24 8 24Z" fill="currentColor" />
      <path d="M4 12C4 9.792 5.792 8 8 8H12V16H8C5.792 16 4 14.208 4 12Z" fill="currentColor" />
      <path d="M4 4C4 1.792 5.792 0 8 0H12V8H8C5.792 8 4 6.208 4 4Z" fill="currentColor" />
      <path d="M12 0H16C18.208 0 20 1.792 20 4C20 6.208 18.208 8 16 8H12V0Z" fill="currentColor" />
      <path d="M20 12C20 14.208 18.208 16 16 16C13.792 16 12 14.208 12 12C12 9.792 13.792 8 16 8C18.208 8 20 9.792 20 12Z" fill="currentColor" />
    </svg>
  );
}

const CODE_FILE_ACCEPT = '.ts,.tsx,.js,.jsx,.mjs,.cjs,.py,.java,.go,.rs,.php,.rb,.cs,.cpp,.c,.h,.json,.md,.yml,.yaml,.toml,.ini,.xml,.html,.css,.scss,.sql,.sh,.txt';
const MAX_ATTACHMENT_CHARS = 6000;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function truncateAttachmentContent(content: string): string {
  if (content.length <= MAX_ATTACHMENT_CHARS) return content;
  return `${content.slice(0, MAX_ATTACHMENT_CHARS)}\n\n[truncated]`;
}

function ChatInput({
  onSend,
  loading = false,
  placeholder = 'Ask Codeax what to build next...',
}: {
  onSend?: (message: string) => void | Promise<void>;
  loading?: boolean;
  placeholder?: string;
}) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [message]);

  const readFileText = async (file: File): Promise<string> => {
    try {
      const raw = await file.text();
      return truncateAttachmentContent(raw);
    } catch {
      return '';
    }
  };

  const createAttachment = async (file: File, kind: ChatAttachment['kind']): Promise<ChatAttachment> => {
    const basic: ChatAttachment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      kind,
    };

    if (kind === 'image') {
      return basic;
    }

    const shouldReadText =
      kind === 'code' ||
      file.type.startsWith('text/') ||
      /\.(json|md|yml|yaml|toml|ini|xml|html|css|scss|sql|txt)$/i.test(file.name);

    if (!shouldReadText) {
      return basic;
    }

    const content = await readFileText(file);
    return content ? { ...basic, content } : basic;
  };

  const addFiles = async (fileList: FileList | null, kind: ChatAttachment['kind']) => {
    if (!fileList || fileList.length === 0) return;

    const next = await Promise.all(Array.from(fileList).map((file) => createAttachment(file, kind)));
    setAttachments((prev) => [...prev, ...next]);
  };

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed && attachments.length === 0) return;

    let composedMessage = trimmed || 'Please analyze the attached items.';
    if (attachments.length > 0) {
      const summaryLines = attachments.map((item) => `- ${item.name} (${item.kind}, ${formatSize(item.size)})`);
      const contentBlocks = attachments
        .filter((item) => item.content)
        .map((item) => `--- ${item.name} ---\n${item.content}`);

      composedMessage += `\n\nAttached items:\n${summaryLines.join('\n')}`;
      if (contentBlocks.length > 0) {
        composedMessage += `\n\nAttached file content:\n${contentBlocks.join('\n\n')}`;
      }
    }

    void onSend?.(composedMessage);
    setMessage('');
    setAttachments([]);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[780px]">
      <div className="rounded-2xl border border-gh-border bg-gh-card/95 p-3 shadow-[0_25px_70px_rgba(1,4,9,0.55)] backdrop-blur-sm">
        <input
          ref={uploadInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files, 'file');
            event.target.value = '';
          }}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files, 'image');
            event.target.value = '';
          }}
        />
        <input
          ref={codeInputRef}
          type="file"
          accept={CODE_FILE_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files, 'code');
            event.target.value = '';
          }}
        />

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[88px] max-h-[180px] w-full resize-none rounded-xl border border-gh-border bg-gh-bg px-4 py-3 text-[15px] text-gh-heading placeholder:text-gh-text/55 focus:border-gh-green focus:outline-none"
          style={{ height: '88px' }}
        />

        {attachments.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 rounded-full border border-gh-border bg-gh-bg px-2.5 py-1 text-xs text-gh-text"
              >
                <span>{item.kind}</span>
                <span className="max-w-[180px] truncate">{item.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((current) => current.id !== item.id))}
                  className="text-gh-text/80 transition hover:text-gh-heading"
                  aria-label={`Remove ${item.name}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu((prev) => !prev)}
              className="flex size-8 items-center justify-center rounded-full border border-gh-border bg-gh-bg text-gh-text transition-colors hover:border-gh-green hover:text-gh-heading"
            >
              <Plus className={`size-4 transition-transform ${showAttachMenu ? 'rotate-45' : ''}`} />
            </button>
            {showAttachMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                <div className="absolute bottom-full left-0 z-50 mb-2 min-w-[180px] rounded-xl border border-gh-border bg-gh-card p-1.5 shadow-2xl">
                  {[
                    {
                      icon: <Paperclip className="size-4" />,
                      label: 'Upload file',
                      action: () => uploadInputRef.current?.click(),
                    },
                    {
                      icon: <Image className="size-4" />,
                      label: 'Add image',
                      action: () => imageInputRef.current?.click(),
                    },
                    {
                      icon: <FileCode className="size-4" />,
                      label: 'Import code',
                      action: () => codeInputRef.current?.click(),
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setShowAttachMenu(false);
                        item.action();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gh-text transition-colors hover:bg-gh-border/30 hover:text-gh-heading"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="ml-auto flex items-center gap-1.5 rounded-full border border-gh-border bg-gh-bg px-3 py-2 text-xs font-medium text-gh-text transition-colors hover:border-gh-green hover:text-gh-heading">
            <Lightbulb className="size-4" />
            <span className="hidden sm:inline">Plan</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={(!message.trim() && attachments.length === 0) || loading}
            className="flex items-center gap-2 rounded-full bg-gh-green px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span className="hidden sm:inline">{loading ? 'Thinking...' : 'Send'}</span>
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementBadge({ text, href = '#' }: { text: string; href?: string }) {
  const content = (
    <>
      <Bolt className="size-4 text-gh-green" />
      <span className="font-medium text-gh-heading">{text}</span>
    </>
  );

  const className =
    'inline-flex items-center gap-2 rounded-full border border-gh-border bg-gh-card/80 px-4 py-1.5 text-sm backdrop-blur-sm transition-colors hover:border-gh-green';

  return href !== '#' ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <button className={className}>{content}</button>
  );
}

function ImportButtons({ onImport }: { onImport?: (source: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gh-text/80">
      <span>or import from</span>
      {[
        { id: 'figma', name: 'Figma', icon: <FigmaIcon className="size-4" /> },
        { id: 'github', name: 'GitHub', icon: <Github className="size-4" /> },
      ].map((option) => (
        <button
          key={option.id}
          onClick={() => onImport?.(option.id)}
          className="flex items-center gap-1.5 rounded-full border border-gh-border bg-gh-card px-3 py-1.5 text-xs font-medium text-gh-text transition-colors hover:border-gh-green hover:text-gh-heading"
        >
          {option.icon}
          <span>{option.name}</span>
        </button>
      ))}
    </div>
  );
}

interface BoltChatProps {
  title?: string;
  subtitle?: string;
  announcementText?: string;
  announcementHref?: string;
  placeholder?: string;
  initialMessages?: ChatMessage[];
  onSend?: (message: string, conversation: ChatMessage[]) => Promise<string> | string;
  onImport?: (source: string) => void;
}

export function BoltStyleChat({
  title = 'What will you',
  subtitle = 'Build in Codeax today?',
  announcementText = 'Codeax Chat Workspace',
  announcementHref = '#',
  placeholder = 'What do you want to build?',
  initialMessages,
  onSend,
  onImport,
}: BoltChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages || [{ role: 'assistant', text: 'I am ready. Ask anything about your repository, PRs, security, or tests.' }],
  );
  const [loading, setLoading] = useState(false);

  const handleSend = async (message: string) => {
    const userMessage: ChatMessage = { role: 'user', text: message };
    const nextConversation = [...messages, userMessage];
    setMessages(nextConversation);
    setLoading(true);

    try {
      if (!onSend) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Chat handler is not configured yet. Please wire the page with API integration.' },
        ]);
        return;
      }

      const answer = await onSend(message, nextConversation);
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I could not reach the chatbot backend right now. Please confirm the API server on port 8000 is healthy.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card relative overflow-hidden rounded-3xl px-4 py-8 sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(42, 209, 120, 0.2), transparent 35%), radial-gradient(circle at 88% 90%, rgba(83, 183, 255, 0.2), transparent 42%)',
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-7">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <AnnouncementBadge text={announcementText} href={announcementHref} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight text-gh-heading sm:text-5xl">
            {title}{' '}
            <span className="bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text italic text-transparent">ship</span>{' '}
            faster?
          </h1>
          <p className="mt-2 text-sm font-medium text-gh-text sm:text-base">{subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[780px]"
        >
          <div className="mb-4 max-h-[360px] overflow-y-auto rounded-2xl border border-gh-border bg-gh-bg/75 p-3 sm:p-4">
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((item, index) => (
                  <motion.div
                    key={`${item.role}-${index}`}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: Math.min(index * 0.02, 0.14) }}
                    className={`max-w-[88%] rounded-xl border px-3 py-2 text-sm ${
                      item.role === 'user'
                        ? 'ml-auto border-gh-green/80 bg-gradient-to-br from-gh-green/20 to-emerald-500/10 text-gh-heading'
                        : 'border-gh-border bg-gh-card/75 text-gh-text'
                    }`}
                  >
                    {item.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-fit rounded-xl border border-gh-border bg-gh-card/75 px-3 py-2 text-sm text-gh-text"
                >
                  Codeax is thinking...
                </motion.div>
              ) : null}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="w-full"
        >
          <ChatInput placeholder={placeholder} onSend={handleSend} loading={loading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <ImportButtons onImport={onImport} />
        </motion.div>
      </div>
    </div>
  );
}
