import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const Signup: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <SignUp 
        path="/signup" 
        routing="path" 
        signInUrl="/login" 
        forceRedirectUrl="/"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "rounded-3xl shadow-2xl border-none",
            formButtonPrimary: "bg-[#0066FF] hover:bg-[#1A8CFF] text-white",
            footerActionLink: "text-[#0066FF] hover:text-[#1A8CFF]",
          }
        }}
      />
    </div>
  );
};

export default Signup;


