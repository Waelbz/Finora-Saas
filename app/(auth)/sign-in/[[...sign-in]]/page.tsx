import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <svg width="32" height="36" viewBox="0 0 56 56" fill="none">
              <path d="M28 4L52 17.5V38.5L28 52L4 38.5V17.5L28 4Z" stroke="url(#lgs)" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
              <path d="M4 17.5L28 31V52" stroke="url(#lgs)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M52 17.5L28 31" stroke="url(#lgs)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M20 28L20 44M20 34L32 34" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <defs>
                <linearGradient id="lgs" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1fd9a4"/>
                  <stop offset="100%" stopColor="#6c47ff"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="text-2xl font-extrabold text-white font-display">Finora</span>
          </div>
          <p className="text-white/50 text-sm">Connectez-vous à votre espace comptable</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm rounded-2xl',
              headerTitle: 'text-white font-display',
              headerSubtitle: 'text-white/50',
              socialButtonsBlockButton: 'bg-white/10 border-white/10 text-white hover:bg-white/15',
              socialButtonsBlockButtonText: 'text-white',
              dividerLine: 'bg-white/10',
              dividerText: 'text-white/30',
              formFieldLabel: 'text-white/70',
              formFieldInput: 'bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-violet-400',
              formButtonPrimary: 'bg-gradient-to-r from-violet-500 to-violet-400 hover:brightness-110',
              footerActionLink: 'text-violet-400 hover:text-violet-300',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-violet-400',
            },
          }}
        />
      </div>
    </div>
  )
}
