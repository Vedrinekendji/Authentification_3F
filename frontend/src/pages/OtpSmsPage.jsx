import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, RefreshCw, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function OtpSmsPage() {
  const navigate = useNavigate();
  const { authState, updateAuth } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(180); // 3 minutes

  useEffect(() => {
    if (!authState.sessionToken) { navigate('/'); return; }
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error('Entrez les 6 chiffres du code SMS.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-sms-otp', {
        sessionToken: authState.sessionToken,
        otp,
      });
      updateAuth({ step: 4, sessionToken: res.data.sessionToken });
      toast.success('SMS vérifié ! Dernière étape...');
      navigate('/verify/app');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code SMS invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      await api.post('/auth/resend-otp', {
        sessionToken: authState.sessionToken,
        type: 'sms',
      });
      toast.success('Nouveau code envoyé par SMS !');
      setCountdown(180);
    } catch {
      toast.error("Impossible de renvoyer le SMS.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout currentStep={3}>
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Vérification SMS</h2>
        </div>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Un code de sécurité a été envoyé sur votre mobile. 
          Saisissez-le pour confirmer votre identité.
        </p>

        {/* Progress bar 3 étapes - Étape 2 active/complétée */}
        <div className="flex items-center gap-2 mb-10">
          <div className="flex-1 h-1.5 bg-[#1e3a8a] rounded-full" />
          <div className="flex-1 h-1.5 bg-[#1e3a8a] rounded-full" />
          <div className="flex-1 h-1.5 bg-[#1e3a8a] rounded-full" />
        </div>

        <OtpInput length={6} onChange={setOtp} />

        <button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-8"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Valider le SMS <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        <button
          onClick={handleResend}
          disabled={resending}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 rounded-2xl transition-all duration-200 mt-3 disabled:opacity-50"
        >
          {resending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            'Renvoyer le SMS'
          )}
        </button>

        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Expire dans <span className="font-semibold text-slate-700">{formatTime(countdown)}</span></span>
        </div>
      </div>
    </AuthLayout>
  );
}
