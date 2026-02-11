import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, MapPin, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfileCompletion: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    age: profile?.age?.toString() || '',
    gender: profile?.gender || '',
    location: profile?.location || '',
    status: profile?.status || '' as 'Student' | 'Working Professional' | ''
  });

  // Update form data if profile loads later
  React.useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || profile.name || '',
        age: prev.age || profile.age?.toString() || '',
        gender: prev.gender || profile.gender || '',
        location: prev.location || profile.location || '',
        status: prev.status || profile.status || ''
      }));
    }
  }, [profile]);


  const totalSteps = 5;

  const handleNext = () => {
    // Validation for each step
    if (step === 1 && !formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (step === 2 && (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 120)) {
      setError('Please enter a valid age');
      return;
    }
    if (step === 3 && !formData.gender) {
      setError('Please select your gender');
      return;
    }
    if (step === 4 && !formData.location.trim()) {
      setError('Please enter your location');
      return;
    }
    if (step === 5 && !formData.status) {
      setError('Please select your status');
      return;
    }

    setError('');
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setError('');
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await updateProfile({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        location: formData.location,
        status: formData.status as 'Student' | 'Working Professional'
      });
      // Success - manually redirect to dashboard
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };



  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-slide-up">
            <div className="w-16 h-16 bg-[#0066FF] rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-900" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">What's your name?</h2>
            <p className="text-slate-500">Let's personalize your experience</p>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              autoFocus
              className="w-full bg-[#F5F6F7] rounded-2xl py-4 px-6 text-lg outline-none border-2 border-transparent focus:border-[#0066FF] transition-all mt-6"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 animate-slide-up">
            <div className="w-16 h-16 bg-[#0066FF] rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-900" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">How old are you?</h2>
            <p className="text-slate-500">This helps us customize your experience</p>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Enter your age"
              autoFocus
              min="1"
              max="120"
              className="w-full bg-[#F5F6F7] rounded-2xl py-4 px-6 text-lg outline-none border-2 border-transparent focus:border-[#0066FF] transition-all mt-6"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-slide-up">
            <div className="w-16 h-16 bg-[#0066FF] rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-900" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Select your gender</h2>
            <p className="text-slate-500">Help us understand you better</p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, gender: option })}
                  className={`py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                    formData.gender === option
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-[#F5F6F7] text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 animate-slide-up">
            <div className="w-16 h-16 bg-[#0066FF] rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-slate-900" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Where are you from?</h2>
            <p className="text-slate-500">Your location helps us serve you better</p>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
              autoFocus
              className="w-full bg-[#F5F6F7] rounded-2xl py-4 px-6 text-lg outline-none border-2 border-transparent focus:border-[#0066FF] transition-all mt-6"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 animate-slide-up">
            <div className="w-16 h-16 bg-[#0066FF] rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-slate-900" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">What's your status?</h2>
            <p className="text-slate-500">This helps us tailor content for you</p>
            <div className="grid grid-cols-1 gap-4 mt-6">
              {['Student', 'Working Professional'].map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, status: option as 'Student' | 'Working Professional' })}
                  className={`py-5 px-6 rounded-2xl font-bold text-lg transition-all ${
                    formData.status === option
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-[#F5F6F7] text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0066FF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-[#1A8CFF]/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md flex flex-col relative z-10">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Step {step} of {totalSteps}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0066FF] transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm mb-6 animate-slide-up">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="mb-12">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-900" />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Saving...' : step === totalSteps ? 'Complete Setup' : 'Continue'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
