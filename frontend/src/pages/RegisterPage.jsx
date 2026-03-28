import { useReducer, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import api from '../api/axios';
import OtpInput from '../components/OtpInput';

const registrationReducer = (s, a) => {
  if (a.t === 'UPDATE') return { ...s, [a.f]: a.v, errors: { ...s.errors, [a.f]: false } };
  if (a.t === 'FAIL') return { ...s, errors: a.m };
  if (a.t === 'WAIT') return { ...s, busy: a.v };
  return s;
};

export default function RegisterPage() {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(registrationReducer, {
    user_handle: '',
    secret_p1: '',
    secret_p2: '',
    pin_code: '',
    busy: false,
    errors: {}
  });

  const [reveal, setReveal] = useState(false);

  const initRegistration = async (e) => {
    e.preventDefault();
    
    const fails = {};
    if (!state.user_handle) fails.user_handle = true;
    if (state.secret_p1.length < 5) fails.secret_p1 = true;
    if (state.secret_p1 !== state.secret_p2) fails.secret_p2 = true;
    if (state.pin_code.length !== 6) fails.pin_code = true;

    if (Object.keys(fails).length > 0) {
      dispatch({ t: 'FAIL', m: fails });
      return;
    }

    dispatch({ t: 'WAIT', v: true });

    try {
      const fullEmail = state.user_handle.includes('@') ? state.user_handle : `${state.user_handle}@gmail.com`;
      await api.post('/auth/register', {
        email: fullEmail,
        password: state.secret_p1,
        pin: state.pin_code,
      });
      toast.success('Déploiement réussi. Redirection login.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du déploiement.');
    } finally {
      dispatch({ t: 'WAIT', v: false });
    }
  };

  return (
    <AuthLayout currentStep={0}>
      <div className="text-left animate-in fade-in slide-in-from-bottom-2 duration-1000 font-['Montserrat']">
        <h2 className="text-[25px] font-black text-slate-800 mb-0.5 tracking-tighter uppercase">Inscription</h2>
        <p className="text-slate-400 text-[9px] mb-8 uppercase font-black tracking-[0.4em]">Déploiement Sentinel</p>

        <form onSubmit={initRegistration} className="space-y-5">
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Identité du Compte</span>
            <div className={`flex items-center px-5 py-3 rounded-2xl border-2 transition-all bg-[#f8fafc] ${state.errors.user_handle ? 'border-red-400' : 'border-slate-50 focus-within:border-[#1e3a8a] focus-within:bg-white focus-within:shadow-xl focus-within:shadow-blue-900/5'}`}>
              <Mail className="w-3.5 h-3.5 text-slate-300 mr-4" />
              <input
                type="text"
                placeholder="votre.identifiant"
                value={state.user_handle}
                onChange={(e) => dispatch({ t: 'UPDATE', f: 'user_handle', v: e.target.value })}
                className="flex-1 bg-transparent text-slate-900 text-xs outline-none font-bold"
              />
              {!state.user_handle.includes('@') && (
                <span className="text-slate-300 font-black text-[9px] bg-white px-2 py-1 rounded-lg border border-slate-100">@gmail.com</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Mot de Passe</span>
                <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all bg-[#f8fafc] ${state.errors.secret_p1 ? 'border-red-400' : 'border-slate-50'}`}>
                   <input
                     type={reveal ? 'text' : 'password'}
                     placeholder="••••••••"
                     value={state.secret_p1}
                     onChange={(e) => dispatch({ t: 'UPDATE', f: 'secret_p1', v: e.target.value })}
                     className="flex-1 bg-transparent text-slate-900 text-xs outline-none font-bold tracking-widest"
                   />
                </div>
             </div>
             <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Vérification</span>
                <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all bg-[#f8fafc] ${state.errors.secret_p2 ? 'border-red-400' : 'border-slate-50'}`}>
                   <input
                     type={reveal ? 'text' : 'password'}
                     placeholder="••••••••"
                     value={state.secret_p2}
                     onChange={(e) => dispatch({ t: 'UPDATE', f: 'secret_p2', v: e.target.value })}
                     className="flex-1 bg-transparent text-slate-900 text-xs outline-none font-bold tracking-widest"
                   />
                   <button type="button" onClick={() => setReveal(!reveal)}>
                      {reveal ? <EyeOff className="w-3.5 h-3.5 text-slate-300" /> : <Eye className="w-3.5 h-3.5 text-slate-300" />}
                   </button>
                </div>
             </div>
          </div>

          <div className="space-y-3">
            <span className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest ml-1 flex items-center gap-2">
               <ShieldCheck className="w-3.5 h-3.5" /> PIN MASTER (6 Chiffres)
            </span>
            <div className={`p-1.5 rounded-2xl border-2 bg-white flex justify-center shadow-sm ${state.errors.pin_code ? 'border-red-400' : 'border-slate-50'}`}>
               <OtpInput length={6} onChange={(val) => dispatch({ t: 'UPDATE', f: 'pin_code', v: val })} isPassword={true} />
            </div>
          </div>

          <button
            type="submit"
            disabled={state.busy}
            className="w-full bg-slate-900 hover:bg-[#1e3a8a] text-white font-black py-4.5 rounded-2xl shadow-2xl shadow-blue-900/10 mt-4 transition-all duration-500 active:scale-[0.98] disabled:opacity-50 text-[10px] tracking-[0.3em] uppercase"
          >
            {state.busy ? 'INITIALISATION...' : 'CRÉER LE PROFIL SENTINEL'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
