
import React from 'react';
import { MemoryItem } from '../types';
import { ArrowUpRight, CheckCircle2, Circle } from 'lucide-react';

interface TodayCardProps {
  items: MemoryItem[];
  onToggleCheck: (itemId: string, index: number) => void;
}

const TodayCard: React.FC<TodayCardProps> = ({ items, onToggleCheck }) => {
  const todayTasks = items.filter(i => i.type === 'task' || i.type === 'checklist').slice(0, 3);
  const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'long' }).toUpperCase();

  return (
    <div className="bg-[#C6F35A] rounded-[28px] p-6 mb-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md col-span-1 md:col-span-2">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-700 tracking-wider">{dateStr}</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">Today</h2>
        </div>
        <button className="bg-white/40 p-2 rounded-full hover:bg-white/60 transition-colors">
          <ArrowUpRight className="w-5 h-5 text-slate-900" />
        </button>
      </div>

      <div className="space-y-3">
        {todayTasks.length > 0 ? todayTasks.map(task => (
          <div key={task.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm group">
            <button 
              onClick={() => task.items?.[0] && onToggleCheck(task.id, 0)}
              className="flex-shrink-0"
            >
              {task.items?.[0]?.completed ? (
                <CheckCircle2 className="w-6 h-6 text-slate-900" fill="currentColor" />
              ) : (
                <Circle className="w-6 h-6 text-slate-300" />
              )}
            </button>
            <span className={`text-slate-800 font-semibold transition-all ${task.items?.[0]?.completed ? 'line-through opacity-50' : ''}`}>
              {task.title || (
                <span dangerouslySetInnerHTML={{ __html: task.content.substring(0, 50) + (task.content.length > 50 ? '...' : '') }} />
              )}
            </span>
          </div>
        )) : (
          <p className="text-slate-700 font-medium italic opacity-60 py-4">No tasks for today. Start talking to add some!</p>
        )}
      </div>
    </div>
  );
};

export default TodayCard;
