import React from 'react';
import { ArrowLeft, LogOut, User, Mail, Calendar, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }


  
  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="h-64 bg-[#0066FF] flex items-center justify-center relative w-full rounded-b-[50px]">
        <button 
          onClick={onBack} 
          className="absolute top-6 left-6 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all backdrop-blur-sm z-20"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[120px] font-black tracking-widest text-white opacity-10 select-none absolute pointer-events-none overflow-hidden whitespace-nowrap">CORTEX</h1>
        <h1 className="text-4xl font-black tracking-widest text-white relative z-10 md:hidden">CORTEX</h1>
      </div>

      {/* Profile Content Container */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        
        {/* Header Section: Avatar + Info + Actions */}
        <div className="relative -mt-24 md:-mt-20 mb-12 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          
          {/* Avatar */}
          <div className="w-48 h-48 rounded-full p-2 bg-white shadow-xl relative z-20 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-slate-200 overflow-hidden relative">
              {profile.name ? (
                 <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-6xl font-bold text-slate-500">
                    {profile.name.charAt(0).toUpperCase()}
                 </div>
              ) : (
                 <User className="w-full h-full p-10 text-slate-400" />
              )}
            </div>
            {/* Verified Badge */}
            <div className="absolute bottom-3 right-3 bg-[#0066FF] text-white p-1.5 rounded-full border-[4px] border-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>

          {/* Name & Role */}
          <div className="flex-1 md:pb-6 pt-2">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 flex items-center justify-center md:justify-start gap-3">
              {profile.name || 'User'}
              <span className="text-amber-400 text-2xl md:text-3xl">★</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg mt-2 flex items-center justify-center md:justify-start gap-2">
              {profile.status || 'Secondary Mind User'} <span className="text-slate-300">|</span> Cortex
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 md:pb-6 w-full md:w-auto px-4 md:px-0">
           
            <button 
              onClick={handleSignOut}
              className="flex-1 md:flex-none py-3 px-6 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
           
          </div>
        </div>

        <div className="h-px bg-slate-100 w-full mb-12" />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2">
            <div className="mb-10">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#0066FF] rounded-full"></span> About
              </h3>
              <p className="text-slate-600 leading-loose text-lg">
                {profile.bio || `I am a ${profile.age ? profile.age + ' year old ' : ''}${profile.gender || 'person'} based in ${profile.location || 'the world'}. Using Cortex to organize my thoughts, store memories, and expand my cognitive capabilities through AI assistance.`}
              </p>
            </div>
          </div>

          {/* Side Details Column */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#0066FF] rounded-full"></span> Details
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                        <p className="text-slate-900 font-medium">{profile.location || 'Unknown'}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                        <a href={`mailto:${profile.email}`} className="text-slate-900 font-medium hover:text-[#0066FF] transition-colors break-all">{profile.email}</a>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Joined</p>
                        <p className="text-slate-900 font-medium">{new Date(profile._creationTime).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#0047B3] text-white shadow-xl shadow-blue-500/20">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-widest">Status</span>
                </div>
                <p className="font-bold text-lg">Active Now</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
