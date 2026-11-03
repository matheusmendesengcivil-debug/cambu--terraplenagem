-- Migration for Cambuí Terraplenagem Gestão
-- Created: 2026-11-03
-- Extension pgcrypto is standard in Supabase
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PERFIS E USUARIOS
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'operador')),
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. OBRAS
CREATE TABLE IF NOT EXISTS public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  endereco TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'pausada')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FUNCIONARIOS
CREATE TABLE IF NOT EXISTS public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  funcao TEXT NOT NULL,
  valor_hora NUMERIC(10, 2) DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MAQUINAS
CREATE TABLE IF NOT EXISTS public.maquinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  modelo TEXT NOT NULL,
  placa_identificacao TEXT NOT NULL,
  horimetro_atual NUMERIC(10, 1) NOT NULL DEFAULT 0,
  valor_hora_padrao NUMERIC(10, 2) NOT NULL DEFAULT 0,
  intervalo_troca_oleo NUMERIC(10, 1) NOT NULL DEFAULT 250,
  horimetro_ultima_troca NUMERIC(10, 1) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'em_manutencao', 'parada')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TIPOS DE SERVICO
CREATE TABLE IF NOT EXISTS public.tipos_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PRECOS POR CLIENTE / OBRA (Prioridade sobre preço padrão da máquina)
CREATE TABLE IF NOT EXISTS public.precos_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  valor_hora NUMERIC(10, 2) NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_preco UNIQUE (cliente_id, obra_id, maquina_id)
);

-- 8. APONTAMENTOS
CREATE TABLE IF NOT EXISTS public.apontamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE RESTRICT,
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE RESTRICT,
  horimetro_inicial NUMERIC(10, 1) NOT NULL,
  horimetro_final NUMERIC(10, 1) NOT NULL,
  horas_trabalhadas NUMERIC(10, 1) NOT NULL,
  horas_paradas NUMERIC(10, 1) DEFAULT 0,
  motivo_parada TEXT,
  quantidade_viagens INT DEFAULT 0,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'devolvido', 'rascunho_foto')),
  motivo_devolucao TEXT,
  valor_hora_aplicado NUMERIC(10, 2) DEFAULT 0,
  valor_total NUMERIC(10, 2) DEFAULT 0,
  cobranca_id UUID,
  foto_folha_url TEXT,
  origem_foto BOOLEAN NOT NULL DEFAULT false,
  criado_por UUID REFERENCES auth.users(id),
  atualizado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. APONTAMENTO SERVICOS (Relacionamento N:N)
CREATE TABLE IF NOT EXISTS public.apontamento_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apontamento_id UUID NOT NULL REFERENCES public.apontamentos(id) ON DELETE CASCADE,
  tipo_servico_id UUID NOT NULL REFERENCES public.tipos_servico(id) ON DELETE RESTRICT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. FOTOS
CREATE TABLE IF NOT EXISTS public.fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apontamento_id UUID REFERENCES public.apontamentos(id) ON DELETE CASCADE,
  abastecimento_id UUID,
  manutencao_id UUID,
  url TEXT NOT NULL,
  legenda TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ABASTECIMENTOS
CREATE TABLE IF NOT EXISTS public.abastecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE RESTRICT,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE RESTRICT,
  horimetro_momento NUMERIC(10, 1) NOT NULL,
  tipo_combustivel TEXT NOT NULL DEFAULT 'diesel' CHECK (tipo_combustivel IN ('diesel', 'gasolina', 'ARLA')),
  litros NUMERIC(10, 2) NOT NULL,
  valor_por_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2) NOT NULL,
  posto_local TEXT,
  foto_cupom_url TEXT,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. MANUTENCOES
CREATE TABLE IF NOT EXISTS public.manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE RESTRICT,
  horimetro NUMERIC(10, 1) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('troca de óleo do motor', 'óleo hidráulico', 'filtros', 'graxa/lubrificação', 'pneus', 'peças', 'conserto', 'revisão')),
  descricao TEXT NOT NULL,
  custo NUMERIC(10, 2) NOT NULL DEFAULT 0,
  oficina_responsavel TEXT,
  fotos TEXT[] DEFAULT ARRAY[]::TEXT[],
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. COBRANCAS
CREATE TABLE IF NOT EXISTS public.cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  horas_totais NUMERIC(10, 1) NOT NULL DEFAULT 0,
  valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  valor_pago NUMERIC(10, 2) NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_aberto' CHECK (status IN ('em_aberto', 'pago_parcial', 'pago', 'atrasado')),
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar FK de cobranca_id na tabela apontamentos agora que cobrancas existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_apontamentos_cobranca'
  ) THEN
    ALTER TABLE public.apontamentos
      ADD CONSTRAINT fk_apontamentos_cobranca
      FOREIGN KEY (cobranca_id) REFERENCES public.cobrancas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 14. PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cobranca_id UUID NOT NULL REFERENCES public.cobrancas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  valor NUMERIC(10, 2) NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('Pix', 'dinheiro', 'boleto', 'transferência', 'cheque')),
  comprovante_url TEXT,
  observacao TEXT,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_apontamentos_data ON public.apontamentos(data);
CREATE INDEX IF NOT EXISTS idx_apontamentos_funcionario ON public.apontamentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_apontamentos_maquina ON public.apontamentos(maquina_id);
CREATE INDEX IF NOT EXISTS idx_apontamentos_status ON public.apontamentos(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_cliente ON public.cobrancas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_maquina ON public.abastecimentos(maquina_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_maquina ON public.manutencoes(maquina_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apontamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apontamento_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND perfil = 'admin' AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_funcionario_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.funcionarios
    WHERE usuario_id = auth.uid() AND ativo = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES

-- USUARIOS
DROP POLICY IF EXISTS "usuarios_read" ON public.usuarios;
CREATE POLICY "usuarios_read" ON public.usuarios
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "usuarios_admin_manage" ON public.usuarios;
CREATE POLICY "usuarios_admin_manage" ON public.usuarios
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CLIENTES (Operador vê clientes ativos, Admin gerencia)
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT TO authenticated
  USING (ativo = true OR public.is_admin());

DROP POLICY IF EXISTS "clientes_admin_all" ON public.clientes;
CREATE POLICY "clientes_admin_all" ON public.clientes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- OBRAS (Operador vê obras ativas, Admin gerencia)
DROP POLICY IF EXISTS "obras_select" ON public.obras;
CREATE POLICY "obras_select" ON public.obras
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "obras_admin_all" ON public.obras;
CREATE POLICY "obras_admin_all" ON public.obras
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- FUNCIONARIOS
DROP POLICY IF EXISTS "funcionarios_select" ON public.funcionarios;
CREATE POLICY "funcionarios_select" ON public.funcionarios
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "funcionarios_admin_all" ON public.funcionarios;
CREATE POLICY "funcionarios_admin_all" ON public.funcionarios
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- MAQUINAS
DROP POLICY IF EXISTS "maquinas_select" ON public.maquinas;
CREATE POLICY "maquinas_select" ON public.maquinas
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "maquinas_admin_all" ON public.maquinas;
CREATE POLICY "maquinas_admin_all" ON public.maquinas
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- TIPOS_SERVICO
DROP POLICY IF EXISTS "tipos_servico_select" ON public.tipos_servico;
CREATE POLICY "tipos_servico_select" ON public.tipos_servico
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "tipos_servico_admin_all" ON public.tipos_servico;
CREATE POLICY "tipos_servico_admin_all" ON public.tipos_servico
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PRECOS_CLIENTE (Somente Admin tem acesso)
DROP POLICY IF EXISTS "precos_cliente_admin" ON public.precos_cliente;
CREATE POLICY "precos_cliente_admin" ON public.precos_cliente
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APONTAMENTOS
-- Operador vê apenas seus apontamentos; Admin vê todos
DROP POLICY IF EXISTS "apontamentos_select" ON public.apontamentos;
CREATE POLICY "apontamentos_select" ON public.apontamentos
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    criado_por = auth.uid() OR
    funcionario_id = public.get_current_funcionario_id()
  );

DROP POLICY IF EXISTS "apontamentos_insert" ON public.apontamentos;
CREATE POLICY "apontamentos_insert" ON public.apontamentos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    criado_por = auth.uid() OR
    funcionario_id = public.get_current_funcionario_id()
  );

DROP POLICY IF EXISTS "apontamentos_update" ON public.apontamentos;
CREATE POLICY "apontamentos_update" ON public.apontamentos
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    (criado_por = auth.uid() AND status IN ('pendente', 'devolvido', 'rascunho_foto'))
  )
  WITH CHECK (
    public.is_admin() OR
    (criado_por = auth.uid() AND status IN ('pendente', 'devolvido', 'rascunho_foto'))
  );

DROP POLICY IF EXISTS "apontamentos_delete" ON public.apontamentos;
CREATE POLICY "apontamentos_delete" ON public.apontamentos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- APONTAMENTO_SERVICOS
DROP POLICY IF EXISTS "apontamento_servicos_all" ON public.apontamento_servicos;
CREATE POLICY "apontamento_servicos_all" ON public.apontamento_servicos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- FOTOS
DROP POLICY IF EXISTS "fotos_all" ON public.fotos;
CREATE POLICY "fotos_all" ON public.fotos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ABASTECIMENTOS
DROP POLICY IF EXISTS "abastecimentos_select" ON public.abastecimentos;
CREATE POLICY "abastecimentos_select" ON public.abastecimentos
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    criado_por = auth.uid() OR
    funcionario_id = public.get_current_funcionario_id()
  );

DROP POLICY IF EXISTS "abastecimentos_insert" ON public.abastecimentos;
CREATE POLICY "abastecimentos_insert" ON public.abastecimentos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    criado_por = auth.uid() OR
    funcionario_id = public.get_current_funcionario_id()
  );

DROP POLICY IF EXISTS "abastecimentos_admin_modify" ON public.abastecimentos;
CREATE POLICY "abastecimentos_admin_modify" ON public.abastecimentos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- MANUTENCOES
DROP POLICY IF EXISTS "manutencoes_select" ON public.manutencoes;
CREATE POLICY "manutencoes_select" ON public.manutencoes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "manutencoes_insert" ON public.manutencoes;
CREATE POLICY "manutencoes_insert" ON public.manutencoes
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "manutencoes_admin_modify" ON public.manutencoes;
CREATE POLICY "manutencoes_admin_modify" ON public.manutencoes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- COBRANCAS (Somente Admin)
DROP POLICY IF EXISTS "cobrancas_admin_all" ON public.cobrancas;
CREATE POLICY "cobrancas_admin_all" ON public.cobrancas
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PAGAMENTOS (Somente Admin)
DROP POLICY IF EXISTS "pagamentos_admin_all" ON public.pagamentos;
CREATE POLICY "pagamentos_admin_all" ON public.pagamentos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SEED DATA: TIPOS DE SERVICO
INSERT INTO public.tipos_servico (nome) VALUES
  ('puxando terra com caminhão'),
  ('escavação'),
  ('alargamento de represa'),
  ('limpeza de terreno'),
  ('abertura de valas'),
  ('terraplenagem/nivelamento'),
  ('compactação'),
  ('carregamento'),
  ('abertura de estrada'),
  ('desassoreamento'),
  ('outros')
ON CONFLICT (nome) DO NOTHING;
