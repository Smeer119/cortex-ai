import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, ListTodo, FileText, Trash2, Save, X, Plus, Check,
  Image as LucideImage, Mic as LucideMic, StopCircle, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, CheckCircle2, Circle
} from 'lucide-react';
import { Doc, Id } from '../convex/_generated/dataModel';
import { MemoryType, MemoryStyle } from '../types';

interface EditorProps {
  note: Partial<Doc<"memories">>;
  onSave: (note: Partial<Doc<"memories">>) => void;
  onDelete: (id: Id<"memories">) => void;
  onBack: () => void;
}

const Editor: React.FC<EditorProps> = ({ note, onSave, onDelete, onBack }) => {
  const [editingNote, setEditingNote] = useState<Partial<Doc<"memories">>>(note);
  const [activeField, setActiveField] = useState<'title' | 'content'>('content');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isFormatPanelMinimized, setIsFormatPanelMinimized] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const editorContentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Sync content with div
  useEffect(() => {
    if (editorContentRef.current && editorContentRef.current.innerHTML !== editingNote.content) {
      editorContentRef.current.innerHTML = editingNote.content || '';
    }
  }, [editingNote._id]);

  const handleSave = () => {
    if (!editingNote.content && !editingNote.title) return;
    onSave(editingNote);
  };

  const updateStyle = (styleUpdate: Partial<MemoryStyle>) => {
    setEditingNote(prev => ({
      ...prev,
      style: { ...(prev.style || {}), ...styleUpdate }
    }));
  };

  const applyHighlight = (color: string) => {
    document.execCommand('backColor', false, color);
    if (editorContentRef.current) {
      setEditingNote(prev => ({ ...prev, content: editorContentRef.current!.innerHTML }));
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
  }, [isDragging]);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden" style={{ backgroundColor: editingNote.style?.backgroundColor }}>
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-inherit z-30">
        <button onClick={onBack} className="p-2 bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 px-4">
          <h2 className="text-xl font-bold text-slate-900">{editingNote.tags?.[0] || 'Note'}</h2>
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
          {editingNote._id && (
            <button onClick={() => onDelete(editingNote._id as Id<"memories">)} className="p-2 bg-rose-50 rounded-full text-rose-500 hover:bg-rose-100 transition-colors" title="Delete Note">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={handleSave} className="p-2 bg-[#0066FF] rounded-full shadow-sm text-white font-bold flex items-center gap-2 px-4 hover:bg-[#1A8CFF] transition-colors">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 pt-4 pb-48 overflow-y-auto">
        <input
          type="text"
          value={editingNote.title || ''}
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
            setEditingNote(prev => ({ ...prev, content: e.currentTarget.innerHTML }));
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
                    <CheckCircle2 className="w-6 h-6 text-[#0066FF] fill-[#0066FF]/10" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-slate-300 rounded-full hover:border-[#0066FF] transition-colors" />
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
                <button onClick={() => setEditingNote(prev => ({ ...prev, items: prev.items?.filter((_, i) => i !== idx) }))} className="p-2 text-slate-300 hover:text-rose-500">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button 
              onClick={() => setEditingNote(prev => ({ ...prev, items: [...(prev.items || []), { id: Math.random().toString(36).substring(2, 9), text: '', completed: false }] }))}
              className="flex items-center gap-3 text-slate-400 hover:text-[#0066FF] font-bold text-sm py-2"
            >
              <Plus className="w-5 h-5" /> Add Task
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2 items-center">
          {editingNote.tags?.map((tag, idx) => (
            <div key={idx} className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 flex items-center gap-2">
              <span>#{tag}</span>
              <button onClick={() => setEditingNote(prev => ({ ...prev, tags: prev.tags?.filter((_, i) => i !== idx) }))} className="text-slate-400 hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="relative">
            <button onClick={() => setShowTagInput(!showTagInput)} className="px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-xs font-bold">+ Add Tag</button>
            {showTagInput && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 flex gap-2 items-center z-50 min-w-[280px]">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTag.trim()) {
                      setEditingNote(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }));
                      setNewTag('');
                      setShowTagInput(false);
                    }
                  }}
                  placeholder="Tag name..."
                  autoFocus
                  className="flex-1 px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-none"
                />
                <button onClick={() => setShowTagInput(false)} className="p-2 bg-slate-200 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Format Panel */}
      <div 
        className="fixed z-40"
        style={{ transform: `translate(${panelPos.x}px, ${panelPos.y}px)`, bottom: '2rem', right: '2rem', touchAction: 'none' }}
      >
        <div className={`bg-[#1C1C1E] rounded-[32px] overflow-hidden text-white shadow-2xl transition-all duration-300 ${isFormatPanelMinimized ? 'w-16 h-16' : 'w-[340px] md:w-[400px]'}`}>
          <div onMouseDown={handleDragStart} onTouchStart={handleDragStart} className="p-4 flex justify-between items-center cursor-move bg-white/5">
            {!isFormatPanelMinimized && <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Format</h4>}
            <button onClick={() => setIsFormatPanelMinimized(!isFormatPanelMinimized)} className="p-2 hover:bg-white/10 rounded-full">
              {isFormatPanelMinimized ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </button>
          </div>
          {!isFormatPanelMinimized && (
            <div className="p-6">
              <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
                {['#FEF08A', '#0066FF', '#BFDBFE', '#E9D5FF', '#FBCFE8', 'transparent'].map((color) => (
                  <button key={color} onClick={() => applyHighlight(color)} className="w-10 h-10 rounded-full border-2 border-transparent hover:border-white" style={{ background: color }} />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 mb-8">
                {[AlignLeft, AlignCenter, AlignRight, AlignJustify].map((Icon, i) => (
                  <button key={i} onClick={() => updateStyle({ [activeField === 'title' ? 'titleAlign' : 'contentAlign']: ['left', 'center', 'right', 'justify'][i] as any })} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20">
                    <Icon className="w-5 h-5 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;

