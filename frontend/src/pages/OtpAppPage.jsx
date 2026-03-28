import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, QrCode, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function OtpAppPage() {
  const navigate = useNavigate();
  const { authState, updateAuth } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpSetup, setTotpSetup] = useState(false);

  useEffect(() => {
    if (!authState.sessionToken) { navigate('/'); return; }
    
    // Fetch TOTP QR code
    api.get(`/auth/totp-setup?sessionToken=${authState.sessionToken}`)
      .then(res => {
        setQrCode(res.data.qrCode);
        setTotpSetup(res.data.alreadySetup);
      })
      .catch(() => {});
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error('Entrez les 6 chiffres de votre application.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-totp', {
        sessionToken: authState.sessionToken,
        otp,
      });
      updateAuth({ step: 5 });
      localStorage.setItem('authToken', res.data.authToken);
      toast.success('Authentification complète ! Bienvenue 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code TOTP invalide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout currentStep={4}>
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-violet-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Authentification App</h2>
        </div>
        
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          {totpSetup
            ? 'Entrez le code actuel à 6 chiffres généré par votre application (Google Authenticator, Authy, etc.).'
            : 'Scannez le code QR ci-dessous avec votre application d\'authentification pour finaliser le couplage.'}
        </p>

        {!totpSetup && qrCode && (
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center animate-fade-in-up">
            <img src={qrCode} alt="QR Code TOTP" className="w-40 h-40 mx-auto rounded-lg border border-white" />
            <p className="text-[10px] text-slate-400 mt-2 font-medium tracking-wide uppercase">
              Scannez pour coupler votre compte
            </p>
          </div>
        )}

        {totpSetup && (
          <div className="flex items-center gap-3 justify-center mb-6 py-3 px-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 animate-fade-in-up">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-tight">Application couplée avec succès</span>
          </div>
        )}

        <OtpInput length={6} onChange={setOtp} />

        <button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-8"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Finaliser la connexion <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          Le code se renouvelle automatiquement toutes les 30 secondes
        </p>
      </div>
    </AuthLayout>
  );
}
