'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarDaysIcon, ClockIcon, VideoCameraIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/fetch/apiFetch';

interface ScheduledCall {
  id: string;
  scheduled_time: string;
  topic?: string;
  status: string;
  meet_link?: string;
  created_at: string;
}

interface CallSectionProps {
  calls: ScheduledCall[];
  loading: boolean;
  onRefresh?: () => void;
}

// 15-minute increments for sophistication
const timeSlots = Array.from({ length: (21 - 7) * 4 + 1 }).map((_, i) => {
  const minutes = (7 * 60) + (i * 15);
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
});

export default function CallSection({ calls, loading, onRefresh }: CallSectionProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [topic, setTopic] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editing, setEditing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show content when selections are made
  useEffect(() => {
    if (selectedTime && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedTime]);

  useEffect(() => {
    if (selectedDate && !selectedTime) {
      // Scroll a bit down to show time slots
      const el = document.getElementById('time-selection-picker');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedDate, selectedTime]);

  const scheduleCall = async () => {
    if (!selectedDate || !selectedTime) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      await apiFetch('/api/calls', {
        method: 'POST',
        body: JSON.stringify({ scheduledAt, topic }),
      });
      setScheduled(true);
      setSelectedDate('');
      setSelectedTime('');
      setTopic('');
      onRefresh?.();
      setTimeout(() => setScheduled(false), 3000);
    } catch (error) {
      console.error('Failed to schedule call:', error);
    } finally {
      setScheduling(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setMonth(max.getMonth() + 2);
    return max.toISOString().split('T')[0];
  };

  // Render a basic month grid for the given month offset (0 = current month,
  // 1 = next month). Clicking a day selects it (if within min/max range).
  const renderMonthGrid = (monthOffset: number) => {
    const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Normalize so Sunday=0 stays as-is; our grid will show Sun..Sat
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const min = getMinDate();
    const max = getMaxDate();

    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">
            {base.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {/* header cells */}
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((s) => (
            <div key={s} className="h-8 w-8 flex items-center justify-center text-xs text-slate-500 font-semibold">
              {s}
            </div>
          ))}

          {/* date cells */}
          {cells.map((c, idx) => {
            if (c === null) return <div key={`empty-${idx}`} className="h-8 w-8" />;
            const dayStr = String(c).padStart(2, '0');
            const monthStr = String(month + 1).padStart(2, '0');
            const dateISO = `${year}-${monthStr}-${dayStr}`;
            const disabled = dateISO < min || dateISO > max;
            const isSelected = selectedDate === dateISO;
            return (
              <button
                key={`day-${idx}`}
                type="button"
                onClick={() => !disabled && setSelectedDate(dateISO)}
                disabled={disabled}
                className={`h-8 w-8 rounded ${isSelected ? 'bg-slate-900 text-white' : disabled ? 'text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const upcomingCalls = calls.filter(
    (c) => c.status === 'scheduled' && new Date(c.scheduled_time) > new Date()
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="h-6 w-48 rounded bg-slate-200" />
            <div className="mt-4 h-32 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main title removed as requested */}

      {/* Upcoming Calls */}
      {upcomingCalls.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="flex items-center gap-2 font-medium text-blue-900">
            <VideoCameraIcon className="h-5 w-5" />
            Upcoming Calls
          </h3>
          <div className="mt-3 space-y-2">
            {upcomingCalls.map((call) => (
              <div key={call.id} className="rounded-lg bg-white p-3">
                {editingCallId === call.id ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-900">Edit Call</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="rounded-lg border px-2 py-1" />
                      <select value={editTime} onChange={(e) => setEditTime(e.target.value)} className="rounded-lg border px-2 py-1">
                        <option value="">Select time</option>
                        {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <input type="text" value={editTopic} onChange={(e) => setEditTopic(e.target.value)} placeholder="Topic (optional)" className="mt-1 w-full rounded-lg border px-3 py-2" />
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        if (!editDate || !editTime) return alert('Please select date and time');
                        setEditing(true);
                        try {
                          const scheduledAt = new Date(`${editDate}T${editTime}`).toISOString();
                          await apiFetch(`/api/calls/${call.id}`, { method: 'PATCH', body: JSON.stringify({ scheduledAt, topic: editTopic }) });
                          setEditingCallId(null);
                          onRefresh?.();
                        } catch (err) {
                          console.error('Failed to update call', err);
                          alert('Failed to update call');
                        } finally { setEditing(false); }
                      }} className="rounded-lg bg-slate-900 px-3 py-1 text-white">Save</button>
                      <button onClick={() => setEditingCallId(null)} className="rounded-lg border px-3 py-1">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(call.scheduled_time).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(call.scheduled_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {call.topic && ` • ${call.topic}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.meet_link && (
                        <a href={call.meet_link} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700">Join</a>
                      )}
                      <button onClick={() => {
                        // Prepare edit values
                        const d = new Date(call.scheduled_time);
                        setEditDate(d.toISOString().split('T')[0]);
                        setEditTime(d.toTimeString().slice(0,5));
                        setEditTopic(call.topic || '');
                        setEditingCallId(call.id);
                      }} className="rounded-lg border px-3 py-1 text-sm">Edit</button>
                      <button onClick={async () => {
                        if (!confirm('Cancel this call?')) return;
                        try {
                          await apiFetch(`/api/calls/${call.id}`, { method: 'DELETE' });
                          onRefresh?.();
                        } catch (err) { console.error('Failed to cancel call', err); alert('Failed to cancel call'); }
                      }} className="rounded-lg border px-3 py-1 text-sm text-red-600">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule New Call */}
      {!showCalendar ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-2xl bg-amber-50 p-4 text-amber-600 ring-1 ring-amber-100">
              <CalendarDaysIcon className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Need personal assistance?</h3>
              <p className="text-base text-slate-600 max-w-sm mx-auto">
                Schedule a 1-on-1 call with our travel experts to solve any doubts about your upcoming experience.
              </p>
            </div>
            <button
              onClick={() => setShowCalendar(true)}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
            >
              Schedule a call
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Select a date and time</h3>
            <button 
              onClick={() => { setShowCalendar(false); setSelectedDate(''); setSelectedTime(''); }}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Go back
            </button>
          </div>

          {scheduled ? (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Call Scheduled!</p>
                <p className="text-sm text-green-700">
                  You&apos;ll receive a confirmation email with the meeting link.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Date Selection */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {renderMonthGrid(0)}
                {renderMonthGrid(1)}
              </div>

              {/* Time Selection - Modern Sophisticated Row */}
              {selectedDate && (
                <div id="time-selection-picker" className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-widest">
                    <ClockIcon className="h-4 w-4" />
                    Available Times
                  </div>
                  
                  <div className="w-full overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`
                            px-5 py-3 rounded-xl text-sm font-bold transition-all border
                            ${selectedTime === time 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                            }
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Topic & CTA */}
              {selectedDate && selectedTime && (
                <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-800 uppercase tracking-widest">Optional Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What would you like to discuss?"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <button
                    onClick={scheduleCall}
                    disabled={scheduling}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white transition-all hover:bg-slate-800 hover:shadow-xl disabled:opacity-50 active:scale-[0.99]"
                  >
                    {scheduling ? 'Scheduling...' : 'Confirm Meeting'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Past Calls */}
      {calls.filter((c) => c.status === 'completed').length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Call History</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {calls
              .filter((c) => c.status === 'completed')
              .map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(call.scheduled_time).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-500">{call.topic || 'General inquiry'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(call.status)}`}>
                    {call.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
