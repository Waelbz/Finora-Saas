'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, Paperclip, RotateCcw, Loader2, MicOff } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  file?: string
}

const SUGGESTIONS = [
  '💼 Frais de déplacement — quels comptes utiliser ?',
  '🏗 Comment comptabiliser une immobilisation ?',
  '📋 Différence entre compte 6411 et 6412 ?',
  '📄 Écriture d\'une facture fournisseur avec TVA',
  '💰 Comment calculer les charges patronales ?',
  '⚖️ Qu\'est-ce que la liasse fiscale ?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatFile, setChatFile] = useState<File | null>(null)
  const [recording, setRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const apiKey = typeof window !== 'undefined' ? sessionStorage.getItem('finora_key') || '' : ''

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim()
    if (!content && !chatFile) return
    if (!apiKey) { alert('Configurez votre clé API dans Paramètres'); return }

    const userMsg: Message = {
      role: 'user',
      content: content || '(document joint)',
      timestamp: new Date().toISOString(),
      file: chatFile?.name,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setChatFile(null)
    setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Hide suggestions after first message
    try {
      const history = [...messages, userMsg].slice(-10)

      const contentParts: object[] = []
      if (chatFile) {
        const b64 = await toBase64(chatFile)
        const isPdf = chatFile.type === 'application/pdf'
        contentParts.push(
          isPdf
            ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
            : { type: 'image', source: { type: 'base64', media_type: chatFile.type, data: b64 } }
        )
      }
      if (content) contentParts.push({ type: 'text', text: content })

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 2048,
          system: `Tu es un expert-comptable français senior, spécialisé en comptabilité générale (PCG français), fiscalité française (TVA, IS, IR), droit social français (paie, cotisations), et Sage Génération Expert. Tu connais les normes IFRS et les règles de la Direction Générale des Finances Publiques (DGFiP).

Réponds en français, de façon précise et professionnelle. Utilise des exemples concrets avec les numéros de comptes du Plan Comptable Général (PCG) quand c'est pertinent. Format tes réponses avec des sauts de ligne pour la lisibilité. Utilise \`code\` pour les numéros de compte et les écritures.`,
          messages: history.map(m => ({
            role: m.role,
            content: m === userMsg ? contentParts : m.content
          }))
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || `Erreur ${res.status}`)

      const aiText = data.content?.find((b: { type: string }) => b.type === 'text')?.text || ''
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiText,
        timestamp: new Date().toISOString(),
      }])

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Erreur : ${message}`,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const toggleVoice = () => {
    const SR = (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
               (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) { alert('Reconnaissance vocale non disponible. Utilisez Chrome.'); return }

    if (recording && recognition) {
      recognition.stop(); setRecording(false); return
    }

    const rec = new SR()
    rec.lang = 'fr-FR'; rec.interimResults = true; rec.continuous = false
    rec.onresult = (e: anyEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setInput(t)
    }
    rec.onend = () => setRecording(false)
    rec.onerror = () => setRecording(false)
    rec.start()
    setRecognition(rec)
    setRecording(true)
  }

  const formatContent = (text: string) => {
    // Markdown basique
    return text
      .replace(/`([^`]+)`/g, '<code class="text-violet-600 bg-violet-50 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="animate-page-in flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-white font-bold text-lg font-display">Expert IA</h1>
          <p className="text-white/40 text-sm mt-0.5">Expert-comptable IA — PCG, fiscalité, droit social</p>
        </div>
        <button onClick={() => setMessages([])} className="btn btn-sm text-white/60 border-white/10 hover:bg-white/10">
          <RotateCcw className="w-3.5 h-3.5" /> Nouvelle conv.
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#f8f9fc] px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center shadow-[0_8px_24px_rgba(108,71,255,.3)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-extrabold font-display text-[#0f1117] mb-2">Votre expert-comptable IA</h2>
              <p className="text-sm text-[#858aaa] max-w-sm leading-relaxed">
                Posez vos questions sur la comptabilité, la fiscalité française et le droit social.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-xl">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-2 rounded-full bg-white border border-[#eaecf4] text-sm text-[#3d4263] hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
            )}
            <div
              className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}
              dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center flex-shrink-0 mr-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div className="bubble-ai flex items-center gap-1.5 py-3">
              {[0,1,2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#c0c5de] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input zone */}
      <div className="bg-white border-t border-[#eaecf4] px-8 py-4 flex-shrink-0">
        {chatFile && (
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-sm text-violet-700">
            <Paperclip className="w-3.5 h-3.5" />
            <span className="font-medium">{chatFile.name}</span>
            <button onClick={() => setChatFile(null)} className="text-violet-400 hover:text-violet-600 ml-1">×</button>
          </div>
        )}

        <div className="flex items-end gap-3 bg-[#f4f5f9] rounded-2xl px-4 py-3 border border-transparent focus-within:border-violet-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(108,71,255,.1)] transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            placeholder="Posez votre question comptable… (Entrée pour envoyer)"
            rows={1}
            className="flex-1 resize-none border-none outline-none bg-transparent text-sm text-[#0f1117] placeholder:text-[#c0c5de] leading-relaxed max-h-40 overflow-y-auto"
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer text-[#858aaa] hover:bg-violet-50 hover:text-violet-500 transition-all">
              <Paperclip className="w-4 h-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={e => e.target.files?.[0] && setChatFile(e.target.files[0])}
              />
            </label>
            <button
              onClick={toggleVoice}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                recording
                  ? 'bg-red-50 text-red-500 animate-pulse'
                  : 'text-[#858aaa] hover:bg-green-50 hover:text-green-500'
              }`}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !chatFile)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(108,71,255,.3)] hover:shadow-[0_4px_14px_rgba(108,71,255,.4)] hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-[#c0c5de] mt-2">
          Entrée pour envoyer · Shift+Entrée nouvelle ligne · 📎 joindre un document
        </p>
      </div>
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
