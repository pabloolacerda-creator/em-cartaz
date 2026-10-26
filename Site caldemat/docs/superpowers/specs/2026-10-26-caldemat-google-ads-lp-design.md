# Caldemat — Google Ads + LP de Orçamento + aba Leads

**Data:** 2026-10-26
**Cliente:** Caldemat Indústria Metalúrgica (Várzea Grande, MT)
**Status:** Design para aprovação (nada será construído antes do "ok")
**Repositório afetado:** `Site caldemat` (site público + área de gestão já existentes)

---

## 1. Intenção e o porquê

A Caldemat capta cliente hoje **só por WhatsApp**, e o tráfego pago dela é só
Meta Ads. O dono do projeto (Pablo, que gerencia o marketing) quer **testar o
Google Ads** para trazer leads de quem **procura ativamente** por produtos de
abastecimento agrícola no Google — intenção de compra, não descoberta.

A visão inicial era "automação", mas a verdade foi destravada na conversa: a
Caldemat **nunca rodou uma campanha no Google**. Então o objetivo real não é
automatizar nada ainda — é **fazer a primeira campanha rodar e gerar lead**.
Automação (se fizer sentido) fica para depois que isso provar resultado.

Para o lead não se perder e o teste poder ser medido, o anúncio não vai para a
home: vai para uma **Landing Page (LP) de orçamento** focada, com um
**formulário qualificador**. Quem envia **cai numa aba "Leads"** dentro do
sistema de gestão que a Caldemat já tem, e o **vendedor** parte para cima
(chama a pessoa no WhatsApp a partir do sistema).

Critério de sucesso: em 4–6 semanas, com orçamento enxuto, descobrir se o
Google Ads traz **lead qualificado de abastecimento agrícola a um custo que o
ticket (alto) da Caldemat justifica**.

---

## 2. Metas, não-metas e anti-metas

### Metas
- **LP de Orçamento** nova (`/orcamento`) no site atual, focada em **uma só
  oferta**: tanques de abastecimento agrícola.
- Item **"Orçamento"** no menu do site, levando à LP (serve também o visitante
  orgânico).
- **Formulário qualificador** que, ao enviar, grava o lead no banco (Supabase).
- Nova aba **"Leads"** na área de gestão (mesmo padrão das outras: protegida por
  login e por permissão de funcionário), onde o vendedor vê o lead e tem um
  botão **"Chamar no WhatsApp"**.
- **Rastreio de conversão do Google Ads** disparado no **envio do formulário**
  (a conversão que o Google aprende a otimizar), com captura de UTM para
  atribuição.
- **Playbook de campanha Google Ads** pronto para colar no painel: estrutura,
  palavras-chave, negativadas, textos do anúncio, extensões, geo, orçamento e o
  passo a passo de configuração — feito para quem **nunca** mexeu no Google Ads.

### Não-metas (de propósito ficam de fora)
- **Não** automatizar o Google Ads via API agora (token de desenvolvedor +
  aprovação levam semanas; não cabe no escopo deste teste).
- **Não** usar Display, Performance Max, Shopping ou YouTube — **só Search**,
  para o orçamento enxuto não se diluir.
- **Não** anunciar todos os produtos. Só **abastecimento agrícola** nesta
  primeira frente. Caixa d'água metálica fica como a **segunda** frente, depois
  que a primeira provar que vende.
- **Não** ligar Leads a Pedidos/Estoque automaticamente (segue o padrão de
  módulos independentes do sistema).

### Anti-metas (seria fracasso mesmo "funcionando")
- Formulário tão longo/burocrático que o interessado desiste de preencher.
- Lead que **fica parado** na aba sem ninguém ver — leva à perda do cliente
  (quem responde primeiro ganha). Ver Seção 7 (notificação) como ponto aberto.
- Exigir **CNPJ puro** e, com isso, barrar o produtor rural que compra no CPF.
- Queimar o orçamento enxuto em termos vagos/curiosos por falta de negativadas.

---

## 3. Restrições e fundação (decidido)

- **Orçamento de mídia:** ~**R$ 500/mês** (≈ **R$ 16/dia**). É enxuto; exige
  campanha **apertada e concentrada**. *(Decisão do cliente.)*
- **Geografia:** começar mirando **o estado de MT inteiro**; apertar para o raio
  em volta de Várzea Grande/Cuiabá se os leads distantes não fecharem por frete.
  *(Frete é a restrição real do negócio — produto pesado.)*
- **Frente única inicial:** abastecimento agrícola (tanque/comboio para abastecer
  máquina e avião agrícola; aço, sob medida, foco em combustível).
- **Tipo de campanha:** Search (rede de pesquisa) apenas.
- **Conversão:** **envio do formulário** da LP (não o clique no WhatsApp).
- **Destino do anúncio:** `caldemat.vercel.app/orcamento` (site já no ar na
  Vercel). A virada para `caldemat.com.br` continua pendente de DNS (herdado do
  projeto do site) e **não bloqueia** este trabalho.
- **Banco e login:** Supabase já existente do projeto; a aba Leads e a tabela
  `leads` entram nessa mesma base, com RLS.
- **Idioma:** pt-BR.
- **Stack:** a mesma do site/painel atual (React + Vite + supabase-js). Nada novo.

---

## 4. A LP de Orçamento (`/orcamento`)

Página pública, **focada em conversão**, validada com o cliente em mockup:

- **Topo enxuto:** só logo + telefone. **Sem o menu completo** para não puxar a
  pessoa do anúncio para outros cantos. *(Decisão do Claude — princípio de LP.)*
- **Hero:** selo "Metalúrgica · 40+ anos em MT"; título falando direto com quem
  abastece lavoura ("Tanques de abastecimento sob medida para a sua lavoura");
  subtítulo sobre abastecer máquina e avião agrícola com segurança, fabricação
  própria em aço, entrega em MT.
- **Foto real** do tanque de abastecimento (a fornecer — ver Seção 8).
- **Provas rápidas:** sob medida · aço para combustível · atende MT.
- **Formulário (o centro da página):**
  - **Nome** (obrigatório)
  - **WhatsApp** (obrigatório, com máscara)
  - **CPF ou CNPJ** (obrigatório; aceita os dois — *decisão do Claude*, para não
    travar produtor rural no CPF)
  - **Capacidade** — **campo numérico livre em litros**, a pessoa digita (ex.:
    "5.000"); **sem faixas prontas**. *(Decisão do cliente.)*
  - **Bacia de contenção?** — Sim / Não
  - **Para qual cidade?** (obrigatório; qualifica o frete)
  - Botão **"Quero meu orçamento"**.
  - **Honeypot** anti-spam (campo escondido); validação dos campos. Sem captcha
    na v1. *(Decisão do Claude.)*
- **Pós-envio:** mensagem de confirmação ("recebemos, um vendedor vai te
  chamar"). O lead já está gravado.
- A LP também é acessível pelo item **"Orçamento"** no menu do site principal.

---

## 5. Captação e a aba "Leads"

### Dados do lead (tabela `leads` no Supabase)
`id`, `criado_em`, `nome`, `whatsapp`, `documento` (CPF ou CNPJ),
`capacidade_litros`, `bacia_contencao` (bool), `cidade`, `status`,
`origem`/UTMs (`utm_source`, `utm_medium`, `utm_campaign`), `obs?`,
`vendedor_id?` (quem assumiu).

### Segurança (RLS)
- **Inserção pública (anônima):** permitida **só INSERT** na `leads` (o
  formulário da LP é público). Anônimo **não lê** nada.
- **Leitura/edição:** só usuário logado **com permissão** `pode_leads`
  (nova flag no `perfis`, no mesmo esquema das outras: `pode_materia_prima`,
  `pode_estoque`, `pode_clientes`, `pode_pedidos`). Admin vê tudo.

### Aba "Leads" (área de gestão)
- Entra na navegação por abas, **só aparece com permissão** `pode_leads`.
- **Lista** com colunas: Data · Nome · Documento · Capacidade · Bacia · Cidade ·
  Status · ação.
- **Status** (proposta do Claude): **Novo · Contatado · Ganho · Perdido**.
  Lead novo chega destacado (badge "Novo").
- Botão **"Chamar no WhatsApp"**: abre `wa.me/<numero-do-lead>` com uma
  **mensagem pronta** ("Olá {nome}, aqui é da Caldemat sobre seu orçamento de
  tanque de abastecimento..."). O vendedor atualiza o status depois.
- Busca/filtro por status e por cidade. Ordenação por data (mais novo primeiro).

---

## 6. Campanha Google Ads (playbook para o painel)

Entregue como **passo a passo** porque o cliente nunca usou o Google Ads.
Nada disso é código — é configuração no painel ads.google.com.

- **Objetivo/tipo:** Leads · campanha **Search**. Lances: começar em
  **Maximizar cliques** com teto de CPC (até ter conversões suficientes para
  migrar a **Maximizar conversões**).
- **Orçamento:** R$ 16/dia, uma campanha, **um grupo de anúncios** (frente
  única).
- **Geo:** estado de MT; opção de apertar para raio de VG/Cuiabá. "Presença"
  (pessoas no local), não "interesse".
- **Palavras-chave** (alta intenção, em frase/exata — lista final a refinar com
  pesquisa de volume no planejador): tanque de abastecimento agrícola; comboio
  de abastecimento; comboio de abastecimento agrícola; tanque para diesel
  fazenda; tanque aéreo para combustível; tanque de combustível para lavoura;
  tanque para abastecer trator; tanque para abastecer avião agrícola; etc.
- **Negativadas** (proteger o orçamento): plástico, polietileno, polietileno,
  usado, segunda mão, aluguel, locação, vaga, emprego, curso, sucata, preço de
  sucata, manual, PDF, nourse de marcas de revenda que não se aplicam. Revisar
  os **termos de pesquisa** toda semana e ir adicionando.
- **Anúncio responsivo de pesquisa (RSA):** ~12–15 títulos e 4 descrições em
  torno de: "sob medida", "40 anos", "fabricação própria em MT", "para
  combustível", "orçamento rápido no WhatsApp", "entrega em Mato Grosso".
- **Extensões:** sitelinks, frases de destaque (callouts), snippets
  estruturados, **extensão de chamada** (telefone (65) 99359-7968) e, se houver
  **Perfil da Empresa no Google**, extensão de local.
- **URL final:** `caldemat.vercel.app/orcamento` **com UTMs**
  (`utm_source=google&utm_medium=cpc&utm_campaign=abastecimento`).
- **Conversão:** ação de conversão "Lead – formulário orçamento", disparada no
  envio do formulário (ver Seção 7). É o que a campanha otimiza.
- **Plano de aprendizado:** rodar 4–6 semanas; revisar termos de pesquisa
  semanalmente; cortar o que só gasta; só subir orçamento depois que houver
  lead a custo aceitável; aí abrir a 2ª frente (caixa d'água) ou ampliar.

---

## 7. Rastreio de conversão (liga o site ao Google Ads)

- No **envio bem-sucedido** do formulário, a LP dispara o evento de conversão do
  Google Ads (gtag `event: 'conversion'` com o **ID/label** da ação de
  conversão criada no painel).
- As **UTMs** da URL são lidas e **gravadas junto do lead**, para a Caldemat
  saber quais leads vieram do Google.
- **Dependência:** o ID/label de conversão só existe **depois** que a conta
  Google Ads estiver criada e a ação de conversão configurada. O código fica
  pronto com um ponto único para colar esse ID. Ver Seção 9.

---

## 8. O que fica a cargo do builder
- Rota `/orcamento`, item de menu "Orçamento" e polimento visual fino da LP
  (direção já validada no mockup).
- Tabela `leads`, políticas RLS (insert anônimo; leitura/edição por
  `pode_leads`), flag `pode_leads` no `perfis` e na tela de permissões de
  funcionário.
- Implementação do honeypot, máscaras (WhatsApp, CPF/CNPJ) e validação.
- Tela da aba "Leads" (lista, filtros, badge de status, botão "Chamar no
  WhatsApp" com mensagem pronta).
- Ponto único no código para o ID/label de conversão do Google Ads + leitura de
  UTMs.
- Redação final das palavras-chave, negativadas e textos do RSA no playbook
  (com uma rápida checagem de volume no planejador de palavras-chave).

---

## 9. Dependências e pendências (fora do código — do cliente/gestor)
1. **Conta Google Ads + billing (R$/BRL):** ainda **não existe** — precisa ser
   criada. **Decisão tomada:** a conta de anúncios nasce **na propriedade do
   cliente** (idealmente no mesmo Google dono do Perfil da Empresa), o gestor
   (Pablo) cria uma **Conta de Administrador (MCC)** grátis e **gerencia por
   acesso de administrador**, e a **fatura fica no cartão do cliente**. Evita-se
   de propósito criar a conta enterrada no Google pessoal do gestor (o cliente
   ficaria refém do histórico e o gestor, da fatura). Se o cliente não tiver
   traquejo, o gestor cria **logado no Google do cliente** (com permissão) para
   já nascer no nome dele, e vincula à MCC. Criar/logar **não pode ser feito
   nesta sessão** (sem acesso à conta). Vincular a conta ao **Perfil da
   Empresa** para habilitar extensão de local.
2. **Ação de conversão no Google Ads:** criar e me passar o **ID/label** para
   fechar a Seção 7.
3. **Foto real** do tanque de abastecimento em boa qualidade para a LP.
4. **Perfil da Empresa no Google** (opcional, mas ajuda extensão de local e
   confiança) — confirmar se existe.
5. **DNS** (`caldemat.com.br`): segue pendente do projeto do site; **não
   bloqueia** — o anúncio usa o endereço `.vercel.app`.

---

## 10. Decisões do gestor (fechadas)
- **Notificação de lead novo:** **sem aviso automático na v1.** O vendedor
  **fica de olho no sistema** e trabalha a aba "Leads". Aviso automático
  (e-mail/WhatsApp via Edge Function) fica como melhoria futura, se o volume
  justificar.
- **Dono da conta Google Ads:** resolvido na Seção 9.1 (conta na propriedade do
  cliente, gerenciada pela MCC do gestor, fatura no cliente).

---

## 11. Tamanho
**Projeto** — segue para um plano de implementação
(superpowers:writing-plans) **após a aprovação deste documento**. Nada é
construído antes do "ok".
