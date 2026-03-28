import { useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Lock, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const finalPhaseReducer = (s, a) => {
  if (a.t === 'PIN') return { ...s, val: a.v };
  if (a.t === 'BUSY') return { ...s, loading: a.v };
  return s;
};

export default function PinPage() {
  const navigate = useNavigate();
  const { authState, updateAuth } = useAuth();
  
  const [session, dispatch] = useReducer(finalPhaseReducer, {
    val: '',
    loading: false
  });

  useEffect(() => {
    if (!authState.sessionToken) { navigate('/'); return; }
  }, [authState.sessionToken, navigate]);

  const runFinalHandshake = async () => {
    if (session.val.length !== 6) return;
    dispatch({ t: 'BUSY', v: true });

    try {
      await new Promise(r => setTimeout(r, 900 + Math.random() * 200));
      const { data } = await api.post('/auth/verify-pin', {
        sessionToken: authState.sessionToken,
        pin: session.val,
      });

      localStorage.setItem('authToken', data.authToken);
      updateAuth({ authToken: data.authToken });
      toast.success('Accès Sentinel Validé.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Empreinte PIN incorrecte.');
    } finally {
      dispatch({ t: 'BUSY', v: false });
    }
  };

  return (
    <AuthLayout currentStep={3}>
      <div className="animate-in fade-in duration-1000 flex flex-col items-center font-['Montserrat']">
        
        <div className="w-[52px] h-[52px] bg-white border-2 border-slate-50 rounded-[18px] flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/10">
           <Shield className="w-7 h-7 text-[#1e3a8a]" />
        </div>

        <h2 className="text-[23px] font-black text-slate-800 mb-0.5 tracking-[-0.05em] uppercase">Phase Finale</h2>
        <p className="text-slate-400 text-[9px] mb-8 uppercase tracking-[0.4em] font-black text-center leading-relaxed">
           Saisissez le MASTER-PIN de sécurité.
        </p>

        <div className="mb-8 scale-105">
           <OtpInput length={6} onChange={(v) => dispatch({ t: 'PIN', v })} isPassword={true} />
        </div>

        <button
          onClick={runFinalHandshake}
          disabled={session.loading || session.val.length !== 6}
          className="w-full bg-slate-900 hover:bg-[#1e3a8a] text-white font-black py-4.5 rounded-[20px] shadow-2xl shadow-blue-900/10 transition-all duration-500 disabled:opacity-50 text-[10px] uppercase tracking-[0.4em]"
        >
          {session.loading ? '...' : (
             <span className="flex items-center justify-center gap-3">
                Confirmer l'accès <ArrowRight className="w-4 h-4" />
             </span>
          )}
        </button>

        <div className="flex items-center gap-3 text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] mt-10 pt-6 border-t border-slate-50 w-full justify-center opacity-40">
           <Key className="w-4 h-4" />
           SESSION VERIFIED
        </div>
      </div>
    </AuthLayout>
  );
}
