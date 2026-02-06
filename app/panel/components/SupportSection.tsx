'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, PlusIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/fetch/apiFetch';

interface TicketReply {
  id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority?: string;
  created_at: string;
  replies?: TicketReply[];
}

interface SupportSectionProps {
  tickets: Ticket[];
  loading: boolean;
  onRefresh?: () => void;
}

export default function SupportSection({ tickets, loading, onRefresh }: SupportSectionProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.replies]);

  // Ensure section is visible when selecting a ticket
  useEffect(() => {
    if (selectedTicketId) {
      const el = document.getElementById('section-support');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedTicketId]);

  const sendReply = async () => {
    if (!selectedTicketId || !newMessage.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/api/support/tickets/${selectedTicketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage }),
      });
      setNewMessage('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify(newTicket),
      });
      setNewTicket({ subject: '', message: '' });
      setShowNewTicket(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'closed':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Help & Support</h2>
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-16 rounded bg-slate-100" />
            <div className="h-16 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  // New Ticket Form
  if (showNewTicket) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNewTicket(false)}
            className="rounded-lg p-1 hover:bg-slate-100"
          >
            <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-semibold text-slate-900">New Support Ticket</h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Subject</label>
            <input
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-slate-500"
              placeholder="What do you need help with?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Message</label>
            <textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket((prev) => ({ ...prev, message: e.target.value }))}
              rows={5}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-slate-500"
              placeholder="Describe your issue or question in detail..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowNewTicket(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createTicket}
              disabled={creating || !newTicket.subject.trim() || !newTicket.message.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ticket Chat View
  if (selectedTicket) {
    return (
      <div className="flex h-[calc(100vh-12rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => setSelectedTicketId(null)}
            className="rounded-lg p-1 hover:bg-slate-100"
          >
            <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">{selectedTicket.subject}</h2>
            <p className="text-sm text-slate-500">
              Ticket #{selectedTicket.id.slice(0, 8)} • {new Date(selectedTicket.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
            {selectedTicket.status}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Initial message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-slate-900 px-4 py-2 text-white">
              <p className="text-sm">{selectedTicket.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Replies */}
          {selectedTicket.replies?.map((reply) => (
            <div key={reply.id} className={`flex ${reply.is_staff ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  reply.is_staff
                    ? 'rounded-bl-md bg-slate-100 text-slate-900'
                    : 'rounded-br-md bg-slate-900 text-white'
                }`}
              >
                {reply.is_staff && (
                  <p className="text-xs font-medium text-slate-500 mb-1">Support Team</p>
                )}
                <p className="text-sm">{reply.message}</p>
                <p className={`mt-1 text-xs ${reply.is_staff ? 'text-slate-400' : 'text-slate-400'}`}>
                  {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {selectedTicket.status !== 'closed' && (
          <div className="border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                placeholder="Type your message..."
              />
              <button
                type="button"
                onClick={sendReply}
                disabled={sending || !newMessage.trim()}
                className="rounded-xl bg-slate-900 p-2 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Ticket List
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Help & Support</h2>
        <button
          type="button"
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No support tickets</h3>
          <p className="mt-2 text-sm text-slate-500">
            Need help? Create a ticket and our team will respond shortly.
          </p>
          <button
            type="button"
            onClick={() => setShowNewTicket(true)}
            className="mt-6 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            Create Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="relative">
              <button
                type="button"
                onClick={() => setSelectedTicketId(ticket.id)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:shadow-md"
              >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">{ticket.subject}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-1">{ticket.message}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                {ticket.replies && ticket.replies.length > 0 && (
                  <span>{ticket.replies.length} replies</span>
                )}
              </div>
              </button>
              {/* Solved button positioned to the right */}
              {ticket.status !== 'closed' && (
                <div className="absolute right-3 top-3">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await apiFetch(`/api/support/tickets/${ticket.id}/resolve`, {
                          method: 'PATCH',
                        });
                        onRefresh?.();
                      } catch (err) {
                        console.error('Failed to mark ticket solved', err);
                      }
                    }}
                    className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Solved
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
