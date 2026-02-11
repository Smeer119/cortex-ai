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
    <div className="min-h-screen bg-[#F5F6F7] relative">
      {/* Curvy Gradient Header */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-br from-[#0066FF] to-[#0047B3] rounded-b-[60px] shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack} 
            className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all shadow-sm border border-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all shadow-sm border border-white/10 flex items-center gap-2 font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[40px] shadow-xl p-8 md:p-12 mt-10 relative overflow-visible">
          {/* Avatar - Floating above */}
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
            <div className="w-40 h-40 bg-white rounded-full p-2 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-[#0066FF] to-[#0047B3] rounded-full flex items-center justify-center text-6xl font-bold text-white shadow-inner border-4 border-white">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>

          <div className="mt-16 text-center mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{profile.name || 'User'}</h1>
            <p className="text-slate-500 font-medium bg-slate-100 px-4 py-1 rounded-full inline-block text-sm">{profile.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl hover:bg-blue-50 transition-colors group">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-[#0066FF]">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Age</span>
              </div>
              <p className="text-xl font-bold text-slate-900 pl-14">{profile.age ? `${profile.age} years old` : 'Not specified'}</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl hover:bg-blue-50 transition-colors group">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-[#0066FF]">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gender</span>
              </div>
              <p className="text-xl font-bold text-slate-900 pl-14">{profile.gender || 'Not specified'}</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl hover:bg-blue-50 transition-colors group">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-[#0066FF]">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</span>
              </div>
              <p className="text-xl font-bold text-slate-900 pl-14">{profile.location || 'Not specified'}</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl hover:bg-blue-50 transition-colors group">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-[#0066FF]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
              </div>
              <p className="text-xl font-bold text-slate-900 pl-14">{profile.status || 'Not specified'}</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between text-slate-400 text-sm">
             <span>Member since {new Date(profile._creationTime).toLocaleDateString()}</span>
             <span className="flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               Active Now
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
