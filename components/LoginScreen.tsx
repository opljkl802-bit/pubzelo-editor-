import React, { useState } from 'react';
import type { User } from '../types';
import { useGoogleLogin } from '@react-oauth/google';

// Standalone Google Icon SVG
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 9.613C34.521 5.791 29.632 3.5 24 3.5C11.77 3.5 1.5 13.77 1.5 26S11.77 48.5 24 48.5c12.23 0 22.5-10.27 22.5-22.5c0-1.343-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691c-2.222 3.912-3.566 8.525-3.566 13.591s1.344 9.679 3.566 13.591L6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 48.5c5.632 0 10.52-1.791 14.496-4.801L34.1 39.199c-2.73 1.8-6.16 2.8-9.9 2.8c-7.983 0-14.746-5.405-17.17-12.801L6.306 32.282c3.446 8.583 12.023 14.718 21.694 14.718L24 48.5z"></path>
        <path fill="#1976D2" d="M43.611 20.083L43.595 20L42 20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-3.74 0-7.17-1-9.9-2.8L9.504 33.699C13.48 36.709 18.368 38.5 24 38.5c9.671 0 18.247-6.135 21.694-14.718L44.5 22.5c-.251-1.25-.389-2.577-.389-3.917z"></path>
    </svg>
);


interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  
  const googleLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
          try {
              // The `credential` response from popup sign in is a JWT ID token.
              // We fetch user info to be more robust, though decoding the token is also an option.
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: {
                      'Authorization': `Bearer ${tokenResponse.access_token}`,
                  },
              });
              if (!res.ok) {
                  throw new Error(`Failed to fetch user info: ${res.statusText}`);
              }
              const profile = await res.json();
              onLogin({
                  isGuest: false,
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture,
              });
          } catch (err) {
              console.error("Error fetching Google user profile:", err);
              setError("Could not retrieve your Google profile. Please try again.");
          }
      },
      onError: () => {
          console.error("Google login failed.");
          setError("Google sign-in failed. Please try again.");
      }
  });


  const handleGuestLogin = () => {
    onLogin({ isGuest: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"></div>
      <div className="relative w-full max-w-sm p-8 bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl text-center animate-slide-up-fade">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-4">
          Welcome to Pubzelo
        </h2>
        <p className="text-slate-300 mb-8">Sign in to save your projects or continue as a guest.</p>
        
        {error && (
            <p className="text-red-400 bg-red-900/30 p-3 rounded-md mb-4 text-sm">{error}</p>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-slate-700 font-semibold rounded-lg shadow-md hover:bg-slate-200 transition-all transform hover:scale-105"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
          
          <button
            onClick={handleGuestLogin}
            className="w-full py-3 px-4 bg-slate-700/50 text-slate-200 font-semibold rounded-lg hover:bg-slate-700 transition-all transform hover:scale-105"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;