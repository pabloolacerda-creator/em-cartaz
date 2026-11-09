# Site + Sistema de Gestão — Xandão Vidros

**Data:** 2026-11-09
**Cliente final:** Xandão Vidros (vidraçaria; Instagram @xandaovidros1 — "Segurança, elegância e resistência")
**Responsável pela entrega:** Pablo
**Base de referência:** projeto `Site caldemat` (mesmo repositório), reaproveitado quase integralmente.

---

## 1. Intenção e o porquê

O Xandão é vidraceiro e **não tem nenhum controle do negócio hoje**. Trabalha por telefone/visita (sem loja física): o cliente liga, ele vai ao local medir, passa o preço e combina o pagamento. Hoje nada disso é registrado — orçamento, pedido, o que entrou, o que saiu, quem é o cliente, nada.

O objetivo é dar a ele **duas coisas conectadas**:

1. **Um site institucional** que dê presença e sirva de porta de entrada (o cliente conhece, vê trabalhos, chama no WhatsApp).
2. **Um sistema de gestão** que controle o ciclo completo: orçamento → pedido/O.S. → financeiro, com cadastro de clientes, catálogo de vidros/ferragens e um painel financeiro (entrada, saída, fluxo de caixa, contas a pagar e a receber).

O "porquê" central: hoje o Xandão não enxerga **o quanto entra, o quanto sai e o quanto sobra**, e perde o rastro dos orçamentos. O sistema existe para dar essa visão e profissionalizar o atendimento (orçamento em PDF com a cara da empresa, enviado no WhatsApp).

Decisão estruturante já tomada com o Pablo: **isto deve ser "exatamente como o Caldemat"**. Não é um sistema novo pensado do zero — é o Caldemat clonado e reescopado para vidraçaria. Isso mantém o custo baixo, reaproveita algo já testado em produção e dá a cara/comportamento que o Pablo já conhece e aprovou.

---

## 2. Como o fluxo funciona (visão do usuário)

**Dois mundos conectados, idênticos ao Caldemat:**

### Mundo 1 — Pedidos (começa no orçamento)
1. O Xandão cria um **Orçamento**: escolhe o cliente e monta item por item. Cada item puxa um produto do catálogo (tipo de vidro ou ferragem), com `unidade` e preço. Para vidro, informa **largura × altura** e o sistema calcula o **m²** e o valor do item automaticamente; para ferragem, informa a quantidade.
2. O documento nasce como **Orçamento** (status *Emitido*). O Xandão **imprime/salva como PDF** (recurso do navegador) e **manda no WhatsApp do cliente na mão**. O PDF já traz timbrado, itens, medidas em m², desconto, total e forma de pagamento.
3. Quando o cliente aceita, o Xandão marca **Aprovado** — o documento passa a se chamar **Pedido**.
4. Do pedido aprovado ele gera a **Ordem de Serviço** (documento interno de produção, **sem valores**) e **Fatura** o pedido.
5. Faturar **lança automaticamente no Financeiro** a conta a receber (à vista ou parcelado, via `FaturarDialog`).

### Mundo 2 — Financeiro
- **Painel/dashboard** com entrada, saída, saldo e fluxo de caixa.
- **Lançamentos** de receita e despesa, cada um com vencimento e data de pagamento (`pago_em` vazio = em aberto). Isso é, na prática, **contas a pagar e a receber**.
- **Contas/caixas** com saldo (saldo inicial + recebido − pago).

### Cadastros de apoio (já existem no Caldemat)
- **Clientes** (nome, documento, telefone, e-mail, endereço).
- **Catálogo de produtos** = tipos de vidro (unidade `m²`, preço por m²) e ferragens (unidade `Unidade`, preço cada). *No Caldemat esse módulo se chama "Produtos"/"Matéria-prima"; aqui ele é o catálogo de vidros e ferragens.*
- **Estoque** (opcional para o Xandão — ver Não-objetivos).
- **Usuários/permissões por módulo** (admin + `pode_*`).

---

## 3. O que vem pronto do Caldemat (reaproveitado como está)

- **Stack:** Vite + React + TypeScript + Tailwind; backend **Supabase** (Postgres + Auth + RLS + Edge Function `admin-users`). Deploy Vercel. (Será um **projeto Supabase novo** e um **deploy Vercel novo**, só para o Xandão.)
- **Login** por usuário/senha e **permissões por módulo** (`perfis` + `pode_materia_prima/estoque/clientes/pedidos/produtos/financeiro`).
- **Clientes** (CRUD completo).
- **Catálogo de produtos** com `unidade` + `valor_venda` → serve direto para vidros (m²) e ferragens (un).
- **Cálculo de item** (`src/app/pedidos/calculo.ts`): modos `area` (m² = largura×altura), `linear` e `quantidade`. **O cálculo de vidro por m² já está resolvido.**
- **Fluxo orçamento → pedido → O.S. → faturar** com status *Emitido/Aprovado/Reprovado/Faturado* (`status.ts`, `PedidoDetalhe.tsx`, `PedidoOS.tsx`, `FaturarDialog.tsx`).
- **Documento do cliente com preços** = `PedidoDetalhe.tsx` (imprime via `window.print()`, com timbrado, medidas em m², desconto, total, forma de pagamento). **É o "PDF do orçamento".**
- **Ordem de Serviço** sem valores para produção (`PedidoOS.tsx`).
- **Financeiro completo:** `contas_financeiras`, `lancamentos` (receita/despesa, vencimento, `pago_em`), views de saldo, painel/dashboard, integração automática ao faturar.
- **Site institucional** público + formulário que gera **leads** no sistema.

---

## 4. O que muda em relação ao Caldemat (o trabalho real)

1. **Marca / identidade (rebranding):**
   - `src/lib/empresa.ts` → dados da Xandão Vidros: nome **Xandão Vidros**, atendimento em **Cuiabá e Várzea Grande/MT**, WhatsApp **(65) 98403-1635**.
   - **Logo:** fornecida em `IMG/logo/` — wordmark "XANDÃO VIDROS" em **cinza grafite** com monograma geométrico (um "X" de vidraças), em duas versões: **empilhada** (símbolo sobre o texto) e **horizontal** (símbolo à esquerda). Usar a horizontal no header do site e a empilhada no timbrado.
   - **Timbrado** (`public/timbrado.png`) gerado a partir da logo para os documentos impressos (orçamento/pedido/O.S.).
   - Paleta: **grafite** (da logo) como cor base + um **azul/teal de vidro** como acento, no lugar do verde/esmeralda da metalúrgica. Mesma estrutura de layout do Caldemat.
   - `WHATSAPP_URL` apontando para (65) 98403-1635; textos de contato com Cuiabá e Várzea Grande.

2. **Conteúdo do site institucional:**
   - Home, "Empresa"/sobre, serviços e contato reescritos para vidraçaria: **box de banheiro, espelhos, portas e divisórias de vidro, janelas, guarda-corpo, fachadas, tampos** (lista final a confirmar com o Pablo).
   - Fotos de trabalhos (do Instagram ou fornecidas pelo Pablo).
   - Lema "Segurança, elegância e resistência".

3. **Catálogo inicial (seed):** popular o catálogo de produtos com tipos de vidro (temperado, comum, espelho, etc.) por m² e ferragens por unidade. Preços entram depois (pelo Xandão) ou como tabela inicial fornecida pelo Pablo.

4. **Remover o que é específico de metalúrgica:** a **calculadora de chapa de aço por peso** (`src/lib/chapa.ts` + `CalculadoraPage`) não serve para vidro e sai do projeto (ou fica desativada). O cálculo de m² necessário já está em `calculo.ts`.

5. **Nomenclatura na interface:** ajustar rótulos que façam sentido para vidraçaria (ex.: "Matéria-prima" → "Vidros e ferragens", se aplicável), sem mexer na lógica.

---

## 5. Objetivos, não-objetivos e anti-objetivos

### Objetivos
- Xandão consegue, de ponta a ponta: cadastrar cliente → montar orçamento com cálculo de m² → gerar PDF com a marca dele → marcar aprovado → gerar O.S. → faturar → ver no financeiro.
- Painel financeiro mostra entrada, saída, saldo, contas a pagar e a receber.
- Site institucional no ar, com WhatsApp e leads chegando no sistema.

### Não-objetivos (nesta entrega)
- **Envio automático de WhatsApp/PDF** — o Xandão envia o PDF manualmente. (A automação fica para depois, se ele quiser.)
- **Controle de estoque de vidro** — o módulo existe no Caldemat, mas o Xandão pediu o foco em financeiro + pedidos. **Decisão: manter o módulo disponível (já existe, custa quase nada) mas sem seed; como o acesso é só do Xandão-admin, ele simplesmente não usa se não quiser.**
- **Gestão de funcionários / múltiplos usuários** — o acesso é **só do Xandão** (um único usuário admin). O sistema de permissões por módulo continua existindo (vem do Caldemat), mas não há cadastro de funcionários nem telas a configurar: um admin vê tudo. A Edge Function `admin-users` pode ficar, mas não é usada no dia a dia.
- Aprovação do orçamento pelo cliente dentro do sistema (ele aprova por WhatsApp; o Xandão registra).
- App mobile nativo (o site/painel é responsivo, como o Caldemat).

### Anti-objetivos (seria fracasso mesmo "funcionando")
- Ficar mais complexo que o Caldemat — a meta é igualar, não sofisticar.
- PDF/documento sem a cara do Xandão (timbrado genérico derruba o valor percebido).
- Exigir que o Xandão aprenda contabilidade — o financeiro precisa falar "entrou / saiu / a receber / a pagar".

---

## 6. Restrições

- Reutilizar a base do Caldemat verbatim onde der; divergir só onde a Seção 4 pede.
- Mesma stack e mesmo padrão de deploy (Supabase novo + Vercel novo).
- Segredos (service role) nunca no front nem no Vercel (idem Caldemat).
- Conteúdo em pt-BR.
- Entregar ao final um **"relatório dos caminhos"** para o cliente (como no Caldemat: `docs/relatorio-dos-caminhos.md`) — guia de como usar e operar.

---

## 7. Decisões já tomadas (as que o builder não precisa reabrir)

- **Clonar o Caldemat** como ponto de partida (não começar do zero). — do Pablo
- Pasta do projeto: **`Site Xandão Vidros`** (mesmo padrão de nome do `Site caldemat`). — do Pablo
- **PDF do orçamento = impressão do navegador** sobre `PedidoDetalhe` (sem engine de PDF novo). — minha decisão, confirmada pelo fluxo "manda PDF no WhatsApp"
- Catálogo de vidros/ferragens **usa o módulo de produtos existente** (unidade + valor_venda); sem calculadora nova. — minha decisão
- **Remover a calculadora de chapa de aço** (específica de metalúrgica). — minha decisão
- Logo: **o Pablo coloca o arquivo pronto na pasta**. — do Pablo

---

## 8. O que fica a cargo do builder (decisões menores)

- Estrutura de pastas/rotas: espelhar o Caldemat.
- Nome exato dos rótulos reescritos na interface.
- Paleta concreta da identidade "vidro" (dentro do espírito aprovado).
- Como desativar/esconder a calculadora de chapa e (se for o caso) o estoque.
- Organização do seed do catálogo.

---

## 9. Dados do cliente (respondidos pelo Pablo)

1. **Cidade / região:** Cuiabá e Várzea Grande/MT. ✅
2. **WhatsApp:** (65) 98403-1635. ✅
3. **Logo:** em `IMG/logo/` (wordmark grafite + monograma, versões empilhada e horizontal). ✅
4. **Fotos de trabalhos:** o Pablo envia depois. ⏳ *(entra perto do fim; até lá, usar placeholders/Instagram)*
5. **Serviços a destacar no site:**
   - **Residencial:** instalação de portas de vidro, janelas de vidro temperado, box para banheiro, espelhos sob medida, fechamento de sacadas, envidraçamento de varandas, divisórias de vidro, guarda-corpo de vidro, coberturas de vidro, prateleiras de vidro, tampos de mesa de vidro, nichos de vidro.
   - **Comercial:** fachadas de vidro, vitrines comerciais, portas de vidro temperado, divisórias corporativas, fechamento de ambientes, pele de vidro, portas automáticas de vidro, balcões e expositores, guichês de atendimento, fechamento de lojas. ✅
6. **Preços:** **catálogo sem preços** — o Xandão preenche os valores depois. ✅
7. **Login:** **só o Xandão** (um usuário admin; sem funcionários). ✅

Nenhuma pendência bloqueia iniciar. Só as **fotos** (item 4) ficam para o fim.

---

## 10. Próximo passo

Projeto de porte "documento + plano". Com este design aprovado, o próximo passo é escrever o **plano de implementação** (superpowers:writing-plans) e então executar. A construção só começa depois da aprovação deste documento.
