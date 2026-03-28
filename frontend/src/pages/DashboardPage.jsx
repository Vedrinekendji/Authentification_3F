import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, LogOut, Shield, 
  Activity, CheckCircle2, ShieldAlert, Clock, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [loadState, setLoadState] = useState(true);
  const [isLogMenuOpen, setIsLogMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const initTerminal = async () => {
      const activeToken = localStorage.getItem('authToken');
      if (!activeToken) { navigate('/'); return; }
      
      try {
        const [{ data: identity }, { data: logs }] = await Promise.all([
          api.get('/auth/me'),
          api.get('/auth/my-logs')
        ]);
        setSessionData(identity);
        setUserLogs(logs);
      } catch (err) {
        localStorage.removeItem('authToken');
        navigate('/');
      } finally {
        setLoadState(false);
      }
    };
    initTerminal();
  }, [navigate]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLogMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    toast.success('Déconnexion effectuée.');
    navigate('/');
  };

  const formatIsoDate = (iso) => {
    if (!iso) return 'Non disponible';
    
    // On convertit le format MySQL (YYYY-MM-DD HH:mm:ss) en objet Date
    // Si on n'ajoute pas de "Z", le navigateur l'interprète souvent comme l'heure locale, 
    // ce qui peut créer des décalages si la DB est déjà à l'heure locale.
    // L'astuce ici est de forcer la date à être traitée comme une date locale s'il n'y a pas de fuseau.
    const date = new Date(iso.replace(' ', 'T'));
    
    return new Intl.DateTimeFormat('fr-FR', {
       hour: '2-digit', minute: '2-digit', second: '2-digit',
       hour12: false
    }).format(date);
  };

  const formatFullDate = (iso) => {
    if (!iso) return 'Non disponible';
    const date = new Date(iso.replace(' ', 'T'));
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  if (loadState) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { account, telemetry } = sessionData;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-['Montserrat'] selection:bg-slate-900 selection:text-white">
      
      {/* HEADER MINIMALISTE */}
      <header className="px-12 py-6 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-[100]">
        <div className="flex items-center gap-6">
           <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
           </div>
           <h2 className="text-[13px] font-bold tracking-tight">
             Bienvenue, <span className="text-slate-400 font-medium">{account?.email}</span>
           </h2>
        </div>

        <nav className="flex items-center gap-10">
           
           {/* MENU DEROULANT JOURNAL D'AUDIT */}
           <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsLogMenuOpen(!isLogMenuOpen)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isLogMenuOpen ? 'text-[#1e3a8a]' : 'text-slate-400 hover:text-slate-900'}`}
              >
                Journal d'Audit <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 ${isLogMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU */}
              {isLogMenuOpen && (
                <div className="absolute right-0 mt-6 w-[400px] bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activités Récentes</p>
                   </div>
                   <div className="max-h-[450px] overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
                      {userLogs.map(log => (
                        <div key={log.id} className="px-6 py-4 hover:bg-slate-50 flex items-center justify-between gap-4 border-b border-slate-50 last:border-0">
                           <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              <div>
                                 <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</p>
                                 <p className="text-[9px] text-slate-400 font-bold">{log.ip_address}</p>
                              </div>
                           </div>
                           <span className="text-[9px] text-slate-300 font-black italic">{formatIsoDate(log.created_at)}</span>
                        </div>
                      ))}
                      {userLogs.length === 0 && (
                        <div className="py-12 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">
                           Identité stérile
                        </div>
                      )}
                   </div>
                   <div className="p-5 bg-slate-50/50 flex justify-center border-t border-slate-50">
                      <button className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1e3a8a] hover:underline" onClick={() => setIsLogMenuOpen(false)}>Réduire le terminal</button>
                   </div>
                </div>
              )}
           </div>

           <button 
             onClick={handleLogout}
             className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
           >
             Quitter
           </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-12 py-24">
        
        {/* BLOC INFORMATION RÉDUIT À L'ESSENTIEL */}
        <section className="bg-white border border-slate-100 rounded-[40px] p-12 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-12">Session Identity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"><Mail className="w-5 h-5" /></div>
                <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Contact-Point</p>
                    <p className="font-bold text-slate-900 text-sm tracking-tight">{account?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"><Calendar className="w-5 h-5" /></div>
                <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Last Iteration</p>
                    <p className="font-bold text-slate-900 text-sm tracking-tight">{formatFullDate(telemetry.lastConnection)} - {formatIsoDate(telemetry.lastConnection)}</p>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-12 border-t border-slate-50 flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Protection Active</span>
               </div>
               <span className="w-1 h-1 bg-slate-200 rounded-full" />
               <p className="text-[11px] text-slate-400 font-medium">Votre terminal est actuellement isolé et surveillé par Sentinel Core.</p>
            </div>
        </section>

      </main>

      <footer className="fixed bottom-10 left-12 opacity-30">
         <span className="text-[9px] font-black uppercase tracking-[0.4em]">STNL.SYS // V2.0</span>
      </footer>
    </div>
  );
}
