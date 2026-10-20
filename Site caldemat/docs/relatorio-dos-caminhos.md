# Relatório dos caminhos — Caldemat

Guia de uso do sistema Caldemat, escrito para o proprietário.

## 1. O que é o sistema

Dois ambientes no mesmo endereço:
- **Site** (público): a apresentação da Caldemat, que qualquer pessoa vê.
- **Painel** (restrito): área interna com login para controlar matéria-prima, estoque, clientes, pedidos e funcionários.

## 2. Endereços de acesso

| O quê | Endereço |
|---|---|
| Site | `<PREENCHER: URL do site>` |
| Painel | `<PREENCHER: URL do site>/app/login` |

Hoje o sistema está num endereço temporário. Quando o domínio for apontado (DNS), o endereço final será **caldemat.com.br**, e o painel ficará em **caldemat.com.br/app/login**.

## 3. Login

Na tela de login, digite seu **usuário** (sem e-mail) e sua **senha**.
- Login do administrador: usuário `<PREENCHER: usuário do admin, ex.: admin>`; a senha é entregue em separado (troque-a após o primeiro acesso).
- Cada funcionário tem seu próprio usuário e senha, criados pelo administrador. Cada um vê apenas as abas liberadas para ele.

## 4. Passo a passo de cada aba

### Matéria-Prima
Cadastro dos materiais usados na produção.
1. Abra **Matéria-Prima**. O formulário já fica visível na tela.
2. Preencha **Nome**, **Unidade** e **Estoque mínimo** e clique em **Salvar**.
3. Para tirar um material de uso, clique em **Inativar** na linha dele.

### Estoque
Registra entradas e saídas de cada material e mostra o saldo.
1. Abra **Estoque** e escolha o material.
2. Escolha **Entrada** (chegou material) ou **Saída** (material usado/vendido), informe a quantidade e confirme.
3. Se a **saída for maior que o saldo**, aparece um **aviso** na tela e, ao registrar, uma janela de confirmação pergunta **"Deseja registrar a saída mesmo assim?"**. Você pode confirmar e a saída é registrada (útil quando uma entrada não foi lançada a tempo); o saldo fica negativo até regularizar com uma entrada.

### Clientes
1. Abra **Clientes**.
2. Preencha **Nome**, **Documento**, **Telefone**, **E-mail**, **Endereço** e **Observações** e clique em **Salvar**.
3. Para tirar um cliente de uso, clique em **Inativar** na linha dele.

### Pedidos
1. Abra **Pedidos**; o formulário chama-se **Novo pedido**.
2. Escolha o cliente.
3. Clique em **Adicionar item** para cada item e preencha **Descrição**, **Quantidade** e **Valor unitário**. O **total em reais** é calculado sozinho.
4. Salve. Os pedidos ficam listados com seus totais.

Observação: Estoque e Pedidos são independentes; um pedido não baixa o estoque automaticamente.

### Funcionários (somente administrador)
- **Criar funcionário:** em **Funcionários**, preencha o formulário (nome, usuário e senha inicial), **marque os acessos** (Matéria-Prima, Estoque, Clientes, Pedidos) e clique em **Cadastrar**. Entregue usuário e senha à pessoa.
- **Atenção:** os acessos são escolhidos **somente na criação**. Para mudar o acesso de alguém, **inative** o funcionário e **crie um novo login** com os acessos desejados.
- **Resetar senha:** na linha do funcionário, clique em **Resetar senha**, defina a nova senha e avise a pessoa.
- **Desligar alguém:** clique em **Inativar**; ele deixa de conseguir entrar, sem perder o histórico.

## 5. Onde ficam os dados

Os dados ficam no **Supabase** (banco de dados na nuvem), numa conta que deve ser **de propriedade da Caldemat**. É seguro porque: o acesso exige login; cada pessoa só alcança o que o administrador liberou (regras no próprio banco, não só na tela); a chave mestra fica guardada apenas no servidor, nunca no site; e o Supabase mantém cópias de segurança conforme o plano contratado.

## 6. Pendências

- **Transferir a conta** do Supabase e da Vercel para o cliente (hoje ficam na conta do desenvolvedor) e registrar o e-mail do proprietário.
- **Apontar o domínio caldemat.com.br** no DNS (Registro.br) para a Vercel; depois atualizar a tabela de endereços acima.
- Trocar a senha inicial do administrador.
- Preencher os campos `<PREENCHER: ...>` deste documento com os valores reais após o deploy.
