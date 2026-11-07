delete from public.fotos;
delete from public.apontamento_servicos;
delete from public.apontamentos;
delete from public.pagamentos;
delete from public.cobrancas;
delete from public.abastecimentos;
delete from public.manutencoes;
delete from public.precos_cliente;
delete from public.obras;
delete from public.clientes;
delete from public.maquinas;
delete from public.funcionarios;
delete from public.tipos_servico;
delete from auth.users where email in ('ze.carlos@cambui.com','tiago.pedroso@cambui.com','marcos.silva@cambui.com');

alter table public.apontamentos
  add column if not exists modo_medicao text not null default 'horimetro',
  add column if not exists periodos jsonb,
  add column if not exists diarias numeric;
alter table public.abastecimentos
  add column if not exists operador_id uuid references public.funcionarios(id) on delete set null;
