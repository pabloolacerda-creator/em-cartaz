# Playbook Google Ads — Caldemat · Abastecimento Agrícola

**Data:** 2026-10-26
**Para:** Pablo (gestor de tráfego da Caldemat)
**Objetivo:** primeira campanha de Search trazendo leads de tanques de abastecimento agrícola, com orçamento enxuto (R$ 500/mês ≈ R$ 16/dia), entregando no formulário da LP `caldemat.vercel.app/orcamento`.

> Este é um passo a passo para montar a campanha **dentro do painel** (ads.google.com). Nada aqui é automático — o sistema só entra com a LP e a aba Leads (já construídas). A campanha você liga quando a conta existir.

---

## 0. Pré-requisitos (fazer antes de anunciar)

1. **Conta Google Ads** criada **na propriedade do cliente** (de preferência no mesmo Google do Perfil da Empresa). Você cria uma **Conta de Administrador (MCC)** grátis e pega acesso de admin à conta da Caldemat. **Fatura no cartão do cliente.** (Ver design, Seção 9.)
2. **Ação de conversão** "Lead – formulário orçamento":
   - Em *Objetivos → Conversões → Nova ação de conversão → Site* (ou "Importar/Manual").
   - Melhor caminho simples: criar como conversão disparada por evento do **gtag** no envio do formulário.
   - Anote o **ID de conversão** (formato `AW-XXXXXXXXXX`) e o **rótulo** (label).
   - Coloque no build da LP as variáveis de ambiente:
     - `VITE_GADS_ID=AW-XXXXXXXXXX`
     - `VITE_GADS_LABEL_LEAD=<rótulo>`
   - Refaça o deploy na Vercel. (Sem isso, a LP grava o lead normalmente, só não reporta a conversão ao Google.)
3. **Perfil da Empresa no Google** vinculado à conta (habilita a extensão de local).
4. **Foto boa** do tanque de abastecimento (a LP usa `/fotos/tanque-aereo.webp`; troque por uma foto forte se tiver melhor).

---

## 1. Estrutura da campanha

- **1 campanha** Search · Meta: Leads · Sem rede de Display ("Incluir rede de Display" **desmarcado**).
- **1 grupo de anúncios:** "Abastecimento agrícola".
- **Lances:** começar em **Maximizar cliques** com **CPC máx. limitado** (ex.: R$ 3,00) para não gastar tudo em um clique caro. Depois de juntar ~15–30 conversões, migrar para **Maximizar conversões**.

## 2. Orçamento e segmentação

- **Orçamento diário:** R$ 16.
- **Local:** estado de **Mato Grosso**. Em *Configurações de local → Opções de local*, escolher **"Presença: pessoas que estão ou visitam regularmente"** (não "interesse"), para não pagar clique de quem só pesquisou MT de fora.
- Se os leads de cantos distantes não fecharem por frete, apertar para **raio** em volta de Várzea Grande/Cuiabá.
- **Idioma:** Português.

## 3. Palavras-chave (correspondência de frase e exata)

Lista inicial — **antes de subir, confira volume no Planejador de Palavras-chave** e corte as de volume zero:

- `"tanque de abastecimento agrícola"`
- `"comboio de abastecimento"`
- `"comboio de abastecimento agrícola"`
- `"tanque para diesel fazenda"`
- `"tanque aéreo para combustível"`
- `"tanque de combustível para lavoura"`
- `"tanque para abastecer trator"`
- `"tanque para abastecer avião agrícola"`
- `[tanque de abastecimento para fazenda]` (exata)
- `[comboio de abastecimento diesel]` (exata)

> Comece **sem correspondência ampla** — com orçamento enxuto, ampla gasta rápido em termos irrelevantes.

## 4. Palavras-chave negativas

Adicionar como negativas da campanha:

`plástico`, `polietileno`, `fibra`, `usado`, `segunda mão`, `aluguel`, `locação`, `vaga`, `emprego`, `curso`, `sucata`, `manual`, `pdf`, `como fazer`, `preço do litro`, `grátis`.

> **Rotina semanal:** abrir *Palavras-chave → Termos de pesquisa*, ver o que de fato buscaram, e negativar tudo que não é cliente (curioso, concorrente, produto errado).

## 5. Anúncio responsivo de pesquisa (RSA)

**Títulos (até 15 — escreva 12+):**
1. Tanque de Abastecimento Agrícola
2. Comboio de Abastecimento
3. Fabricação Própria em MT
4. Tanques Sob Medida em Aço
5. Caldemat · 40+ Anos
6. Abasteça Trator e Avião
7. Entrega em Todo Mato Grosso
8. Orçamento Rápido no WhatsApp
9. Tanque para Diesel na Fazenda
10. Com Bacia de Contenção
11. Qualidade de Metalúrgica
12. Peça seu Orçamento Hoje

**Descrições (até 4):**
1. Tanques de abastecimento sob medida para a sua lavoura. Fabricação própria em aço. Peça orçamento.
2. Caldemat: 40+ anos fabricando tanques e caixas d'água em Mato Grosso. Entrega regional.
3. Diga a capacidade e a cidade; um vendedor retorna com o preço. Sem compromisso.
4. Abastecimento seguro de máquinas e aviões agrícolas. Fale com a gente no WhatsApp.

## 6. Recursos (extensões)

- **Sitelinks:** Produtos · A Empresa · Serviços · Contato (links do site).
- **Frases de destaque:** "40+ anos", "Fabricação própria", "Sob medida", "Entrega em MT".
- **Snippets estruturados:** Tipos → Tanques aéreos, Tanques agrícolas, Caixas d'água.
- **Chamada (ligação):** (65) 99359-7968.
- **Local:** via Perfil da Empresa no Google.

## 7. URL final

```
https://caldemat.vercel.app/orcamento?utm_source=google&utm_medium=cpc&utm_campaign=abastecimento
```

A LP lê essas UTMs e grava junto do lead, então na aba **Leads** dá pra ver quais contatos vieram do Google.

## 8. Medição e rotina

- **Conversão que importa:** envio do formulário (a LP dispara via gtag).
- **Semanal:** revisar termos de pesquisa + negativar; pausar palavra que só gasta e não converte.
- **Não** subir orçamento nas primeiras 2 semanas — deixar juntar dado.
- Quando houver **lead a custo aceitável** (o ticket de um tanque paga meses de anúncio), aí sim: subir orçamento ou abrir a 2ª frente (**caixa d'água metálica**).

## 9. Checklist de lançamento

- [ ] Conta criada (propriedade do cliente) + MCC + fatura do cliente
- [ ] Ação de conversão criada; `VITE_GADS_ID` e `VITE_GADS_LABEL_LEAD` no deploy da Vercel
- [ ] Perfil da Empresa vinculado
- [ ] Campanha Search (sem Display), 1 grupo, R$ 16/dia, MT/presença
- [ ] Palavras-chave (frase/exata) conferidas no planejador
- [ ] Negativas adicionadas
- [ ] RSA com 12+ títulos e 4 descrições
- [ ] Extensões (sitelinks, destaque, snippets, chamada, local)
- [ ] URL final com UTMs
- [ ] Teste: preencher o formulário e confirmar que o lead aparece na aba **Leads**
