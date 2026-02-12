import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Verification state for stalled sign-ups
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [verificationLevel, setVerificationLevel] = useState<'first' | 'second'>('first');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    setError('');
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else if (result.status === "needs_first_factor") {
        setVerificationLevel('first');
        // Handle unverified email case
        // @ts-ignore
        const emailFactor = result.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code');
        
        if (emailFactor) {
            await signIn.prepareFirstFactor({
                strategy: 'email_code',
                // @ts-ignore
                emailAddressId: emailFactor.emailAddressId,
            });
            setVerifying(true);
        } else {
            setError("Account requires verification method not supported here.");
        }
      } else if (result.status === "needs_second_factor") {
        setVerificationLevel('second');
        // Assume email code for second factor as well, or find supported strategy
        // @ts-ignore
        const secondFactor = result.supportedSecondFactors?.find((f: any) => f.strategy === 'email_code' || f.strategy === 'phone_code');
        
        if (secondFactor) {
             await signIn.prepareSecondFactor({
                strategy: secondFactor.strategy,
                // @ts-ignore
                phoneNumberId: secondFactor.phoneNumberId, 
                // @ts-ignore
                emailAddressId: secondFactor.emailAddressId
            });
            setVerifying(true);
        } else {
             // Fallback: try blindly or prompt user (simplification)
             // Or maybe it's just ready?
             setVerifying(true);
        }
      } else {
        setError(`Verification needed. Status: ${result.status}`);
      }
    } catch (err: any) {
      // Check if it's the "already signed in" error or similar
      setError(err.errors?.[0]?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    setLoading(true);
    setError('');

    try {
      let result;
      if (verificationLevel === 'first') {
          result = await signIn.attemptFirstFactor({
            strategy: "email_code",
            code,
          });
      } else {
          result = await signIn.attemptSecondFactor({
            strategy: "email_code", // Assuming email code for simplicity, could dynamic
            code,
          });
      }

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setError(`Verification successful but login incomplete (Status: ${result.status}).`);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0066FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-[#0066FF]" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">Verify Email</h1>
          <p className="text-slate-600">Enter the code sent to your email to complete login.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0066FF] focus:outline-none text-center text-2xl tracking-widest font-bold"
              placeholder="000000"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0066FF] hover:bg-[#1A8CFF] text-white font-bold rounded-xl transition-all"
          >
            {loading ? 'Verifying...' : 'Verify Login'}
          </button>
          
          <button
            type="button"
            onClick={() => setVerifying(false)}
            className="w-full text-slate-500 text-sm hover:underline"
          >
            Back to Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <p className="text-slate-600">Sign in to your CORTEX account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Captcha - Required for Clerk */}
        <div id="clerk-captcha" />

        <button
          type="submit"
          disabled={loading || !isLoaded}
          className="w-full py-3 bg-[#0066FF] hover:bg-[#1A8CFF] text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-600 font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#0066FF] font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;


