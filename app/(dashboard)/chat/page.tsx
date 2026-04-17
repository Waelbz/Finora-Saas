// @ts-nocheck
'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, Loader2, MessageCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre Expert IA comptable. Posez-moi vos questions sur la fiscalité française, le PCG, la TVA, les écritures comptables, ou tout autre sujet comptable." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 2048,
          system: 'Tu es un expert-comptable français. Réponds aux questions sur la fiscalité française, le PCG, la TVA, les écritures comptables, le droit comptable français. Sois précis, concis et utilise les références légales quand c\'est pertinent.',
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!resp.ok) throw new Error('Erreur ' + resp.status)
      const data = await resp.json()
      const reply = data.content?.find((b: any) => b.type === 'text')?.text || 'Désolé, je n\'ai pas pu répondre.'
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch (e: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Erreur: ' + (e.message || 'problème de connexion') }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center gap-3">
        <MessageCircle className="w-5 h-5 text-violet-500" />
        <div>
          <h1 className="text-white font-bold text-lg">Expert IA</h1>
          <p className="text-white/40 text-sm">Votre assistant comptable français</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white/[0.05] text-white/90 border border-white/[0.07]'}`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white/70" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-white/[0.05] border border-white/[0.07] px-4 py-3 rounded-2xl">
              <div className="text-sm text-white/50">Expert IA réfléchit…</div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.07] p-4 bg-[#0f1117]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Posez votre question comptable…"
            className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="btn btn-primary px-5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
