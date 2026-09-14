import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Flag, MessageCircle, Send, UserRound } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import ReportModal from '../../../components/common/ReportModal';
import { applicationService, messagingService, recruiterService } from '../../../services';
import { useAuthContext } from '../../../context/useAuthContext';
import { useMessagingRealtime } from '../../../hooks/useMessagingRealtime';

const MessagingPage = () => {
  const { userRole } = useAuthContext();
  const [conversations, setConversations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [mobileChat, setMobileChat] = useState(false);
  const typingStopTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const [reportTarget, setReportTarget] = useState(null);

  const handleRealtimeEvent = useCallback((event) => {
    if (event.event === 'MESSAGE_CREATED' && event.message?.conversationId === selectedId) {
      setMessages((current) => [...current.filter((item) => item.id !== event.message.id), event.message]);
      setTyping(false);
    }
    if (event.event === 'TYPING_STARTED' && event.conversationId === selectedId) setTyping(true);
    if (event.event === 'TYPING_STOPPED' && event.conversationId === selectedId) setTyping(false);
  }, [selectedId]);
  const { status: realtimeStatus, sendTyping } = useMessagingRealtime({ enabled: true, onEvent: handleRealtimeEvent });

  const handleDraftChange = (event) => {
    const value = event.target.value;
    setDraft(value);
    if (!selectedId) return;
    window.clearTimeout(typingStopTimerRef.current);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(selectedId, true);
    }
    typingStopTimerRef.current = window.setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(selectedId, false);
    }, 2000);
  };

  useEffect(() => () => window.clearTimeout(typingStopTimerRef.current), []);

  useEffect(() => {
    isTypingRef.current = false;
    window.clearTimeout(typingStopTimerRef.current);
  }, [selectedId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await messagingService.getConversations();
      const items = response.data?.data || [];
      setConversations(items);
      if (!selectedId && items[0]) setSelectedId(items[0].id);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const loadApplications = async () => {
      try {
        const response = userRole === 'recruiter'
          ? await recruiterService.getAllApplications({ page: 0, size: 100 })
          : await applicationService.getMyApplications();
        const data = response.data?.data;
        setApplications(Array.isArray(data) ? data : data?.content || []);
      } catch { setApplications([]); }
    };
    loadApplications();
  }, [userRole]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return undefined; }
    let ignore = false;
    const loadMessages = async () => {
      try {
        const response = await messagingService.getMessages(selectedId);
        if (!ignore) {
          setMessages(response.data?.data || []);
          await messagingService.markRead(selectedId);
        }
      } catch (err) { if (!ignore) setError(err.response?.data?.message || 'Unable to load messages.'); }
    };
    loadMessages();
    const poll = window.setInterval(loadMessages, 10000);
    return () => { ignore = true; window.clearInterval(poll); };
  }, [selectedId]);

  const visibleConversations = useMemo(() => conversations.filter((conversation) => {
    const query = search.trim().toLowerCase();
    return !query || [conversation.otherUserName, conversation.jobTitle].some((value) => String(value || '').toLowerCase().includes(query));
  }), [conversations, search]);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);

  const startConversation = async (applicationId) => {
    setStarting(true); setError('');
    try {
      const response = await messagingService.createConversation(Number(applicationId));
      const conversation = response.data?.data;
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      setSelectedId(conversation.id); setMobileChat(true);
    } catch (err) { setError(err.response?.data?.message || 'You are not authorized to message this hiring relationship.'); }
    finally { setStarting(false); }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setSending(true); setError('');
    try {
      window.clearTimeout(typingStopTimerRef.current);
      if (isTypingRef.current) { isTypingRef.current = false; sendTyping(selectedId, false); }
      const response = await messagingService.sendMessage(selectedId, { content: draft.trim(), messageType: 'TEXT' });
      const message = response.data?.data;
      setMessages((current) => [...current.filter((item) => item.id !== message.id), message]);
      setDraft('');
      await loadConversations();
    } catch (err) { setError(err.response?.data?.message || 'Message failed to send.'); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{userRole === 'recruiter' ? 'Recruiter workspace' : 'Candidate workspace'}</p><h1 className="mt-2 text-4xl font-semibold">Messages</h1><p className="mt-2 text-slate-500">Communicate only with people connected to an application.</p></div>
        {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="grid min-h-[650px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className={`${mobileChat ? 'hidden lg:block' : 'block'} border-r border-slate-200 p-5`}>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" />
            {loading ? <p className="mt-5 text-sm text-slate-500">Loading conversations...</p> : visibleConversations.length === 0 ? <p className="mt-5 text-sm text-slate-500">No conversations yet. Start one from an application.</p> : <div className="mt-5 space-y-2">{visibleConversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => { setSelectedId(conversation.id); setMobileChat(true); }} className={`w-full rounded-2xl p-4 text-left ${selectedId === conversation.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserRound size={17} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{conversation.otherUserName || 'Hiring contact'}</strong><span className="block truncate text-xs text-slate-500">{conversation.jobTitle}</span></span>{conversation.unreadCount > 0 && <span className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white">{conversation.unreadCount}</span>}</div><p className="mt-3 truncate text-xs text-slate-400">{conversation.lastMessage || 'No messages yet'}</p></button>)}</div>}
            {applications.length > 0 && <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Start from application</p><select disabled={starting} onChange={(event) => event.target.value && startConversation(event.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm"><option value="">Choose an application</option>{applications.map((application) => <option key={application.id} value={application.id}>{application.jobTitle || `Application #${application.id}`}</option>)}</select></div>}
          </aside>
          <main className={`${mobileChat ? 'block' : 'hidden lg:flex'} min-w-0 flex-col`}>
            {!selectedConversation ? <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500"><MessageCircle size={36} /><p className="mt-4 font-semibold">Select a conversation</p><p className="mt-1 text-sm">Choose an application to begin a permitted conversation.</p></div> : <><header className="flex items-center justify-between gap-3 border-b border-slate-200 p-5"><div className="flex items-center gap-3"><button type="button" className="lg:hidden" onClick={() => setMobileChat(false)} aria-label="Back to conversations"><ArrowLeft size={20} /></button><div><h2 className="text-lg font-semibold">{selectedConversation.otherUserName}</h2><p className="text-sm text-slate-500">{selectedConversation.jobTitle} <span className="ml-2 text-xs text-emerald-600">{realtimeStatus === 'connected' ? 'Online channel' : 'Polling fallback'}</span></p></div></div><button type="button" onClick={() => setReportTarget({ targetType: userRole === 'recruiter' ? 'CANDIDATE' : 'RECRUITER', targetId: selectedConversation.otherUserId, targetLabel: selectedConversation.otherUserName || 'this person' })} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500" aria-label={`Report ${selectedConversation.otherUserName || 'this person'}`}><Flag size={13} /> Report</button></header><div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">{messages.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No messages yet.</p> : messages.map((message) => <div key={message.id} className={`group flex items-end gap-2 ${message.senderId === selectedConversation.otherUserId ? 'justify-start' : 'justify-end'}`}>{message.senderId === selectedConversation.otherUserId && <button type="button" onClick={() => setReportTarget({ targetType: 'MESSAGE', targetId: message.id, targetLabel: 'this message' })} aria-label="Report this message" className="hidden text-slate-300 hover:text-red-500 group-hover:block"><Flag size={13} /></button>}<div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.senderId === selectedConversation.otherUserId ? 'bg-white text-slate-700' : 'bg-blue-600 text-white'}`}><p>{message.content}</p><p className={`mt-1 text-[11px] ${message.senderId === selectedConversation.otherUserId ? 'text-slate-400' : 'text-blue-100'}`}>{formatTime(message.createdAt)} {message.senderId !== selectedConversation.otherUserId && (message.read ? 'Read' : 'Sent')}</p></div></div>)}{typing && <p className="text-xs text-slate-400">Typing...</p>}</div><form onSubmit={sendMessage} className="flex gap-3 border-t border-slate-200 p-4"><Input value={draft} onChange={handleDraftChange} placeholder="Write a message" /><Button type="submit" loading={sending} disabled={!draft.trim()}><Send size={16} /> Send</Button></form></>}
          </main>
        </div>
      </div>
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetLabel={reportTarget.targetLabel}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};

const formatTime = (value) => value ? new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'now';

export default MessagingPage;