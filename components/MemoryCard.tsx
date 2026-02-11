
import React from 'react';
import { MemoryItem } from '../types';
import { Lock, MoreHorizontal, FileText, ListTodo, Bell, Trash2, Image as ImageIcon, Mic, CheckCircle2, Circle } from 'lucide-react';

interface MemoryCardProps {
  item: MemoryItem;
  onToggleCheck?: (itemId: string, checkIndex: number) => void;
  onDelete?: (itemId: string) => void;
  onClick?: (item: MemoryItem) => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ item, onToggleCheck, onDelete, onClick }) => {
  const isLocked = item.tags.includes('private') || item.tags.includes('locked');

  const getIcon = () => {
    if (isLocked) return <Lock className="w-5 h-5 text-slate-400" />;
    switch (item.type) {
      case 'task':
      case 'checklist': return <ListTodo className="w-5 h-5 text-slate-800" />;
      case 'reminder': return <Bell className="w-5 h-5 text-slate-800" />;
      default: return <FileText className="w-5 h-5 text-slate-800" />;
    }
  };

  const cardStyle = {
    backgroundColor: item.style?.backgroundColor || '#FFFFFF',
    fontFamily: item.style?.fontFamily || 'inherit',
    textAlign: item.style?.contentAlign || 'left',
  };

  return (
    <div 
      onClick={() => onClick?.(item)}
      className="rounded-[24px] p-5 mb-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group relative border border-transparent hover:border-slate-100 cursor-pointer overflow-hidden"
      style={cardStyle}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.tags[0] || 'Note'}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
            className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-300 hover:text-slate-500 rounded-lg hover:bg-slate-50">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {item.attachments && item.attachments.length > 0 && (
        <div className="mb-3 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
           {item.attachments[0].type === 'image' ? (
             <img src={item.attachments[0].url} className="w-full h-32 object-cover" alt="attachment" />
           ) : (
             <div className="p-3 flex items-center gap-2 text-xs font-bold text-slate-500">
               <Mic className="w-4 h-4" /> Audio Recording
             </div>
           )}
        </div>
      )}

      <div className={isLocked ? "blur-sm select-none" : ""}>
        {item.title && (
          <h3 
            className="text-slate-900 font-extrabold text-xl leading-tight mb-2"
            style={{ 
              fontFamily: item.style?.fontFamily || 'inherit',
              textAlign: item.style?.titleAlign || 'left'
            }}
          >
            {item.title}
          </h3>
        )}
        <div 
          className="text-slate-600 text-sm line-clamp-3 prose prose-sm overflow-hidden"
          style={{ 
            fontSize: item.style?.fontSize ? `${parseInt(item.style.fontSize)}px` : 'inherit',
            textAlign: item.style?.contentAlign || 'left'
          }}
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
        
        {item.type === 'checklist' && item.items && (
          <div className="space-y-3 mt-4">
            {item.items.slice(0, 3).map((check, idx) => (
              <button 
                key={check.id} 
                onClick={(e) => { e.stopPropagation(); onToggleCheck?.(item.id, idx); }}
                className="flex items-center gap-3 w-full text-left group/item"
              >
                {check.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-lime-500 fill-lime-100" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 group-hover/item:text-lime-400 transition-colors" />
                )}
                <span className={`text-sm ${check.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                  {check.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map(tag => (
          <span 
            key={tag} 
            className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-opacity-20 text-slate-600"
            style={{ backgroundColor: item.style?.highlightColor || '#F0F1F3' }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {item.reminderAt && !isLocked && (
        <div className="mt-4 flex items-center gap-2 text-rose-500 bg-rose-50 w-fit px-2 py-1 rounded-full text-[10px] font-bold">
          <Bell className="w-3 h-3" />
          {new Date(item.reminderAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
};

export default MemoryCard;
