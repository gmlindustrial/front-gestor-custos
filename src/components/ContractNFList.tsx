import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronRight,
  Building,
  Calendar,
  DollarSign,
  Hash,
  Truck
} from "lucide-react";
import { useContractNFsDetailed, useValidateNotaFiscal } from "@/hooks/useNotasFiscais";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ContractNFListProps {
  contractId: number;
}

export const ContractNFList: React.FC<ContractNFListProps> = ({ contractId }) => {
  const [expandedNFs, setExpandedNFs] = useState<Set<number>>(new Set());
  const [expandedSubpastas, setExpandedSubpastas] = useState<Set<string>>(new Set());
  const { data: nfData, isLoading, error } = useContractNFsDetailed(contractId);
  const validateNF = useValidateNotaFiscal();

  const toggleNFExpansion = (nfId: number) => {
    const newExpanded = new Set(expandedNFs);
    if (newExpanded.has(nfId)) {
      newExpanded.delete(nfId);
    } else {
      newExpanded.add(nfId);
    }
    setExpandedNFs(newExpanded);
  };

  const toggleSubpastaExpansion = (subpasta: string) => {
    const newExpanded = new Set(expandedSubpastas);
    if (newExpanded.has(subpasta)) {
      newExpanded.delete(subpasta);
    } else {
      newExpanded.add(subpasta);
    }
    setExpandedSubpastas(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validado':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Validado</Badge>;
      case 'processado':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'erro':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para agrupar NFs por subpasta
  const groupNFsBySubpasta = (nfs: any[]) => {
    const groups: { [key: string]: any[] } = {};

    nfs.forEach((nf) => {
      const key = nf.subpasta || 'Sem subpasta';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(nf);
    });

    return groups;
  };

  // Função para calcular estatísticas de uma subpasta
  const getSubpastaStats = (nfs: any[]) => {
    const total = nfs.length;
    const validadas = nfs.filter(nf => nf.status_processamento === 'validado').length;
    const pendentes = nfs.filter(nf => nf.status_processamento === 'processado').length;
    const erro = nfs.filter(nf => nf.status_processamento === 'erro').length;
    const valorTotal = nfs.reduce((sum, nf) => sum + (nf.valor_total || 0), 0);

    return { total, validadas, pendentes, erro, valorTotal };
  };

  // Função para converter peso para kg e formatar
  const formatPeso = (peso?: number, unidadeItem?: string) => {
    if (!peso) return null;

    // Se a unidade do item for toneladas (to, t, ton), converter para kg
    if (unidadeItem?.toLowerCase() === 'to' ||
        unidadeItem?.toLowerCase() === 't' ||
        unidadeItem?.toLowerCase().includes('ton')) {
      return `${(peso * 1000).toFixed(2)} kg`;
    }

    // Se já for kg ou sem unidade especificada, assumir kg
    return `${peso.toFixed(2)} kg`;
  };

  // Função para converter peso para kg (retorna número para cálculos)
  const convertPesoToKg = (peso?: number, unidadeItem?: string): number => {
    if (!peso) return 0;

    // Se a unidade do item for toneladas (to, t, ton), converter para kg
    if (unidadeItem?.toLowerCase() === 'to' ||
        unidadeItem?.toLowerCase() === 't' ||
        unidadeItem?.toLowerCase().includes('ton')) {
      return peso * 1000;
    }

    // Se já for kg ou sem unidade especificada, assumir kg
    return peso;
  };

  // Função para calcular peso total de uma NF específica
  const calculateNFWeight = (nf: any): number => {
    let nfWeight = 0;

    if (nf.items && Array.isArray(nf.items)) {
      nf.items.forEach((item: any) => {
        if (item.peso_liquido) {
          nfWeight += convertPesoToKg(item.peso_liquido, item.unidade);
        }
      });
    }

    return nfWeight;
  };

  // Função para calcular peso total de todas as NFs
  const calculateTotalWeight = (nfs: any[]): number => {
    let totalWeight = 0;

    nfs.forEach(nf => {
      totalWeight += calculateNFWeight(nf);
    });

    return totalWeight;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-card border-0 shadow-card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas Fiscais do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-muted/30 rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-2 w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !nfData) {
    return (
      <Card className="bg-gradient-card border-0 shadow-card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas Fiscais do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            Erro ao carregar notas fiscais
          </div>
        </CardContent>
      </Card>
    );
  }

  const { contract, summary, nfs } = nfData;
  const nfsGroupedBySubpasta = groupNFsBySubpasta(nfs);
  const totalWeight = calculateTotalWeight(nfs);

  return (
    <div className="space-y-6">
      {/* Contract Summary */}
      <Card className="bg-gradient-card border-0 shadow-card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {contract.nome_projeto}
          </CardTitle>
          <p className="text-muted-foreground">{contract.cliente}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total NFs</p>
              <p className="text-2xl font-bold">{summary.total_nfs}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validadas</p>
              <p className="text-2xl font-bold text-green-600">{summary.nfs_validadas}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Realizado</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.valor_realizado)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peso Total</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalWeight > 0 ? `${totalWeight.toFixed(2)} kg` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">% Realizado</p>
              <p className={`text-2xl font-bold ${summary.percentual_realizado > 100 ? 'text-red-600' : 'text-blue-600'}`}>
                {summary.percentual_realizado?.toFixed(1) || 0}%
              </p>
            </div>
          </div>

          {summary.percentual_realizado > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso Financeiro</span>
                <span>{summary.percentual_realizado?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${summary.percentual_realizado > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(summary.percentual_realizado, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFs List - Grouped by Subpasta */}
      <Card className="bg-gradient-card border-0 shadow-card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas Fiscais por Subpasta ({nfs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nfs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              Nenhuma nota fiscal encontrada para este contrato
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(nfsGroupedBySubpasta).map(([subpasta, subpastaNFs]) => {
                const stats = getSubpastaStats(subpastaNFs);
                const isExpanded = expandedSubpastas.has(subpasta);

                return (
                  <div key={subpasta} className="border rounded-lg bg-muted/10">
                    {/* Subpasta Header */}
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleSubpastaExpansion(subpasta)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover:bg-muted/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                              <div>
                                <h3 className="text-lg font-semibold">{subpasta}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {stats.total} nota{stats.total !== 1 ? 's' : ''} fiscal{stats.total !== 1 ? 'is' : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-lg font-bold">{formatCurrency(stats.valorTotal)}</p>
                                <div className="flex gap-2">
                                  {stats.validadas > 0 && (
                                    <Badge variant="default" className="bg-green-500">
                                      {stats.validadas} validadas
                                    </Badge>
                                  )}
                                  {stats.pendentes > 0 && (
                                    <Badge variant="secondary">
                                      {stats.pendentes} pendentes
                                    </Badge>
                                  )}
                                  {stats.erro > 0 && (
                                    <Badge variant="destructive">
                                      {stats.erro} com erro
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* NFs da Subpasta */}
                      <CollapsibleContent>
                        <Separator />
                        <div className="p-4 space-y-4">
                            {subpastaNFs.map((nf) => (
                              <Collapsible
                                key={nf.id}
                                open={expandedNFs.has(nf.id)}
                                onOpenChange={() => toggleNFExpansion(nf.id)}
                              >
                                <div className="border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                                  {/* NF Header */}
                                  <CollapsibleTrigger asChild>
                                    <div className="p-4 cursor-pointer">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            {expandedNFs.has(nf.id) ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                            <h4 className="font-semibold">
                                              NF {nf.numero}/{nf.serie}
                                            </h4>
                                            {getStatusBadge(nf.status_processamento)}
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                              <Truck className="h-4 w-4" />
                                              <span>{nf.nome_fornecedor || nf.fornecedor}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Calendar className="h-4 w-4" />
                                              <span>{formatDate(nf.data_emissao)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <DollarSign className="h-4 w-4" />
                                              <span className="font-medium">{formatCurrency(nf.valor_total)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Package className="h-4 w-4" />
                                              <span className="font-medium">
                                                {calculateNFWeight(nf) > 0 ? `${calculateNFWeight(nf).toFixed(2)} kg` : 'Sem peso'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline">
                                            {nf.items.length} itens
                                          </Badge>
                                          {nf.status_processamento === 'processado' && (
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                validateNF.mutate(nf.id);
                                              }}
                                              disabled={validateNF.isPending}
                                            >
                                              <CheckCircle className="h-4 w-4 mr-1" />
                                              Validar
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>

                                  {/* NF Details */}
                                  <CollapsibleContent>
                                    <Separator />
                                    <div className="p-4">
                                      {/* NF Info */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                          <h5 className="font-medium mb-3">Informações da NF</h5>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">CNPJ Fornecedor:</span>
                                              <span>{nf.cnpj_fornecedor}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Fornecedor:</span>
                                              <span>{nf.nome_fornecedor || nf.fornecedor}</span>
                                            </div>
                                            {nf.destinatario_nome && (
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Destinatário:</span>
                                                <span>{nf.destinatario_nome}</span>
                                              </div>
                                            )}
                                            {nf.chave_acesso && (
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Chave Acesso:</span>
                                                <span className="font-mono text-xs">{nf.chave_acesso}</span>
                                              </div>
                                            )}
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Pasta:</span>
                                              <span>{nf.pasta_origem}{nf.subpasta ? ` / ${nf.subpasta}` : ''}</span>
                                            </div>
                                            {nf.data_entrada && (
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Data Entrada:</span>
                                                <span>{formatDate(nf.data_entrada)}</span>
                                              </div>
                                            )}
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Criada em:</span>
                                              <span>{formatDate(nf.created_at)}</span>
                                            </div>
                                            {nf.processed_by_n8n_at && (
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Processada em:</span>
                                                <span>{formatDate(nf.processed_by_n8n_at)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div>
                                          <h5 className="font-medium mb-3">Valores</h5>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Produtos:</span>
                                              <span>{formatCurrency(nf.valor_produtos)}</span>
                                            </div>
                                            {nf.valor_impostos && nf.valor_impostos > 0 && (
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Impostos:</span>
                                                <span>{formatCurrency(nf.valor_impostos)}</span>
                                              </div>
                                            )}
                                            {nf.valor_frete && nf.valor_frete > 0 && (
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Frete:</span>
                                                <span>{formatCurrency(nf.valor_frete)}</span>
                                              </div>
                                            )}
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Peso Total:</span>
                                              <span>
                                                {calculateNFWeight(nf) > 0 ? `${calculateNFWeight(nf).toFixed(2)} kg` : 'Sem peso'}
                                              </span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between font-medium">
                                              <span>Total:</span>
                                              <span>{formatCurrency(nf.valor_total)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Items */}
                                      <div>
                                        <h5 className="font-medium mb-3 flex items-center gap-2">
                                          <Package className="h-4 w-4" />
                                          Itens/Produtos ({nf.items.length})
                                        </h5>
                                        <div className="space-y-3">
                                          {nf.items.map((item) => (
                                            <div key={item.id} className="border rounded-lg p-3 bg-background/50">
                                              <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                  <h6 className="font-medium">{item.descricao}</h6>
                                                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    {item.numero_item && (
                                                      <div className="flex items-center gap-1">
                                                        <span>Item:</span>
                                                        <span>{item.numero_item}</span>
                                                      </div>
                                                    )}
                                                    {item.codigo_produto && (
                                                      <div className="flex items-center gap-1">
                                                        <Hash className="h-3 w-3" />
                                                        <span>{item.codigo_produto}</span>
                                                      </div>
                                                    )}
                                                    {item.ncm && (
                                                      <div className="flex items-center gap-1">
                                                        <span>NCM:</span>
                                                        <span>{item.ncm}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                <Badge variant={item.status_integracao === 'integrado' ? 'default' : 'secondary'}>
                                                  {item.status_integracao === 'integrado' ? 'Integrado' : 'Pendente'}
                                                </Badge>
                                              </div>

                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                  <span className="text-muted-foreground">Qtd:</span>
                                                  <p className="font-medium">{item.quantidade} {item.unidade || ''}</p>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Valor Unit.:</span>
                                                  <p className="font-medium">{formatCurrency(item.valor_unitario)}</p>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Total:</span>
                                                  <p className="font-medium">{formatCurrency(item.valor_total)}</p>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Centro Custo:</span>
                                                  <p className="font-medium">{item.centro_custo || 'Não classificado'}</p>
                                                </div>
                                              </div>

                                              {item.peso_liquido && (
                                                <div className="mt-2 pt-2 border-t grid grid-cols-1 gap-4 text-sm">
                                                  <div>
                                                    <span className="text-muted-foreground">Peso:</span>
                                                    <p className="font-medium">{formatPeso(item.peso_liquido, item.unidade)}</p>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {nf.observacoes && (
                                        <div className="mt-6 pt-4 border-t">
                                          <h5 className="font-medium mb-2">Observações</h5>
                                          <p className="text-sm text-muted-foreground">{nf.observacoes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
