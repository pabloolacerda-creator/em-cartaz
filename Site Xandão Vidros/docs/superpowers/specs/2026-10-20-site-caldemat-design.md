# Site Caldemat — Institucional novo + Área de Gestão

**Data:** 2026-10-20
**Cliente:** Caldemat Indústria Metalúrgica (Várzea Grande, MT)
**Status:** Design para aprovação (nada será construído antes do "ok")

---

## 1. Intenção e o porquê

A Caldemat é uma metalúrgica com 40+ anos em Várzea Grande (MT). Fabrica
tanques (aéreos, agrícolas), caixas d'água metálicas, e presta serviços de
recuperação de caixa d'água e conformação de metais (corte, dobra,
calandragem). Atende agronegócio, fazendas e construtoras.

Hoje existem **dois problemas**:

1. O site institucional atual (caldemat.com.br) não tem a cara que a empresa
   quer — querem algo **mais bonito e moderno**.
2. **Não existe nenhum controle interno**: nem de estoque de matéria-prima,
   nem de pedidos de venda. Tudo é "de cabeça" ou no papel.

Este projeto entrega as duas coisas num produto só: um site público novo e,
atrás de um login, uma **área de gestão** simples o bastante para ser usada
no dia a dia por quem não é de tecnologia.

O critério real de sucesso não é "ter o sistema"; é **o pessoal da Caldemat
realmente usar** porque é simples. Simplicidade vence funcionalidade aqui.

---

## 2. Metas, não-metas e anti-metas

### Metas
- Site institucional novo, moderno, responsivo (celular e desktop), com os
  produtos, serviços, contato/WhatsApp e Instagram da Caldemat.
- Botão **Login** no topo do site público.
- Área de gestão protegida por login, com:
  - **Cadastro de Matéria-Prima**
  - **Estoque** (entradas e saídas de matéria-prima + quantidade atual)
  - **Cadastro de Clientes**
  - **Pedidos** (vendas, salvos permanentemente)
  - **Funcionários** (só o admin): criar logins e definir permissões
- Permissões **granulares por funcionário**, definidas pelo login principal.
- Dados persistentes e seguros (Supabase), de propriedade do cliente.

### Não-metas (ficam de fora de propósito)
- **Não** ligar estoque e pedidos: vender um produto NÃO baixa matéria-prima
  automaticamente. São módulos independentes. *(Confirmado pelo cliente.)*
- **Não** controlar estoque de produto pronto — só **matéria-prima**.
- Sem emissão de nota fiscal, integração contábil/fiscal ou meios de pagamento.
- Sem app de celular nativo (o site responsivo cobre o celular).

### Anti-metas (seria um fracasso mesmo "funcionando")
- Um sistema tão cheio de campos e etapas que o pessoal desiste e volta pro
  papel. Cada tela precisa ser óbvia.
- Login frágil / dados que qualquer um acessa. Segurança de verdade é
  obrigatória, não opcional.

---

## 3. Restrições e fundação técnica (decidido)

- **Banco de dados + login:** Supabase (Postgres + Auth). Cabe no **plano
  gratuito** no volume da Caldemat → **~R$ 0/mês** de custo novo.
- **Hospedagem da parte visual:** host estático gratuito (ex.: Vercel,
  Netlify, Cloudflare Pages ou GitHub Pages). Sem servidor próprio pra manter.
- **Domínio:** caldemat.com.br é do cliente. **Acesso ao DNS ainda não
  confirmado** (decisão do usuário). Portanto a entrega será feita primeiro
  num **endereço temporário** (ex.: subdomínio do host gratuito) totalmente
  funcional; a **virada do domínio fica como pendência** a resolver quando o
  acesso ao DNS existir. *(Risco conhecido — ver Seção 11. Mesmo padrão do
  site da Priscila Ribeiro, parado por DNS.)* O botão Login leva à área de
  gestão no mesmo endereço (ex.: `/app`).
- **Conta/propriedade:** o sistema será montado **na conta do desenvolvedor**
  (Supabase + hospedagem) para arrancar rápido, e **transferido/documentado
  para o cliente no fim** (faz parte do relatório dos caminhos — Seção 9).
- **Login dos funcionários:** por **usuário + senha**, sem e-mail. O
  funcionário recebe um login tipo `joao` e uma senha. Como o Supabase Auth é
  centrado em e-mail, o builder mapeia cada usuário para um e-mail sintético
  interno (ex.: `joao@caldemat.local`) de forma transparente — a pessoa só vê
  "usuário e senha". **Não há** recuperação de senha por e-mail; quem reseta
  senha é o **admin** (ver Seção 5.5).
- **Idioma de toda a interface:** português (pt-BR).
- **Segurança das permissões:** aplicada no **banco** (Row Level Security do
  Postgres), não só escondendo botões na tela. Um funcionário sem acesso ao
  financeiro não consegue ler pedidos nem "por baixo dos panos".

---

## 4. Parte pública (site institucional)

Site novo, visual moderno (direção visual delegada ao Claude). Conteúdo base,
reaproveitando textos/fotos da Caldemat (site atual + Instagram @caldemat.ind):

- **Home / Hero** — identidade da empresa, 40+ anos, chamada principal.
- **A Empresa** — história e diferenciais.
- **Produtos** — tanques aéreos, tanques ovais agrícolas, caixas d'água.
- **Serviços** — recuperação de caixa d'água; conformação de metais.
- **Contato** — telefone/WhatsApp (65) 99359-7968, e-mail
  contato@caldemat.com.br, endereço (Rua Pinheiro, s/n, Várzea Grande-MT),
  Instagram.
- **Botão Login** fixo no topo → leva à área de gestão.

Responsivo, rápido, acessível. Conteúdo definitivo (textos finais, fotos em
alta) a ser fornecido/coletado na fase de construção.

---

## 5. Área de gestão (atrás do login)

Navegação por abas. Cada aba só aparece se o funcionário tiver permissão.

### 5.1 Cadastro de Matéria-Prima
Registrar os **tipos** de material. Campos:
- Nome (ex.: "Chapa de aço 1/8", "Tubo metalon 20x20", "Cantoneira 1\"")
- Unidade de medida (kg, metro, peça, barra…)
- (Opcional) Estoque mínimo p/ alerta; observação
Ações: criar, editar, inativar.

### 5.2 Estoque
Mostra a **quantidade atual** de cada matéria-prima e registra movimentações:
- **Entrada** (chegou do fornecedor): material, quantidade, data,
  (opcional) fornecedor/observação.
- **Saída** (foi usado): material, quantidade, data, (opcional) observação.
- Quantidade atual = soma das entradas − soma das saídas (via view calculada
  no banco; o builder pode manter coluna somada se preferir desempenho).
- Histórico de movimentações por material.
- (Opcional) destaque quando abaixo do estoque mínimo.
- **Saída maior que o saldo:** é **permitida, com um aviso** na tela (não
  bloqueia). *(Decisão do Claude: no início os saldos não estão perfeitos;
  travar a saída deixaria o pessoal preso. O aviso sinaliza saldo negativo.)*

### 5.3 Cadastro de Clientes
- Nome / razão social, documento (CPF/CNPJ) opcional, telefone, e-mail,
  endereço, observação.
- Criar, editar, inativar. Usado para vincular aos pedidos.

### 5.4 Pedidos (vendas)
Um pedido = uma venda, **salva permanentemente**. Estrutura:
- Cliente (selecionado do cadastro), data.
- **Itens do pedido** (um ou mais): descrição, quantidade, valor unitário,
  valor total do item (= qtd × unitário, calculado).
- **Total do pedido** = soma dos itens (calculado).
- *(Decisão do Claude: permitir vários itens por pedido, porque é como uma
  venda real funciona e um pedido de 1 item é só uma linha. Se o cliente
  quiser forçar 1 item por pedido, é um ajuste simples.)*
- Listar, consultar, editar pedidos salvos; busca por cliente/data.

### 5.5 Funcionários (exclusivo do login principal / admin)
- O **admin** cadastra funcionários numa página de cadastro e, na hora,
  **marca os acessos** que quiser liberar: Matéria-Prima, Estoque, Clientes,
  Pedidos (cada um ligado/desligado por funcionário).
- A aba Funcionários nunca é liberada a um funcionário comum.
- Admin pode editar permissões e remover/inativar funcionários depois.
- **Reset de senha:** como não há e-mail, o admin tem um botão para
  **redefinir a senha** de qualquer funcionário. *(Decisão do Claude.)*
- "Financeiro" e "Estoque" deixam de ser níveis fixos e viram só exemplos de
  configuração de permissões.

---

## 6. Modelo de dados (rascunho para o builder)

Tabelas no Postgres/Supabase (nomes finais a critério do builder):

- `perfis` — 1 por usuário do Auth. Campos: `id` (= auth user), `nome`,
  `is_admin` (bool), e permissões booleanas: `pode_materia_prima`,
  `pode_estoque`, `pode_clientes`, `pode_pedidos`. Admin tem tudo + gestão de
  usuários.
- `materiais_prima` — `id`, `nome`, `unidade`, `estoque_minimo?`, `ativo`.
- `movimentacoes_estoque` — `id`, `material_id`, `tipo` (entrada/saida),
  `quantidade`, `data`, `obs?`, `usuario_id`.
- `clientes` — `id`, `nome`, `documento?`, `telefone?`, `email?`,
  `endereco?`, `obs?`, `ativo`.
- `pedidos` — `id`, `cliente_id`, `data`, `obs?`, `usuario_id`.
- `pedido_itens` — `id`, `pedido_id`, `descricao`, `quantidade`,
  `valor_unitario`.
- Quantidade de estoque e totais de pedido como **views/colunas calculadas**.

RLS: leitura/escrita de cada tabela condicionada à permissão no `perfis` do
usuário logado. Estoque e Matéria-Prima independentes de Pedidos/Clientes.

---

## 7. Criação de logins secundários (ponto técnico)

Criar outros usuários a partir do painel do admin **não pode** usar a chave
de administrador direto no navegador (risco de segurança). Abordagem: uma
**Supabase Edge Function** (server-side) que só o admin aciona. Como o login é
por **usuário + senha** (sem e-mail), a função cria o usuário no Auth com um
e-mail sintético interno (`usuario@caldemat.local`), grava nome/permissões no
`perfis`, e também é usada pelo admin para **resetar senha**. Decisão de
implementação fica com o builder; o requisito é: o admin cria o funcionário,
define permissões e reseta senha sem expor chaves no navegador.

---

## 8. O que fica a cargo do builder
- Escolha do framework/front (recomendação: stack leve, hospedável estático,
  usando `supabase-js`). Institucional pode ser estático; o painel, uma SPA.
- Estrutura exata de tabelas, views, RLS e a Edge Function de criação de users.
- Caminho vs. subdomínio para o painel; detalhes de DNS.
- Layout visual fino (direção: moderno e limpo), coleta de textos/fotos finais.
- Semente do primeiro usuário admin.

---

## 9. Entregável final — NÃO ESQUECER
Ao fim do projeto, produzir um **"relatório dos caminhos"**: documento para o
cliente com endereços de acesso (site e painel), logins, passo a passo de uso
de cada aba, e onde/como os dados ficam guardados (propriedade do cliente).
*(Pedido explícito do usuário.)*

---

## 11. Riscos e pendências conhecidos
- **DNS / domínio (pendência aberta):** acesso ao DNS do caldemat.com.br
  ainda não confirmado. Entregamos funcionando num endereço temporário; a
  virada para o domínio final fica pendente até haver acesso. Não bloqueia a
  construção, só a publicação no endereço definitivo.
- **Transferência de conta no fim:** o projeto nasce na conta do
  desenvolvedor e será transferido/entregue ao cliente — planejar isso no
  encerramento (relatório dos caminhos).
- **Conteúdo final** (textos e fotos em alta) depende de coleta junto ao
  cliente durante a construção.

## 10. Tamanho
**Projeto** — segue para um plano de implementação (superpowers:writing-plans)
após a aprovação deste documento. Nada é construído antes do "ok".
