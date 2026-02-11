
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { 
  Search, Mic, Plus, Sparkles, X, Edit2, ArrowLeft, MoreVertical, 
  LayoutGrid, Type as FontIcon, ImageIcon, Languages, List,
  CheckCircle2, Circle, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Save, Trash2, Image as LucideImage, Mic as LucideMic, StopCircle, ListTodo, FileText, Minus, Check
} from 'lucide-react';
import { MemoryItem, MemoryType, VoiceState, MemoryStyle, Attachment } from './types';
import { MODEL_NAME, SYSTEM_INSTRUCTION, MEMORY_STORAGE_KEY } from './constants';
import { createBlob, decode, decodeAudioData } from './services/audioUtils';
import VoicePulse from './components/VoicePulse';
import MemoryCard from './components/MemoryCard';
import TodayCard from './components/TodayCard';

const App: React.FC = () => {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'editor'>('onboarding');
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'home' | 'work' | 'ideas'>('all');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isThinking: false,
    transcript: '',
    lastResponse: '',
  });

  // Panel State
  const [isFormatPanelMinimized, setIsFormatPanelMinimized] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 }); 
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  // Editor State
  const [editingNote, setEditingNote] = useState<Partial<MemoryItem>>({});
  const [activeField, setActiveField] = useState<'title' | 'content'>('content');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
  const editorContentRef = useRef<HTMLDivElement>(null);

  // Storage and Reminders
  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  useEffect(() => {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  }, [memories]);

  const updateAudioLevels = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setVoiceLevel(average / 128);
    }
    animFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, []);

  // Sync contentEditable div with editingNote content (only on initial load)
  useEffect(() => {
    if (editorContentRef.current && view === 'editor' && editingNote.id) {
      // Only sync if the div is empty or significantly different
      const currentContent = editorContentRef.current.innerHTML || '';
      const newContent = editingNote.content || '';
      
      // Only update if empty or completely different (not during typing)
      if (!currentContent || (currentContent !== newContent && !document.activeElement || document.activeElement !== editorContentRef.current)) {
        editorContentRef.current.innerHTML = newContent;
      }
    }
  }, [editingNote.id, view]);

  const saveToMemory = useCallback((args: any) => {
    const { type, content, title, tags, items, reminder_time } = args;
    const newItem: MemoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: (type as MemoryType) || 'note',
      title: title || '',
      content: content || '',
      tags: tags || ['General'],
      items: items?.map((it: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        text: it.text || it,
        completed: it.completed || false
      })),
      timestamp: Date.now(),
      reminderAt: reminder_time,
      style: { backgroundColor: '#FFFFFF', highlightColor: '#C6F35A' }
    };
    setMemories(prev => [newItem, ...prev]);
    return "Saved to Cortex successfully.";
  }, []);

  // Fix: Added missing toggleCheck function to handle checklist and task completion
  const toggleCheck = useCallback((itemId: string, index: number) => {
    setMemories(prev => prev.map(m => {
      if (m.id === itemId && m.items && m.items[index]) {
        const newItems = [...m.items];
        newItems[index] = { ...newItems[index], completed: !newItems[index].completed };
        return { ...m, items: newItems };
      }
      return m;
    }));
  }, []);

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
      
      // Basic checks for mobile/secure context
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Voice features require a secure connection (HTTPS or localhost). If you are testing on mobile, please use a secure tunnel like ngrok or localtunel.");
        return;
      }

      setIsConnecting(true);
      if (!aiRef.current) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      }
      const ai = aiRef.current;
      
      // Initialize or Resume AudioContexts (Crucial for Mobile)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
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
        parameters: {
          type: Type.OBJECT,
          description: 'Save a new note, task, checklist or reminder.',
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

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [saveFn] }],
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
                if (fc.name === 'save_to_memory') {
                  const result = saveToMemory(fc.args);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result } } }));
                }
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
      id: Math.random().toString(36).substring(2, 9),
      title: '',
      content: '',
      type: 'note',
      tags: ['Manual'],
      timestamp: Date.now(),
      style: { backgroundColor: '#FFFFFF', highlightColor: '#C6F35A', titleAlign: 'left', contentAlign: 'left', fontFamily: 'Nunito' },
      items: [],
      attachments: []
    });
    setView('editor');
  };

  const handleEditNote = (note: MemoryItem) => {
    setEditingNote(note);
    setView('editor');
  };

  const handleSaveEditor = () => {
    if (!editingNote.content) return;
    setMemories(prev => {
      const exists = prev.find(m => m.id === editingNote.id);
      if (exists) {
        return prev.map(m => m.id === editingNote.id ? { ...m, ...editingNote } as MemoryItem : m);
      }
      return [{ ...editingNote, timestamp: Date.now() } as MemoryItem, ...prev];
    });
    setView('dashboard');
  };

  const handleDeleteEditor = () => {
    if (!editingNote.id) return;
    if (confirm("Are you sure you want to delete this note?")) {
      setMemories(prev => prev.filter(m => m.id !== editingNote.id));
      setView('dashboard');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingNote(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), { type: 'image', url: base64, name: file.name }]
      }));
    };
    reader.readAsDataURL(file);
  };

  const startManualRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
           const base64 = e.target?.result as string;
           setEditingNote(prev => ({
             ...prev,
             attachments: [...(prev.attachments || []), { type: 'audio', url: base64, name: 'Recording' }]
           }));
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) { console.error(e); }
  };

  const stopManualRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const updateStyle = (styleUpdate: Partial<MemoryStyle>) => {
    setEditingNote(prev => ({
      ...prev,
      style: { ...(prev.style || {}), ...styleUpdate }
    }));
  };

  const applyHighlight = (color: string) => {
    try {
      // Use execCommand with backColor which works better
      document.execCommand('backColor', false, color);
      
      // Update content after highlighting
      setTimeout(() => {
        if (editorContentRef.current) {
          setEditingNote(prev => ({ ...prev, content: editorContentRef.current!.innerHTML }));
        }
      }, 10);
    } catch (error) {
      console.error('Highlighting error:', error);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      startPosX: panelPos.x,
      startPosY: panelPos.y
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      
      setPanelPos({
        x: dragRef.current.startPosX + dx,
        y: dragRef.current.startPosY + dy
      });
    };
    
    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, panelPos]);

  useEffect(() => {
    if (view === 'editor' && editorContentRef.current) {
      if (editorContentRef.current.innerHTML !== editingNote.content) {
        editorContentRef.current.innerHTML = editingNote.content || '';
      }
    }
  }, [editingNote.id]);

  const filteredMemories = memories.filter(m => {
    const matchesSearch = (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && m.tags.some(t => t.toLowerCase() === activeTab);
  });

  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-white flex flex-col p-8 md:justify-center items-center">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-12">
            <h1 className="text-2xl font-bold tracking-tighter">CORTEX</h1>
            <X className="w-6 h-6 text-slate-300" />
          </div>
          <div className="bg-[#F5F6F7] rounded-[50px] w-full p-8 mb-10 relative overflow-hidden flex items-center justify-center min-h-[350px]">
            <img 
              src="https://images.unsplash.com/photo-1516962080544-eac695c93791?auto=format&fit=crop&q=80&w=400" 
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-20" 
              alt="pencil art" 
            />
            <div className="relative z-10 scale-150 rotate-12 drop-shadow-2xl">
              <div className="bg-orange-500 w-12 h-40 rounded-full relative">
                 <div className="absolute top-0 w-12 h-12 bg-orange-300 rounded-full" />
                 <div className="absolute bottom-0 w-12 h-8 bg-slate-900 rounded-b-full" />
                 <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[12px] border-t-slate-900" />
              </div>
            </div>
          </div>
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold leading-tight text-slate-900">
              Start your adventure by taking notes <span className="bg-[#C6F35A] px-2 rounded-full inline-block">right away!</span>
            </h2>
          </div>
          <div className="flex gap-4 mb-12">
            {[FontIcon, Edit2, ImageIcon, Languages, List].map((Icon, idx) => (
              <div key={idx} className={`p-4 rounded-full ${idx === 0 ? 'bg-slate-900 text-white' : 'bg-[#F0F1F3] text-slate-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
            ))}
          </div>
          <button 
            onClick={() => setView('dashboard')}
            className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  if (view === 'editor') {
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden" style={{ backgroundColor: editingNote.style?.backgroundColor }}>
        <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-inherit z-30">
          <button onClick={() => setView('dashboard')} className="p-2 bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 px-4">
            <h2 className="text-xl font-bold text-slate-900">{editingNote.tags?.[0] || 'Work'}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {new Date(editingNote.timestamp || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setEditingNote(prev => ({ ...prev, type: prev.type === 'checklist' ? 'note' : 'checklist', items: prev.items || [] }))}
              className={`p-2 rounded-full flex items-center gap-2 px-4 font-bold transition-all ${editingNote.type === 'checklist' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {editingNote.type === 'checklist' ? <ListTodo className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {editingNote.type === 'checklist' ? 'Checklist' : 'Note'}
            </button>
            <button onClick={handleDeleteEditor} className="p-2 bg-rose-50 rounded-full text-rose-500 hover:bg-rose-100 transition-colors" title="Delete Note">
               <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={handleSaveEditor} className="p-2 bg-[#C6F35A] rounded-full shadow-sm text-slate-900 font-bold flex items-center gap-2 px-4 hover:bg-[#AEEA3A] transition-colors">
               <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 pt-4 pb-48 overflow-y-auto">
          <input
            type="text"
            value={editingNote.title}
            onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
            onFocus={() => setActiveField('title')}
            placeholder="Headline..."
            className="w-full bg-transparent border-none outline-none text-4xl font-black text-slate-900 placeholder-slate-200 mb-4"
            style={{ 
              textAlign: editingNote.style?.titleAlign,
              fontFamily: editingNote.style?.fontFamily
            }}
          />
          
          <div className="h-[1px] w-full bg-slate-100 mb-8" />

          <div
            ref={editorContentRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setActiveField('content')}
            onInput={(e) => {
              try {
                const target = e.currentTarget;
                if (target && target.innerHTML !== undefined) {
                  setEditingNote(prev => ({ ...prev, content: target.innerHTML }));
                }
              } catch (error) {
                console.error('Editor input error:', error);
              }
            }}
            data-placeholder="Start typing your thoughts..."
            className="w-full min-h-[50px] outline-none text-xl text-slate-700 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-200 prose prose-slate max-w-none"
            style={{ 
              textAlign: editingNote.style?.contentAlign,
              fontFamily: editingNote.style?.fontFamily,
              fontSize: editingNote.style?.fontSize ? `${editingNote.style.fontSize}px` : '18px'
            }}
          />

          {editingNote.type === 'checklist' && (
            <div className="mt-8 space-y-4">
              {editingNote.items?.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-4 group">
                  <button 
                    onClick={() => {
                      const newItems = [...(editingNote.items || [])];
                      newItems[idx] = { ...newItems[idx], completed: !newItems[idx].completed };
                      setEditingNote(prev => ({ ...prev, items: newItems }));
                    }}
                    className="flex-shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-lime-500 fill-lime-100" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 hover:text-lime-400 transition-colors" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...(editingNote.items || [])];
                      newItems[idx] = { ...newItems[idx], text: e.target.value };
                      setEditingNote(prev => ({ ...prev, items: newItems }));
                    }}
                    placeholder="List item..."
                    className={`flex-1 bg-transparent border-none outline-none text-lg transition-all ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                  />
                  <button 
                    onClick={() => {
                      setEditingNote(prev => ({ 
                        ...prev, 
                        items: prev.items?.filter((_, i) => i !== idx) 
                      }));
                    }}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  setEditingNote(prev => ({
                    ...prev,
                    items: [...(prev.items || []), { id: Math.random().toString(36).substring(2, 9), text: '', completed: false }]
                  }));
                }}
                className="flex items-center gap-3 text-slate-400 hover:text-lime-500 font-bold text-sm transition-colors py-2"
              >
                <Plus className="w-5 h-5" /> Add Task
              </button>
            </div>
          )}

          {editingNote.attachments?.map((att, idx) => (
             <div key={idx} className="relative group mt-6 mb-4 rounded-3xl overflow-hidden shadow-sm">
                {att.type === 'image' ? (
                  <img src={att.url} className="w-full h-auto max-h-[400px] object-cover" alt="attachment" />
                ) : (
                  <div className="p-4 bg-slate-900 text-white flex items-center gap-4">
                    <LucideMic className="w-6 h-6 text-[#C6F35A]" />
                    <div>
                       <div className="text-sm font-bold">Voice Recording</div>
                       <div className="text-[10px] opacity-60">PCM Audio / Native Note Attachment</div>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setEditingNote(prev => ({ ...prev, attachments: prev.attachments?.filter((_, i) => i !== idx) }))}
                  className="absolute top-2 right-2 p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
             </div>
          ))}
          
          <div className="mt-8">
            <div className="flex flex-wrap gap-2 items-center">
              {editingNote.tags?.map((tag, idx) => (
                <div key={idx} className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 flex items-center gap-2">
                  <span>#{tag}</span>
                  <button 
                    onClick={() => {
                      setEditingNote(prev => ({
                        ...prev,
                        tags: prev.tags?.filter((_, i) => i !== idx)
                      }));
                    }}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="relative">
                <button 
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  + Add Tag
                </button>
                {showTagInput && (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 flex gap-2 items-center z-50 animate-slide-up min-w-[280px]">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        try {
                          if (e.key === 'Enter' && newTag.trim()) {
                            setEditingNote(prev => ({
                              ...prev,
                              tags: [...(prev.tags || []), newTag.trim()]
                            }));
                            setNewTag('');
                            setShowTagInput(false);
                          } else if (e.key === 'Escape') {
                            setShowTagInput(false);
                            setNewTag('');
                          }
                        } catch (error) {
                          console.error('Tag input error:', error);
                        }
                      }}
                      placeholder="Tag name..."
                      autoFocus
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                    />
                    <button 
                      onClick={() => {
                        if (newTag.trim()) {
                          setEditingNote(prev => ({
                            ...prev,
                            tags: [...(prev.tags || []), newTag.trim()]
                          }));
                          setNewTag('');
                          setShowTagInput(false);
                        }
                      }}
                      className="p-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition-colors"
                      title="Save tag"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setShowTagInput(false);
                        setNewTag('');
                      }}
                      className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Floating Draggable Format Panel */}
        <div 
          className="fixed z-40 transition-shadow"
          style={{ 
            transform: `translate(${panelPos.x}px, ${panelPos.y}px)`,
            bottom: '2rem',
            right: '2rem',
            touchAction: 'none'
          }}
        >
           <div className={`bg-[#1C1C1E] rounded-[32px] overflow-hidden text-white shadow-2xl transition-all duration-300 ${isFormatPanelMinimized ? 'w-16 h-16' : 'w-[340px] md:w-[400px]'}`}>
              {/* Drag Handle & Toggle */}
              <div 
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className="p-4 flex justify-between items-center cursor-move bg-white/5"
              >
                {!isFormatPanelMinimized && <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Text Format</h4>}
                <button 
                  onClick={() => setIsFormatPanelMinimized(!isFormatPanelMinimized)}
                  className={`p-2 hover:bg-white/10 rounded-full transition-transform ${isFormatPanelMinimized ? 'rotate-180 mx-auto' : ''}`}
                >
                  {isFormatPanelMinimized ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </button>
              </div>

              {!isFormatPanelMinimized && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tools</span>
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                      <label htmlFor="file-upload" className="p-2 hover:bg-white/10 rounded-lg cursor-pointer">
                        <LucideImage className="w-5 h-5 text-slate-400" />
                      </label>
                      <button 
                        onClick={isRecording ? stopManualRecording : startManualRecording}
                        className={`p-2 rounded-lg ${isRecording ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'hover:bg-white/10 text-slate-400'}`}
                      >
                        {isRecording ? <StopCircle className="w-5 h-5" /> : <LucideMic className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
                    {[
                      { name: 'yellow', color: '#FEF08A' },
                      { name: 'lime', color: '#C6F35A' },
                      { name: 'blue', color: '#BFDBFE' },
                      { name: 'purple', color: '#E9D5FF' },
                      { name: 'pink', color: '#FBCFE8' },
                      { name: 'clear', color: 'transparent' }
                    ].map((c) => (
                      <button
                        key={c.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyHighlight(c.color)}
                        className={`w-10 h-10 rounded-full border-2 border-transparent hover:border-white transition-all overflow-hidden flex items-center justify-center`}
                        style={{ background: c.color }}
                        title={c.name === 'clear' ? 'Remove Highlight' : `Highlight ${c.name}`}
                      >
                        {c.name === 'clear' && <X className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-8">
                    {[
                      { type: 'left', icon: AlignLeft },
                      { type: 'center', icon: AlignCenter },
                      { type: 'right', icon: AlignRight },
                      { type: 'justify', icon: AlignJustify }
                    ].map((align) => {
                      const Icon = align.icon;
                      const currentAlign = activeField === 'title' ? editingNote.style?.titleAlign : editingNote.style?.contentAlign;
                      return (
                        <button 
                          key={align.type}
                          onClick={() => updateStyle({ [activeField === 'title' ? 'titleAlign' : 'contentAlign']: align.type })} 
                          className={`p-3 rounded-2xl ${currentAlign === align.type ? 'bg-[#C6F35A] text-slate-900' : 'bg-white/10'}`}
                        >
                          <Icon className="w-5 h-5 mx-auto" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500">FONT</span>
                      <select 
                        value={editingNote.style?.fontFamily} 
                        onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                        className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                      >
                        <option value="Nunito" className="text-black">Nunito</option>
                        <option value="Inter" className="text-black">Inter</option>
                        <option value="Georgia" className="text-black">Georgia</option>
                        <option value="monospace" className="text-black">Mono</option>
                      </select>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500">SIZE</span>
                       <select 
                        value={editingNote.style?.fontSize} 
                        onChange={(e) => updateStyle({ fontSize: e.target.value })}
                        className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                      >
                        <option value="16" className="text-black">Normal</option>
                        <option value="20" className="text-black">Medium</option>
                        <option value="24" className="text-black">Large</option>
                        <option value="32" className="text-black">Huge</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto flex flex-col bg-[#F5F6F7] relative">
      <nav className="px-6 py-8 flex items-center justify-between sticky top-0 bg-[#F5F6F7]/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <img src="/cortexlogo.png" className="w-12 h-12 object-contain" alt="Cortex" />
          <h1 className="text-2xl font-bold tracking-tighter text-slate-900">CORTEX</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative">
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white rounded-full py-2.5 px-6 pl-12 text-sm focus:w-80 transition-all outline-none border border-transparent focus:border-lime-400 shadow-sm"
            />
            <Search className="absolute left-4 top-2.5 w-5 h-5 text-slate-400" />
          </div>
          <button className="bg-white p-3 rounded-full shadow-sm md:hidden">
            <Search className="w-5 h-5 text-slate-900" />
          </button>
        </div>
      </nav>

      <div className="px-6 flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
        {[
          { id: 'all', label: 'All Notes', count: memories.length },
          { id: 'home', label: 'Home', count: memories.filter(m => m.tags.includes('Home')).length },
          { id: 'work', label: 'Work', count: memories.filter(m => m.tags.includes('Work')).length },
          { id: 'ideas', label: 'Ideas', count: memories.filter(m => m.tags.includes('Ideas')).length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white text-slate-400 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-[#C6F35A] text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <main className="px-6 pb-40">
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-32 h-32 mb-8 relative">
               <img src="/cortexlogo.png" className="w-full h-full object-contain opacity-20 grayscale" alt="cortex" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#F5F6F7] to-transparent" />
            </div>
            <h2 className="text-2xl font-bold text-slate-400 mb-2">Your brain is empty</h2>
            <p className="text-slate-400 max-w-xs mx-auto text-sm">Fill it with your thoughts, tasks, and creative ideas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {filteredMemories.map(item => (
              <MemoryCard 
                key={item.id} 
                item={item} 
                onToggleCheck={toggleCheck}
                onDelete={(id) => setMemories(prev => prev.filter(m => m.id !== id))}
                onClick={handleEditNote}
              />
            ))}
          </div>
        )}
      </main>

      {/* Voice Interface Overlay */}
      {isLiveActive && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-8 animate-slide-up">
          <button 
            onClick={stopVoiceInteraction}
            className="absolute top-10 right-10 p-3 bg-slate-100 rounded-full text-slate-900 hover:bg-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl">
            <VoicePulse isActive={isLiveActive} level={voiceLevel} />
            <div className="mt-16">
              <p className="text-[#AEEA3A] text-xs font-bold uppercase tracking-[0.3em] mb-4">Listening to you...</p>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                {voiceState.transcript || "Add a reminder, task or idea just by speaking."}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-full p-2 flex items-center gap-2 shadow-2xl shadow-slate-400/50">
          <button 
            disabled={isConnecting}
            onClick={startVoiceInteraction} 
            className={`p-4 transition-colors ${isConnecting ? 'text-slate-600 animate-pulse' : 'text-white hover:text-[#C6F35A]'}`}
          >
            <Mic className={`w-6 h-6 ${isConnecting ? 'animate-bounce' : ''}`} />
          </button>
          <button 
            onClick={handleCreateManualNote}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-[#C6F35A] hover:bg-[#AEEA3A] active:scale-95 shadow-inner`}
          >
            <Plus className="w-7 h-7 text-slate-900" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80" alt="avatar" />
          </div>
        </div>
        {isConnecting && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-full whitespace-nowrap animate-bounce shadow-lg">
            CONNECTING TO AI...
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
