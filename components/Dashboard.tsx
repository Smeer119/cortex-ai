import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { 
  Search, Mic, Plus, X, User as UserIcon, Bell
} from 'lucide-react';
import { MemoryType, VoiceState } from '../types';
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';
import VoicePulse from './VoicePulse';
import MemoryCard from './MemoryCard';
import ProfilePage from './ProfilePage';
import Editor from './Editor';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../convex/_generated/api';
import { Doc, Id } from '../convex/_generated/dataModel';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [view, setView] = useState<'dashboard' | 'editor' | 'profile'>('dashboard');
  const [activeTab, setActiveTab] = useState<'all' | 'home' | 'work' | 'ideas'>('all');
  const [voiceState, setVoiceState] = useState<VoiceState>({ isActive: false, transcript: '', isProcessing: false });
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState<Set<string>>(new Set());
  const lastCheckRef = useRef<number>(Date.now());

  // Convex queries and mutations
  const memories = useQuery(api.memories.getMemories) || [];
  // Use `any` for createMemory to bypass strict typing if needed, or update types
  const createMemory = useMutation(api.memories.createMemory);
  const updateMemory = useMutation(api.memories.updateMemory);
  const deleteMemory = useMutation(api.memories.deleteMemory);
  const toggleChecklistItem = useMutation(api.memories.toggleChecklistItem);


  // Editor State
  const [editingNote, setEditingNote] = useState<Partial<Doc<"memories">>>({});

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  const updateAudioLevels = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setVoiceLevel(average / 128);
    }
    animFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, []);

  // Keep memories fresh for callbacks
  const memoriesRef = useRef(memories);
  useEffect(() => { memoriesRef.current = memories; }, [memories]);

  const saveToMemory = useCallback(async (args: any) => {
    const { type, content, title, tags, items, reminder_time } = args;
    try {
      const processedItems = items?.map((item: any) => ({
        ...item,
        id: item.id || Math.random().toString(36).substring(2, 9)
      }));

      await createMemory({
        type: (type as any) || 'note',
        title: title || '',
        content: content || '',
        tags: tags || ['General'],
        items: processedItems,
        reminderAt: reminder_time,
      });
      return "Saved to Cortex successfully.";
    } catch (e) {
      console.error("Failed to save via voice:", e);
      return "Failed to save to Cortex.";
    }
  }, [createMemory]);

  const appendToMemory = useCallback(async (args: any) => {
    const { target_title, content, items } = args;
    const memories = memoriesRef.current;
    
    // Fuzzy find best match
    const target = memories.find(m => 
      (m.title || '').toLowerCase().includes(target_title.toLowerCase())
    );

    if (!target) {
      // Fallback: Create new if not found, but inform user
      return await saveToMemory({ title: target_title, content, items, type: items ? 'checklist' : 'note' });
    }

    try {
      const newContent = content ? (target.content + '\n' + content) : target.content;
      let newItems = target.items || [];
      
      if (items && items.length > 0) {
        const processedItems = items.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(2, 9)
        }));
        newItems = [...newItems, ...processedItems];
      }

      await updateMemory({
        memoryId: target._id,
        content: newContent,
        items: newItems,
      });
      return `Updated "${target.title}" successfully.`;
    } catch (e) {
      console.error("Failed to append:", e);
      return "Failed to update memory.";
    }
  }, [updateMemory, saveToMemory]);

  const stopVoiceInteraction = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (sessionRef.current) sessionRef.current.close();
    setIsLiveActive(false);
    setVoiceLevel(0);
    setVoiceState(prev => ({ ...prev, isListening: false, isThinking: false }));
  };

  const startVoiceInteraction = async () => {
    try {
      if (isLiveActive) { stopVoiceInteraction(); return; }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Voice features require a secure connection (HTTPS or localhost).");
        return;
      }

      setIsConnecting(true);
      if (!aiRef.current) {
        aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      }
      const ai = aiRef.current;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      streamRef.current = stream;
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;
      updateAudioLevels();

      const saveFn: FunctionDeclaration = {
        name: 'save_to_memory',
        description: 'Save a new note, task, checklist or reminder.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, completed: { type: Type.BOOLEAN } } } },
            reminder_time: { type: Type.NUMBER }
          },
          required: ['type', 'content'],
        },
      };

      const appendFn: FunctionDeclaration = {
        name: 'append_to_memory',
        description: 'Add content or items to an existing note/checklist.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            target_title: { type: Type.STRING, description: "Title of the existing note to update" },
            content: { type: Type.STRING, description: "Text to append" },
            items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, completed: { type: Type.BOOLEAN } } } }
          },
          required: ['target_title'],
        },
      };

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [saveFn, appendFn] }],
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            setIsConnecting(false);
            setVoiceState(prev => ({ ...prev, isListening: true }));
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(session => session.sendRealtimeInput({ media: createBlob(inputData) }));
            };
            sourceNode.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setVoiceState(prev => ({ ...prev, transcript: msg.serverContent!.inputTranscription!.text }));
            }
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                let result = "Unknown tool.";
                if (fc.name === 'save_to_memory') {
                   result = await saveToMemory(fc.args);
                } else if (fc.name === 'append_to_memory') {
                   result = await appendToMemory(fc.args);
                }
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result } } }));
              }
            }
          },
          onerror: (e) => {
            console.error("Voice Error:", e);
            stopVoiceInteraction();
            setIsConnecting(false);
          },
          onclose: () => {
            stopVoiceInteraction();
            setIsConnecting(false);
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { 
      console.error("Start Voice Error:", err);
      stopVoiceInteraction(); 
      setIsConnecting(false);
    }
  };

  const handleCreateManualNote = () => {
    setEditingNote({
      title: '',
      content: '',
      type: 'note',
      tags: ['Manual'],
      timestamp: Date.now(),
      style: { backgroundColor: '#FFFFFF', highlightColor: '#0066FF', titleAlign: 'left', contentAlign: 'left', fontFamily: 'Nunito' }
    });
    setView('editor');
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setView('editor');
  };

  const handleSaveEditor = async (note: Partial<Doc<"memories">>) => {
    try {
      if (note._id) {
        await updateMemory({
          memoryId: note._id,
          title: note.title,
          content: note.content,
          tags: note.tags,
          items: note.items,
          type: note.type,
          reminderAt: note.reminderAt,
          style: note.style,
        });
      } else {
        await createMemory({
          type: note.type || 'note',
          title: note.title,
          content: note.content || '',
          tags: note.tags || [],
          items: note.items,
          reminderAt: note.reminderAt,
          style: note.style,
        });
      }
      setView('dashboard');
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save note.");
    }
  };

  const handleDeleteEditor = async (id: Id<"memories">) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteMemory({ memoryId: id });
        setView('dashboard');
      } catch (e) {
        console.error("Delete error:", e);
      }
    }
  };

  const handleDeleteCard = async (id: string) => {
      if (confirm("Are you sure you want to delete this note?")) {
        try {
          // @ts-ignore
          await deleteMemory({ memoryId: id });
        } catch (e) {
          console.error("Delete error:", e);
        }
      }
  };

  const filteredMemories = memories.filter(m => {
    const matchesTab = activeTab === 'all' || m.tags.includes(activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
    const searchQueryLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (m.title || '').toLowerCase().includes(searchQueryLower) || 
      m.content.toLowerCase().includes(searchQueryLower) || 
      m.tags.some(t => t.toLowerCase().includes(searchQueryLower));
    return matchesTab && matchesSearch;
  });

  if (view === 'profile') return <ProfilePage onBack={() => setView('dashboard')} />;
  if (view === 'editor') return <Editor note={editingNote} onSave={handleSaveEditor} onDelete={handleDeleteEditor} onBack={() => setView('dashboard')} />;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F5F6F7] relative overflow-hidden">
      {/* Background Decor */}
      {/* Background Decor - Brighter & Starts from Top */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-100/80 to-transparent pointer-events-none w-full" />
      <div className="absolute top-32 -right-24 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-[#1A8CFF]/10 rounded-full blur-3xl pointer-events-none" />

      <nav className="w-full px-6 py-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src="/cortexlogo.png" className="w-8 h-8 object-contain" alt="Cortex" />
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">CORTEX</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative">
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/80 backdrop-blur-sm rounded-full py-2.5 px-6 pl-12 text-sm w-64 focus:w-80 transition-all outline-none border border-transparent focus:border-[#0066FF] shadow-sm"
            />
            <Search className="absolute left-4 top-2.5 w-5 h-5 text-slate-400" />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-600 hover:text-[#0066FF] hover:shadow-md transition-all relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {/* <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span> */}
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 font-medium">No new notifications</p>
                    <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="px-6 flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
        {['all', 'home', 'work', 'ideas'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all border ${
              activeTab === tab 
                ? 'bg-[#0066FF] text-white border-transparent shadow-lg shadow-blue-500/30 scale-105' 
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-[#0066FF] hover:shadow-md'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <main className="px-6 pb-40 flex-1">
        {filteredMemories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#0066FF]/10 blur-3xl rounded-full scale-150" />
              <img src="/cortexlogo.png" className="w-32 h-32 object-contain relative z-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700" alt="Cortex" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Your brain is empty</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Cortex is ready to store your thoughts, tasks, and ideas. Start by using voice or manual entry.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMemories.map(item => (
              <MemoryCard 
                key={item._id} 
                item={item as any} 
                onToggleCheck={(id, idx) => toggleChecklistItem({ memoryId: id as any, itemId: (item as any).items[idx].id })}
                onDelete={(id) => handleDeleteCard(id)}
                onClick={handleEditNote}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </main>

      {/* Voice UI Overlay */}
      {isLiveActive && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center animate-slide-up">
          <button onClick={stopVoiceInteraction} className="absolute top-10 right-10 p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X className="w-6 h-6" /></button>
          <VoicePulse isActive={isLiveActive} level={voiceLevel} />
          <div className="mt-16 text-center px-6">
            <p className="text-[#0066FF] text-xs font-bold uppercase tracking-[0.3em] mb-4">Listening...</p>
            <h2 className="text-3xl font-bold text-slate-900">{voiceState.transcript || "Speak now..."}</h2>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar */}
      {/* Gradient Fade at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F5F6F7] via-[#F5F6F7]/80 to-transparent pointer-events-none z-30" />

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-8 bg-[#18181b] backdrop-blur-2xl px-8 py-4 rounded-[32px] shadow-2xl border border-white/5">
          
          {/* Mic Button - Now Round & Balanced */}
          <button 
            onClick={startVoiceInteraction} 
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group ${
              isConnecting 
                ? 'bg-slate-800 text-slate-500 animate-pulse' 
                : 'bg-slate-800 text-white hover:bg-[#0066FF] hover:-translate-y-1'
            }`}
          >
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Main Action - Center & Prominent */}
          <button 
            onClick={handleCreateManualNote} 
            className="w-16 h-16 rounded-full bg-[#0066FF] flex items-center justify-center hover:bg-[#1A8CFF] active:scale-95 transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-1"
          >
            <Plus className="w-8 h-8 text-white" />
          </button>

          {/* Profile Button - Round & Balanced */}
          <button 
            onClick={() => setView('profile')} 
            className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center transition-all hover:ring-2 hover:ring-[#0066FF] hover:-translate-y-1"
          >
            {profile?.name ? (
               <div className="w-full h-full bg-gradient-to-br from-[#0066FF] to-[#0047B3] flex items-center justify-center text-white font-bold text-lg">
                  {profile.name.charAt(0).toUpperCase()}
               </div>
            ) : (
               <UserIcon className="w-5 h-5 text-slate-400" />
            )}
          </button>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
