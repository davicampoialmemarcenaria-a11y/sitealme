import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../services/supabase";
import "./Fluxo.scss";

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarQuantidade = (valor) =>
  Number(valor ?? 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });

const formatarPercentual = (valor) =>
  `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

/*
=====================================================
PADRONIZAÇÃO DOS CÁLCULOS
=====================================================
*/

// Arredonda valores monetários sempre para cima, em centavos.
// Exemplos: 10,101 -> 10,11; 10,10 -> 10,10.
const arredondarCentavosParaCima = (valor) => {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero)) return 0;

  const margemPrecisao = Number.EPSILON * Math.max(1, Math.abs(numero));
  return Math.ceil((numero - margemPrecisao) * 100) / 100;
};

// Arredondamento monetário convencional para os campos manuais.
const arredondarCentavos = (valor) => {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return 0;
  return Math.round((numero + Number.EPSILON) * 100) / 100;
};

const arredondarCasas = (valor, casas = 2) => {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero)) return 0;

  const fator = 10 ** casas;
  return Math.round((numero + Number.EPSILON) * fator) / fator;
};

const normalizar = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const ehAditivo = (nome) =>
  /\b(ADTO|ADITIVO|ADIT)\b/i.test(String(nome || ""));

const nomeDoItem = (item) =>
  String(item.nome_item || "").trim() || "Item sem nome";


/*
=====================================================
CARREGAR A VERSÃO MAIS RECENTE DO ORÇAMENTO
=====================================================

A tabela do Fluxo não deve ser tratada como cópia definitiva dos itens do
orçamento. Ao editar um fluxo existente, os itens e quantidades são recarregados
da versão mais recente do orçamento. As marcações de progresso são preservadas
quando o mesmo item continua no mesmo ambiente.
*/
async function carregarItensOrcamentoAtual(idOrcamento) {
  const id = String(idOrcamento ?? "").trim();

  if (!id) {
    throw new Error("O fluxo não possui um orçamento vinculado.");
  }

  const { data: versoes, error: erroVersoes } = await supabase
    .from("orcamento_versoes")
    .select("id,orcamento_id,versao,updated_at,created_at")
    .eq("orcamento_id", id)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (erroVersoes) throw erroVersoes;

  const versao = versoes?.[0];
  if (!versao) {
    throw new Error("Não foi encontrada uma versão atual para este orçamento.");
  }

  const [resultadoAmbientes, resultadoItens] = await Promise.all([
    supabase
      .from("orcamento_versao_ambientes")
      .select("id,nome,ordem")
      .eq("versao_id", versao.id)
      .order("ordem", { ascending: true }),
    supabase
      .from("orcamento_itens")
      .select(
        "id,versao_id,ambiente_id,ordem,quantidade,nome_item,valor_memorial_descritivo"
      )
      .eq("versao_id", versao.id)
      .order("ordem", { ascending: true }),
  ]);

  if (resultadoAmbientes.error) throw resultadoAmbientes.error;
  if (resultadoItens.error) throw resultadoItens.error;

  const ambientes = resultadoAmbientes.data || [];
  const itensOrcamento = resultadoItens.data || [];

  if (!itensOrcamento.length) {
    throw new Error("A versão mais recente do orçamento não possui itens.");
  }

  return {
    versao,
    itens: itensOrcamento.map((item) => {
      const ambiente = ambientes.find(
        (a) => String(a.id) === String(item.ambiente_id)
      );

      return {
        item_orcamento_id: item.id,
        ambiente_orcamento_id: item.ambiente_id,
        ambiente_nome: ambiente?.nome || "Ambiente sem nome",
        item_nome: nomeDoItem(item),
        quantidade: Number(item.quantidade ?? 0),
        valor_memorial_descritivo: Number(
          item.valor_memorial_descritivo ?? 0
        ),
        compra_material: false,
        compra_material_parcial: false,
        instalacao: false,
        finalizado: false,
        ordem_ambiente: Number(ambiente?.ordem ?? 0),
        ordem_item: Number(item.ordem ?? 0),
      };
    }),
  };
}

/*
=====================================================
PRESERVAR AS MARCAÇÕES DE PROGRESSO
=====================================================
*/
function mesclarProgressoDosItens(itensAtuaisDoOrcamento, itensSalvosDoFluxo) {
  const salvos = (itensSalvosDoFluxo || []).map((item, indice) => ({
    ...item,
    __indiceOriginal: indice,
  }));
  const usados = new Set();

  return itensAtuaisDoOrcamento.map((itemAtual) => {
    const ambienteAtual = normalizar(itemAtual.ambiente_nome);
    const nomeAtual = normalizar(itemAtual.item_nome);

    // O orçamento pode recriar os IDs internos ao salvar uma nova versão.
    // Por isso, o vínculo para preservar as marcações usa ambiente + nome do item,
    // e não item_orcamento_id, que pode ter mudado.
    const candidatos = salvos.filter((salvo) =>
      !usados.has(salvo.__indiceOriginal) &&
      normalizar(salvo.ambiente_nome) === ambienteAtual &&
      normalizar(salvo.item_nome) === nomeAtual
    );

    candidatos.sort((a, b) =>
      Math.abs(Number(a.ordem_item ?? 0) - Number(itemAtual.ordem_item ?? 0)) -
      Math.abs(Number(b.ordem_item ?? 0) - Number(itemAtual.ordem_item ?? 0))
    );

    const salvo = candidatos[0] || null;
    if (salvo) usados.add(salvo.__indiceOriginal);

    const compraMaterialParcial = Boolean(salvo?.compra_material_parcial);
    const compraMaterialTotal = Boolean(salvo?.compra_material) &&
      !compraMaterialParcial;

    return {
      ...itemAtual,
      compra_material: compraMaterialTotal,
      compra_material_parcial: compraMaterialParcial,
      instalacao: Boolean(salvo?.instalacao),
      finalizado: Boolean(salvo?.finalizado),
    };
  });
}


/*
=====================================================
CÁLCULO DOS ITENS
=====================================================
*/

const calcularItem = (item, totalProjeto) => {
  // O valor individual também é arredondado para cima em centavos.
  const valor = arredondarCentavosParaCima(
    item.valor_memorial_descritivo
  );

  const percentualEntrega =
    (item.compra_material_parcial
      ? 35
      : item.compra_material
        ? 70
        : 0) +
    (item.instalacao ? 20 : 0) +
    (item.finalizado ? 10 : 0);

  const percentualValor =
    totalProjeto > 0 ? (valor / totalProjeto) * 100 : 0;

  // Mantém o percentual exato para os cálculos agregados.
  // A versão arredondada é usada somente na exibição da tabela.
  // Assim, a soma dos itens totalmente concluídos chega a 100%,
  // sem acumular diferenças causadas pelo arredondamento de cada linha.
  const percentualTotalItemExato =
    percentualValor * (percentualEntrega / 100);

  const percentualTotalItem = arredondarCasas(
    percentualTotalItemExato,
    2
  );

  return {
    ...item,
    valor,
    percentualEntrega,
    percentualValor,
    percentualTotalItem,
    percentualTotalItemExato,
  };
};

export default function Fluxo() {
  const [fluxos, setFluxos] = useState([]);
  const [obras, setObras] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);

  // Valores de origem por obra: meta cadastrada em Obras e custo realizado
  // salvo em Extratos unificados. Não são valores editáveis neste fluxo.
  const [metasCustosPorObra, setMetasCustosPorObra] = useState({});
  const [custosRealizadosPorObra, setCustosRealizadosPorObra] = useState({});

  const [itens, setItens] = useState([]);
  const [fluxoSelecionado, setFluxoSelecionado] = useState(null);

  const [obraId, setObraId] = useState("");
  const [orcamentoId, setOrcamentoId] = useState("");
  const [versaoOrcamentoId, setVersaoOrcamentoId] = useState("");
  const [metaCustos, setMetaCustos] = useState("0");
  const [custoDireto, setCustoDireto] = useState("0");

  const [buscaOrcamento, setBuscaOrcamento] = useState("");
  const [orcamentoAberto, setOrcamentoAberto] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [carregandoOrcamento, setCarregandoOrcamento] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Carrega fluxos, obras e orçamentos sem depender de um JOIN automático.
  // Se a leitura direta de obras não trouxer alguma obra vinculada, consulta
  // admin-obras para reconstruir a exibição sem perder o obra_id salvo.
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [
        resultadoFluxos,
        resultadoObras,
        resultadoOrcamentos,
        resultadoExtratos,
        resultadoDadosFinanceiros,
      ] = await Promise.all([
        supabase
          .from("fluxos_fisico_financeiros")
          .select("*")
          .order("updated_at", { ascending: false }),

        supabase
          .from("obras")
          .select(`
            id,
            nome,
            cliente_nome,
            endereco,
            concluida,
            orcamento_id
          `)
          .order("nome", { ascending: true }),

        supabase
          .from("orcamentos")
          .select("id,nome,codigo,status,versao_atual,created_at")
          .order("nome", { ascending: true }),

        // Custo direto: valor efetivamente salvo em Extratos unificados.
        supabase
          .from("extratos_unificados")
          .select("obra_id,custo_realizado,updated_at")
          .order("updated_at", { ascending: false, nullsFirst: false }),

        // Meta de custos: informação financeira cadastrada na tela Obras.
        supabase.functions.invoke("admin-inforfi", {
          body: { action: "list" },
        }),
      ]);

      if (resultadoFluxos.error) throw resultadoFluxos.error;
      if (resultadoOrcamentos.error) throw resultadoOrcamentos.error;
      if (resultadoExtratos.error) {
        throw new Error(
          `Não foi possível consultar Custo realizado em Extratos unificados: ${resultadoExtratos.error.message}`
        );
      }
      if (resultadoDadosFinanceiros.error || resultadoDadosFinanceiros.data?.error) {
        throw new Error(
          `Não foi possível consultar a Meta de custo cadastrada em Obras: ${
            resultadoDadosFinanceiros.data?.error ||
            resultadoDadosFinanceiros.error?.message ||
            "erro não identificado"
          }`
        );
      }

      const fluxosBrutos = resultadoFluxos.data || [];
      let listaObras = resultadoObras.error
        ? []
        : (resultadoObras.data || []);
      const todosOrcamentos = resultadoOrcamentos.data || [];

      // Monta o mapa de metas usando o ID da obra, sem depender do nome.
      const dadosFinanceiros = resultadoDadosFinanceiros.data || {};
      const obrasComFinanceiro = [
        ...(Array.isArray(dadosFinanceiros.obrasAtivas)
          ? dadosFinanceiros.obrasAtivas
          : []),
        ...(Array.isArray(dadosFinanceiros.obrasConcluidas)
          ? dadosFinanceiros.obrasConcluidas
          : []),
      ];
      const mapaMetas = {};
      obrasComFinanceiro.forEach((obraFinanceira) => {
        if (obraFinanceira?.id === null || obraFinanceira?.id === undefined) return;
        const chave = String(obraFinanceira.id);
        const meta = obraFinanceira?.informacaoFinanceira?.meta_custo;
        mapaMetas[chave] = Number(meta ?? 0);
      });
      setMetasCustosPorObra(mapaMetas);

      // Uma linha atual por obra no Extratos unificados. Se houver registros
      // repetidos, conserva o mais recente pela ordenação de updated_at.
      const mapaCustos = {};
      (resultadoExtratos.data || []).forEach((registro) => {
        if (registro?.obra_id === null || registro?.obra_id === undefined) return;
        const chave = String(registro.obra_id);
        if (Object.prototype.hasOwnProperty.call(mapaCustos, chave)) return;
        mapaCustos[chave] = Number(registro.custo_realizado ?? 0);
      });
      setCustosRealizadosPorObra(mapaCustos);

      // IDs de obras que já estão usados por fluxos salvos.
      const idsObrasNecessarias = [
        ...new Set(
          fluxosBrutos
            .map((fluxo) => fluxo.obra_id)
            .filter((id) => id !== null && id !== undefined && String(id).trim() !== "")
            .map(String)
        ),
      ];

      const idsObrasCarregadas = new Set(
        listaObras.map((obra) => String(obra.id))
      );

      const faltamObras = idsObrasNecessarias.some(
        (id) => !idsObrasCarregadas.has(id)
      );

      if (faltamObras || resultadoObras.error) {
        // A tela de Obras já usa essa Edge Function. Tenta recuperar
        // tanto obras ativas quanto concluídas quando o SELECT direto omite algo.
        const resultadosFallback = await Promise.all([
          supabase.functions.invoke("admin-obras", {
            body: { action: "list" },
          }),
          supabase.functions.invoke("admin-obras", {
            body: { action: "list_concluidas" },
          }),
        ]);

        const obrasPorId = new Map(
          listaObras.map((obra) => [String(obra.id), obra])
        );

        resultadosFallback.forEach(({ data, error }) => {
          if (error || data?.error) {
            console.warn(
              "Não foi possível completar a lista de obras via admin-obras:",
              error || data?.error
            );
            return;
          }

          const listaFallback = Array.isArray(data?.obras) ? data.obras : [];
          listaFallback.forEach((obra) => {
            if (obra?.id === null || obra?.id === undefined) return;

            const id = String(obra.id);
            const atual = obrasPorId.get(id) || {};
            obrasPorId.set(id, { ...atual, ...obra });
          });
        });

        listaObras = Array.from(obrasPorId.values()).sort((a, b) =>
          String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
        );
      }

      // Reassocia cada fluxo à obra e ao orçamento usando os IDs persistidos.
      // Se obra_id estiver vazio ou não apontar para uma obra retornada,
      // usa o orcamento_id do fluxo para reencontrar a obra vinculada.
      const fluxosComRelacionamentos = fluxosBrutos.map((fluxo) => {
        const obraPorId = listaObras.find(
          (obra) => fluxo.obra_id !== null && fluxo.obra_id !== undefined &&
            String(obra.id) === String(fluxo.obra_id)
        ) || null;

        const obraPorOrcamento = listaObras.find(
          (obra) => fluxo.orcamento_id &&
            String(obra.orcamento_id ?? "") === String(fluxo.orcamento_id)
        ) || null;

        const obraRelacionada = obraPorId || obraPorOrcamento || null;

        const orcamentoRelacionado = todosOrcamentos.find(
          (orcamento) => String(orcamento.id) === String(fluxo.orcamento_id)
        ) || null;

        const idObraRelacionada =
          obraRelacionada?.id ?? fluxo.obra_id ?? null;
        const chaveObraRelacionada = String(idObraRelacionada ?? "");

        return {
          ...fluxo,
          // Prefere o ID que de fato corresponde à obra recuperada.
          obra_id: obraPorId
            ? fluxo.obra_id
            : (obraRelacionada?.id ?? fluxo.obra_id ?? null),
          // Exibe sempre a informação atual das telas de origem, não o snapshot
          // antigo que eventualmente ficou gravado no fluxo.
          meta_custos: Object.prototype.hasOwnProperty.call(
            mapaMetas,
            chaveObraRelacionada
          )
            ? mapaMetas[chaveObraRelacionada]
            : 0,
          custo_direto: Object.prototype.hasOwnProperty.call(
            mapaCustos,
            chaveObraRelacionada
          )
            ? mapaCustos[chaveObraRelacionada]
            : 0,
          obra: obraRelacionada,
          orcamento: orcamentoRelacionado,
        };
      });

      setFluxos(fluxosComRelacionamentos);
      setObras(listaObras);

      const aprovados = todosOrcamentos.filter(
        (orcamento) =>
          String(orcamento.status || "").toLowerCase() === "aprovado" &&
          !ehAditivo(orcamento.nome)
      );
      setOrcamentos(aprovados);
    } catch (e) {
      setErro(`Não foi possível carregar os dados: ${e.message}`);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const orcamentosFiltrados = useMemo(() => {
    const termo = normalizar(buscaOrcamento);

    return orcamentos.filter((orcamento) => {
      const texto = normalizar(
        `${orcamento.nome || ""} ${orcamento.codigo || ""}`
      );
      return !termo || texto.includes(termo);
    });
  }, [orcamentos, buscaOrcamento]);

  const obrasDisponiveis = useMemo(() => obras, [obras]);

  /*
  =====================================================
  LOCALIZAR OBRA PELO ORÇAMENTO
  =====================================================
  */
  async function buscarObraVinculada(idOrcamento) {
    const id = String(idOrcamento ?? "").trim();
    if (!id) return null;

    const {
      data: obrasEncontradas,
      error: erroConsulta,
    } = await supabase
      .from("obras")
      .select(`
        id,
        nome,
        cliente_nome,
        endereco,
        concluida,
        orcamento_id
      `)
      .eq("orcamento_id", id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!erroConsulta && obrasEncontradas?.length) {
      return obrasEncontradas[0];
    }

    const { data: resposta, error: erroFuncao } =
      await supabase.functions.invoke("admin-obras", {
        body: { action: "list" },
      });

    if (erroFuncao) {
      throw new Error(
        `Não foi possível localizar a obra. Consulta direta: ${
          erroConsulta?.message || "nenhum registro encontrado"
        }. Consulta admin-obras: ${erroFuncao.message}`
      );
    }

    if (resposta?.error) throw new Error(resposta.error);

    const listaObras = Array.isArray(resposta?.obras)
      ? resposta.obras
      : [];

    return (
      listaObras.find(
        (obra) => String(obra.orcamento_id ?? "").trim() === id
      ) || null
    );
  }

  async function buscarObraPorId(idObra, idOrcamento) {
    const id = String(idObra ?? "").trim();

    if (id) {
      const { data, error } = await supabase
        .from("obras")
        .select("id,nome,cliente_nome,endereco,concluida,orcamento_id")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) return data;
    }

    if (idOrcamento) {
      const porOrcamento = await buscarObraVinculada(idOrcamento);
      if (porOrcamento) return porOrcamento;
    }

    // Inclui obras concluídas e contorna limites de leitura direta.
    const respostas = await Promise.all([
      supabase.functions.invoke("admin-obras", {
        body: { action: "list" },
      }),
      supabase.functions.invoke("admin-obras", {
        body: { action: "list_concluidas" },
      }),
    ]);

    for (const { data, error } of respostas) {
      if (error || data?.error) continue;
      const lista = Array.isArray(data?.obras) ? data.obras : [];
      const encontrada = lista.find((obra) => String(obra.id) === id);
      if (encontrada) return encontrada;
    }

    return null;
  }

  const obraSelecionada = useMemo(
    () =>
      obras.find((obra) => String(obra.id) === String(obraId)) ||
      (fluxoSelecionado?.obra &&
      String(fluxoSelecionado.obra.id) === String(obraId)
        ? fluxoSelecionado.obra
        : null),
    [obras, obraId, fluxoSelecionado]
  );

  /*
  =====================================================
  CÁLCULOS DO PAINEL
  =====================================================
  */

  // Soma o valor de cada item depois de arredondá-lo para cima
  // em centavos. A soma em centavos inteiros evita erros de ponto flutuante.
  const totalProjeto = useMemo(() => {
    const totalCentavos = itens.reduce((total, item) => {
      const valorArredondado = arredondarCentavosParaCima(
        item.valor_memorial_descritivo
      );
      return total + Math.round(valorArredondado * 100);
    }, 0);

    return totalCentavos / 100;
  }, [itens]);

  const itensCalculados = useMemo(
    () => itens.map((item) => calcularItem(item, totalProjeto)),
    [itens, totalProjeto]
  );

  // Soma os percentuais reais de todos os itens e arredonda o resultado
  // somente no final. Isso evita acumular erro ao arredondar cada linha.
  // Exemplo: se todas as etapas estiverem concluídas, o total fica em 100,00%.
  const percentualAndamento = arredondarCasas(
    itensCalculados.reduce(
      (total, item) =>
        total + Number(
          item.percentualTotalItemExato ?? item.percentualTotalItem ?? 0
        ),
      0
    ),
    2
  );

  // Limita apenas a largura visual da barra ao intervalo de 0% a 100%.
  // O indicador numérico continua mostrando o percentual calculado.
  const percentualBarra = Math.min(100, Math.max(0, percentualAndamento));

  const metaNumerica = arredondarCentavos(metaCustos);
  const custoDiretoNumerico = arredondarCentavos(custoDireto);

  // Relação do custo direto em percentual:
  // Custo direto / Meta * 100.
  // Exemplo: R$ 67.000 / R$ 68.838,74 = 97,33% da meta.
  const relacaoCustoPercentual =
    metaNumerica > 0
      ? arredondarCasas(
          (custoDiretoNumerico / metaNumerica) * 100,
          2
        )
      : 0;

  // Diferença entre fluxo realizado e custo realizado, ambos em percentual.
  // Usa o andamento calculado sem arredondar cada item individualmente.
  const diferencaPercentual = arredondarCasas(
    percentualAndamento - relacaoCustoPercentual,
    2
  );

  const sincronizarValoresFinanceirosDaObra = (id) => {
    const chave = String(id ?? "");
    setMetaCustos(String(metasCustosPorObra[chave] ?? 0));
    setCustoDireto(String(custosRealizadosPorObra[chave] ?? 0));
  };

  const abrirNovo = () => {
    setFluxoSelecionado(null);
    setObraId("");
    setOrcamentoId("");
    setVersaoOrcamentoId("");
    setMetaCustos("0");
    setCustoDireto("0");
    setBuscaOrcamento("");
    setOrcamentoAberto(false);
    setItens([]);
    setErro("");
    setSucesso("");
    setMostrarFormulario(true);
  };

  const abrirEdicao = async (fluxo) => {
    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const { data: itensSalvosDoFluxo, error: erroItensSalvos } = await supabase
        .from("fluxos_fisico_financeiros_itens")
        .select("*")
        .eq("fluxo_id", fluxo.id)
        .order("ordem_ambiente", { ascending: true })
        .order("ordem_item", { ascending: true });

      if (erroItensSalvos) throw erroItensSalvos;

      // Sempre busca os itens da versão atual do orçamento. Assim, se a
      // quantidade ou o valor mudou depois que o fluxo foi criado, não usamos
      // a cópia antiga guardada em fluxos_fisico_financeiros_itens.
      let versaoOrcamentoAtual = null;
      let itensParaEditar = (itensSalvosDoFluxo || []).map((item) => ({
        ...item,
        quantidade: Number(item.quantidade ?? 1),
        compra_material: Boolean(item.compra_material),
        compra_material_parcial: Boolean(item.compra_material_parcial),
        instalacao: Boolean(item.instalacao),
        finalizado: Boolean(item.finalizado),
      }));

      if (fluxo.orcamento_id ?? fluxo.orcamento?.id) {
        const dadosOrcamentoAtual = await carregarItensOrcamentoAtual(
          fluxo.orcamento_id ?? fluxo.orcamento?.id
        );
        versaoOrcamentoAtual = dadosOrcamentoAtual.versao;
        itensParaEditar = mesclarProgressoDosItens(
          dadosOrcamentoAtual.itens,
          itensSalvosDoFluxo || []
        );
      }

      // Recupera a obra associada, mesmo que ela não esteja na lista local.
      let obraDaEdicao =
        obras.find((obra) => String(obra.id) === String(fluxo.obra_id)) ||
        fluxo.obra ||
        null;

      if (!obraDaEdicao) {
        try {
          obraDaEdicao = await buscarObraPorId(
            fluxo.obra_id,
            fluxo.orcamento_id
          );
        } catch (erroBuscaObra) {
          console.warn(
            "Não foi possível recarregar a obra ao editar o fluxo:",
            erroBuscaObra
          );
        }
      }

      if (obraDaEdicao?.id !== null && obraDaEdicao?.id !== undefined) {
        setObras((obrasAtuais) => {
          const semDuplicada = obrasAtuais.filter(
            (obra) => String(obra.id) !== String(obraDaEdicao.id)
          );
          return [...semDuplicada, obraDaEdicao];
        });
      }

      const idObraSalvo = obraDaEdicao?.id ?? fluxo.obra_id ?? "";
      const versaoIdAtual = versaoOrcamentoAtual?.id ?? fluxo.versao_orcamento_id ?? "";

      setFluxoSelecionado({
        ...fluxo,
        versao_orcamento_id: versaoIdAtual,
        obra: obraDaEdicao || fluxo.obra || null,
      });
      setObraId(idObraSalvo !== "" ? String(idObraSalvo) : "");
      setOrcamentoId(String(fluxo.orcamento_id ?? fluxo.orcamento?.id ?? ""));
      setVersaoOrcamentoId(String(versaoIdAtual));
      sincronizarValoresFinanceirosDaObra(idObraSalvo);
      setBuscaOrcamento(
        fluxo.orcamento?.nome ||
        orcamentos.find(
          (orcamento) => String(orcamento.id) === String(fluxo.orcamento_id)
        )?.nome ||
        ""
      );
      setOrcamentoAberto(false);
      setItens(itensParaEditar);
      setMostrarFormulario(true);
    } catch (e) {
      console.error("ERRO AO ABRIR FLUXO:", e);
      setErro(
        `Não foi possível abrir o fluxo com a versão atual do orçamento: ${e.message}`
      );
    } finally {
      setCarregando(false);
    }
  };

  /*
  =====================================================
  SELECIONAR ORÇAMENTO E LOCALIZAR OBRA VINCULADA
  =====================================================
  */
  const selecionarOrcamento = async (orcamento) => {
    setErro("");
    setSucesso("");
    setOrcamentoAberto(false);
    setBuscaOrcamento(orcamento.nome);
    setOrcamentoId(String(orcamento.id));
    setVersaoOrcamentoId("");
    setObraId("");
    setItens([]);
    setCarregandoOrcamento(true);

    try {
      const obraVinculada = await buscarObraVinculada(orcamento.id);

      if (!obraVinculada) {
        throw new Error(
          "O orçamento foi encontrado, mas a obra vinculada não foi retornada. " +
            "Verifique a leitura de obras.orcamento_id e a resposta de admin-obras."
        );
      }

      console.log("OBRA ENCONTRADA PARA O ORÇAMENTO:", {
        obra_id: obraVinculada.id,
        obra_nome: obraVinculada.nome,
        orcamento_id: obraVinculada.orcamento_id,
        orcamento_selecionado: orcamento.id,
      });

      setObraId(String(obraVinculada.id));
      sincronizarValoresFinanceirosDaObra(obraVinculada.id);
      setObras((obrasAtuais) => {
        const semDuplicada = obrasAtuais.filter(
          (obra) => String(obra.id) !== String(obraVinculada.id)
        );
        return [...semDuplicada, obraVinculada];
      });

      const dadosOrcamentoAtual = await carregarItensOrcamentoAtual(orcamento.id);
      setVersaoOrcamentoId(String(dadosOrcamentoAtual.versao.id));
      setItens(dadosOrcamentoAtual.itens);
    } catch (e) {
      console.error("ERRO AO SELECIONAR ORÇAMENTO:", e);
      setErro(`Não foi possível importar o orçamento: ${e.message}`);
      setObraId("");
      setOrcamentoId("");
      setVersaoOrcamentoId("");
      setMetaCustos("0");
      setCustoDireto("0");
      setItens([]);
    } finally {
      setCarregandoOrcamento(false);
    }
  };

  const atualizarItem = (indice, campo, valor) => {
    setItens((anteriores) =>
      anteriores.map((item, i) =>
        i === indice ? { ...item, [campo]: valor } : item
      )
    );
  };

  // Compra parcial (35%) e compra total (70%) são opções exclusivas.
  const atualizarCompraMaterial = (indice, campo, marcado) => {
    setItens((anteriores) =>
      anteriores.map((item, i) => {
        if (i !== indice) return item;

        if (campo === "compra_material_parcial") {
          return {
            ...item,
            compra_material_parcial: marcado,
            compra_material: marcado ? false : item.compra_material,
          };
        }

        return {
          ...item,
          compra_material: marcado,
          compra_material_parcial: marcado
            ? false
            : item.compra_material_parcial,
        };
      })
    );
  };

  const salvarFluxo = async (event) => {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (carregandoOrcamento) {
      setErro("Aguarde a importação do orçamento terminar.");
      return;
    }

    if (!orcamentoId || !versaoOrcamentoId) {
      setErro("Pesquise e selecione um orçamento aprovado.");
      return;
    }

    if (!obraId) {
      setErro(
        "Não foi possível identificar a obra deste orçamento. " +
          "Verifique o vínculo obras.orcamento_id."
      );
      return;
    }

    // Confere a obra no estado local atualizado durante a seleção.
    const obraVinculada = obras.find(
      (obra) =>
        String(obra.id) === String(obraId) &&
        String(obra.orcamento_id) === String(orcamentoId)
    );

    if (!obraVinculada) {
      setErro(
        "A obra selecionada não corresponde ao orçamento. " +
          "Selecione novamente o orçamento vinculado à obra."
      );
      return;
    }

    if (!itens.length) {
      setErro("O orçamento selecionado não possui itens importados.");
      return;
    }

    const chaveObraFinanceira = String(obraId);
    const metaInformada = Number(
      metasCustosPorObra[chaveObraFinanceira] ?? 0
    );
    const custoDiretoInformado = Number(
      custosRealizadosPorObra[chaveObraFinanceira] ?? 0
    );

    if (!Number.isFinite(metaInformada) || metaInformada < 0) {
      setErro("Informe uma meta válida, igual ou maior que zero.");
      return;
    }

    if (
      !Number.isFinite(custoDiretoInformado) ||
      custoDiretoInformado < 0
    ) {
      setErro("Informe um custo direto válido, igual ou maior que zero.");
      return;
    }

    setSalvando(true);

    try {
      let fluxoId = fluxoSelecionado?.id;

      const dadosFluxo = {
        obra_id: Number(obraId),
        orcamento_id: orcamentoId,
        versao_orcamento_id: versaoOrcamentoId,
        meta_custos: arredondarCentavos(metaInformada),
        custo_direto: arredondarCentavos(custoDiretoInformado),
      };

      if (fluxoSelecionado) {
        const { data, error } = await supabase
          .from("fluxos_fisico_financeiros")
          .update(dadosFluxo)
          .eq("id", fluxoSelecionado.id)
          .select("id,obra_id,orcamento_id")
          .single();

        if (error) throw error;

        if (!data || String(data.obra_id) !== String(obraId)) {
          throw new Error(
            `O fluxo foi atualizado, mas o vínculo não foi confirmado. ` +
            `obra_id retornado: ${data?.obra_id ?? "vazio"}; obra selecionada: ${obraId}.`
          );
        }
      } else {
        const { data, error } = await supabase
          .from("fluxos_fisico_financeiros")
          .insert(dadosFluxo)
          .select("id,obra_id,orcamento_id")
          .single();

        if (error) throw error;

        if (!data || String(data.obra_id) !== String(obraId)) {
          throw new Error(
            `O fluxo foi criado, mas o vínculo não foi confirmado. ` +
            `obra_id retornado: ${data?.obra_id ?? "vazio"}; obra selecionada: ${obraId}.`
          );
        }

        fluxoId = data.id;
      }

      const { error: erroExcluir } = await supabase
        .from("fluxos_fisico_financeiros_itens")
        .delete()
        .eq("fluxo_id", fluxoId);

      if (erroExcluir) throw erroExcluir;

      const itensParaSalvar = itens.map((item) => ({
        fluxo_id: fluxoId,
        item_orcamento_id: item.item_orcamento_id || null,
        ambiente_orcamento_id: item.ambiente_orcamento_id || null,
        ambiente_nome: item.ambiente_nome || "Ambiente",
        item_nome: item.item_nome || "Item sem nome",
        quantidade: Number(item.quantidade ?? 0),
        valor_memorial_descritivo: arredondarCentavosParaCima(
          item.valor_memorial_descritivo
        ),
        compra_material: Boolean(item.compra_material) &&
          !Boolean(item.compra_material_parcial),
        compra_material_parcial: Boolean(item.compra_material_parcial),
        instalacao: Boolean(item.instalacao),
        finalizado: Boolean(item.finalizado),
        ordem_ambiente: Number(item.ordem_ambiente || 0),
        ordem_item: Number(item.ordem_item || 0),
      }));

      const { error: erroInserir } = await supabase
        .from("fluxos_fisico_financeiros_itens")
        .insert(itensParaSalvar);

      if (erroInserir) throw erroInserir;

      setSucesso("Fluxo salvo com sucesso.");
      setMostrarFormulario(false);
      setFluxoSelecionado(null);
      await carregarDados();
    } catch (e) {
      setErro(
        `Não foi possível salvar o fluxo: ${e.message} ` +
          "Confira os dados e as permissões do Supabase."
      );
    } finally {
      setSalvando(false);
    }
  };

  const excluirFluxo = async (fluxo) => {
    const confirmar = window.confirm(
      `Deseja excluir o fluxo da obra "${fluxo.obra?.nome || fluxo.obra_id}"? ` +
        "Os itens e as marcações desse fluxo também serão excluídos."
    );

    if (!confirmar) return;

    setErro("");
    setSucesso("");

    const { error } = await supabase
      .from("fluxos_fisico_financeiros")
      .delete()
      .eq("id", fluxo.id);

    if (error) {
      setErro(`Não foi possível excluir o fluxo: ${error.message}`);
      return;
    }

    setSucesso("Fluxo excluído.");
    await carregarDados();
  };

  const fecharFormulario = () => {
    if (salvando || carregandoOrcamento) return;
    setMostrarFormulario(false);
    setFluxoSelecionado(null);
    setOrcamentoAberto(false);
  };

  const itensAgrupados = useMemo(() => {
    const grupos = new Map();

    itensCalculados.forEach((item, indice) => {
      const chave =
        item.ambiente_orcamento_id ??
        item.ambiente_nome ??
        `ambiente-${indice}`;

      if (!grupos.has(chave)) {
        grupos.set(chave, {
          nome: item.ambiente_nome || "Ambiente sem nome",
          itens: [],
        });
      }

      grupos.get(chave).itens.push({ ...item, indice });
    });

    return Array.from(grupos.values());
  }, [itensCalculados]);

  if (carregando && !mostrarFormulario) {
    return (
      <div className="fluxo-page">
        <p className="fluxo-status">Carregando fluxo físico-financeiro...</p>
      </div>
    );
  }

  return (
    <main className="fluxo-page">
      <header className="fluxo-header">
        <div>
          <span className="fluxo-eyebrow">PRODUÇÃO</span>
          <h1>Fluxo Físico-Financeiro</h1>
          <p>
            Acompanhe o avanço das entregas e o custo direto realizado de cada obra.
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            type="button"
            className="fluxo-button fluxo-button-primary"
            onClick={abrirNovo}
          >
            + Novo fluxo
          </button>
        )}
      </header>

      {erro && (
        <div className="fluxo-alert fluxo-alert-error" role="alert">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="fluxo-alert fluxo-alert-success" role="status">
          {sucesso}
        </div>
      )}

      {mostrarFormulario ? (
        <form className="fluxo-form" onSubmit={salvarFluxo}>
          <div className="fluxo-section-heading">
            <div>
              <h2>{fluxoSelecionado ? "Editar fluxo" : "Novo fluxo"}</h2>
              <p>
                Selecione o orçamento para localizar automaticamente a obra vinculada.
              </p>
            </div>

            <button
              type="button"
              className="fluxo-button fluxo-button-secondary"
              onClick={fecharFormulario}
              disabled={salvando || carregandoOrcamento}
            >
              Voltar
            </button>
          </div>

          <div className="fluxo-form-grid">
            <div className="fluxo-field fluxo-budget-search">
              <label htmlFor="fluxo-busca-orcamento">
                Orçamento principal aprovado *
              </label>

              <input
                id="fluxo-busca-orcamento"
                type="search"
                value={buscaOrcamento}
                onChange={(e) => {
                  const valor = e.target.value;
                  setBuscaOrcamento(valor);
                  setOrcamentoAberto(true);

                  // Ao alterar a pesquisa, exige selecionar novamente o orçamento.
                  if (
                    normalizar(valor) !==
                    normalizar(
                      orcamentos.find(
                        (o) => String(o.id) === String(orcamentoId)
                      )?.nome
                    )
                  ) {
                    setOrcamentoId("");
                    setVersaoOrcamentoId("");
                    setObraId("");
                    setMetaCustos("0");
                    setCustoDireto("0");
                    setItens([]);
                  }
                }}
                onFocus={() => setOrcamentoAberto(true)}
                placeholder="Pesquise por nome ou código..."
                autoComplete="off"
                required
                aria-expanded={orcamentoAberto}
                aria-controls="fluxo-resultados-orcamento"
              />

              {orcamentoAberto && (
                <div
                  className="fluxo-budget-results"
                  id="fluxo-resultados-orcamento"
                  role="listbox"
                >
                  {orcamentosFiltrados.length ? (
                    orcamentosFiltrados.map((orcamento) => (
                      <button
                        type="button"
                        key={orcamento.id}
                        className="fluxo-budget-option"
                        role="option"
                        aria-selected={
                          String(orcamentoId) === String(orcamento.id)
                        }
                        onClick={() => selecionarOrcamento(orcamento)}
                        disabled={carregandoOrcamento}
                      >
                        <strong>{orcamento.nome}</strong>
                        <small>
                          {orcamento.codigo || "Sem código"} · Aprovado
                        </small>
                      </button>
                    ))
                  ) : (
                    <p className="fluxo-empty">
                      Nenhum orçamento principal aprovado encontrado.
                    </p>
                  )}

                  <button
                    type="button"
                    className="fluxo-budget-close"
                    onClick={() => setOrcamentoAberto(false)}
                  >
                    Fechar resultados
                  </button>
                </div>
              )}

              {carregandoOrcamento && (
                <small className="fluxo-field-help">
                  Localizando a obra e importando os itens...
                </small>
              )}

              {orcamentoId && versaoOrcamentoId && !carregandoOrcamento && (
                <small className="fluxo-field-help">
                  Versão selecionada pela atualização mais recente.
                </small>
              )}
            </div>

            <label className="fluxo-field">
              <span>Obra vinculada *</span>
              <select
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                required
                disabled
              >
                <option value="">
                  {carregandoOrcamento
                    ? "Carregando obra vinculada..."
                    : orcamentoId
                      ? "Não foi possível recuperar a obra vinculada"
                      : "Selecione primeiro um orçamento"}
                </option>
                {obraId &&
                  !obrasDisponiveis.some(
                    (obra) => String(obra.id) === String(obraId)
                  ) && (
                    <option value={String(obraId)}>
                      {fluxoSelecionado?.obra?.nome
                        ? `${fluxoSelecionado.obra.nome} (vínculo salvo)`
                        : `Obra #${obraId} (ID vinculado ao fluxo)`}
                    </option>
                  )}
                {obrasDisponiveis.map((obra) => (
                  <option key={obra.id} value={String(obra.id)}>
                    {obra.nome}
                    {obra.cliente_nome ? ` — ${obra.cliente_nome}` : ""}
                  </option>
                ))}
              </select>

              {obraSelecionada && (
                <small className="fluxo-field-help">
                  Obra identificada automaticamente pelo vínculo com o orçamento.
                </small>
              )}
            </label>

            <label className="fluxo-field">
              <span>Meta (R$) *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={metaCustos}
                readOnly
                required
                title="Valor carregado automaticamente de Obras → Meta de custo."
              />
            </label>

            <label className="fluxo-field">
              <span>Custo direto (R$) *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={custoDireto}
                readOnly
                required
                title="Valor carregado automaticamente de Extratos unificados → Custo realizado."
              />
            </label>
          </div>

          <section className="fluxo-dashboard">
            <div className="fluxo-metric">
              <span>Meta</span>
              <strong>{formatarMoeda(metaNumerica)}</strong>
            </div>

            <div className="fluxo-metric">
              <span>% de andamento</span>
              <strong>{formatarPercentual(percentualAndamento)}</strong>
            </div>

            <div className="fluxo-metric">
              <span>Custo direto</span>
              <strong>{formatarMoeda(custoDiretoNumerico)}</strong>
            </div>

            <div className="fluxo-metric">
              <span>Relação do custo direto (%)</span>
              <strong>{formatarPercentual(relacaoCustoPercentual)}</strong>
            </div>

            <div className="fluxo-metric">
              <span>Diferença fluxo realizado − custo (%)</span>
              <strong>{formatarPercentual(diferencaPercentual)}</strong>
            </div>

            <div className="fluxo-metric">
              <span>Valor total do projeto</span>
              <strong>{formatarMoeda(totalProjeto)}</strong>
            </div>
          </section>

          {/* =================================================
              BARRA DE PROGRESSO FÍSICO-FINANCEIRO
          ================================================= */}
          <section className="fluxo-progress-card" aria-label="Progresso da obra">
            <div className="fluxo-progress-top">
              <div className="fluxo-progress-heading">
                <span className="fluxo-progress-eyebrow">ACOMPANHAMENTO DA OBRA</span>
                <h3>Progresso físico-financeiro</h3>
                <p>Avanço calculado com base nas etapas realizadas em cada item.</p>
              </div>

              <div className="fluxo-progress-percentage">
                <strong>{formatarPercentual(percentualAndamento)}</strong>
                <span>do projeto concluído</span>
              </div>
            </div>

            <div
              className="fluxo-progress-track"
              role="progressbar"
              aria-label="Percentual de andamento da obra"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentualBarra}
              aria-valuetext={formatarPercentual(percentualAndamento)}
            >
              <div
                className="fluxo-progress-fill"
                style={{ width: `${percentualBarra}%` }}
              />
            </div>

            <div className="fluxo-progress-footer">
              <span>0%</span>
              <span>
                {percentualBarra >= 100
                  ? "Todas as etapas concluídas"
                  : "Andamento das etapas da obra"}
              </span>
              <span>100%</span>
            </div>
          </section>

          <div className="fluxo-section-heading fluxo-items-heading">
            <div>
              <h2>Itens por ambiente</h2>
              <p>
                O percentual total por item considera sua participação no valor total
                do projeto e as etapas concluídas (compra parcial de material 35% ou
                compra total de material 70%, instalação 20% e finalização 10%).
              </p>
            </div>
            <span className="fluxo-item-count">
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </span>
          </div>

          {!itens.length ? (
            <div className="fluxo-empty-panel">
              Selecione um orçamento para importar seus ambientes e itens.
            </div>
          ) : (
            <div className="fluxo-environments">
              {itensAgrupados.map((grupo, indiceGrupo) => (
                <section
                  className="fluxo-environment"
                  key={`${String(grupo.nome)}-${indiceGrupo}`}
                >
                  <h3>{grupo.nome}</h3>

                  <div className="fluxo-table-wrapper">
                    <table className="fluxo-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantidade</th>
                          <th>Valor memorial</th>
                          <th>% valor do item</th>
                          <th>Compra parcial de material (35%)</th>
                          <th>Compra total de material (70%)</th>
                          <th>Instalação (20%)</th>
                          <th>Finalizado (10%)</th>
                          <th>% entrega</th>
                          <th>% total por item</th>
                        </tr>
                      </thead>

                      <tbody>
                        {grupo.itens.map((item) => (
                          <tr
                            key={
                              item.id ||
                              item.item_orcamento_id ||
                              `${item.indice}-${item.item_nome}`
                            }
                          >
                            <td>
                              <strong>{item.item_nome}</strong>
                            </td>

                            <td>{formatarQuantidade(item.quantidade)}</td>

                            <td>
                              <input
                                className="fluxo-money-input"
                                type="text"
                                aria-label={`Valor memorial de ${item.item_nome}`}
                                value={formatarMoeda(item.valor)}
                                readOnly
                                title="Valor memorial importado do orçamento; campo bloqueado para edição."
                              />
                            </td>

                            <td>{formatarPercentual(item.percentualValor)}</td>

                            <td>
                              <label className="fluxo-check">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.compra_material_parcial)}
                                  onChange={(e) =>
                                    atualizarCompraMaterial(
                                      item.indice,
                                      "compra_material_parcial",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span>35%</span>
                              </label>
                            </td>

                            <td>
                              <label className="fluxo-check">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.compra_material)}
                                  onChange={(e) =>
                                    atualizarCompraMaterial(
                                      item.indice,
                                      "compra_material",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span>70%</span>
                              </label>
                            </td>

                            <td>
                              <label className="fluxo-check">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.instalacao)}
                                  onChange={(e) =>
                                    atualizarItem(
                                      item.indice,
                                      "instalacao",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span>20%</span>
                              </label>
                            </td>

                            <td>
                              <label className="fluxo-check">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.finalizado)}
                                  onChange={(e) =>
                                    atualizarItem(
                                      item.indice,
                                      "finalizado",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span>10%</span>
                              </label>
                            </td>

                            <td>
                              <strong>{formatarPercentual(item.percentualEntrega)}</strong>
                            </td>

                            <td>
                              <strong>
                                {formatarPercentual(item.percentualTotalItem)}
                              </strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="fluxo-form-footer">
            <button
              type="button"
              className="fluxo-button fluxo-button-secondary"
              onClick={fecharFormulario}
              disabled={salvando || carregandoOrcamento}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="fluxo-button fluxo-button-primary"
              disabled={salvando || carregandoOrcamento}
            >
              {salvando
                ? "Salvando..."
                : carregandoOrcamento
                  ? "Importando orçamento..."
                  : "Salvar fluxo"}
            </button>
          </div>
        </form>
      ) : (
        <section className="fluxo-list-section">
          <div className="fluxo-section-heading">
            <div>
              <h2>Fluxos cadastrados</h2>
              <p>Abra um fluxo para editar valores e etapas de entrega.</p>
            </div>

            <span className="fluxo-item-count">
              {fluxos.length} {fluxos.length === 1 ? "fluxo" : "fluxos"}
            </span>
          </div>

          {!fluxos.length ? (
            <div className="fluxo-empty-panel">
              Nenhum fluxo cadastrado. Clique em “Novo fluxo” para começar.
            </div>
          ) : (
            <div className="fluxo-list">
              {fluxos.map((fluxo) => {
                // Proteção adicional de exibição: busca a obra pelo obra_id
                // caso o objeto relacionado não tenha vindo no registro do fluxo.
                const obraRelacionada =
                  fluxo.obra ||
                  obras.find(
                    (obra) => String(obra.id) === String(fluxo.obra_id)
                  ) ||
                  null;

                const orcamentoRelacionado =
                  fluxo.orcamento ||
                  orcamentos.find(
                    (orcamento) => String(orcamento.id) === String(fluxo.orcamento_id)
                  ) ||
                  null;

                const obraNome =
                  obraRelacionada?.nome || `Obra #${fluxo.obra_id}`;

                return (
                  <article className="fluxo-list-card" key={fluxo.id}>
                    <div className="fluxo-list-main">
                      <span className="fluxo-eyebrow">FLUXO #{fluxo.id}</span>
                      <h3>{obraNome}</h3>
                      <p>{obraRelacionada?.cliente_nome || "Cliente não informado"}</p>
                      <small>
                        Orçamento: {orcamentoRelacionado?.nome || "Não identificado"}
                      </small>
                    </div>

                    <div className="fluxo-list-meta">
                      <span>Meta</span>
                      <strong>{formatarMoeda(fluxo.meta_custos)}</strong>
                    </div>

                    <div className="fluxo-list-meta">
                      <span>Custo direto</span>
                      <strong>{formatarMoeda(fluxo.custo_direto)}</strong>
                    </div>

                    <div className="fluxo-list-actions">
                      <button
                        type="button"
                        className="fluxo-button fluxo-button-secondary"
                        onClick={() => abrirEdicao(fluxo)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="fluxo-button fluxo-button-danger"
                        onClick={() => excluirFluxo(fluxo)}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
