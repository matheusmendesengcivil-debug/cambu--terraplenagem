-- Seed demo data for Cambuí Terraplenagem Gestão
-- Users: 1 admin (including matheus.mendes96@hotmail.com) and 3 operators

DO $$
DECLARE
  v_admin_id UUID;
  v_op1_id UUID;
  v_op2_id UUID;
  v_op3_id UUID;

  v_func1_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_func2_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_func3_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;

  v_cli1_id UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_cli2_id UUID := 'c2222222-2222-2222-2222-222222222222'::UUID;
  v_cli3_id UUID := 'c3333333-3333-3333-3333-333333333333'::UUID;

  v_obra1_id UUID := 'a1111111-1111-1111-1111-111111111111'::UUID;
  v_obra2_id UUID := 'a2222222-2222-2222-2222-222222222222'::UUID;
  v_obra3_id UUID := 'a3333333-3333-3333-3333-333333333333'::UUID;
  v_obra4_id UUID := 'a4444444-4444-4444-4444-444444444444'::UUID;

  v_maq1_id UUID := 'ba111111-1111-1111-1111-111111111111'::UUID;
  v_maq2_id UUID := 'ba222222-2222-2222-2222-222222222222'::UUID;
  v_maq3_id UUID := 'ba333333-3333-3333-3333-333333333333'::UUID;
  v_maq4_id UUID := 'ba444444-4444-4444-4444-444444444444'::UUID;

  v_srv_esc UUID;
  v_srv_caminhao UUID;
  v_srv_represa UUID;
  v_srv_limpeza UUID;
  v_srv_valas UUID;
  v_srv_nivelamento UUID;

  v_ap1_id UUID := gen_random_uuid();
  v_ap2_id UUID := gen_random_uuid();
  v_ap3_id UUID := gen_random_uuid();
  v_ap4_id UUID := gen_random_uuid();
  v_ap5_id UUID := gen_random_uuid();
  v_ap6_id UUID := gen_random_uuid();
  v_ap7_id UUID := gen_random_uuid();

  v_cob1_id UUID := gen_random_uuid();
  v_cob2_id UUID := gen_random_uuid();
BEGIN
  -- 1. SEED AUTH USERS
  -- Admin user
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'matheus.mendes96@hotmail.com';
  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'matheus.mendes96@hotmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Matheus Mendes (Admin)"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  -- Operator 1
  SELECT id INTO v_op1_id FROM auth.users WHERE email = 'ze.carlos@cambui.com';
  IF v_op1_id IS NULL THEN
    v_op1_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_op1_id,
      '00000000-0000-0000-0000-000000000000',
      'ze.carlos@cambui.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Zé Carlos"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  -- Operator 2
  SELECT id INTO v_op2_id FROM auth.users WHERE email = 'tiago.pedroso@cambui.com';
  IF v_op2_id IS NULL THEN
    v_op2_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_op2_id,
      '00000000-0000-0000-0000-000000000000',
      'tiago.pedroso@cambui.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Tiago Pedroso"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  -- Operator 3
  SELECT id INTO v_op3_id FROM auth.users WHERE email = 'marcos.silva@cambui.com';
  IF v_op3_id IS NULL THEN
    v_op3_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_op3_id,
      '00000000-0000-0000-0000-000000000000',
      'marcos.silva@cambui.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marcos Silva"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  -- 2. PUBLIC.USUARIOS
  INSERT INTO public.usuarios (id, email, nome, perfil, telefone, ativo) VALUES
    (v_admin_id, 'matheus.mendes96@hotmail.com', 'Matheus Mendes (Admin)', 'admin', '(35) 99876-5432', true),
    (v_op1_id, 'ze.carlos@cambui.com', 'Zé Carlos', 'operador', '(35) 99123-4567', true),
    (v_op2_id, 'tiago.pedroso@cambui.com', 'Tiago Pedroso', 'operador', '(35) 99234-5678', true),
    (v_op3_id, 'marcos.silva@cambui.com', 'Marcos Silva', 'operador', '(35) 99345-6789', true)
  ON CONFLICT (id) DO UPDATE SET
    perfil = EXCLUDED.perfil,
    nome = EXCLUDED.nome;

  -- 3. FUNCIONARIOS (3 operadores)
  INSERT INTO public.funcionarios (id, usuario_id, nome, telefone, funcao, valor_hora, ativo) VALUES
    (v_func1_id, v_op1_id, 'Zé Carlos Ferreira', '(35) 99123-4567', 'Operador de Escavadeira Hidráulica', 35.00, true),
    (v_func2_id, v_op2_id, 'Tiago Pedroso Santos', '(35) 99234-5678', 'Motorista de Caminhão Basculante', 30.00, true),
    (v_func3_id, v_op3_id, 'Marcos da Silva Rocha', '(35) 99345-6789', 'Operador de Retroescavadeira e Pá', 32.00, true)
  ON CONFLICT (id) DO NOTHING;

  -- 4. CLIENTES (3 clientes)
  INSERT INTO public.clientes (id, nome, cpf_cnpj, telefone, whatsapp, email, endereco, observacoes, ativo) VALUES
    (v_cli1_id, 'João Silva Agropecuária', '12.345.678/0001-90', '(35) 3431-1020', '(35) 99988-1122', 'contato@joaosilva.com.br', 'Rod. Fernão Dias, KM 905 - Cambuí / MG', 'Cliente antigo, pagamento sempre em dia via Pix.', true),
    (v_cli2_id, 'Construtora Mantiqueira Ltda', '23.456.789/0001-01', '(35) 3431-2244', '(35) 99877-3344', 'obras@construtoramantiqueira.com.br', 'Av. Pref. José Dias, 450 - Centro - Cambuí / MG', 'Exige relatório de medição assinado e fotos de cada etapa.', true),
    (v_cli3_id, 'Fazenda Bela Vista (Dr. Roberto)', '098.765.432-10', '(35) 3431-5588', '(35) 99766-5566', 'roberto.belavista@gmail.com', 'Estrada Rural do Bairro dos Lopes, S/N - Cambuí / MG', 'Propriedade rural com 2 represas e estradas internas.', true)
  ON CONFLICT (id) DO NOTHING;

  -- 5. OBRAS (4 obras)
  INSERT INTO public.obras (id, cliente_id, nome, endereco, latitude, longitude, data_inicio, status) VALUES
    (v_obra1_id, v_cli1_id, 'Represa Sítio Boa Vista', 'Estrada do Córrego Bom Sucesso, KM 3', -22.6123450, -46.0123450, CURRENT_DATE - 45, 'em_andamento'),
    (v_obra2_id, v_cli2_id, 'Loteamento Vale Verde - Terraplenagem Ruas', 'Bairro Santa Terezinha - Rua 04', -22.6054320, -46.0087650, CURRENT_DATE - 30, 'em_andamento'),
    (v_obra3_id, v_cli2_id, 'Abertura de Acesso e Vala Central', 'Acesso Sul BR-381, próx. Trevo', -22.5987650, -46.0154320, CURRENT_DATE - 15, 'em_andamento'),
    (v_obra4_id, v_cli3_id, 'Desassoreamento Lagoa 2 e Estrada da Serra', 'Bairro dos Lopes - Fazenda Bela Vista', -22.6245670, -46.0234560, CURRENT_DATE - 60, 'em_andamento')
  ON CONFLICT (id) DO NOTHING;

  -- 6. MAQUINAS (4 máquinas)
  -- maq1: Escavadeira CAT 320D (1840h, troca a 250h, ultima troca 1650h -> restam 60h)
  -- maq2: Retroescavadeira JCB 3CX (2410h, troca a 250h, ultima troca 2150h -> atrasada 10h!)
  -- maq3: Caminhão Basculante VW Constellation 24.280 (3200h, troca a 300h, ultima troca 3000h -> restam 100h)
  -- maq4: Pá Carregadeira Caterpillar 924K (1520h, troca a 250h, ultima troca 1300h -> atrasada ou próxima)
  INSERT INTO public.maquinas (id, tipo, modelo, placa_identificacao, horimetro_atual, valor_hora_padrao, intervalo_troca_oleo, horimetro_ultima_troca, status) VALUES
    (v_maq1_id, 'Escavadeira Hidráulica', 'CAT 320D', 'ESC-01 (Caterpillar)', 1845.5, 320.00, 250, 1650.0, 'ativa'),
    (v_maq2_id, 'Retroescavadeira', 'JCB 3CX 4x4', 'RET-02 (JCB)', 2415.0, 210.00, 250, 2150.0, 'ativa'),
    (v_maq3_id, 'Caminhão Basculante', 'VW Constellation 24.280', 'CAM-03 (Placa GKR-4A88)', 3210.0, 190.00, 300, 3000.0, 'ativa'),
    (v_maq4_id, 'Pá Carregadeira', 'Caterpillar 924K', 'CAR-04 (CAT 924K)', 1520.0, 280.00, 250, 1480.0, 'ativa')
  ON CONFLICT (id) DO NOTHING;

  -- 7. PREÇOS ESPECÍFICOS POR CLIENTE
  INSERT INTO public.precos_cliente (cliente_id, obra_id, maquina_id, valor_hora) VALUES
    (v_cli2_id, v_obra2_id, v_maq1_id, 300.00), -- Desconto de volume para Construtora Mantiqueira
    (v_cli1_id, v_obra1_id, v_maq2_id, 200.00)
  ON CONFLICT (cliente_id, obra_id, maquina_id) DO NOTHING;

  -- Buscar IDs de tipos de serviço
  SELECT id INTO v_srv_esc FROM public.tipos_servico WHERE nome = 'escavação' LIMIT 1;
  SELECT id INTO v_srv_caminhao FROM public.tipos_servico WHERE nome = 'puxando terra com caminhão' LIMIT 1;
  SELECT id INTO v_srv_represa FROM public.tipos_servico WHERE nome = 'alargamento de represa' LIMIT 1;
  SELECT id INTO v_srv_limpeza FROM public.tipos_servico WHERE nome = 'limpeza de terreno' LIMIT 1;
  SELECT id INTO v_srv_valas FROM public.tipos_servico WHERE nome = 'abertura de valas' LIMIT 1;
  SELECT id INTO v_srv_nivelamento FROM public.tipos_servico WHERE nome = 'terraplenagem/nivelamento' LIMIT 1;

  -- 8. APONTAMENTOS DA ÚLTIMA SEMANA
  -- Apontamento 1: Zé Carlos, Escavadeira CAT, Cliente 1 (Obra Represa), 4 dias atrás, 8.5h (Aprovado)
  INSERT INTO public.apontamentos (
    id, data, funcionario_id, maquina_id, cliente_id, obra_id,
    horimetro_inicial, horimetro_final, horas_trabalhadas, horas_paradas, motivo_parada,
    descricao, status, valor_hora_aplicado, valor_total, criado_por
  ) VALUES (
    v_ap1_id, CURRENT_DATE - 4, v_func1_id, v_maq1_id, v_cli1_id, v_obra1_id,
    1820.0, 1828.5, 8.5, 0.5, 'Pausa para abastecimento de água e conferência de cota',
    'Escavação do talude leste da represa e acerto de rampa', 'aprovado', 320.00, 2720.00, v_op1_id
  ) ON CONFLICT (id) DO NOTHING;

  IF v_srv_esc IS NOT NULL THEN
    INSERT INTO public.apontamento_servicos (apontamento_id, tipo_servico_id) VALUES (v_ap1_id, v_srv_esc) ON CONFLICT DO NOTHING;
  END IF;
  IF v_srv_represa IS NOT NULL THEN
    INSERT INTO public.apontamento_servicos (apontamento_id, tipo_servico_id) VALUES (v_ap1_id, v_srv_represa) ON CONFLICT DO NOTHING;
  END IF;

  -- Apontamento 2: Tiago Pedroso, Caminhão VW, Cliente 1 (Obra Represa), 4 dias atrás, 8.0h, 14 viagens (Aprovado)
  INSERT INTO public.apontamentos (
    id, data, funcionario_id, maquina_id, cliente_id, obra_id,
    horimetro_inicial, horimetro_final, horas_trabalhadas, quantidade_viagens,
    descricao, status, valor_hora_aplicado, valor_total, criado_por
  ) VALUES (
    v_ap2_id, CURRENT_DATE - 4, v_func2_id, v_maq3_id, v_cli1_id, v_obra1_id,
    3185.0, 3193.0, 8.0, 14,
    'Transporte de material retirado do sangradouro até o bota-fora interno', 'aprovado', 190.00, 1520.00, v_op2_id
  ) ON CONFLICT (id) DO NOTHING;

  IF v_srv_caminhao IS NOT NULL THEN
    INSERT INTO public.apontamento_servicos (apontamento_id, tipo_servico_id) VALUES (v_ap2_id, v_srv_caminhao) ON CONFLICT DO NOTHING;
  END IF;

  -- Apontamento 3: Marcos Silva, Retro JCB, Cliente 2 (Obra Vale Verde), 3 dias atrás, 7.5h (Aprovado)
  INSERT INTO public.apontamentos (
    id, data, funcionario_id, maquina_id, cliente_id, obra_id,
    horimetro_inicial, horimetro_final, horas_trabalhadas, horas_paradas, motivo_parada,
    descricao, status, valor_hora_aplicado, valor_total, criado_por
  ) VALUES (
    v_ap3_id, CURRENT_DATE - 3, v_func3_id, v_maq2_id, v_cli2_id, v_obra2_id,
    2395.0, 2402.5, 7.5, 0.0, NULL,
    'Abertura de vala para galeria de águas pluviais na rua B', 'aprovado', 210.00, 1575.00, v_op3_id
  ) ON CONFLICT (id) DO NOTHING;

  IF v_srv_valas IS NOT NULL THEN
    INSERT INTO public.apontamento_servicos (apontamento_id, tipo_servico_id) VALUES (v_ap3_id, v_srv_valas) ON CONFLICT DO NOTHING;
  END IF;

  -- Apontamento 4: Zé Carlos, Escavadeira CAT, Cliente 2 (Obra Vale Verde), 2 dias atrás, 9.0h (Aprovado - preço especial 300,00)
  INSERT INTO public.apontamentos (
    id, data, funcionario_id, maquina_id, cliente_id, obra_id,
    horimetro_inicial, horimetro_final, horas_trabalhadas,
    descricao, status, valor_hora_aplicado, valor_total, criado_por
  ) VALUES (
    v_ap4_id, CURRENT_DATE - 2, v_func1_id, v_maq1_id, v_cli2_id, v_obra2_id,
    1828.5, 1837.5, 9.0,
    'Corte e acerto de talude principal no loteamento', 'aprovado', 300.00, 2700.00, v_op1_id
  ) ON CONFLICT (id) DO NOTHING;

  IF v_srv_nivelamento IS NOT NULL THEN
    INSERT INTO public.apontamento_servicos (apontamento_id, tipo_servico_id) VALUES (v_ap4_id, v_srv_nivelamento) ON CONFLICT DO NOTHING;
  END IF;

  -- Apontamento 5: Marcos Silva, Retro JCB, Cliente 3 (Bela Vista), 1 dia atrás, 6.0h (PENDENTE de aprovação)
  INSERT INTO public.apontamentos (
    id, data, funcionario_id, maquina_id, cliente_id, obra_id,
    horimetro_inicial, horimetro_final, horas_trabalhadas, horas_paradas, motivo_parada,
    descricao, status, valor_hora_aplicado, valor_total, criado_por
  ) VALUES (
    v_ap5_id, CURRENT_DATE - 1, v_func3_id, v_maq2_id, v_cli3_id, v_obra4_id,
    2402.5, 2408.5, 6.0, 1.0, 'Chuva forte após almoço',
    'Limpeza de valetas na subida da sede e cascalhamento', 'pendente', 210.00, 1260.00, v_op3_id
  ) ON CONFLICT (id) DO NOTHING;

  IF v_srv_limpeza IS NOT NULL THEN
    INSERT INTO public.apontamento_servicos (apontamento_id, tipo_servico_id) VALUES (v_ap5_id, v_srv_limpeza) ON CONFLICT DO NOTHING;
  END IF;

  -- Apontamento 6: Zé Carlos, Escavadeira CAT, Cliente 1 (Obra Represa), hoje, 8.0h (PENDENTE)
  INSERT INTO public.apontamentos (
    id, data, funcionario_id, maquina_id, cliente_id, obra_id,
    horimetro_inicial, horimetro_final, horas_trabalhadas,
    descricao, status, valor_hora_aplicado, valor_total, criado_por
  ) VALUES (
    v_ap6_id, CURRENT_DATE, v_func1_id, v_maq1_id, v_cli1_id, v_obra1_id,
    1837.5, 1845.5, 8.0,
    'Conclusão da ensecadeira e aprofundamento do vertedouro', 'pendente', 320.00, 2560.00, v_op1_id
  ) ON CONFLICT (id) DO NOTHING;

  IF v_srv_represa IS NOT NULL THEN
    INSERT INTO public.apontamento_servicos (apontamento_id, tipo_servico_id) VALUES (v_ap6_id, v_srv_represa) ON CONFLICT DO NOTHING;
  END IF;

  -- Apontamento 7: Tiago Pedroso, Caminhão, enviado por FOTO DA FOLHA (Rascunho de foto)
  INSERT INTO public.apontamentos (
    id, data, funcionario_id, maquina_id, cliente_id, obra_id,
    horimetro_inicial, horimetro_final, horas_trabalhadas, quantidade_viagens,
    descricao, status, origem_foto, foto_folha_url, valor_hora_aplicado, valor_total, criado_por
  ) VALUES (
    v_ap7_id, CURRENT_DATE - 1, v_func2_id, v_maq3_id, v_cli2_id, v_obra3_id,
    3193.0, 3201.0, 8.0, 12,
    'Apontamento enviado por foto da ficha de papel para conferência do escritório.',
    'rascunho_foto', true, 'https://img.usecurling.com/p/800/1000?q=document%20notes&color=gray', 190.00, 1520.00, v_op2_id
  ) ON CONFLICT (id) DO NOTHING;

  -- 9. ABASTECIMENTOS
  INSERT INTO public.abastecimentos (
    data, maquina_id, funcionario_id, horimetro_momento, tipo_combustivel, litros, valor_por_litro, valor_total, posto_local, criado_por
  ) VALUES
    (CURRENT_DATE - 4, v_maq1_id, v_func1_id, 1820.0, 'diesel', 180.0, 5.99, 1078.20, 'Posto Petrobras Rod. Fernão Dias', v_op1_id),
    (CURRENT_DATE - 3, v_maq3_id, v_func2_id, 3190.0, 'diesel', 220.0, 5.95, 1309.00, 'Posto Shell Trevo Cambuí', v_op2_id),
    (CURRENT_DATE - 2, v_maq2_id, v_func3_id, 2400.0, 'diesel', 95.0, 6.05, 574.75, 'Comboio de campo no Sítio', v_op3_id),
    (CURRENT_DATE - 1, v_maq1_id, v_func1_id, 1838.0, 'diesel', 170.0, 5.99, 1018.30, 'Posto Petrobras Rod. Fernão Dias', v_op1_id);

  -- 10. MANUTENÇÕES
  INSERT INTO public.manutencoes (
    data, maquina_id, horimetro, tipo, descricao, custo, oficina_responsavel, criado_por
  ) VALUES
    (CURRENT_DATE - 12, v_maq1_id, 1650.0, 'troca de óleo do motor', 'Troca de 28L de óleo 15W40 + substituição de filtros de óleo e combustível', 1450.00, 'Oficina Mecânica TratorSul', v_admin_id),
    (CURRENT_DATE - 18, v_maq2_id, 2150.0, 'troca de óleo do motor', 'Troca de óleo do motor e lubrificação completa das articulações', 980.00, 'Auto Peças e Mecânica Cambuí', v_admin_id),
    (CURRENT_DATE - 5, v_maq3_id, 3170.0, 'pneus', 'Recape de dois pneus traseiros de tração e alinhamento', 1800.00, 'Pneus Cambuí', v_admin_id),
    (CURRENT_DATE - 2, v_maq2_id, 2405.0, 'graxa/lubrificação', 'Engraxamento de todas as buchas e pinos da concha dianteira e lança', 150.00, 'Própria equipe / campo', v_op3_id);

  -- 11. COBRANÇAS / MEDIÇÕES
  -- Cobrança 1: Cliente João Silva, período anterior (PAGA)
  INSERT INTO public.cobrancas (
    id, numero, cliente_id, obra_id, periodo_inicio, periodo_fim,
    horas_totais, valor_total, valor_pago, data_vencimento, status, observacoes, criado_por
  ) VALUES (
    v_cob1_id, 'MED-2026-001', v_cli1_id, v_obra1_id, CURRENT_DATE - 20, CURRENT_DATE - 10,
    32.0, 10240.00, 10240.00, CURRENT_DATE - 5, 'pago', 'Medição quinzenal aprovada e quitada', v_admin_id
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.pagamentos (
    cobranca_id, data, valor, forma_pagamento, observacao, criado_por
  ) VALUES
    (v_cob1_id, CURRENT_DATE - 5, 10240.00, 'Pix', 'Comprovante Banco Itaú chave CNPJ', v_admin_id)
  ON CONFLICT (id) DO NOTHING;

  -- Cobrança 2: Construtora Mantiqueira, período recente (EM ABERTO / VENCENDO)
  INSERT INTO public.cobrancas (
    id, numero, cliente_id, obra_id, periodo_inicio, periodo_fim,
    horas_totais, valor_total, valor_pago, data_vencimento, status, observacoes, criado_por
  ) VALUES (
    v_cob2_id, 'MED-2026-002', v_cli2_id, v_obra2_id, CURRENT_DATE - 10, CURRENT_DATE - 2,
    45.5, 13650.00, 5000.00, CURRENT_DATE + 5, 'pago_parcial', 'Sinal de 5000 pago no ato da medição, restante em 5 dias', v_admin_id
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.pagamentos (
    cobranca_id, data, valor, forma_pagamento, observacao, criado_por
  ) VALUES
    (v_cob2_id, CURRENT_DATE - 2, 5000.00, 'transferência', 'TED Banco do Brasil entrada de 5 mil', v_admin_id)
  ON CONFLICT (id) DO NOTHING;

END $$;
