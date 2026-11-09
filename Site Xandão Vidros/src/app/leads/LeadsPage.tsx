import { useCallback, useEffect, useState } from 'react'
import type { Lead, StatusLead } from '../../types'
import { listarLeads, atualizarStatusLead } from './leads.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

const STATUS: StatusLead[] = ['novo', 'contatado', 'ganho', 'perdido']
const ROTULO: Record<StatusLead, string> = { novo: 'Novo', contatado: 'Contatado', ganho: 'Ganho', perdido: 'Perdido' }

export function linkWhatsappLead(lead: Lead): string {
  const num = '55' + lead.whatsapp.replace(/\D/g, '')
  const texto = `Olá ${lead.nome}, aqui é da Caldemat sobre seu orçamento de tanque de abastecimento.`
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}

const fmtData = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function LeadsPage() {
  const [itens, setItens] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      setItens(await listarLeads())
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function trocarStatus(id: string, status: StatusLead) {
    setErro(null)
    try {
      await atualizarStatusLead(id, status)
      await carregar()
    } catch (e) {
      setErro(msg(e))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Leads</h1>

      {erro && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : itens.length === 0 ? (
        !erro && <p>Nenhum lead recebido ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Data</th>
                <th>Nome</th>
                <th>Documento</th>
                <th>Capacidade</th>
                <th>Bacia</th>
                <th>Cidade</th>
                <th>Status</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="py-2 whitespace-nowrap">{fmtData(l.criado_em)}</td>
                  <td className="font-medium">{l.nome}</td>
                  <td>{l.documento ?? '—'}</td>
                  <td>{l.capacidade_litros != null ? `${l.capacidade_litros} L` : '—'}</td>
                  <td>{l.bacia_contencao == null ? '—' : l.bacia_contencao ? 'Sim' : 'Não'}</td>
                  <td>{l.cidade ?? '—'}</td>
                  <td>
                    <select
                      aria-label={`Status de ${l.nome}`}
                      className="rounded border border-gray-300 px-2 py-1"
                      value={l.status}
                      onChange={(e) => trocarStatus(l.id, e.target.value as StatusLead)}
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>{ROTULO[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <a
                      href={linkWhatsappLead(l)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-brand px-3 py-1 font-semibold text-white hover:bg-vidro"
                    >
                      Chamar no WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
