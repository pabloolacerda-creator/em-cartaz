# Relatório dos caminhos — Xandão Vidros

Guia de uso do sistema da Xandão Vidros, escrito para o proprietário (o Xandão).

## 1. O que é o sistema

Dois ambientes no mesmo endereço:
- **Site** (público): a apresentação da Xandão Vidros, que qualquer pessoa vê.
- **Painel** (restrito): área interna com login, para controlar clientes, catálogo de vidros/ferragens, orçamentos/pedidos e o financeiro.

O acesso ao painel é **só seu** (um administrador). Você enxerga todas as abas.

## 2. Endereços de acesso

| O quê | Endereço |
|---|---|
| Site | `<PREENCHER: URL do site>` |
| Painel | `<PREENCHER: URL do site>/app/login` |

## 3. Login

Na tela de login, digite seu **usuário** (sem e-mail) e sua **senha**. Troque a senha após o primeiro acesso (Supabase > Authentication > Users).

## 4. O caminho do orçamento (o principal)

O fluxo vai do orçamento ao dinheiro, em etapas:

1. **Cadastre o cliente** (aba **Clientes**): nome, documento, telefone, endereço.
2. **Cadastre seu catálogo** uma vez (aba **Cadastro → Produtos/Serviços**): cada **tipo de vidro** com unidade **m²** e o **preço por m²**; cada **ferragem** com unidade **Unidade(s)** e o preço. (Pode começar vazio e ir incluindo conforme usa.)
3. **Monte o orçamento** (aba **Pedidos → Novo pedido**):
   - Escolha o cliente.
   - Em cada item, escolha o produto do catálogo. Para vidro, informe **largura × altura** — o sistema calcula o **m²** e o **valor** sozinho. Para ferragem, informe a **quantidade**.
   - Use **Descrição livre** para um item que não está no catálogo.
   - Informe **prazo**, **forma de pagamento** e um **desconto** se houver.
4. **Gere o PDF e mande no WhatsApp:** abra o orçamento salvo e clique em **Imprimir** → no navegador, escolha **Salvar como PDF**. O PDF sai com o seu timbrado, os itens, as medidas em m² e o total. Envie esse PDF ao cliente pelo WhatsApp.
5. **Cliente aprovou?** Abra o orçamento e clique em **Aprovar** — ele vira **Pedido**. (Se recusar, clique em **Reprovar**.)
6. **Ordem de Serviço:** no pedido aprovado, clique em **Ordem de Serviço** para o documento de produção (esse **não mostra valores**) e imprima para a instalação.
7. **Faturar:** no pedido aprovado, clique em **Faturar**, escolha **à vista ou parcelado** e confirme. Isso **lança automaticamente no Financeiro** o que você tem a receber.

## 5. O Financeiro

- **Painel:** mostra entrada, saída, saldo e o fluxo de caixa.
- **Lançamentos:** cada **receita** ou **despesa**, com **vencimento** e, quando pago, a **data de pagamento**. O que ainda não foi pago aparece como **a pagar / a receber**.
- **Contas:** suas contas/caixas e o saldo de cada uma (saldo inicial + recebido − pago).

Dica: ao faturar um pedido, a conta a receber já entra aqui. As despesas (vidro comprado, material, ajudante) você lança à mão em **Lançamentos**.

## 6. Clientes e Catálogo

- **Clientes:** cadastre e mantenha os dados; use **Inativar** para tirar de uso sem perder o histórico.
- **Produtos/Serviços:** é o catálogo que alimenta o orçamento (vidros por m², ferragens por unidade, serviços).
- **Matéria-Prima / Estoque:** opcionais — se quiser controlar o estoque de vidros/insumos, cadastre em Matéria-Prima e registre entradas/saídas em Estoque. Estoque e pedidos são independentes (um pedido não baixa o estoque automaticamente).

## 7. Se ficar sem acesso de administrador

1. No **Supabase** > **Authentication > Users**, clique no seu usuário e, se aparecer **banned**, remova o banimento (**Unban**).
2. Abra o **SQL Editor**, cole o conteúdo de `supabase/seed_admin.sql` (ajuste o e-mail `admin@xandaovidros.local` se usou outro) e clique em **Run**. Isso marca o usuário como administrador ativo, com todos os acessos.
3. Entre em `/app/login` e, se preciso, troque a senha pelo painel (Authentication > Users).

## 8. Onde ficam os dados

Os dados ficam no **Supabase** (banco na nuvem), numa conta que deve ser **de propriedade da Xandão Vidros**. É seguro: o acesso exige login; a chave mestra fica só no servidor, nunca no site; e o Supabase mantém cópias de segurança conforme o plano.

## 9. Pendências

- **Fotos** dos trabalhos para o site (box, espelhos, portas) — trocar os arquivos em `public/fotos/` quando chegarem.
- **Preços** do catálogo — cadastrar os tipos de vidro e ferragens com seus valores.
- **Transferir as contas** do Supabase e da Vercel para o cliente e registrar o e-mail do proprietário.
- (Opcional) **Apontar um domínio próprio** na Vercel; depois atualizar a tabela de endereços acima.
- Trocar a senha inicial do administrador.
- Preencher os campos `<PREENCHER: ...>` deste documento após o deploy.
