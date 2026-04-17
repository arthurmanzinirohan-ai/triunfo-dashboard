export interface KPIResumo {
  total_chamados: number
  total_falhas: number
  total_defeitos: number
  chamados_fechados: number
  chamados_abertos: number
  mttr_horas: number
  mtbf_horas: number
  disponibilidade_pct: number
  total_horas_indisp: number
  meta_disponibilidade: number
}

export interface KPIMensal {
  mes_ano: string
  ano: number
  mes: number
  contrato: string
  sigla: string
  equipamento: string
  total_chamados: number
  total_falhas: number
  total_defeitos: number
  chamados_fechados: number
  chamados_abertos: number
  mttr_horas: number
  mtbf_horas: number
  disponibilidade_pct: number
  total_horas_indisp: number
  hh_disponivel_mes: number
}

export interface OcorrenciaSistema {
  mes_ano: string
  contrato: string
  sistema: string
  tipo_ocorrencia: string
  total: number
  media_indisp_horas: number
}

export interface RankingEquipamento {
  eqpto_codigo: string
  sigla: string
  equipamento: string
  contrato: string
  total_chamados: number
  total_falhas: number
  total_horas_indisp: number
  mttr_medio: number
}

export interface Chamado {
  id_chamado: string
  data_inicial: string
  equipamento: string
  sigla: string
  contrato: string
  tipo_ocorrencia: string
  descricao_chamado: string
  sistema: string
  status_chamado: string
  tempo_indisp_horas: number
  mes_ano: string
  atendentes: string
}

export interface FiltrosOpcoes {
  contratos: string[]
  siglas: string[]
  meses_anos: string[]
  anos: string[]
}
