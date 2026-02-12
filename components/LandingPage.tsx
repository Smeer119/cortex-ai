import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Mic, Bell, CheckCircle, ArrowRight, Star, 
  Menu, X, ChevronDown, Shield, Zap, Globe, Smartphone,
  Layout, Headphones, FileText, Image as ImageIcon, Lock
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden selection:bg-[#0066FF] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center text-white">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CORTEX AI</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 hover:text-[#0066FF] transition-colors">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-slate-600 hover:text-[#0066FF] transition-colors">How it Works</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-slate-600 hover:text-[#0066FF] transition-colors">FAQ</button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-600 hover:text-[#0066FF] px-4 py-2 rounded-lg hover:bg-slate-50 transition-all">
              Log in
            </button>
            <button onClick={() => navigate('/signup')} className="text-sm font-bold text-white bg-[#0066FF] hover:bg-[#0052CC] px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-xl animate-slide-down">
            <button onClick={() => scrollToSection('features')} className="text-left py-2 font-medium text-slate-600">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-left py-2 font-medium text-slate-600">How it Works</button>
            <button onClick={() => scrollToSection('faq')} className="text-left py-2 font-medium text-slate-600">FAQ</button>
            <div className="h-px bg-slate-100 my-2" />
            <button onClick={() => navigate('/login')} className="w-full py-3 font-semibold text-slate-600 bg-slate-50 rounded-lg">Log in</button>
            <button onClick={() => navigate('/signup')} className="w-full py-3 font-bold text-white bg-[#0066FF] rounded-lg">Get Started</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0066FF] text-xs font-bold uppercase tracking-wider border border-blue-100">
              <Zap className="w-3 h-3" /> AI-Powered Second Brain
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#0F172A] leading-[1.1] tracking-tight">
              Your Ideas. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#0047B3]">Organized Instantly.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-lg">
              Capture thoughts by voice or text. Cortex AI automatically classifies them into ideas, tasks, or reminders—so you never lose a lightbulb moment again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group">
                Start Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                Watch Demo
              </button>
            </div>
          </div>
          
          <div className="relative animate-fade-in-right delay-200">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl transform scale-75" />
            <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="p-2 bg-[#0066FF] rounded-lg text-white">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0066FF] uppercase tracking-wider mb-1">AI Captured</p>
                    <p className="font-medium text-slate-800">"Remind me to call sarah specifically about the project roadmap tomorrow at 10am"</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                   <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all bg-white cursor-default">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle className="w-4 h-4" /></div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">Call Sarah</p>
                        <p className="text-xs text-slate-500">Project Roadmap Discussion</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Tomorrow 10 AM</span>
                   </div>
                   
                   <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all bg-white cursor-default opacity-60">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Brain className="w-4 h-4" /></div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">App Interface Idea</p>
                        <p className="text-xs text-slate-500">Glassmorphism effects...</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Idea</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Harness the Power of Your Second Brain</h2>
            <p className="text-lg text-slate-500">Cortex doesn't just store notes. It understands them, categorizes them, and surfaces them exactly when you need them.</p>
          </div>

          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
             <video 
    src="https://cdn.dribbble.com/userupload/17608183/file/original-a9b30b0413131d806620dc5db95c99f1.mp4"
    className="relative rounded-3xl shadow-2xl object-cover h-[400px] w-full"
    autoPlay 
    muted 
    loop 
    playsInline
  />
              <div className="order-1 md:order-2 space-y-6">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-[#0066FF] mb-4">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">AI Smart Capture</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Stop worrying about organization. Just dump your messy thoughts, and Cortex will convert them into structured notes, actionable tasks, and clear ideas instantly.
                </p>
              </div>
            </div>

            {/* Feature 2: Multi-Language (New) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Speak in Any Language</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Cortex is fluent in over 50 languages. Speak naturally in your native tongue, mixed languages, or dialects. We transcribe and organize it perfectly, every time.
                </p>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl transform -rotate-3 transition-transform group-hover:rotate-0" />
                      <video 
    src="https://cdn.dribbble.com/userupload/30455696/file/original-56dfa4332f094431596fff3957f0a83e.mp4"
    className="relative rounded-3xl shadow-2xl object-cover h-[400px] w-full"
    autoPlay 
    muted 
    loop 
    playsInline
  />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative group">
                <div className="absolute inset-0 bg-amber-400/20 rounded-3xl transform rotate-3 transition-transform group-hover:rotate-0" />
                     <video 
    src="https://cdn.dribbble.com/userupload/42865717/file/original-d869a127e6cd5b2276816a147db6bbad.mp4"
    className="relative rounded-3xl shadow-2xl object-cover h-[400px] w-full"
    autoPlay 
    muted 
    loop 
    playsInline
  />
              </div>
              <div className="order-1 md:order-2 space-y-6">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Smart Reminders</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Context-aware reminders that nudge you at the right time. Whether it's a meeting prep or a grocery run, Cortex ensures you never miss a beat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Cortex */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-2 group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0066FF] mb-6 group-hover:scale-110 transition-transform">
                <Layout className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Intelligent Organization</h3>
              <p className="text-slate-500 leading-relaxed">Automatic tagging and sorting means you spend less time filing and more time doing.</p>
            </div>

            {/* Privacy Feature (Updated) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-2 group">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Local-First & Secure</h3>
              <p className="text-slate-500 leading-relaxed">Your data belongs to you. We use local-first principles and enterprise encryption. We never train our models on your personal notes.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-2 group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Works Everywhere</h3>
              <p className="text-slate-500 leading-relaxed">Seamlessly syncs across all your devices. Access your second brain anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10" />
          <div className="flex gap-1 justify-center mb-8">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />)}
          </div>
          <blockquote className="text-3xl md:text-4xl font-medium text-slate-900 leading-snug mb-10">
            "Cortex has completely changed how I work. It feels like having a dedicated executive assistant who organizes my brain 24/7."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" 
              alt="Sarah J"
              className="w-14 h-14 rounded-full object-cover border-4 border-slate-50"
            />
            <div className="text-left">
              <p className="font-bold text-slate-900">Sarah Jenkins</p>
              <p className="text-sm text-slate-500">Product Manager @ TechFlow</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How does AI classify notes?", a: "Cortex uses advanced LLMs to analyze the context of your input. It determines whether you're stating a fact, asking to be reminded, or listing items, and categorizes accordingly." },
              { q: "Can I speak in my native language?", a: "Yes! Cortex supports over 50 languages including Spanish, French, Mandarin, Hindi, and more." },
              { q: "Is my data secure?", a: "Absolutely. We use a local-first architecture where possible and industry-standard encryption for sync. We do not use your data for training public models." },
              { q: "Can I use it on mobile?", a: "Cortex is fully responsive and works great on any mobile browser. A native app is coming soon!" },
              { q: "Is there a free plan?", a: "Yes, the free plan includes unlimited notes and basic AI features. You can upgrade for advanced voice features and unlimited storage." }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  {item.q}
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-6 text-slate-600 leading-relaxed bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-[#0066FF] rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Start Building Your Second Brain Today</h2>
            <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">Join thousands of users who have streamlined their thoughts and boosted their productivity with Cortex.</p>
            <button 
              onClick={() => navigate('/signup')} 
              className="px-10 py-5 bg-white text-[#0066FF] rounded-xl font-bold text-xl shadow-lg hover:bg-slate-50 transition-all hover:scale-105"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center text-white">
                <Brain className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900">CORTEX</span>
            </div>
            <p className="text-sm text-slate-500">Your AI-powered second brain.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="hover:text-[#0066FF] cursor-pointer">Features</li>
              <li className="hover:text-[#0066FF] cursor-pointer">Pricing</li>
              <li className="hover:text-[#0066FF] cursor-pointer">Download</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="hover:text-[#0066FF] cursor-pointer">Blog</li>
              <li className="hover:text-[#0066FF] cursor-pointer">Community</li>
              <li className="hover:text-[#0066FF] cursor-pointer">Help Center</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="hover:text-[#0066FF] cursor-pointer">Privacy</li>
              <li className="hover:text-[#0066FF] cursor-pointer">Terms</li>
              <li className="hover:text-[#0066FF] cursor-pointer">Security</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
          © 2026 Cortex AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
