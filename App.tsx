
import React, { useState, useRef, useEffect } from 'react';
import { Role, Message, ChatState } from './types';
import { geminiService } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { LawIcon } from './components/LawIcon';
import { Send, Trash2, ShieldAlert, BookOpen, Info, Search, Menu, X, Gavel, Scale } from 'lucide-react';

const SUGGESTIONS = [
  "¿Cuál es el procedimiento en caso de riña callejera?",
  "Requisitos para un allanamiento sin orden judicial",
  "Uso progresivo de la fuerza y Ley 2197",
  "Derechos de una persona capturada",
  "Multas por porte de sustancias prohibidas",
  "Sanciones por ruidos excesivos en barrios"
];

const App: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || state.isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));
    setInput('');

    try {
      const response = await geminiService.sendMessage(state.messages, text);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        content: response.text,
        timestamp: new Date(),
        sources: response.sources,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Error de conexión con JurisPol. Intente de nuevo.",
      }));
    }
  };

  const clearChat = () => {
    if (window.confirm('¿Está seguro de que desea borrar el historial de consulta?')) {
      setState({
        messages: [],
        isLoading: false,
        error: null,
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-80 bg-[#064e3b] text-white z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl`}>
        <div className="p-6 border-b border-emerald-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-400/20 rounded-lg">
              <LawIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">JurisPol</h1>
              <p className="text-[10px] text-emerald-300 font-medium uppercase tracking-widest">Asistente Normativo</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-emerald-300">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest px-4 mb-3">Normatividad Clave</p>
            <nav className="space-y-1">
              {[
                { icon: <Gavel size={16} />, label: "Ley 1801 de 2016", desc: "Código de Convivencia" },
                { icon: <Scale size={16} />, label: "Ley 599 de 2000", desc: "Código Penal" },
                { icon: <ShieldAlert size={16} />, label: "Ley 2197 de 2022", desc: "Seguridad Ciudadana" },
                { icon: <BookOpen size={16} />, label: "Ley 906 de 2004", desc: "Proc. Penal" }
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 hover:bg-emerald-800/50 rounded-xl cursor-help transition-colors group">
                  <div className="text-emerald-400 group-hover:text-white transition-colors">{item.icon}</div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-[10px] text-emerald-300/70">{item.desc}</div>
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest px-4 mb-3">Historial de Consulta</p>
            {state.messages.length === 0 ? (
              <div className="px-4 py-8 text-center bg-emerald-900/20 rounded-2xl border border-emerald-800/30">
                <Info size={24} className="mx-auto mb-2 text-emerald-400/50" />
                <p className="text-xs text-emerald-300/60 italic">No hay consultas previas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {state.messages.filter(m => m.role === Role.USER).slice(-5).map(m => (
                  <button 
                    key={m.id}
                    onClick={() => handleSend(m.content)}
                    className="w-full text-left p-3 text-xs bg-emerald-800/30 hover:bg-emerald-700/50 rounded-xl border border-emerald-800/50 transition-all truncate"
                  >
                    {m.content}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-emerald-900/50">
          <button 
            onClick={clearChat}
            className="flex items-center justify-center space-x-2 w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl transition-all text-xs font-bold border border-red-500/20"
          >
            <Trash2 size={14} />
            <span>LIMPIAR CONSULTA</span>
          </button>
          <p className="text-[9px] text-center mt-4 text-emerald-400/60 leading-relaxed font-medium">
            Sistema de Apoyo Jurídico Institucional<br/>
            &copy; 2024 JurisPol Colombia
          </p>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-4 text-slate-500">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-800">Centro de Consulta Normativa</h2>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Servidor de Inteligencia Jurídica Activo</span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-3">
             <div className="text-xs text-slate-500 flex items-center bg-slate-100 px-3 py-1.5 rounded-full font-medium">
               <Search size={12} className="mr-2" />
               Búsqueda por Similitud Semántica
             </div>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
        >
          {state.messages.length === 0 ? (
            <div className="max-w-3xl mx-auto py-12 px-4 text-center">
              <div className="mb-8 inline-flex p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                <ShieldAlert size={48} className="text-emerald-700" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Bienvenido a JurisPol</h3>
              <p className="text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto">
                Tu asistente IA especializado en todas las leyes, decretos y protocolos que rigen el servicio de policía en Colombia. ¿En qué normatividad puedo apoyarte hoy?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="p-4 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl text-sm text-slate-700 transition-all shadow-sm hover:shadow-md flex items-start group"
                  >
                    <Search size={16} className="mr-3 mt-0.5 text-slate-400 group-hover:text-emerald-500 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full">
              {state.messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              
              {state.isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="bg-white border border-emerald-100 px-6 py-4 rounded-2xl shadow-sm flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Consultando Código Nacional...</span>
                  </div>
                </div>
              )}

              {state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm mb-6 flex items-start shadow-sm">
                  <ShieldAlert size={18} className="mr-3 flex-shrink-0 mt-0.5" />
                  <p className="font-medium">{state.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-200 z-30">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center bg-slate-100 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all overflow-hidden shadow-inner">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escriba su consulta normativa (ej: Procedimiento para riñas)..."
                className="flex-1 bg-transparent py-4 pl-6 pr-14 text-sm focus:outline-none resize-none min-h-[56px] max-h-32 custom-scrollbar text-slate-800 placeholder-slate-500"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || state.isLoading}
                className={`absolute right-3 p-2.5 rounded-xl transition-all ${
                  !input.trim() || state.isLoading 
                    ? 'bg-slate-300 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-3 text-[10px] text-center text-slate-500 font-medium">
              JurisPol utiliza Inteligencia Artificial y fuentes abiertas para guiarte. 
              <span className="text-emerald-600 font-bold ml-1">Verifica siempre con el manual institucional vigente.</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
