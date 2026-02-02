
import React from 'react';
import { Message, Role } from '../types';
import { User, Shield, ExternalLink, Clock } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === Role.ASSISTANT;

  return (
    <div className={`flex w-full mb-6 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${isAssistant ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'} shadow-sm`}>
          {isAssistant ? <Shield size={20} /> : <User size={20} />}
        </div>
        
        <div className={`mx-3 ${isAssistant ? 'items-start' : 'items-end'} flex flex-col`}>
          <div className={`px-5 py-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isAssistant 
              ? 'bg-white text-slate-800 border border-emerald-100' 
              : 'bg-emerald-600 text-white font-medium'
          }`}>
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {isAssistant && message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center uppercase tracking-wider">
                  <ExternalLink size={12} className="mr-1" /> Fuentes consultadas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-slate-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded transition-colors"
                    >
                      {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-1 flex items-center text-[10px] text-slate-400 font-medium px-2">
            <Clock size={10} className="mr-1" />
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};
