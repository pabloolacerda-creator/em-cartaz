import Header from './Header'
import Home from './Home'
import Empresa from './Empresa'
import Produtos from './Produtos'
import Servicos from './Servicos'
import Contato from './Contato'
import Footer from './Footer'

export default function SitePublico() {
  return (
    <div className="overflow-x-hidden scroll-smooth font-sans text-zinc-900">
      <Header />
      <main>
        <Home />
        <Empresa />
        <Produtos />
        <Servicos />
        <Contato />
      </main>
      <Footer />
    </div>
  )
}
