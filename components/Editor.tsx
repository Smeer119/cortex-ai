import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, ListTodo, FileText, Trash2, Save, X, Plus, Check,
  Image as LucideImage, Mic as LucideMic, StopCircle, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, CheckCircle2, Circle, Bold, Italic, Underline, Palette, Bell
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
  const [showReminderInput, setShowReminderInput] = useState(false);
  const [reminderDate, setReminderDate] = useState(note.reminderAt ? new Date(note.reminderAt).toISOString().slice(0, 16) : '');
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

  const applyColor = (color: string) => {
    // Using foreColor for text color as requested
    document.execCommand('foreColor', false, color);
    if (editorContentRef.current) {
        const content = editorContentRef.current.innerHTML;
        setEditingNote(prev => ({ ...prev, content }));
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

  const toggleFormat = (command: string) => {
    document.execCommand(command, false);
    if (editorContentRef.current) {
        const content = editorContentRef.current.innerHTML;
        setEditingNote(prev => ({ ...prev, content }));
    }
  };

  const setReminder = () => {
     if (reminderDate) {
         setEditingNote(prev => ({ ...prev, reminderAt: new Date(reminderDate).getTime() }));
         setShowReminderInput(false);
     }
  };

  const clearReminder = () => {
      setEditingNote(prev => ({ ...prev, reminderAt: undefined }));
      setReminderDate('');
      setShowReminderInput(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
           const imgHtml = `<div class="my-4"><img src="${result}" class="rounded-xl shadow-sm max-w-full" style="display: block; margin: 0 auto; max-height: 400px; object-fit: contain;" /></div><p><br/></p>`;
           
           if (editorContentRef.current) {
               editorContentRef.current.focus();
               // Use insertHTML to place image at cursor
               const success = document.execCommand('insertHTML', false, imgHtml);
               // Fallback if execCommand fails or isn't supported (though it is widely supported for contentEditable)
               if (!success) {
                   setEditingNote(prev => ({ ...prev, content: (prev.content || '') + imgHtml }));
               } else {
                   setEditingNote(prev => ({ ...prev, content: editorContentRef.current?.innerHTML }));
               }
           } else {
               setEditingNote(prev => ({ ...prev, content: (prev.content || '') + imgHtml }));
           }
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-transparent transition-all duration-300">
        <button onClick={onBack} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 px-4">
          <h2 className="text-xl font-bold text-slate-900">{editingNote.tags?.[0] || 'Note'}</h2>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {new Date(editingNote.timestamp || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {editingNote.reminderAt && (
                <div className="flex items-center gap-1 text-[#0066FF] text-xs font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">
                    <Bell className="w-3 h-3" />
                    {new Date(editingNote.reminderAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 relative">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
          />
          {showReminderInput && (
              <>
                <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowReminderInput(false)} />
                <div className="absolute top-12 right-0 bg-white p-4 rounded-xl shadow-2xl border border-slate-100 z-50 w-72 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Set Reminder</h4>
                    <input 
                        type="datetime-local" 
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm mb-4 outline-none focus:border-[#0066FF]"
                    />
                    <div className="flex gap-2">
                        {editingNote.reminderAt && (
                            <button onClick={clearReminder} className="flex-1 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">Clear</button>
                        )}
                        <button onClick={setReminder} className="flex-1 py-2 bg-[#0066FF] text-white text-xs font-bold rounded-lg hover:bg-[#0052CC] transition-colors">Set</button>
                    </div>
                </div>
              </>
          )}

          <button 
            onClick={() => setEditingNote(prev => {
              const newType = prev.type === 'checklist' ? 'note' : 'checklist';
              let newItems = prev.items || [];
              if (newType === 'checklist' && newItems.length === 0) {
                 newItems = [{ id: Math.random().toString(36).substring(2, 9), text: '', completed: false }];
              }
              return { ...prev, type: newType, items: newItems };
            })}
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
            const content = e.currentTarget.innerHTML;
            setEditingNote(prev => ({ ...prev, content }));
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
              <>
                <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowTagInput(false)} />
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 flex gap-2 items-center z-50 w-[90vw] max-w-[320px]">
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
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Format Panel */}
      <div 
        className="fixed z-40"
        style={{ transform: `translate(${panelPos.x}px, ${panelPos.y}px)`, bottom: '2rem', right: '2rem', touchAction: 'none' }}
      >
        <div className={`bg-[#1C1C1E]/95 backdrop-blur-xl rounded-[32px] overflow-hidden text-white shadow-2xl transition-all duration-300 border border-white/10 ${isFormatPanelMinimized ? 'w-16 h-16' : 'w-[90vw] max-w-[400px]'}`}>
          <div onMouseDown={handleDragStart} onTouchStart={handleDragStart} className="p-4 flex justify-between items-center cursor-move bg-white/5">
            {!isFormatPanelMinimized && <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Format</h4>}
            <button onClick={() => setIsFormatPanelMinimized(!isFormatPanelMinimized)} className="p-2 hover:bg-white/10 rounded-full">
              {isFormatPanelMinimized ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </button>
          </div>
          {!isFormatPanelMinimized && (
            <div className="p-6">
              <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide py-1">
                {/* Custom Color Picker via Input */}
                <div title="Custom Color" className="relative w-10 h-10 rounded-full border-2 border-slate-700 hover:border-white shadow-sm flex-shrink-0 overflow-hidden">
                    <input 
                      type="color" 
                      onInput={(e) => applyColor(e.currentTarget.value)}
                      className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 border-0 cursor-pointer opacity-0 z-10"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                        <Palette className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* Quick Actions Actions */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white flex items-center justify-center flex-shrink-0"
                    title="Add Image"
                >
                    <LucideImage className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setShowReminderInput(!showReminderInput)}
                    className={`w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center flex-shrink-0 ${editingNote.reminderAt ? 'bg-[#0066FF] text-white border-transparent' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    title="Set Reminder"
                >
                    <Bell className="w-5 h-5" />
                </button>

                <div className="w-[1px] h-8 bg-slate-700 mx-2 self-center flex-shrink-0" />

                  {/* Colors */}
                  {['#000000', '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#0066FF', '#8B5CF6', '#EC4899'].map((color) => (
                  <button 
                    key={color} 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyColor(color)} 
                    className="w-10 h-10 rounded-full border-2 border-slate-700 hover:border-white shadow-sm flex-shrink-0" 
                    style={{ background: color }} 
                  />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 mb-8">
                {[AlignLeft, AlignCenter, AlignRight, AlignJustify].map((Icon, i) => (
                  <button 
                    key={i} 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateStyle({ [activeField === 'title' ? 'titleAlign' : 'contentAlign']: ['left', 'center', 'right', 'justify'][i] as any })} 
                    className="p-3 bg-white/10 rounded-2xl hover:bg-white/20"
                  >
                    <Icon className="w-5 h-5 mx-auto" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-8">
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleFormat('bold')} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 font-bold">
                    <Bold className="w-5 h-5 mx-auto" />
                </button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleFormat('italic')} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 italic">
                    <Italic className="w-5 h-5 mx-auto" />
                </button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleFormat('underline')} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 underline">
                    <Underline className="w-5 h-5 mx-auto" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Size</span>
                  <input 
                    type="range" 
                    min="14" 
                    max="32" 
                    value={parseInt(editingNote.style?.fontSize || '18')} 
                    onChange={(e) => updateStyle({ fontSize: e.target.value })}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0066FF]"
                  />
                  <span className="text-sm font-bold w-6 text-right">{editingNote.style?.fontSize || '18'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;

