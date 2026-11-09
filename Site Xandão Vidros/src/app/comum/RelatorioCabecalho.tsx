// Cabeçalho que aparece SÓ na impressão do relatório (papel timbrado + título + período).
export default function RelatorioCabecalho({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <header className="print-only mb-4">
      <img src="/timbrado.png" alt="Xandão Vidros" className="w-full" />
      <div className="mt-2 border-b pb-2">
        <div className="text-lg font-bold">{titulo}</div>
        {subtitulo && <div className="text-sm text-gray-600">{subtitulo}</div>}
      </div>
    </header>
  )
}
