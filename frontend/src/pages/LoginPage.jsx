import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const accessReducer = (s, a) => {
  if (a.type === 'SET') return { ...s, [a.f]: a.v, errors: { ...s.errors, [a.f]: false } };
  if (a.type === 'ERR') return { ...s, errors: a.m };
  if (a.type === 'BUSY') return { ...s, loading: a.v };
  return s;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { updateAuth } = useAuth();
  
  const [session, dispatch] = useReducer(accessReducer, {
    handle: '',
    pass: '',
    loading: false,
    errors: {}
  });

  const [reveal, setReveal] = useState(false);

  const initHandshake = async (e) => {
    e.preventDefault();
    
    const issues = {};
    if (!session.handle) issues.handle = true;
    if (session.pass.length < 4) issues.pass = true;
    
    if (Object.keys(issues).length > 0) {
      dispatch({ type: 'ERR', m: issues });
      return;
    }

    dispatch({ type: 'BUSY', v: true });

    try {
      await new Promise(r => setTimeout(r, 700 + Math.random() * 300));
      const fullEmail = session.handle.includes('@') ? session.handle : `${session.handle}@gmail.com`;

      const { data } = await api.post('/auth/login', {
        email: fullEmail,
        password: session.pass
      });

      updateAuth({ 
        email: fullEmail, 
        sessionToken: data.session_id, 
        step: 1 
      });
      
      toast.success('Validation Phase 1 OK. OTP Requis.');
      navigate('/verify/email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accès refusé.');
    } finally {
      dispatch({ type: 'BUSY', v: false });
    }
  };

  return (
    <AuthLayout currentStep={1}>
      <div className="animate-in fade-in zoom-in-95 duration-700 font-['Montserrat']">
        <h2 className="text-[24px] font-black text-slate-900 mb-1 tracking-[-0.05em] uppercase">Connexion</h2>
        <p className="text-slate-400 text-[9px] mb-8 uppercase font-black tracking-[0.4em]">Centre de Contrôle Sentinel</p>

        <form onSubmit={initHandshake} className="space-y-6 text-left">
          
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Identité du Compte</span>
            <div className={`flex items-center px-5 py-3.5 rounded-2xl border-2 transition-all duration-500 bg-white shadow-sm ${session.errors.handle ? 'border-red-500/30' : 'border-slate-50 focus-within:border-[#1e3a8a] focus-within:shadow-xl focus-within:shadow-blue-900/5'}`}>
              <Mail className="w-3.5 h-3.5 text-slate-300 mr-3" />
              <input
                type="text"
                placeholder="nom.utilisateur"
                value={session.handle}
                onChange={(e) => dispatch({ type: 'SET', f: 'handle', v: e.target.value })}
                className="flex-1 bg-transparent text-slate-900 text-xs outline-none font-bold"
                autoComplete="off"
              />
              {!session.handle.includes('@') && (
                <span className="text-slate-400 font-black text-[10px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">@gmail.com</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Clé Secrète</span>
              <button type="button" className="text-[9px] text-slate-300 font-black hover:text-[#1e3a8a] hover:underline uppercase">Récupérer</button>
            </div>
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all duration-500 bg-white shadow-sm ${session.errors.pass ? 'border-red-500/30' : 'border-slate-50 focus-within:border-[#1e3a8a] focus-within:shadow-xl focus-within:shadow-blue-900/5'}`}>
              <Lock className="w-3.5 h-3.5 text-slate-300" />
              <input
                type={reveal ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={session.pass}
                onChange={(e) => dispatch({ type: 'SET', f: 'pass', v: e.target.value })}
                className="flex-1 bg-transparent text-slate-900 text-xs outline-none font-bold tracking-[0.2em]"
              />
              <button type="button" onClick={() => setReveal(!reveal)}>
                {reveal ? <EyeOff className="w-3.5 h-3.5 text-slate-300 hover:text-[#1e3a8a] transition-colors" /> : <Eye className="w-3.5 h-3.5 text-slate-300 hover:text-[#1e3a8a] transition-colors" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={session.loading}
            className="w-full relative overflow-hidden bg-slate-900 hover:bg-[#1e3a8a] text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-900/10 transition-all duration-500 active:scale-[0.98] disabled:opacity-50 mt-4 group"
          >
            {session.loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.4em] font-black">
                Démarrer le terminal <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
