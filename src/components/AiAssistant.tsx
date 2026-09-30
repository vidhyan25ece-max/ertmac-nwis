import React, { useState, useRef, useEffect } from 'react';
import { ActiveDrillingState, OffsetWell } from '../types/drilling';
import { OFFSET_WELLS, FORMATION_LAYERS } from '../data/wellsData';
import { LookAheadAlert } from '../utils/riskModel';
import { useTheme } from '../context/ThemeContext';
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertTriangle } from 'lucide-react';

interface AiAssistantProps {
  activeWell: ActiveDrillingState;
  alerts: LookAheadAlert[];
  stuckPipeRisk: number;
  mudLossRisk: number;
  onSetDepth?: (depth: number) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  activeWell,
  alerts,
  stuckPipeRisk,
  mudLossRisk,
  onSetDepth,
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello, I am the eRTMAC AI Assistant. I can analyze offset well telemetry, historical DDR/WCR reports, and risk intervals at your active depth (${activeWell.currentDepth} m). How can I assist your drilling team?`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const generateAnswer = (userQuery: string): string => {
    const q = userQuery.toLowerCase().trim();

    // Check for specific depth mentions like "2039m" or "at 2410m"
    const depthMatch = q.match(/(\d{3,4})\s*m?/);
    const queriedDepth = depthMatch ? parseInt(depthMatch[1], 10) : activeWell.currentDepth;

    if (q.includes('why is the risk high') || q.includes('why is risk high')) {
      if (activeWell.currentDepth >= 2380 && activeWell.currentDepth <= 2450) {
        return `Risk is elevated because the current depth (${activeWell.currentDepth} m) is directly inside the 2390–2430 m historical risk corridor where Kaveri-Deep-01 (2415 m) and Neelam-North-05 (2442 m) suffered severe Stuck Pipe and Total Lost Circulation.`;
      } else if (activeWell.currentDepth >= 1950 && activeWell.currentDepth <= 2020) {
        return `Risk is elevated because the active bit (${activeWell.currentDepth} m) is traversing the Bassein Limestone reef member, where D-33-East-02 suffered 65 bbl/hr mud loss at 1985 m and Eastern-Trough-12 encountered H2S gas influx at 2010 m.`;
      } else {
        return `At ${activeWell.currentDepth} m, overall risk is currently ${stuckPipeRisk > 50 || mudLossRisk > 50 ? 'elevated' : 'nominal'}. The primary risk factor is ${stuckPipeRisk > mudLossRisk ? 'differential pressure sticking' : 'narrow fracture margin'} based on current mud weight of ${activeWell.mudWeight} SG.`;
      }
    }

    if (q.includes('what happened at 2420') || q.includes('2420m') || q.includes('2420 m')) {
      return `At 2420 m, offset well D-33-South-04 (OFF-G11) recorded severe high torque (29 kft-lb) and 70 klbs overpull on every stand during back-reaming, resulting in 16 hours NPT (DDR_DS04, Page 50).`;
    }

    if (q.includes('what happened at 2415') || q.includes('2415m') || q.includes('2415 m')) {
      return `At 2415 m, Kaveri-Deep-01 (OFF-A01) suffered severe Differential Sticking with 140 klbs overpull, incurring 64 hours NPT before being freed with acid soaking pills (WCR-OFF-A01, Page 48).`;
    }

    if (q.includes('what happened at 1985') || q.includes('1985m') || q.includes('1985 m')) {
      return `At 1985 m, D-33-East-02 (OFF-B04) encountered partial mud losses of 35 bbl/hr escalating to 65 bbl/hr in vuggy coral reef limestone, requiring 18 hours NPT (DDR-B04, Page 32).`;
    }

    if (depthMatch && (q.includes('drilling at') || q.includes('risk at') || q.includes('depth'))) {
      if (queriedDepth >= 2380 && queriedDepth <= 2450) {
        return `⚠ Elevated risk at ${queriedDepth} m. Nearby historical records show critical incidents around this depth, including Stuck Pipe in Kaveri-Deep-01 (2415 m) and total lost circulation in Neelam-North-05 (2442 m). Review offset evidence before proceeding.`;
      } else if (queriedDepth >= 1950 && queriedDepth <= 2020) {
        return `⚠ Moderate-to-High risk at ${queriedDepth} m. The Bassein Limestone interval features historical mud loss (1985 m) and sour gas kick (2010 m). Keep LCM pills on standby.`;
      } else {
        return `At ${queriedDepth} m, current prototype data indicates LOW–MODERATE risk. No immediate high-risk historical zone is nearby. Continue monitoring as you approach the 2390–2430 m historical risk interval.`;
      }
    }

    if (q.includes('show risky depths') || q.includes('risky depths') || q.includes('hazard zones')) {
      return `The primary high-risk depth intervals in the prototype dataset are: 1,985–2,010 m (Bassein Limestone vuggy losses & H2S kick) and 2,390–2,442 m (Panna Marine Shale differential sticking & catastrophic lost circulation).`;
    }

    if (q.includes('nearby historical incidents') || q.includes('historical incidents') || q.includes('nearby wells')) {
      return `There are 12 offset wells monitored within 15 km. Closest critical incidents: Kaveri-Deep-01 (Stuck Pipe at 2415 m, 1.8 km away) and D-33-East-02 (Mud Loss at 1985 m, 2.4 km away). Total fleet NPT documented: 438 hours.`;
    }

    if (q.includes('stuck pipe') || q.includes('sticking')) {
      return `Stuck pipe risk is driven by hydrostatic overbalance against depleted sand lenses in the Panna Formation (2390–2430 m). Recommended mitigation: cap mud weight at 1.34 SG and keep stationary connection time under 90 seconds.`;
    }

    if (q.includes('mud loss') || q.includes('losses') || q.includes('circulation')) {
      return `Severe mud loss occurred at 2442 m in Neelam-North-05 (1.44 SG mud exceeded 1.42 SG fracture gradient). Maintain ECD control and do not exceed 1.35 SG mud weight.`;
    }

    // Default fallback strictly respecting boundary rules
    return `I don't have supporting evidence for that in the current prototype dataset. You can ask about risk at specific depths, historical incidents in nearby wells, or why risk is elevated.`;
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = generateAnswer(query);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 font-medium text-xs shadow-lg transition-all transform hover:scale-105 ${
          isOpen
            ? 'bg-cyan-600 text-white ring-2 ring-cyan-400/50'
            : isDark
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
            : 'bg-white text-cyan-800 border border-cyan-300 hover:bg-cyan-50 shadow-md font-medium'
        }`}
        title="Open eRTMAC AI Assistant"
      >
        <Bot className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        <span>eRTMAC AI Assistant</span>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </button>

      {/* Floating Assistant Chat Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-18 right-5 z-50 w-96 max-w-[calc(100vw-2.5rem)] rounded-xl border shadow-2xl flex flex-col transition-all overflow-hidden backdrop-blur-md ${
            isDark
              ? 'bg-[#0a1120]/95 border-slate-800 text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
              : 'bg-white border-slate-300 text-slate-900 shadow-xl'
          }`}
          style={{ height: '500px' }}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-[#0d1629]' : 'border-slate-200 bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs leading-none">eRTMAC AI Assistant</h3>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Offset Drilling Intelligence Grounded
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`rounded-md p-1 transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Suggestions Chips */}
          <div
            className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-[10px] no-scrollbar ${
              isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <button
              onClick={() => handleSend(`Risk at current depth (${activeWell.currentDepth}m)?`)}
              className={`shrink-0 rounded-full px-2.5 py-1 transition-colors border ${
                isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
                  : 'border-slate-300 bg-white text-slate-800 font-medium hover:border-cyan-500 hover:text-cyan-800 shadow-2xs'
              }`}
            >
              Risk at current depth
            </button>
            <button
              onClick={() => handleSend('Nearby historical incidents?')}
              className={`shrink-0 rounded-full px-2.5 py-1 transition-colors border ${
                isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
                  : 'border-slate-300 bg-white text-slate-800 font-medium hover:border-cyan-500 hover:text-cyan-800 shadow-2xs'
              }`}
            >
              Nearby historical incidents
            </button>
            <button
              onClick={() => handleSend('Why is risk high?')}
              className={`shrink-0 rounded-full px-2.5 py-1 transition-colors border ${
                isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
                  : 'border-slate-300 bg-white text-slate-800 font-medium hover:border-cyan-500 hover:text-cyan-800 shadow-2xs'
              }`}
            >
              Why is risk high?
            </button>
            <button
              onClick={() => handleSend('Show risky depths')}
              className={`shrink-0 rounded-full px-2.5 py-1 transition-colors border ${
                isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
                  : 'border-slate-300 bg-white text-slate-800 font-medium hover:border-cyan-500 hover:text-cyan-800 shadow-2xs'
              }`}
            >
              Show risky depths
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px]">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-[82%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                      : 'bg-slate-100 border border-slate-300 text-slate-900 rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`mt-1 block text-[9px] font-mono text-right opacity-60`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
                {msg.sender === 'user' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-200 text-[10px]">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-8">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></span>
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  ></span>
                </div>
                <span className="text-[11px] font-mono">Analyzing offset telemetry...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div
            className={`p-2.5 border-t flex items-center gap-2 ${
              isDark ? 'border-slate-800 bg-[#0d1629]' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <input
              type="text"
              placeholder="Ask drilling questions (e.g. 'I am at 2410m')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 shadow-2xs'
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                input.trim()
                  ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                  : isDark
                  ? 'bg-slate-800 text-slate-600'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
