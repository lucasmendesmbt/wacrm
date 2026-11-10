'use client'

import { useState } from 'react'
import { Loader2, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Source {
  conversationId: string
  contact: string
  status: string
  lastMessageAt: string | null
  messagesReviewed: number
}
interface Scope {
  conversationsReviewed: number
  maxMessagesPerConversation: number
  includesAttachments: boolean
  includesGoogleAds: boolean
}

export function MissirianManager() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [scope, setScope] = useState<Scope | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async () => {
    const value = question.trim()
    if (value.length < 3 || value.length > 500 || loading) return
    setLoading(true)
    setError('')
    setAnswer('')
    setSources([])
    setScope(null)
    try {
      const response = await fetch('/api/ai/manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: value }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Não foi possível consultar a IA.')
      setAnswer(typeof data.answer === 'string' ? data.answer : '')
      setSources(Array.isArray(data.sources) ? data.sources : [])
      setScope(data.scope ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na consulta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h2 className="font-semibold">Assistente gerencial Missirian</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta somente leitura das conversas recentes da sua conta.
            Nenhuma mensagem é enviada aos clientes.
          </p>
        </div>
      </div>
      <label htmlFor="missirian-question" className="block text-sm font-medium">
        O que deseja analisar?
      </label>
      <textarea
        id="missirian-question"
        rows={3}
        maxLength={500}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Quais clientes estão aguardando resposta e quais precisam de acompanhamento?"
        className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
      />
      <Button onClick={() => void analyze()} disabled={loading || question.trim().length < 3}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
        Analisar conversas
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {answer && (
        <section aria-label="Análise" className="space-y-3 rounded-lg bg-muted/50 p-4">
          <h3 className="font-semibold">Análise da IA</h3>
          <p className="whitespace-pre-wrap text-sm leading-6">{answer}</p>
        </section>
      )}
      {scope && (
        <section className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Recorte consultado: {scope.conversationsReviewed} conversas recentes;
            até {scope.maxMessagesPerConversation} mensagens de texto por conversa.
            Áudios, anexos e Google Ads ainda não estão incluídos.
          </p>
          {sources.length > 0 && (
            <details className="rounded-lg border border-border p-3">
              <summary className="cursor-pointer font-medium">Conversas consideradas ({sources.length})</summary>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {sources.map((source) => (
                  <li key={source.conversationId}>
                    {source.contact} — {source.messagesReviewed} mensagens;
                    status: {source.status};
                    última atividade: {source.lastMessageAt ? new Date(source.lastMessageAt).toLocaleString('pt-BR') : 'indisponível'}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </div>
  )
}
