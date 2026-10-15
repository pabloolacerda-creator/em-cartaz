# Fluxo de Caixa — Documento de Desenho

**Data:** 2026-10-15
**Autor:** Pablo (pabloolacerda@gmail.com), com apoio do Claude Code

---

## Intenção e o porquê

Pablo quer controlar as próprias finanças sem depender de app de banco nem de
controle manual em planilha. Hoje falta **clareza**: ele senta pra ver as
contas e não bate o olho e entende sua situação. O objetivo é um app pessoal,
bonito e simples, que mostre numa tela só — num relance — onde o caixa está.

O valor central é **visualização rápida**. Se abrir o app e em dois segundos
ele souber quanto tem, quanto entrou, quanto saiu e o que ainda está por vir,
o app cumpriu seu papel.

## Objetivos

- **Tela principal ("Caixa") com seis números**, sempre visíveis no topo:
  1. **Quanto tenho agora** — saldo realizado **do mês** (o que de fato já entrou menos o que de fato já saiu no mês selecionado). Começa do zero a cada mês.
  2. **Quanto ganhei** — soma das entradas já recebidas no mês.
  3. **Quanto gastei** — soma das saídas já pagas no mês (inclui pagamentos parciais).
  4. **Tenho pra entrar** — soma das entradas ainda a receber no mês.
  5. **Tenho pra sair** — soma do que ainda falta pagar no mês (inclui o restante de contas parcialmente pagas).
  6. **Sobra prevista no fim do mês** — `quanto tenho + tenho pra entrar − tenho pra sair`.
- **Acesso no celular e no PC pelo navegador**, com layout que se ajusta às duas telas.
- **Dados integrados entre aparelhos**: um lançamento feito no celular aparece no PC.
- **Login simples e privado**: só o dono vê seu caixa.
- **Barra superior com quatro abas**: Caixa, Entradas, Saídas, Contas fixas.
- **Cadastro de lançamentos** com os campos: Nome, Descrição, Valor, Data da compra, Vencimento da conta.
- **Ciclo de pagamento/recebimento**: todo lançamento nasce como promessa ("a pagar"/"a receber") e migra para realizado ("gastei"/"ganhei") quando marcado como pago/recebido. **Pagamentos/recebimentos parciais** são suportados: registra-se quanto foi pago e o sistema mostra o que ainda falta.
- **Contas fixas**: lançamentos que se repetem todo mês (aluguel, assinaturas). O sistema as gera automaticamente em Saídas a cada novo mês.

## Não-objetivos

- Não é um app multiusuário / compartilhado com família ou sócio. É pessoal, um usuário.
- Não integra com banco, Open Finance, importação de extrato ou leitura de nota.
- Não tem categorias/etiquetas de gasto (comida, transporte etc.) — Pablo não pediu, e mantê-las de fora preserva a simplicidade.
- Não é app nativo de loja (iOS/Android); é web, aberto no navegador.
- Não tem relatórios/gráficos elaborados nesta primeira versão — o foco são os seis números e a lista.
- Não tem saldo inicial nem saldo acumulado entre meses. O controle é mensal e começa do zero a cada mês (decisão de Pablo).

## Anti-objetivos (o que tornaria isto um fracasso mesmo "funcionando")

- Uma tela poluída ou que exija cliques e navegação pra entender a situação. Se não dá pra "bater o olho", falhou.
- Lentidão ou fricção pra lançar um gasto no celular na hora que ele acontece.
- Visual genérico/template. Pablo pediu explicitamente algo esteticamente agradável.
- Os seis números não baterem com a realidade (erro de cálculo em pagamento parcial, virada de mês, etc.).

## Modelo dos números (como o dinheiro se move)

Cada lançamento tem um **valor total** e um **valor já realizado** (pago ou recebido), começando em zero.

- **Entrada / Saída nasce como promessa:**
  - Saída → entra em **"Tenho pra sair"** pelo valor total.
  - Entrada → entra em **"Tenho pra entrar"** pelo valor total.
- **Marcar como pago/recebido** (total): o valor migra de "pra sair/entrar" para **"gastei"/"ganhei"**.
- **Pagamento/recebimento parcial:** registra-se o valor pago. A parte paga conta em "gastei"/"ganhei"; o restante (`total − pago`) continua em "pra sair/entrar", exibido como "falta R$ X".
- **"Quanto tenho agora"** = total ganho (realizado) − total gasto (realizado), **dentro do mês selecionado**.
- **"Sobra prevista no fim do mês"** = "quanto tenho agora" + "tenho pra entrar" − "tenho pra sair".
- **Todos os seis números são do mês selecionado** (há um seletor de mês no topo da tela Caixa). O controle é **mensal**: a cada mês tudo recomeça do zero, sem saldo acumulado nem saldo inicial. Decisão confirmada por Pablo.

## Telas

1. **Caixa** (principal): seletor de mês; card grande "Quanto tenho agora"; grade com os outros cinco números; lista de lançamentos recentes do mês, com marcações visuais de vencimento, "repete todo mês" e "pago em parte / falta R$ X". A partir de cada item da lista dá pra **marcar como pago/recebido** (total ou parcial).
2. **Entradas**: formulário de cadastro (Nome, Descrição, Valor, Data da compra, Vencimento) + lista das entradas.
3. **Saídas**: idem, para gastos/contas a pagar.
4. **Contas fixas**: cadastro de contas recorrentes (mesmos campos) que o sistema replica em Saídas a cada mês.

Mockups validados em conversa: tela Caixa (seis números + lista) e aba Saídas (formulário). Tema escuro, visual calmo e moderno, responsivo.

## Restrições

- Abre no navegador, celular e PC, com os dados sincronizados entre eles.
- Privado, com login. Um único usuário (o dono).
- Gratuito de manter (sem custo de servidor): hospedagem estática + serviço gratuito de backend.
- Valores em Real (R$), datas no formato brasileiro (dd/mm/aaaa).

## Decisões de bastidor (escolhas minhas — Pablo me delegou a parte técnica)

- **Frontend:** React + Vite + TypeScript + Tailwind CSS — mesma stack que o projeto já existente na raiz do workspace usa, o que facilita reaproveitar configuração.
- **Backend / dados / login:** **Supabase** (Postgres gerenciado + autenticação), plano gratuito. Guarda os lançamentos na nuvem e faz o login; sincronização entre aparelhos sai de graça por os dados morarem no Supabase.
- **Login:** e-mail + senha via Supabase Auth na primeira versão (Google como opção futura). Decisão do builder confirmar o método mais simples que o Supabase oferece sem fricção.
- **Hospedagem:** site estático, nos mesmos moldes do site Probold que Pablo já publica (GitHub Pages ou equivalente estático). Como é SPA + Supabase, não precisa de servidor próprio.
- **Localização da pasta:** tudo do app mora em `fluxo de caixa/` na raiz do workspace, separado do site Probold e do app "Em Cartaz".

## O que fica a cargo de quem construir

- Modelagem exata das tabelas no Supabase (lançamentos, status de pagamento parcial, contas fixas e sua replicação mensal).
- **Regra da virada de mês para contas fixas:** quando e como gerar as ocorrências do mês (ex.: gerar ao abrir o app num mês novo). Decisão do builder, desde que o usuário não precise recriar manualmente.
- **Contagem por mês:** promessas ("a pagar"/"a receber") contam no mês do **vencimento**; realizados ("gastei"/"ganhei") contam no mês em que foram **pagos/recebidos**. Decisão minha; builder pode refinar se a prática pedir.
- Comportamento de edição/exclusão de lançamentos e o que acontece com um parcial ao editar.
- Detalhes finos de responsividade, animações e microinterações, mantendo o padrão visual dos mockups.
- Estratégia de testes adequada à stack.

## Tamanho

Projeto com documento de desenho escrito → próximo passo é o plano de implementação (superpowers:writing-plans), após aprovação deste documento.
