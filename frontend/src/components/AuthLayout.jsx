import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children, currentStep = 1 }) {
  const steps = [
    { id: 1, label: 'Connexion' },
    { id: 2, label: 'Email' },
    { id: 3, label: 'Sécurité' },
  ];

  // Logic pour largeur variable
  // Step 0 = Inscription, Step 3 = PIN
  const isWide = currentStep === 0 || currentStep === 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-8 font-['Montserrat']">
      
      <div className="flex flex-col items-center mb-5 animate-fade-in-up">
        <h1 className="text-lg font-bold text-[#1e3a8a] tracking-tight">
          authentification
        </h1>
      </div>

      <div className={`relative z-10 w-full transition-all duration-500 bg-white rounded-[28px] shadow-2xl shadow-blue-900/10 p-7 text-center animate-fade-in translate-y-[-10px] ${isWide ? 'max-w-[500px]' : 'max-w-[380px]'}`}>
        <div className={isWide ? 'px-2' : ''}>
          {children}
        </div>

        <div className="mt-7 pt-5 border-t border-slate-50">
          <p className="text-center text-[9px] text-slate-300 mb-4 uppercase tracking-[0.2em] font-black">
            Protocole de sécurité multipasse
          </p>
          <div className="flex items-center justify-center gap-2">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    step.id === currentStep
                      ? 'w-10 bg-[#1e3a8a]'
                      : step.id < currentStep
                      ? 'w-6 bg-[#1e3a8a]/40'
                      : 'w-6 bg-slate-100'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
        {currentStep === 1 ? (
          <>
            Besoin d'un accès ?{' '}
            <Link to="/register" className="text-[#1e3a8a] hover:underline">
              Créer un compte
            </Link>
          </>
        ) : (
          <Link to="/" className="text-[#1e3a8a] hover:underline">
            Retour à la connexion
          </Link>
        )}
      </p>

      <footer className="fixed bottom-6 text-[9px] text-slate-300 font-black uppercase tracking-[0.3em]">
        © 2024 Sentinel Sanctuary. Secure Environment.
      </footer>
    </div>
  );
}
