'use client';

import React, { useRef, useState } from 'react';
import { SavedReply, User } from '@/lib/api';

interface MessageComposerProps {
  canSend: boolean;
  isInactive: boolean;
  isNoteMode: boolean;
  newMessage: string;
  noteDraft: string;
  sending: boolean;
  savingNote: boolean;
  restrictedMessage?: string;
  inactiveLabel?: string;
  staff: User[];
  savedReplies: SavedReply[];
  onMessageChange: (value: string) => void;
  onNoteDraftChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onMentionSelect: (agent: User) => void;
  onSavedReplySelect: (reply: SavedReply) => void;
  onToggleNoteMode: () => void;
  onOpenInternalNotes: () => void;
  onOpenMoreActions: () => void;
}

export function MessageComposer({
  canSend,
  isInactive,
  isNoteMode,
  newMessage,
  noteDraft,
  sending,
  savingNote,
  restrictedMessage,
  inactiveLabel,
  staff,
  savedReplies,
  onMessageChange,
  onNoteDraftChange,
  onSubmit,
  onMentionSelect,
  onSavedReplySelect,
  onToggleNoteMode,
  onOpenInternalNotes,
  onOpenMoreActions,
}: MessageComposerProps) {
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showSavedReplies, setShowSavedReplies] = useState(false);
  const [savedReplyQuery, setSavedReplyQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (value: string) => {
    if (isNoteMode) {
      onNoteDraftChange(value);
      return;
    }

    onMessageChange(value);

    const atIndex = value.lastIndexOf('@');
    if (atIndex >= 0) {
      setMentionQuery(value.slice(atIndex + 1).trim());
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
      setMentionQuery('');
    }

    const slashIndex = value.lastIndexOf('/');
    if (slashIndex >= 0 && !value.slice(slashIndex).includes(' ')) {
      setSavedReplyQuery(value.slice(slashIndex + 1));
      setShowSavedReplies(true);
    } else {
      setShowSavedReplies(false);
      setSavedReplyQuery('');
    }
  };

  const filteredStaff = staff.filter((agent) => {
    if (!mentionQuery) return true;
    const q = mentionQuery.toLowerCase();
    return agent.name.toLowerCase().includes(q) || agent.email.toLowerCase().includes(q);
  });

  const filteredReplies = savedReplies.filter((reply) => {
    if (!savedReplyQuery) return true;
    const q = savedReplyQuery.toLowerCase();
    return (reply.shortcut ?? '').toLowerCase().includes(q) || reply.name.toLowerCase().includes(q);
  });

  if (!canSend && !isNoteMode) {
    return (
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto text-center py-6 px-4 rounded-2xl bg-gray-50 border border-gray-100">
          <p className="text-sm font-medium text-gray-700">
            {isInactive ? inactiveLabel || 'This conversation is closed' : 'Reply restricted'}
          </p>
          {!isInactive && restrictedMessage && (
            <p className="text-xs text-gray-500 mt-1">{restrictedMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 sm:px-6 py-3 safe-area-bottom">
      <form onSubmit={onSubmit} className="max-w-2xl mx-auto relative">
        {isNoteMode && (
          <div className="mb-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Private note — only you can see this
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={() => {
              // Placeholder for future file upload support
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Attach file"
            aria-label="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <textarea
              value={isNoteMode ? noteDraft : newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              placeholder={isNoteMode ? 'Write a private note…' : 'Message…'}
              rows={1}
              className={`w-full resize-none rounded-2xl border px-4 py-2.5 text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors ${
                isNoteMode
                  ? 'bg-amber-50/50 border-amber-200 focus:border-amber-300'
                  : 'bg-gray-50 border-gray-200 focus:border-gray-300 focus:bg-white'
              }`}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={sending || savingNote}
            />
          </div>

          <div className="relative flex-shrink-0" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="More actions"
              aria-label="More actions"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    onClick={() => {
                      onToggleNoteMode();
                      setShowMoreMenu(false);
                    }}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {isNoteMode ? 'Switch to reply' : 'Private note'}
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    onClick={() => {
                      onOpenInternalNotes();
                      setShowMoreMenu(false);
                    }}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Team notes
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    onClick={() => {
                      onOpenMoreActions();
                      setShowMoreMenu(false);
                    }}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Conversation settings
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isNoteMode
                ? savingNote || !noteDraft.trim()
                : sending || !newMessage.trim()
            }
            className="flex-shrink-0 p-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            {sending || savingNote ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {showMentionList && !isNoteMode && filteredStaff.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide border-b border-gray-50">
              Hand off to
            </div>
            {filteredStaff.map((agent) => (
              <button
                key={agent.id}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50"
                onClick={() => {
                  onMentionSelect(agent);
                  setShowMentionList(false);
                  setMentionQuery('');
                }}
              >
                <span className="text-gray-900 font-medium">{agent.name}</span>
                <span className="block text-xs text-gray-400">{agent.email}</span>
              </button>
            ))}
          </div>
        )}

        {showSavedReplies && !isNoteMode && filteredReplies.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-100 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide border-b border-gray-50">
              Saved replies
            </div>
            {filteredReplies.map((reply) => (
              <button
                key={reply.id}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50"
                onClick={() => {
                  onSavedReplySelect(reply);
                  setShowSavedReplies(false);
                  setSavedReplyQuery('');
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{reply.name}</span>
                  {reply.shortcut && (
                    <span className="text-[11px] text-gray-400">{reply.shortcut}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{reply.body}</p>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
