import { useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const sessionStageReducer = (s, a) => {
  if (a.t === 'KEY') return { ...s, code: a.v };
  if (a.t === 'BUSY') return { ...s, loading: a.v };
  if (a.t === 'TICK') return { ...s, time: s.time > 0 ? s.time - 1 : 0 };
  return s;
};

export default function OtpEmailPage() {
  const navigate = useNavigate();
  const { authState, updateAuth } = useAuth();
  
  const [session, dispatch] = useReducer(sessionStageReducer, {
    code: '',
    loading: false,
    time: 300
  });

  useEffect(() => {
    if (!authState.sessionToken) { navigate('/'); return; }
    const clock = setInterval(() => dispatch({ t: 'TICK' }), 1000);
    return () => clearInterval(clock);
  }, [authState.sessionToken, navigate]);

  const clockFace = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const initChallenge = async () => {
    if (session.code.length !== 6) return;
    dispatch({ t: 'BUSY', v: true });

    try {
      const { data } = await api.post('/auth/verify-email-otp', {
        sessionToken: authState.sessionToken,
        otp: session.code,
      });

      updateAuth({ step: 2, sessionToken: data.session_id });
      toast.success('Validation Email OK.');
      navigate('/verify/pattern');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Echec validation.');
    } finally {
      dispatch({ t: 'BUSY', v: false });
    }
  };

  return (
    <AuthLayout currentStep={2}>
      <div className="animate-in fade-in duration-700 font-['Montserrat']">
        <h2 className="text-[21px] font-black text-slate-800 mb-0.5 tracking-tighter uppercase">Code Mail</h2>
        <p className="text-slate-400 text-[9px] mb-8 uppercase font-black tracking-[0.4em]">Validation du Mail</p>

        <div className="flex justify-center mb-10 scale-105">
           <OtpInput length={6} onChange={(val) => dispatch({ t: 'KEY', v: val })} />
        </div>

        <button
          onClick={initChallenge}
          disabled={session.loading || session.code.length !== 6}
          className="w-full bg-slate-900 hover:bg-[#1e3a8a] text-white font-black py-4.5 rounded-[20px] shadow-2xl shadow-blue-900/10 transition-all duration-500 uppercase text-[10px] tracking-[0.4em]"
        >
          {session.loading ? '...' : (
            <span className="flex items-center justify-center gap-3">
               Valider le code <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>

        <div className="mt-10 flex items-center justify-center gap-3 text-[9px] font-black text-slate-300 uppercase tracking-widest pt-6 border-t border-slate-50 opacity-60">
          <Clock className="w-3.5 h-3.5" />
          <span>Expire sous <span className="text-slate-500">{clockFace(session.time)}</span></span>
        </div>
      </div>
    </AuthLayout>
  );
}
