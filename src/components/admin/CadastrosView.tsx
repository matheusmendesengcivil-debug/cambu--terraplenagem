import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  HardHat,
  MapPin,
  Truck,
  Plus,
  Edit2,
  Trash2,
  Navigation,
  CheckCircle,
  Search,
  Check,
  Car,
  AlertTriangle,
} from 'lucide-react'
import {
  getClientes,
  saveCliente,
  getObras,
  saveObra,
  getFuncionarios,
  saveFuncionario,
  getMaquinas,
  saveMaquina,
  getTiposServico,
  saveTipoServico,
  excluirCadastro,
} from '@/services/cambui'
import { Cliente, Obra, Funcionario, Maquina, TipoServico } from '@/types/cambui'
import { formatCurrency, nomeEquipamento } from '@/lib/formatters'
import { toast } from 'sonner'

export const CadastrosView: React.FC = () => {
  const [secao, setSecao] = useState<
    'clientes' | 'obras' | 'maquinas' | 'veiculos' | 'funcionarios' | 'servicos'
  >('clientes')
  const [loading, setLoading] = useState(true)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([])

  // Modals for editing / new
  const [modalCliente, setModalCliente] = useState<Partial<Cliente> | null>(null)
  const [modalObra, setModalObra] = useState<Partial<Obra> | null>(null)
  const [modalMaquina, setModalMaquina] = useState<Partial<Maquina> | null>(null)
  const [modalFuncionario, setModalFuncionario] = useState<Partial<Funcionario> | null>(null)
  const [novoServicoNome, setNovoServicoNome] = useState('')

  const listaMaquinas = maquinas.filter((m) => (m.categoria || 'maquina') === 'maquina')
  const listaVeiculos = maquinas.filter((m) => m.categoria === 'veiculo')
  const ehVeiculoModal = modalMaquina?.categoria === 'veiculo'

  const carregarTudo = async () => {
    setLoading(true)
    try {
      const [c, o, m, f, s] = await Promise.all([
        getClientes(),
        getObras(),
        getMaquinas(),
        getFuncionarios(),
        getTiposServico(),
      ])
      setClientes(c)
      setObras(o)
      setMaquinas(m)
      setFuncionarios(f)
      setTiposServico(s)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  // GPS for Obra
  const handlePegarGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada no aparelho.')
      return
    }
    toast.info('Obtendo coordenadas do GPS...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (modalObra) {
          setModalObra({
            ...modalObra,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
          toast.success(
            `GPS capturado: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,
          )
        }
      },
      (err) => {
        toast.error('Não foi possível obter GPS: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // CLIENTE SUBMIT
  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalCliente) return
    try {
      const { error } = await saveCliente(modalCliente)
      if (error) throw error
      toast.success('Cliente salvo com sucesso!')
      setModalCliente(null)
      await carregarTudo()
    } catch (err: any) {
      toast.error('Erro ao salvar cliente: ' + err.message)
    }
  }

  // OBRA SUBMIT
  const handleSaveObra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalObra) return
    try {
      const { error } = await saveObra(modalObra)
      if (error) throw error
      toast.success('Obra salva com sucesso!')
      setModalObra(null)
      await carregarTudo()
    } catch (err: any) {
      toast.error('Erro ao salvar obra: ' + err.message)
    }
  }

  // MAQUINA SUBMIT
  const handleSaveMaquina = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalMaquina) return
    try {
      const { error } = await saveMaquina(modalMaquina)
      if (error) throw error
      toast.success(ehVeiculoModal ? 'Veículo salvo com sucesso!' : 'Máquina salva com sucesso!')
      setModalMaquina(null)
      await carregarTudo()
    } catch (err: any) {
      toast.error('Erro ao salvar máquina: ' + err.message)
    }
  }

  // FUNCIONARIO SUBMIT
  const handleSaveFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalFuncionario) return
    try {
      const { error } = await saveFuncionario(modalFuncionario)
      if (error) throw error
      toast.success('Colaborador salvo com sucesso!')
      setModalFuncionario(null)
      await carregarTudo()
    } catch (err: any) {
      toast.error('Erro ao salvar funcionário: ' + err.message)
    }
  }

  // TIPO SERVICO SUBMIT
  const handleAddTipoServico = async () => {
    if (!novoServicoNome.trim()) return
    try {
      const { error } = await saveTipoServico({ nome: novoServicoNome.trim(), ativo: true })
      if (error) throw error
      toast.success('Tipo de serviço adicionado!')
      setNovoServicoNome('')
      await carregarTudo()
    } catch (err: any) {
      toast.error('Erro ao adicionar serviço: ' + err.message)
    }
  }

  const handleExcluir = async (
    tabela: 'clientes' | 'obras' | 'maquinas' | 'funcionarios' | 'tipos_servico',
    id: string,
    nome: string,
  ) => {
    if (
      !window.confirm(
        `Excluir "${nome}"?\n\nOs lançamentos ligados a ele continuam salvos, só ficam com esse campo em branco.`,
      )
    )
      return
    const { error } = await excluirCadastro(tabela, id)
    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
      return
    }
    toast.success('Excluído com sucesso.')
    await carregarTudo()
  }

  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            CADASTROS GERAIS (ADMIN)
          </h2>
          <p className="text-xs text-muted-foreground">
            Gerenciamento de clientes, obras com GPS, máquinas, operadores e serviços
          </p>
        </div>

        {/* Section switch */}
        <div className="flex flex-wrap p-1 bg-muted rounded-xl text-xs font-bold gap-1">
          <button
            onClick={() => setSecao('clientes')}
            className={`px-3 py-1.5 rounded-lg transition-all ${secao === 'clientes' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Clientes ({clientes.length})
          </button>
          <button
            onClick={() => setSecao('obras')}
            className={`px-3 py-1.5 rounded-lg transition-all ${secao === 'obras' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Obras ({obras.length})
          </button>
          <button
            onClick={() => setSecao('maquinas')}
            className={`px-3 py-1.5 rounded-lg transition-all ${secao === 'maquinas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Máquinas ({listaMaquinas.length})
          </button>
          <button
            onClick={() => setSecao('veiculos')}
            className={`px-3 py-1.5 rounded-lg transition-all ${secao === 'veiculos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Veículos ({listaVeiculos.length})
          </button>
          <button
            onClick={() => setSecao('funcionarios')}
            className={`px-3 py-1.5 rounded-lg transition-all ${secao === 'funcionarios' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Equipe ({funcionarios.length})
          </button>
          <button
            onClick={() => setSecao('servicos')}
            className={`px-3 py-1.5 rounded-lg transition-all ${secao === 'servicos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Serviços ({tiposServico.length})
          </button>
        </div>
      </div>

      {/* 1. CLIENTES */}
      {secao === 'clientes' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">
              Lista de Clientes Cadastrados
            </span>
            <Button
              size="sm"
              onClick={() => setModalCliente({ ativo: true })}
              className="bg-pepsi-600 hover:bg-pepsi-700 text-white font-bold text-xs h-9 gap-1"
            >
              <Plus className="w-4 h-4" /> Novo Cliente
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clientes.map((c) => (
              <Card key={c.id} className="border-2 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{c.nome || 'Sem nome'}</h3>
                      <p className="text-xs text-muted-foreground">
                        {c.cpf_cnpj || 'Sem CPF/CNPJ'}
                      </p>
                    </div>
                    <Badge
                      variant={c.ativo ? 'default' : 'secondary'}
                      className={c.ativo ? 'bg-emerald-600 text-[10px]' : 'text-[10px]'}
                    >
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-0.5 text-muted-foreground">
                    {c.telefone && (
                      <div>
                        📞 {c.telefone} {c.whatsapp && `(WhatsApp: ${c.whatsapp})`}
                      </div>
                    )}
                    {c.email && <div>✉️ {c.email}</div>}
                    {c.endereco && <div>📍 {c.endereco}</div>}
                    {c.observacoes && (
                      <div className="italic text-foreground/80 mt-1">"{c.observacoes}"</div>
                    )}
                  </div>

                  <div className="flex justify-end gap-1 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalCliente(c)}
                      className="text-xs h-8 gap-1 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExcluir('clientes', c.id, c.nome || 'cliente sem nome')}
                      className="text-xs h-8 gap-1 font-semibold text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 2. OBRAS */}
      {secao === 'obras' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">
              Obras & Locais de Trabalho
            </span>
            <Button
              size="sm"
              onClick={() => setModalObra({ status: 'em_andamento', cliente_id: clientes[0]?.id })}
              className="bg-pepsi-600 hover:bg-pepsi-700 text-white font-bold text-xs h-9 gap-1"
            >
              <Plus className="w-4 h-4" /> Nova Obra
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {obras.map((o) => {
              const cli = clientes.find((c) => c.id === o.cliente_id)
              return (
                <Card key={o.id} className="border-2 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          {o.nome || 'Sem nome'}
                        </h3>
                        <p className="text-xs font-semibold text-pepsi-600 dark:text-pepsi-300">
                          Cliente: {cli?.nome || 'Não definido'}
                        </p>
                      </div>
                      <Badge
                        className={
                          o.status === 'em_andamento'
                            ? 'bg-pepsi-600 text-white text-[10px]'
                            : 'text-[10px]'
                        }
                      >
                        {o.status === 'em_andamento' ? 'Em Andamento' : o.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>📍 {o.endereco || 'Endereço não informado'}</div>
                      {o.latitude && o.longitude && (
                        <div className="font-mono text-[11px] text-foreground flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-pepsi-500" />
                          GPS: {o.latitude.toString().substring(0, 9)},{' '}
                          {o.longitude.toString().substring(0, 9)}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-1 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModalObra(o)}
                        className="text-xs h-8 gap-1 font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluir('obras', o.id, o.nome || 'obra sem nome')}
                        className="text-xs h-8 gap-1 font-semibold text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. MAQUINAS e VEÍCULOS */}
      {(secao === 'maquinas' || secao === 'veiculos') && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">
              {secao === 'veiculos'
                ? 'Veículos (caminhões, carros) — controle por km'
                : 'Máquinas e Equipamentos — controle por horímetro'}
            </span>
            <Button
              size="sm"
              onClick={() =>
                setModalMaquina({
                  categoria: secao === 'veiculos' ? 'veiculo' : 'maquina',
                  status: 'ativa',
                  horimetro_atual: 0,
                  intervalo_troca_oleo: secao === 'veiculos' ? 10000 : 250,
                  valor_hora_padrao: 0,
                })
              }
              className="bg-pepsi-600 hover:bg-pepsi-700 text-white font-bold text-xs h-9 gap-1"
            >
              <Plus className="w-4 h-4" /> {secao === 'veiculos' ? 'Novo Veículo' : 'Nova Máquina'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(secao === 'veiculos' ? listaVeiculos : listaMaquinas).map((m) => {
              const un = m.categoria === 'veiculo' ? 'km' : 'h'
              return (
                <Card key={m.id} className="border-2 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {m.categoria === 'veiculo' ? (
                            <Car className="w-4 h-4 text-pepsi-500" />
                          ) : (
                            <HardHat className="w-4 h-4 text-pepsi-500" />
                          )}
                          {nomeEquipamento(m)}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground">
                          {m.placa_identificacao || 'Sem placa/identificação'}
                        </p>
                      </div>
                      <Badge className="bg-emerald-600 text-[10px] capitalize">{m.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg">
                      <div>
                        <span className="text-muted-foreground">
                          {un === 'km' ? 'Km Atual:' : 'Horímetro Atual:'}
                        </span>
                        <div className="font-bold font-mono text-foreground text-sm">
                          {m.horimetro_atual}
                          {un}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor Cobrado / Hora:</span>
                        <div className="font-bold font-mono text-pepsi-600 dark:text-pepsi-300 text-sm">
                          {formatCurrency(m.valor_hora_padrao)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Intervalo Troca Óleo:</span>
                        <div className="font-mono text-foreground">
                          {m.intervalo_troca_oleo}
                          {un}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Última Troca:</span>
                        <div className="font-mono text-foreground">
                          {m.horimetro_ultima_troca}
                          {un}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1 pt-1 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModalMaquina(m)}
                        className="text-xs h-8 gap-1 font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluir('maquinas', m.id, nomeEquipamento(m))}
                        className="text-xs h-8 gap-1 font-semibold text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. FUNCIONARIOS */}
      {secao === 'funcionarios' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">
              Operadores e Equipe de Campo
            </span>
            <Button
              size="sm"
              onClick={() => setModalFuncionario({ ativo: true, valor_hora: 35 })}
              className="bg-pepsi-600 hover:bg-pepsi-700 text-white font-bold text-xs h-9 gap-1"
            >
              <Plus className="w-4 h-4" /> Novo Colaborador
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {funcionarios.map((f) => (
              <Card key={f.id} className="border-2 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{f.nome || 'Sem nome'}</h3>
                      <p className="text-xs text-pepsi-600 dark:text-pepsi-300 font-semibold">
                        {f.funcao}
                      </p>
                    </div>
                    <Badge
                      variant={f.ativo ? 'default' : 'secondary'}
                      className={f.ativo ? 'bg-emerald-600 text-[10px]' : 'text-[10px]'}
                    >
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1 text-muted-foreground">
                    {f.telefone && <div>📞 {f.telefone}</div>}
                    <div>💰 Custo hora interna: {formatCurrency(f.valor_hora)}</div>
                  </div>

                  <div className="flex justify-end gap-1 pt-1 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalFuncionario(f)}
                      className="text-xs h-8 gap-1 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleExcluir('funcionarios', f.id, f.nome || 'colaborador sem nome')
                      }
                      className="text-xs h-8 gap-1 font-semibold text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. TIPOS DE SERVIÇO */}
      {secao === 'servicos' && (
        <Card className="border-2">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-sm font-bold">Tipos de Serviço de Terraplenagem</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo serviço (ex: Abertura de curva de nível)..."
                value={novoServicoNome}
                onChange={(e) => setNovoServicoNome(e.target.value)}
                className="text-xs h-10"
              />
              <Button
                onClick={handleAddTipoServico}
                className="bg-pepsi-600 hover:bg-pepsi-700 text-white font-bold text-xs h-10 shrink-0"
              >
                Adicionar
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {tiposServico.map((srv) => (
                <div
                  key={srv.id}
                  className="p-2.5 rounded-lg border bg-muted/30 flex items-center justify-between text-xs font-semibold"
                >
                  <span>{srv.nome}</span>
                  <button
                    type="button"
                    title="Excluir serviço"
                    onClick={() => handleExcluir('tipos_servico', srv.id, srv.nome)}
                    className="text-destructive hover:opacity-70"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL CLIENTE */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCliente}
            className="bg-card border-2 rounded-2xl p-5 max-w-md w-full space-y-3 shadow-2xl"
          >
            <h3 className="text-base font-black text-foreground">
              {modalCliente.id ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            <div>
              <Label className="text-xs font-bold">Nome / Razão Social</Label>
              <Input
                value={modalCliente.nome || ''}
                onChange={(e) => setModalCliente({ ...modalCliente, nome: e.target.value })}
                className="h-10 text-xs mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">CPF ou CNPJ</Label>
                <Input
                  value={modalCliente.cpf_cnpj || ''}
                  onChange={(e) => setModalCliente({ ...modalCliente, cpf_cnpj: e.target.value })}
                  className="h-10 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">WhatsApp</Label>
                <Input
                  value={modalCliente.whatsapp || ''}
                  onChange={(e) => setModalCliente({ ...modalCliente, whatsapp: e.target.value })}
                  className="h-10 text-xs mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Endereço</Label>
              <Input
                value={modalCliente.endereco || ''}
                onChange={(e) => setModalCliente({ ...modalCliente, endereco: e.target.value })}
                className="h-10 text-xs mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalCliente(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-pepsi-600 text-white font-bold">
                Salvar Cliente
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL OBRA */}
      {modalObra && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveObra}
            className="bg-card border-2 rounded-2xl p-5 max-w-md w-full space-y-3 shadow-2xl"
          >
            <h3 className="text-base font-black text-foreground">
              {modalObra.id ? 'Editar Obra / Local' : 'Nova Obra / Local'}
            </h3>
            <div>
              <Label className="text-xs font-bold">Cliente Vinculado</Label>
              <select
                value={modalObra.cliente_id || ''}
                onChange={(e) => setModalObra({ ...modalObra, cliente_id: e.target.value })}
                className="w-full h-10 text-xs rounded-md border border-input bg-background px-2.5 mt-1 font-semibold"
              >
                <option value="">— Sem cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome || 'Sem nome'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold">Nome da Obra</Label>
              <Input
                placeholder="Ex: Represa Sítio Boa Vista"
                value={modalObra.nome || ''}
                onChange={(e) => setModalObra({ ...modalObra, nome: e.target.value })}
                className="h-10 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Endereço / Referência</Label>
              <Input
                placeholder="Ex: Estrada dos Lopes, KM 4"
                value={modalObra.endereco || ''}
                onChange={(e) => setModalObra({ ...modalObra, endereco: e.target.value })}
                className="h-10 text-xs mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Coordenadas GPS</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePegarGPS}
                  className="h-7 text-[11px] gap-1"
                >
                  <Navigation className="w-3 h-3 text-pepsi-500" /> Pegar GPS Atual
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  placeholder="Latitude"
                  type="number"
                  step="0.000001"
                  value={modalObra.latitude || ''}
                  onChange={(e) =>
                    setModalObra({ ...modalObra, latitude: parseFloat(e.target.value) || null })
                  }
                  className="h-9 text-xs font-mono"
                />
                <Input
                  placeholder="Longitude"
                  type="number"
                  step="0.000001"
                  value={modalObra.longitude || ''}
                  onChange={(e) =>
                    setModalObra({ ...modalObra, longitude: parseFloat(e.target.value) || null })
                  }
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalObra(null)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-pepsi-600 text-white font-bold">
                Salvar Obra
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL MAQUINA */}
      {modalMaquina && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMaquina}
            className="bg-card border-2 rounded-2xl p-5 max-w-md w-full space-y-3 shadow-2xl"
          >
            <h3 className="text-base font-black text-foreground">
              {modalMaquina.id
                ? ehVeiculoModal
                  ? 'Editar Veículo'
                  : 'Editar Máquina'
                : ehVeiculoModal
                  ? 'Cadastrar Veículo'
                  : 'Cadastrar Máquina'}
            </h3>
            <div>
              <Label className="text-xs font-bold">Categoria</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['maquina', 'veiculo'] as const).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setModalMaquina({ ...modalMaquina, categoria: c })}
                    className={`h-10 rounded-lg border-2 text-xs font-bold ${
                      (modalMaquina.categoria || 'maquina') === c
                        ? 'border-pepsi-600 bg-prata-300/35'
                        : 'border-border'
                    }`}
                  >
                    {c === 'maquina' ? '🚜 Máquina (horímetro)' : '🚚 Veículo (km)'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Tipo</Label>
                <Input
                  placeholder={
                    ehVeiculoModal ? 'Caminhão, Caçamba, Carro...' : 'Escavadeira, Retro...'
                  }
                  value={modalMaquina.tipo || ''}
                  onChange={(e) => setModalMaquina({ ...modalMaquina, tipo: e.target.value })}
                  className="h-10 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Modelo</Label>
                <Input
                  placeholder="CAT 320D, JCB 3CX..."
                  value={modalMaquina.modelo || ''}
                  onChange={(e) => setModalMaquina({ ...modalMaquina, modelo: e.target.value })}
                  className="h-10 text-xs mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Identificação / Placa</Label>
              <Input
                placeholder="ESC-01 ou Placa ABC-1234"
                value={modalMaquina.placa_identificacao || ''}
                onChange={(e) =>
                  setModalMaquina({ ...modalMaquina, placa_identificacao: e.target.value })
                }
                className="h-10 text-xs mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">
                  {ehVeiculoModal ? 'Km Atual' : 'Horímetro Atual (h)'}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={modalMaquina.horimetro_atual || ''}
                  onChange={(e) =>
                    setModalMaquina({
                      ...modalMaquina,
                      horimetro_atual: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-10 text-xs font-mono mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Preço Hora Cliente (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={modalMaquina.valor_hora_padrao || ''}
                  onChange={(e) =>
                    setModalMaquina({
                      ...modalMaquina,
                      valor_hora_padrao: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-10 text-xs font-mono mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">
                Intervalo Troca de Óleo ({ehVeiculoModal ? 'km' : 'h'})
              </Label>
              <Input
                type="number"
                step="1"
                placeholder={ehVeiculoModal ? '10000' : '250'}
                value={modalMaquina.intervalo_troca_oleo || ''}
                onChange={(e) =>
                  setModalMaquina({
                    ...modalMaquina,
                    intervalo_troca_oleo: parseInt(e.target.value) || 0,
                  })
                }
                className="h-10 text-xs font-mono mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalMaquina(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-pepsi-600 text-white font-bold">
                {ehVeiculoModal ? 'Salvar Veículo' : 'Salvar Máquina'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL FUNCIONARIO */}
      {modalFuncionario && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveFuncionario}
            className="bg-card border-2 rounded-2xl p-5 max-w-md w-full space-y-3 shadow-2xl"
          >
            <h3 className="text-base font-black text-foreground">
              {modalFuncionario.id ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h3>
            <div>
              <Label className="text-xs font-bold">Nome Completo</Label>
              <Input
                value={modalFuncionario.nome || ''}
                onChange={(e) => setModalFuncionario({ ...modalFuncionario, nome: e.target.value })}
                className="h-10 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Função</Label>
              <Input
                placeholder="Operador de escavadeira, motorista..."
                value={modalFuncionario.funcao || ''}
                onChange={(e) =>
                  setModalFuncionario({ ...modalFuncionario, funcao: e.target.value })
                }
                className="h-10 text-xs mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Telefone</Label>
                <Input
                  value={modalFuncionario.telefone || ''}
                  onChange={(e) =>
                    setModalFuncionario({ ...modalFuncionario, telefone: e.target.value })
                  }
                  className="h-10 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Custo Hora (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={modalFuncionario.valor_hora || ''}
                  onChange={(e) =>
                    setModalFuncionario({
                      ...modalFuncionario,
                      valor_hora: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-10 text-xs mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalFuncionario(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-pepsi-600 text-white font-bold">
                Salvar Colaborador
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
