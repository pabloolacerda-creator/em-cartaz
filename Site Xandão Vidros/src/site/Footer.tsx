import { EMAIL, INSTAGRAM, INSTAGRAM_URL, TELEFONE, WHATSAPP_URL } from './dados'

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <img src="/logo-branco.png" alt="Caldemat" className="h-14 w-auto self-start" />
        <ul className="space-y-1 text-sm">
          <li>
            WhatsApp:{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-white hover:text-vidro">
              <span>{TELEFONE}</span>
            </a>
          </li>
          <li>
            Instagram:{' '}
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-white hover:text-vidro">
              <span>{INSTAGRAM}</span>
            </a>
          </li>
          <li>{EMAIL}</li>
        </ul>
      </div>
      <p className="border-t border-zinc-800 px-4 py-4 text-center text-xs">
        © {new Date().getFullYear()} Caldemat Indústria Metalúrgica · Várzea Grande/MT
      </p>
    </footer>
  )
}
