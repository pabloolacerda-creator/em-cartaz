begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public', 'perfis', 'tabela perfis');
select has_table('public', 'materiais_prima', 'tabela materiais_prima');
select has_table('public', 'movimentacoes_estoque', 'tabela movimentacoes_estoque');
select has_table('public', 'clientes', 'tabela clientes');
select has_table('public', 'pedidos', 'tabela pedidos');
select has_table('public', 'pedido_itens', 'tabela pedido_itens');
select has_view('public', 'saldo_estoque', 'view saldo_estoque');
select has_view('public', 'pedidos_total', 'view pedidos_total');

-- saldo: entrada 10 + saida 3 = 7
insert into materiais_prima (id, nome, unidade)
  values ('00000000-0000-0000-0000-0000000000a1', 'Chapa de aço', 'kg');
insert into movimentacoes_estoque (material_id, tipo, quantidade) values
  ('00000000-0000-0000-0000-0000000000a1', 'entrada', 10),
  ('00000000-0000-0000-0000-0000000000a1', 'saida', 3);
select is(
  (select saldo from saldo_estoque where material_id = '00000000-0000-0000-0000-0000000000a1'),
  7::numeric, 'saldo = 10 - 3');

-- total: 2x10,00 + 1x5,50 = 25,50
insert into clientes (id, nome) values ('00000000-0000-0000-0000-0000000000c1', 'Cliente Teste');
insert into pedidos (id, cliente_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1');
insert into pedido_itens (pedido_id, descricao, quantidade, valor_unitario) values
  ('00000000-0000-0000-0000-0000000000b1', 'Item A', 2, 10.00),
  ('00000000-0000-0000-0000-0000000000b1', 'Item B', 1, 5.50);
select is(
  (select total from pedidos_total where pedido_id = '00000000-0000-0000-0000-0000000000b1'),
  25.50::numeric, 'total do pedido = 25,50');

select * from finish();
rollback;
