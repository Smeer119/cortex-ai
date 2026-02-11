
import React from 'react';

interface VoicePulseProps {
  isActive: boolean;
  level: number;
}

const VoicePulse: React.FC<VoicePulseProps> = ({ isActive, level }) => {
  // level is 0 to 1
  const scale = isActive ? 1 + level * 0.5 : 1;
  const opacity = isActive ? 0.6 + level * 0.4 : 0.3;

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Glow */}
      <div 
        className="absolute w-full h-full rounded-full blur-3xl transition-all duration-150"
        style={{ 
          backgroundColor: '#0066FF',
          transform: `scale(${scale * 1.2})`,
          opacity: isActive ? 0.15 : 0
        }}
      />
      
      {/* Pulse Rings */}
      <div 
        className="absolute w-48 h-48 rounded-full border-4 transition-all duration-300 ease-out"
        style={{ 
          borderColor: '#0066FF',
          transform: `scale(${scale})`,
          opacity: opacity * 0.2
        }}
      />
      <div 
        className="absolute w-40 h-40 rounded-full border-2 transition-all duration-200 ease-out"
        style={{ 
          borderColor: '#1A8CFF',
          transform: `scale(${scale * 1.1})`,
          opacity: opacity * 0.4
        }}
      />

      {/* Main Core */}
      <div 
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
          isActive 
            ? 'shadow-xl' 
            : 'bg-slate-200'
        }`}
        style={{ 
          background: isActive ? 'linear-gradient(135deg, #0066FF 0%, #0047B3 100%)' : undefined,
          boxShadow: isActive ? '0 20px 25px -5px rgba(0, 102, 255, 0.3)' : undefined,
          transform: `scale(${scale})` 
        }}
      >
        <div className="w-16 h-16 flex items-center justify-center">
          <img 
            src="/cortexlogo.png" 
            className={`w-full h-full object-contain transition-all duration-300 ${isActive ? 'brightness-0 invert' : 'opacity-40 grayscale'}`} 
            alt="cortex" 
          />
        </div>
      </div>
    </div>
  );
};

export default VoicePulse;
