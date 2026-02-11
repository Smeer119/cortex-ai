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
    <div className="min-h-screen bg-[#F5F6F7] flex flex-col">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between bg-white sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Profile</h2>
        <button
          onClick={handleSignOut}
          className="p-2 bg-rose-50 rounded-full text-rose-500 hover:bg-rose-100 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Profile Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Avatar Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#0066FF] to-[#0047B3] rounded-full flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{profile.name || 'User'}</h1>
            <p className="text-slate-500 text-sm">{profile.email}</p>
          </div>

          {/* Profile Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h3>

            <div className="flex items-center gap-4 p-4 bg-[#F5F6F7] rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</p>
                <p className="text-slate-900 font-semibold">{profile.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F5F6F7] rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-slate-900 font-semibold">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F5F6F7] rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age</p>
                <p className="text-slate-900 font-semibold">{profile.age} years old</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F5F6F7] rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                <p className="text-slate-900 font-semibold">{profile.gender}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F5F6F7] rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                <p className="text-slate-900 font-semibold">{profile.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F5F6F7] rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className="text-slate-900 font-semibold">{profile.status}</p>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
