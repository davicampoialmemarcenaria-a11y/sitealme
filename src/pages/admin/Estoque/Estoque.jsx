import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

import { supabase } from "../../../services/supabase";

import "./Estoque.scss";

import {
  listarProdutos,
  listarEntradas,
  listarSaidas,
  listarUltimasSaidas,
  criarProduto,
  editarProduto,
  excluirProduto,
  criarEntrada,
  editarEntrada,
  excluirEntrada,
  criarSaida,
  editarSaidaItem,
  excluirSaida,
} from "./services/estoqueService";

const ESTOQUE_DRAFT_KEYS = {
  produto: "alme-estoque-form-produto",
  entrada: "alme-estoque-form-entrada",
  saida: "alme-estoque-form-saida",
  devolucao: "alme-estoque-form-devolucao",
};

const formProdutoInicial = {
  nome: "",
  sku: "",
  codigoAlme: "",
  valorUnitario: "",
  preco: "",
};

const formEntradaInicial = {
  produtoId: "",
  obraId: "",
  nfEntrada: "",
  nomeItem: "",
  sku: "",
  codigoAlme: "",
  quantidade: "",
  valorUnitario: "",
  valorTotal: "",
  valorUnitarioFinal: "",
  preco: "",
};

const formSaidaInicial = {
  produtoId: "",
  obraId: "",
  quantidade: "",
  solicitante: "",
};

const formDevolucaoInicial = {
  obraId: "",
  saidaItemId: "",
  saidaId: "",
  produtoId: "",
  itemNome: "",
  sku: "",
  quantidadeRetirada: "",
  quantidadeJaDevolvida: "",
  quantidadeDisponivel: "",
  solicitante: "",
  valorRetirada: "",
  precoUnitario: "",
  quantidadeDevolvida: "",
  valorDevolvido: "",
};

function lerRascunhoEstoque(chave, inicial) {
  if (typeof window === "undefined") {
    return { ...inicial };
  }

  try {
    const salvo = window.sessionStorage.getItem(chave);

    if (!salvo) {
      return { ...inicial };
    }

    const parsed = JSON.parse(salvo);

    if (!parsed || typeof parsed !== "object") {
      return { ...inicial };
    }

    return {
      ...inicial,
      ...parsed,
    };
  } catch (error) {
    console.warn(
      "Não foi possível recuperar o rascunho do estoque:",
      error
    );

    return { ...inicial };
  }
}

function salvarRascunhoEstoque(chave, formulario) {
  if (typeof window === "undefined") return;

  try {
    const temConteudo = Object.values(formulario || {}).some(
      (valor) =>
        valor !== null &&
        valor !== undefined &&
        String(valor).trim() !== ""
    );

    if (!temConteudo) {
      window.sessionStorage.removeItem(chave);
      return;
    }

    window.sessionStorage.setItem(
      chave,
      JSON.stringify(formulario)
    );
  } catch (error) {
    console.warn(
      "Não foi possível salvar o rascunho do estoque:",
      error
    );
  }
}

function limparRascunhoEstoque(chave) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(chave);
  } catch (error) {
    console.warn(
      "Não foi possível limpar o rascunho do estoque:",
      error
    );
  }
}

function calcularValorDevolucao({
  quantidadeRetirada,
  valorRetirada,
  quantidadeDevolvida,
}) {
  const retirada = Number(quantidadeRetirada || 0);
  const valor = Number(valorRetirada || 0);
  const devolvida = Number(quantidadeDevolvida || 0);

  if (
    !Number.isFinite(retirada) ||
    retirada <= 0 ||
    !Number.isFinite(valor) ||
    valor < 0 ||
    !Number.isFinite(devolvida) ||
    devolvida <= 0
  ) {
    return 0;
  }

  const calculado = (devolvida / retirada) * valor;

  return Math.round(
    (calculado + Number.EPSILON) * 100
  ) / 100;
}

export default function Estoque() {
  // =====================================================
  // ABA ATUAL
  // =====================================================

  const [aba, setAba] = useState("resumo");

  // =====================================================
  // FILTRO
  // =====================================================

  const [filtroProduto, setFiltroProduto] = useState("");

  // =====================================================
  // DADOS
  // =====================================================

  const [produtos, setProdutos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [ultimasSaidas, setUltimasSaidas] = useState([]);

  // Obras cadastradas na Produção
  const [obras, setObras] = useState([]);
  const [loadingObras, setLoadingObras] = useState(false);

  // Devoluções cadastradas no estoque
  const [devolucoes, setDevolucoes] = useState([]);
  const [modalDevolucao, setModalDevolucao] = useState(false);
  const [salvandoDevolucao, setSalvandoDevolucao] = useState(false);
  const [erroDevolucao, setErroDevolucao] = useState("");

  const [formDevolucao, setFormDevolucao] = useState(() =>
    lerRascunhoEstoque(
      ESTOQUE_DRAFT_KEYS.devolucao,
      formDevolucaoInicial
    )
  );

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // =====================================================
  // MODAL PRODUTO
  // =====================================================

  const [modalProduto, setModalProduto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [erroProduto, setErroProduto] = useState("");

  const [formProduto, setFormProduto] = useState(() =>
    lerRascunhoEstoque(
      ESTOQUE_DRAFT_KEYS.produto,
      formProdutoInicial
    )
  );

  // =====================================================
  // MODAL ENTRADA
  // =====================================================

  const [modalEntrada, setModalEntrada] = useState(false);
  const [entradaEditando, setEntradaEditando] = useState(null);
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);
  const [erroEntrada, setErroEntrada] = useState("");

  const [formEntrada, setFormEntrada] = useState(() =>
    lerRascunhoEstoque(
      ESTOQUE_DRAFT_KEYS.entrada,
      formEntradaInicial
    )
  );

  // =====================================================
  // MODAL SAÍDA
  // =====================================================

  const [modalSaida, setModalSaida] = useState(false);
  const [saidaEditando, setSaidaEditando] = useState(null);
  const [salvandoSaida, setSalvandoSaida] = useState(false);
  const [erroSaida, setErroSaida] = useState("");

  const [formSaida, setFormSaida] = useState(() =>
    lerRascunhoEstoque(
      ESTOQUE_DRAFT_KEYS.saida,
      formSaidaInicial
    )
  );

  // =====================================================
  // MODAL DE CONFIRMAÇÃO
  // =====================================================

  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [confirmacao, setConfirmacao] = useState({
    titulo: "",
    mensagem: "",
    textoConfirmar: "Excluir",
    tipo: "danger",
    acao: null,
  });
  const [confirmando, setConfirmando] = useState(false);

  // =====================================================
  // ABRIR CONFIRMAÇÃO
  // =====================================================

  function abrirConfirmacao({
    titulo,
    mensagem,
    textoConfirmar = "Excluir",
    tipo = "danger",
    acao,
  }) {
    setConfirmacao({
      titulo,
      mensagem,
      textoConfirmar,
      tipo,
      acao,
    });

    setModalConfirmacao(true);
  }

  // =====================================================
  // FECHAR CONFIRMAÇÃO
  // =====================================================

  function fecharConfirmacao() {
    if (confirmando) return;

    setModalConfirmacao(false);

    setConfirmacao({
      titulo: "",
      mensagem: "",
      textoConfirmar: "Excluir",
      tipo: "danger",
      acao: null,
    });
  }

  // =====================================================
  // EXECUTAR CONFIRMAÇÃO
  // =====================================================

  async function executarConfirmacao() {
    if (!confirmacao.acao) {
      fecharConfirmacao();
      return;
    }

    try {
      setConfirmando(true);

      await confirmacao.acao();

      setModalConfirmacao(false);

      setConfirmacao({
        titulo: "",
        mensagem: "",
        textoConfirmar: "Excluir",
        tipo: "danger",
        acao: null,
      });
    } catch (error) {
      console.error(
        "Erro na confirmação:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível concluir a operação."
      );

      setModalConfirmacao(false);
    } finally {
      setConfirmando(false);
    }
  }

  // =====================================================
  // CARREGAR DADOS
  // =====================================================

  async function listarDevolucoes() {
    const { data, error } = await supabase
      .from("estoque_devolucoes")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const [
        produtosData,
        entradasData,
        saidasData,
        ultimasData,
        devolucoesData,
      ] = await Promise.all([
        listarProdutos(),
        listarEntradas(),
        listarSaidas(),
        listarUltimasSaidas(),
        listarDevolucoes(),
      ]);

      setProdutos(produtosData || []);
      setEntradas(entradasData || []);
      setSaidas(saidasData || []);
      setUltimasSaidas(ultimasData || []);
      setDevolucoes(devolucoesData || []);
    } catch (error) {
      console.error(
        "Erro ao carregar estoque:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível carregar o estoque."
      );
    } finally {
      setLoading(false);
    }
  }

  async function carregarObras() {
    try {
      setLoadingObras(true);

      const { data, error } = await supabase.functions.invoke(
        "admin-obras",
        {
          body: {
            action: "list",
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const lista = Array.isArray(data?.obras)
        ? data.obras
        : [];

      // Usa TODAS as obras que já existem na Produção.
      // O filtro de obras concluídas é feito apenas na tela de Produção;
      // aqui precisamos manter também o histórico para os movimentos do estoque.
      const listaOrdenada = [...lista].sort((a, b) =>
        String(a?.nome || "").localeCompare(
          String(b?.nome || ""),
          "pt-BR",
          { sensitivity: "base" }
        )
      );

      setObras(listaOrdenada);
    } catch (error) {
      console.error("Erro ao carregar obras da Produção:", error);
      setObras([]);
    } finally {
      setLoadingObras(false);
    }
  }

  useEffect(() => {
    if (!produtoEditando) {
      salvarRascunhoEstoque(
        ESTOQUE_DRAFT_KEYS.produto,
        formProduto
      );
    }
  }, [formProduto, produtoEditando]);

  useEffect(() => {
    if (!entradaEditando) {
      salvarRascunhoEstoque(
        ESTOQUE_DRAFT_KEYS.entrada,
        formEntrada
      );
    }
  }, [formEntrada, entradaEditando]);

  useEffect(() => {
    if (!saidaEditando) {
      salvarRascunhoEstoque(
        ESTOQUE_DRAFT_KEYS.saida,
        formSaida
      );
    }
  }, [formSaida, saidaEditando]);

  useEffect(() => {
    salvarRascunhoEstoque(
      ESTOQUE_DRAFT_KEYS.devolucao,
      formDevolucao
    );
  }, [formDevolucao]);

  useEffect(() => {
    carregarDados();
    carregarObras();
  }, []);

  // =====================================================
  // PRODUTO SELECIONADO
  // =====================================================

  const produtoSelecionado = useMemo(() => {
    if (!filtroProduto) return null;

    return (
      produtos.find(
        (produto) =>
          String(produto.id) ===
          String(filtroProduto)
      ) || null
    );
  }, [filtroProduto, produtos]);

  // =====================================================
  // FILTRO DE PRODUTOS
  // =====================================================

  const produtosFiltrados = useMemo(() => {
    if (!filtroProduto) return produtos;

    return produtos.filter(
      (produto) =>
        String(produto.id) ===
        String(filtroProduto)
    );
  }, [produtos, filtroProduto]);

  // =====================================================
  // FILTRO DE ENTRADAS
  // =====================================================

  const entradasFiltradas = useMemo(() => {
    if (!filtroProduto) return entradas;

    return entradas.filter(
      (entrada) =>
        String(entrada.produto_id) ===
        String(filtroProduto)
    );
  }, [entradas, filtroProduto]);

  // =====================================================
  // FILTRO DE SAÍDAS
  // =====================================================

  const saidasFiltradas = useMemo(() => {
    if (!filtroProduto) return saidas;

    return saidas.filter((saida) => {
      const itens =
        saida?.estoque_saida_itens || [];

      return itens.some(
        (item) =>
          String(item.produto_id) ===
          String(filtroProduto)
      );
    });
  }, [saidas, filtroProduto]);

  // =====================================================
  // FILTRO DE ÚLTIMAS SAÍDAS
  // =====================================================

  const ultimasSaidasFiltradas = useMemo(() => {
    if (!filtroProduto) return ultimasSaidas;

    return ultimasSaidas.filter(
      (saida) =>
        String(saida.produto_id) ===
        String(filtroProduto)
    );
  }, [ultimasSaidas, filtroProduto]);

  // =====================================================
  // DEVOLUÇÕES — QUANTIDADE JÁ DEVOLVIDA POR ITEM
  // =====================================================

  const devolucoesPorItem = useMemo(() => {
    const mapa = {};

    (devolucoes || []).forEach((devolucao) => {
      const itemId = String(devolucao?.saida_item_id || "");

      if (!itemId) return;

      mapa[itemId] =
        Number(mapa[itemId] || 0) +
        Number(devolucao?.quantidade_devolvida || 0);
    });

    return mapa;
  }, [devolucoes]);

  // =====================================================
  // DEVOLUÇÕES — ITENS DAS SAÍDAS DISPONÍVEIS
  // =====================================================

  const itensSaidasDevolucao = useMemo(() => {
    const itens = [];

    (saidas || []).forEach((saida) => {
      const itensSaida =
        saida?.estoque_saida_itens || [];

      itensSaida.forEach((item) => {
        const produto = produtos.find(
          (produtoAtual) =>
            String(produtoAtual?.id) ===
            String(item?.produto_id)
        );

        const quantidadeRetirada = Number(
          item?.quantidade || 0
        );

        const quantidadeJaDevolvida = Number(
          devolucoesPorItem[String(item?.id)] || 0
        );

        const quantidadeDisponivel = Math.max(
          0,
          quantidadeRetirada - quantidadeJaDevolvida
        );

        const precoUnitario = Number(
          item?.preco_unitario ??
          item?.preco ??
          produto?.preco ??
          0
        );

        const valorRetirada = Number(
          item?.valor_total ??
          quantidadeRetirada * precoUnitario
        );

        itens.push({
          saidaId: saida?.id,
          saidaItemId: item?.id,
          obraId: saida?.obra_id ?? null,
          dataSaida: saida?.data_saida,
          produtoId: item?.produto_id,
          itemNome:
            produto?.nome ||
            item?.nome ||
            "Produto não informado",
          sku:
            produto?.sku ||
            item?.sku ||
            "-",
          quantidadeRetirada,
          quantidadeJaDevolvida,
          quantidadeDisponivel,
          solicitante:
            saida?.solicitante ||
            "-",
          precoUnitario,
          valorRetirada,
          precoUnitario,
        });
      });
    });

    return itens
      .filter(
        (item) =>
          Number(item.quantidadeDisponivel || 0) > 0
      )
      .sort((a, b) => {
        const dataA =
          new Date(a.dataSaida || 0).getTime() || 0;
        const dataB =
          new Date(b.dataSaida || 0).getTime() || 0;

        if (dataA !== dataB) {
          return dataB - dataA;
        }

        return Number(b.saidaId || 0) - Number(a.saidaId || 0);
      });
  }, [saidas, produtos, devolucoesPorItem]);

  const saidasDevolucaoFiltradas = useMemo(() => {
    const obraSelecionada = formDevolucao.obraId;

    const chaveObra = obraSelecionada
      ? String(obraSelecionada)
      : "";

    return itensSaidasDevolucao.filter((item) => {
      const chaveItem = item.obraId
        ? String(item.obraId)
        : "";

      return chaveItem === chaveObra;
    });
  }, [itensSaidasDevolucao, formDevolucao.obraId]);

  const saidaItemSelecionadoDevolucao = useMemo(() => {
    if (!formDevolucao.saidaItemId) return null;

    return (
      itensSaidasDevolucao.find(
        (item) =>
          String(item.saidaItemId) ===
          String(formDevolucao.saidaItemId)
      ) || null
    );
  }, [itensSaidasDevolucao, formDevolucao.saidaItemId]);

  // =====================================================
  // PRODUTO
  // =====================================================

  function abrirNovoProduto() {
    setProdutoEditando(null);
    setErroProduto("");
    setModalProduto(true);
  }

  function abrirEditarProduto(produto) {
    limparRascunhoEstoque(ESTOQUE_DRAFT_KEYS.produto);
    setProdutoEditando(produto);

    setFormProduto({
      nome: produto?.nome || "",
      sku: produto?.sku || "",
      codigoAlme: produto?.codigo_alme || "",
      valorUnitario:
        produto?.valor_unitario ?? "",
      preco: produto?.preco ?? "",
    });

    setErroProduto("");
    setModalProduto(true);
  }

  function fecharModalProduto() {
    if (salvandoProduto) return;

    setModalProduto(false);
    setProdutoEditando(null);
    setErroProduto("");

    limparRascunhoEstoque(ESTOQUE_DRAFT_KEYS.produto);
    setFormProduto({ ...formProdutoInicial });
  }

  function alterarProduto(campo, valor) {
    setFormProduto((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function salvarProduto(event) {
    event.preventDefault();

    try {
      setSalvandoProduto(true);
      setErroProduto("");

      if (!formProduto.nome.trim()) {
        throw new Error(
          "Informe o nome do produto."
        );
      }

      const valorUnitario =
        formProduto.valorUnitario === ""
          ? 0
          : Number(formProduto.valorUnitario);

      const preco =
        formProduto.preco === ""
          ? 0
          : Number(formProduto.preco);

      if (Number.isNaN(valorUnitario)) {
        throw new Error(
          "Informe um valor unitário válido."
        );
      }

      if (Number.isNaN(preco)) {
        throw new Error(
          "Informe um preço de venda válido."
        );
      }

      const dadosProduto = {
        nome: formProduto.nome.trim(),
        sku:
          formProduto.sku.trim() || null,
        codigoAlme:
          formProduto.codigoAlme.trim() ||
          null,
        valorUnitario,
        preco,
      };

      if (produtoEditando) {
        await editarProduto({
          id: produtoEditando.id,
          ...dadosProduto,
        });
      } else {
        await criarProduto(dadosProduto);
      }

      await carregarDados();
      fecharModalProduto();
    } catch (error) {
      console.error(
        "Erro ao salvar produto:",
        error
      );

      setErroProduto(
        error?.message ||
          "Não foi possível salvar o produto."
      );
    } finally {
      setSalvandoProduto(false);
    }
  }

  async function removerProduto(produto) {
    abrirConfirmacao({
      titulo: "Excluir produto",
      mensagem: `Deseja realmente excluir o produto "${produto.nome}"?`,
      textoConfirmar: "Excluir produto",
      tipo: "danger",

      acao: async () => {
        await excluirProduto(produto.id);
        await carregarDados();

        if (
          String(filtroProduto) ===
          String(produto.id)
        ) {
          setFiltroProduto("");
        }
      },
    });
  }

  // =====================================================
  // ENTRADA
  // =====================================================

  function limparFormEntrada() {
    limparRascunhoEstoque(ESTOQUE_DRAFT_KEYS.entrada);
    setFormEntrada({ ...formEntradaInicial });
  }

  function abrirNovaEntrada() {
    setEntradaEditando(null);

    setErroEntrada("");
    setModalEntrada(true);
  }

  function abrirEditarEntrada(entrada) {
    limparRascunhoEstoque(ESTOQUE_DRAFT_KEYS.entrada);
    setEntradaEditando(entrada);

    setFormEntrada({
      produtoId:
        entrada?.produto_id ?? "",
      obraId:
        entrada?.obra_id ?? "",
      nfEntrada:
        entrada?.nf_entrada ?? "",
      nomeItem:
        entrada?.nome_item ?? "",
      sku: entrada?.sku ?? "",
      codigoAlme:
        entrada?.codigo_alme ?? "",
      quantidade:
        entrada?.quantidade ?? "",
      valorUnitario:
        entrada?.valor_unitario ?? "",
      valorTotal:
        entrada?.valor_total ?? "",
      valorUnitarioFinal:
        entrada?.valor_unitario_final ?? "",
      preco: entrada?.preco ?? "",
    });

    setErroEntrada("");
    setModalEntrada(true);
  }

  function fecharModalEntrada() {
    if (salvandoEntrada) return;

    setModalEntrada(false);
    setEntradaEditando(null);
    setErroEntrada("");
    limparFormEntrada();
  }

  function alterarEntrada(campo, valor) {
    setFormEntrada((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  // =====================================================
  // SELECIONAR PRODUTO NA ENTRADA
  // =====================================================

  function selecionarProdutoEntrada(
    produtoId
  ) {
    const produto = produtos.find(
      (item) =>
        String(item.id) ===
        String(produtoId)
    );

    if (!produto) {
      setFormEntrada((prev) => ({
        ...prev,
        produtoId: "",
        nomeItem: "",
        sku: "",
        codigoAlme: "",
        valorUnitario: "",
        preco: "",
      }));

      return;
    }

    setFormEntrada((prev) => ({
      ...prev,
      produtoId: produto.id,
      nomeItem: produto.nome || "",
      sku: produto.sku || "",
      codigoAlme:
        produto.codigo_alme || "",
      valorUnitario:
        produto.valor_unitario ?? "",
      preco: produto.preco ?? "",
    }));
  }

  // =====================================================
  // RECALCULAR VALORES DA ENTRADA
  // =====================================================

  function recalcularEntrada({
    quantidade,
    valorUnitario,
  }) {
    const qtd = Number(quantidade || 0);
    const valor = Number(
      valorUnitario || 0
    );

    const total = qtd * valor;

    setFormEntrada((prev) => ({
      ...prev,
      quantidade,
      valorUnitario,
      valorTotal: total,
      valorUnitarioFinal:
        qtd > 0 ? total / qtd : 0,
    }));
  }

  function alterarQuantidadeEntrada(
    valor
  ) {
    recalcularEntrada({
      quantidade: valor,
      valorUnitario:
        formEntrada.valorUnitario,
    });
  }

  function alterarValorUnitarioEntrada(
    valor
  ) {
    recalcularEntrada({
      quantidade:
        formEntrada.quantidade,
      valorUnitario: valor,
    });
  }

  // =====================================================
  // SALVAR ENTRADA
  // =====================================================

  async function salvarEntrada(event) {
    event.preventDefault();

    try {
      setSalvandoEntrada(true);
      setErroEntrada("");

      if (!formEntrada.produtoId) {
        throw new Error(
          "Selecione um produto."
        );
      }

      // =================================================
      // NF OBRIGATÓRIA
      // =================================================

      const nfEntrada =
        String(
          formEntrada.nfEntrada || ""
        ).trim();

      if (!nfEntrada) {
        throw new Error(
          "Informe o número da nota fiscal."
        );
      }

      const quantidade = Number(
        formEntrada.quantidade || 0
      );

      const valorUnitario = Number(
        formEntrada.valorUnitario || 0
      );

      if (
        !Number.isFinite(quantidade) ||
        quantidade <= 0
      ) {
        throw new Error(
          "Informe uma quantidade maior que zero."
        );
      }

      if (
        !Number.isFinite(valorUnitario) ||
        valorUnitario < 0
      ) {
        throw new Error(
          "Informe um valor unitário válido."
        );
      }

      const valorTotal =
        quantidade * valorUnitario;

      const valorUnitarioFinal =
        quantidade > 0
          ? valorTotal / quantidade
          : 0;

      const dadosEntrada = {
        produtoId: Number(
          formEntrada.produtoId
        ),

        // Vazio = ALME ESTOQUE (obra_id NULL)
        obraId: formEntrada.obraId
          ? Number(formEntrada.obraId)
          : null,

        // NF agora sempre será enviada
        nfEntrada,

        nomeItem:
          formEntrada.nomeItem.trim() ||
          null,

        sku:
          formEntrada.sku.trim() ||
          null,

        codigoAlme:
          formEntrada.codigoAlme.trim() ||
          null,

        quantidade,
        valorUnitario,
        valorTotal,
        valorUnitarioFinal,

        preco: Number(
          formEntrada.preco || 0
        ),
      };

      if (entradaEditando) {
        await editarEntrada({
          id: entradaEditando.id,
          ...dadosEntrada,
        });
      } else {
        await criarEntrada(dadosEntrada);
      }

      // =================================================
      // PDF DA ENTRADA
      // =================================================

      const hoje = new Date();

      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      const dia = String(hoje.getDate()).padStart(2, "0");

      const dataEntrada = `${ano}-${mes}-${dia}`;

      gerarPdfEntrada({
        dataEntrada,
        entradaId: entradaEditando?.id || null,
        obra: nomeObraPorId(dadosEntrada.obraId),
        nfEntrada,
        nomeItem: dadosEntrada.nomeItem,
        sku: dadosEntrada.sku,
        codigoAlme: dadosEntrada.codigoAlme,
        quantidade,
        valorUnitario,
        valorTotal,
        valorUnitarioFinal,
        preco: Number(formEntrada.preco || 0),
      });

      await carregarDados();

      fecharModalEntrada();
    } catch (error) {
      console.error(
        "Erro ao salvar entrada:",
        error
      );

      setErroEntrada(
        error?.message ||
          "Não foi possível registrar a entrada."
      );
    } finally {
      setSalvandoEntrada(false);
    }
  }

  // =====================================================
  // EXCLUIR ENTRADA
  // =====================================================

  async function removerEntrada(entrada) {
    abrirConfirmacao({
      titulo: "Excluir entrada",

      mensagem: `Deseja realmente excluir a entrada "${
        entrada.nome_item ||
        `#${entrada.id}`
      }"?`,

      textoConfirmar: "Excluir entrada",

      tipo: "danger",

      acao: async () => {
        await excluirEntrada(
          entrada.id
        );

        await carregarDados();
      },
    });
  }

  // =====================================================
  // SAÍDA
  // =====================================================

  function limparFormSaida() {
    limparRascunhoEstoque(ESTOQUE_DRAFT_KEYS.saida);
    setFormSaida({ ...formSaidaInicial });
  }

  function abrirNovaSaida() {
    setSaidaEditando(null);

    setErroSaida("");
    setModalSaida(true);
  }

  function fecharModalSaida() {
    if (salvandoSaida) return;

    setModalSaida(false);
    setSaidaEditando(null);
    setErroSaida("");
    limparFormSaida();
  }

  function alterarSaida(campo, valor) {
    setFormSaida((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  // =====================================================
  // EDITAR SAÍDA
  // =====================================================

  function abrirEditarSaida(
    saida,
    item = null
  ) {
    limparRascunhoEstoque(ESTOQUE_DRAFT_KEYS.saida);

    const itens =
      saida?.estoque_saida_itens || [];

    const itemSelecionado =
      item || itens[0];

    if (!itemSelecionado) {
      setErro(
        "Não foi possível encontrar o item desta saída."
      );

      return;
    }

    setSaidaEditando({
      ...saida,
      itemId: itemSelecionado.id,
      itemOriginal: itemSelecionado,
    });

    setFormSaida({
      produtoId:
        itemSelecionado.produto_id ??
        "",
      obraId:
        saida?.obra_id ??
        "",
      quantidade:
        itemSelecionado.quantidade ??
        "",
      solicitante:
        saida?.solicitante ?? "",
    });

    setErroSaida("");
    setModalSaida(true);
  }

  // =====================================================
  // SALVAR SAÍDA
  // =====================================================

  async function salvarSaida(event) {
    event.preventDefault();

    try {
      setSalvandoSaida(true);
      setErroSaida("");

      if (!formSaida.produtoId) {
        throw new Error(
          "Selecione um produto."
        );
      }

      const quantidade = Number(
        formSaida.quantidade || 0
      );

      if (
        !Number.isFinite(quantidade) ||
        quantidade <= 0
      ) {
        throw new Error(
          "Informe uma quantidade maior que zero."
        );
      }

      const produto = produtos.find(
        (item) =>
          String(item.id) ===
          String(formSaida.produtoId)
      );

      if (!produto) {
        throw new Error(
          "Produto selecionado não encontrado."
        );
      }

      // =================================================
      // NOVA SAÍDA
      // =================================================

      if (!saidaEditando) {
        const estoqueAtual = Number(
          produto.quantidade_atual || 0
        );

        if (quantidade > estoqueAtual) {
          throw new Error(
            `Estoque insuficiente. Disponível: ${estoqueAtual}.`
          );
        }

        const solicitante = String(
          formSaida.solicitante || ""
        ).trim();

        if (!solicitante) {
          throw new Error(
            "Informe o nome do solicitante."
          );
        }

        // =================================================
        // PREÇO HISTÓRICO
        // =================================================

        const precoUnitario = Number(
          produto.preco || 0
        );

        const valorTotal =
          quantidade *
          precoUnitario;

        // =================================================
        // CRIAR SAÍDA
        // =================================================

        const saidaId =
          await criarSaida({
            produtoId: Number(
              formSaida.produtoId
            ),
            // Vazio = ALME ESTOQUE (obra_id NULL)
            obraId: formSaida.obraId
              ? Number(formSaida.obraId)
              : null,
            quantidade,
            solicitante,
            precoUnitario,
            valorTotal,
          });

        // =================================================
        // DATA
        // =================================================

        const hoje = new Date();

        const ano =
          hoje.getFullYear();

        const mes = String(
          hoje.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
          hoje.getDate()
        ).padStart(2, "0");

        const dataSaida =
          `${ano}-${mes}-${dia}`;

        // =================================================
        // ATUALIZAR
        // =================================================

        await carregarDados();

        // =================================================
        // PDF
        // =================================================

        gerarPdfSaida({
          saidaId,
          dataSaida,
          solicitante,
          obra: nomeObraPorId(formSaida.obraId),
          produto,
          quantidade,
          precoUnitario,
          valorTotal,
        });
      }

      // =================================================
      // EDITAR SAÍDA
      // =================================================

      else {
        await editarSaidaItem({
          itemId:
            saidaEditando.itemId,
          quantidade,
          // Mantém a obra referente da saída.
          // O service deve persistir obraId no registro pai.
          obraId: formSaida.obraId
            ? Number(formSaida.obraId)
            : null,
        });

        // =================================================
        // PDF DA SAÍDA EDITADA
        // =================================================

        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        const dataSaida = `${ano}-${mes}-${dia}`;

        const solicitante = String(
          formSaida.solicitante ||
          saidaEditando?.solicitante ||
          ""
        ).trim();

        const precoUnitario = Number(
          saidaEditando?.itemOriginal?.preco_unitario ??
            saidaEditando?.itemOriginal?.preco ??
            produto?.preco ??
            0
        );

        const valorTotal = quantidade * precoUnitario;

        gerarPdfSaida({
          saidaId: saidaEditando.id,
          dataSaida,
          solicitante,
          obra: nomeObraPorId(formSaida.obraId),
          produto,
          quantidade,
          precoUnitario,
          valorTotal,
        });

        await carregarDados();
      }

      fecharModalSaida();
    } catch (error) {
      console.error(
        "Erro ao salvar saída:",
        error
      );

      setErroSaida(
        error?.message ||
          "Não foi possível registrar a saída."
      );
    } finally {
      setSalvandoSaida(false);
    }
  }

  // =====================================================
  // DEVOLUÇÃO
  // =====================================================

  function limparFormDevolucao() {
    limparRascunhoEstoque(ESTOQUE_DRAFT_KEYS.devolucao);
    setFormDevolucao({ ...formDevolucaoInicial });
  }

  function abrirNovaDevolucao() {
    setErroDevolucao("");
    setModalDevolucao(true);
  }

  function fecharModalDevolucao() {
    if (salvandoDevolucao) return;

    setModalDevolucao(false);
    setErroDevolucao("");
    limparFormDevolucao();
  }

  function alterarDevolucao(campo, valor) {
    setFormDevolucao((prev) => {
      const proximo = {
        ...prev,
        [campo]: valor,
      };

      if (campo === "quantidadeDevolvida") {
        const valorCalculado = calcularValorDevolucao({
          quantidadeRetirada: prev.quantidadeRetirada,
          valorRetirada: prev.valorRetirada,
          quantidadeDevolvida: valor,
        });

        proximo.valorDevolvido = valorCalculado.toFixed(2);
      }

      return proximo;
    });
  }

  function selecionarObraDevolucao(valor) {
    setFormDevolucao({
      ...formDevolucaoInicial,
      obraId: valor,
    });

    setErroDevolucao("");
  }

  function selecionarSaidaDevolucao(saidaItemId) {
    const registro = itensSaidasDevolucao.find(
      (item) =>
        String(item.saidaItemId) ===
        String(saidaItemId)
    );

    if (!registro) {
      setFormDevolucao((prev) => ({
        ...formDevolucaoInicial,
        obraId: prev.obraId,
      }));

      return;
    }

    setFormDevolucao((prev) => ({
      ...prev,
      obraId:
        registro.obraId != null
          ? String(registro.obraId)
          : "",
      saidaItemId: registro.saidaItemId,
      saidaId: registro.saidaId,
      produtoId: registro.produtoId,
      itemNome: registro.itemNome,
      sku: registro.sku,
      quantidadeRetirada:
        registro.quantidadeRetirada,
      quantidadeJaDevolvida:
        registro.quantidadeJaDevolvida,
      quantidadeDisponivel:
        registro.quantidadeDisponivel,
      solicitante: registro.solicitante,
      valorRetirada: registro.valorRetirada,
      precoUnitario: registro.precoUnitario,
      quantidadeDevolvida: "",
      valorDevolvido: "",
    }));

    setErroDevolucao("");
  }

  const valorDevolvidoCalculado = useMemo(() => {
    return calcularValorDevolucao({
      quantidadeRetirada: formDevolucao.quantidadeRetirada,
      valorRetirada: formDevolucao.valorRetirada,
      quantidadeDevolvida: formDevolucao.quantidadeDevolvida,
    });
  }, [
    formDevolucao.quantidadeRetirada,
    formDevolucao.valorRetirada,
    formDevolucao.quantidadeDevolvida,
  ]);

  async function salvarDevolucao(event) {
    event.preventDefault();

    try {
      setSalvandoDevolucao(true);
      setErroDevolucao("");

      if (!formDevolucao.saidaItemId) {
        throw new Error(
          "Selecione a saída referente."
        );
      }

      const registro = itensSaidasDevolucao.find(
        (item) =>
          String(item.saidaItemId) ===
          String(formDevolucao.saidaItemId)
      );

      if (!registro) {
        throw new Error(
          "A saída selecionada não está mais disponível para devolução."
        );
      }

      const quantidadeDevolvida = Number(
        formDevolucao.quantidadeDevolvida || 0
      );

      if (
        !Number.isFinite(quantidadeDevolvida) ||
        quantidadeDevolvida <= 0
      ) {
        throw new Error(
          "Informe uma quantidade devolvida maior que zero."
        );
      }

      if (
        quantidadeDevolvida >
        Number(registro.quantidadeDisponivel || 0)
      ) {
        throw new Error(
          `A quantidade máxima disponível para devolução é ${Number(
            registro.quantidadeDisponivel || 0
          ).toLocaleString("pt-BR")}.`
        );
      }

      const valorDevolvido =
        valorDevolvidoCalculado;

      if (
        !Number.isFinite(valorDevolvido) ||
        valorDevolvido < 0
      ) {
        throw new Error(
          "Não foi possível calcular o valor da devolução."
        );
      }

      const { data, error } = await supabase
        .from("estoque_devolucoes")
        .insert({
          obra_id: registro.obraId
            ? Number(registro.obraId)
            : null,
          saida_id: Number(registro.saidaId),
          saida_item_id: Number(registro.saidaItemId),
          produto_id: Number(registro.produtoId),
          item_nome: registro.itemNome || null,
          sku: registro.sku || null,
          quantidade_retirada:
            Number(registro.quantidadeRetirada || 0),
          solicitante: registro.solicitante || null,
          valor_retirada:
            Number(registro.valorRetirada || 0),
          quantidade_devolvida: quantidadeDevolvida,
          valor_devolvido: valorDevolvido,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      gerarPdfDevolucao({
        devolucaoId: data?.id,
        dataDevolucao:
          data?.data_devolucao ||
          new Date().toISOString().slice(0, 10),
        obra: nomeObraPorId(registro.obraId),
        saidaId: registro.saidaId,
        dataSaida: registro.dataSaida,
        itemNome: registro.itemNome,
        sku: registro.sku,
        solicitante: registro.solicitante,
        quantidadeRetirada:
          registro.quantidadeRetirada,
        valorRetirada:
          registro.valorRetirada,
        quantidadeDevolvida,
        valorDevolvido,
      });

      await carregarDados();
      fecharModalDevolucao();
    } catch (error) {
      console.error(
        "Erro ao salvar devolução:",
        error
      );

      setErroDevolucao(
        error?.message ||
          "Não foi possível registrar a devolução."
      );
    } finally {
      setSalvandoDevolucao(false);
    }
  }

  // =====================================================
  // GERAR PDF DE UMA DEVOLUÇÃO DA LISTA
  // =====================================================

  function gerarPdfDevolucaoDaLinha(devolucao) {
    const item = itensSaidasDevolucao.find(
      (registro) =>
        String(registro.saidaItemId) ===
        String(devolucao?.saida_item_id)
    );

    gerarPdfDevolucao({
      devolucaoId: devolucao?.id,
      dataDevolucao:
        devolucao?.data_devolucao ||
        new Date().toISOString().slice(0, 10),
      obra: nomeObraPorId(devolucao?.obra_id),
      saidaId:
        devolucao?.saida_id ||
        item?.saidaId ||
        "-",
      dataSaida: item?.dataSaida,
      itemNome:
        devolucao?.item_nome ||
        item?.itemNome ||
        "-",
      sku:
        devolucao?.sku ||
        item?.sku ||
        "-",
      solicitante:
        devolucao?.solicitante ||
        item?.solicitante ||
        "-",
      quantidadeRetirada:
        devolucao?.quantidade_retirada ??
        item?.quantidadeRetirada ??
        0,
      valorRetirada:
        devolucao?.valor_retirada ??
        item?.valorRetirada ??
        0,
      quantidadeDevolvida:
        devolucao?.quantidade_devolvida ??
        0,
      valorDevolvido:
        devolucao?.valor_devolvido ??
        0,
    });
  }

  // =====================================================
  // GERAR PDF DA DEVOLUÇÃO
  // =====================================================

  function gerarPdfDevolucao({
    devolucaoId,
    dataDevolucao,
    obra,
    saidaId,
    dataSaida,
    itemNome,
    sku,
    solicitante,
    quantidadeRetirada,
    valorRetirada,
    quantidadeDevolvida,
    valorDevolvido,
  }) {
    const doc = new jsPDF();
    const margem = 20;
    const larguraUtil = 210 - margem * 2;

    const numeroDevolucao =
      devolucaoId
        ? `#${String(devolucaoId).padStart(6, "0")}`
        : "-";

    const numeroSaida =
      saidaId
        ? `#${String(saidaId).padStart(6, "0")}`
        : "-";

    const obraReferente =
      obra ||
      "ALME ESTOQUE";

    const nomeItemFormatado =
      itemNome ||
      "Produto não informado";

    const linhasObra = doc.splitTextToSize(
      `Obra referente: ${obraReferente}`,
      larguraUtil
    );

    const linhasItem = doc.splitTextToSize(
      `Item: ${nomeItemFormatado}`,
      larguraUtil
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ALME MARCENARIA", margem, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      "Controle de movimentação de estoque",
      margem,
      32
    );

    doc.setLineWidth(0.5);
    doc.line(margem, 38, 210 - margem, 38);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      "COMPROVANTE DE DEVOLUÇÃO",
      margem,
      52
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
      `Número da devolução: ${numeroDevolucao}`,
      margem,
      65
    );

    doc.text(
      `Data da devolução: ${formatarData(dataDevolucao)}`,
      margem,
      72
    );

    doc.text(
      `Saída referente: ${numeroSaida}`,
      margem,
      79
    );

    doc.text(
      `Data da saída: ${formatarData(dataSaida)}`,
      margem,
      86
    );

    let y = 94;

    doc.text(linhasObra, margem, y);
    y += 7 * linhasObra.length + 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ITEM", margem, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(linhasItem, margem, y + 9);
    y += 16 + (linhasItem.length - 1) * 5;

    doc.text(`SKU: ${sku || "-"}`, margem, y);
    y += 7;

    doc.text(
      `Solicitante: ${solicitante || "-"}`,
      margem,
      y
    );

    y += 17;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("MOVIMENTAÇÃO", margem, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
      `Quantidade que foi retirada: ${Number(
        quantidadeRetirada || 0
      ).toLocaleString("pt-BR")}`,
      margem,
      y + 10
    );

    doc.text(
      `Valor da retirada: ${formatarMoeda(
        valorRetirada
      )}`,
      margem,
      y + 17
    );

    doc.text(
      `Quantidade devolvida: ${Number(
        quantidadeDevolvida || 0
      ).toLocaleString("pt-BR")}`,
      margem,
      y + 24
    );

    doc.setFont("helvetica", "bold");
    doc.text(
      `Valor devolvido: ${formatarMoeda(
        valorDevolvido
      )}`,
      margem,
      y + 31
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "A quantidade devolvida foi acrescentada ao estoque do produto.",
      margem,
      y + 50
    );

    doc.text(
      "Documento gerado automaticamente pelo sistema de estoque.",
      margem,
      y + 57
    );

    const yAssinaturas = y + 90;

    doc.line(
      margem,
      yAssinaturas,
      90,
      yAssinaturas
    );

    doc.line(
      120,
      yAssinaturas,
      190,
      yAssinaturas
    );

    doc.setFontSize(8);

    doc.text(
      "Responsável pela devolução",
      margem,
      yAssinaturas + 7
    );

    doc.text(
      "Responsável pelo estoque",
      120,
      yAssinaturas + 7
    );

    doc.save(
      `devolucao-estoque-${
        devolucaoId
          ? String(devolucaoId).padStart(6, "0")
          : "novo"
      }.pdf`
    );
  }
// =====================================================
// EXCLUIR DEVOLUÇÃO
// =====================================================

async function removerDevolucao(devolucao) {
  abrirConfirmacao({
    titulo: "Excluir devolução",

    mensagem: `Deseja realmente excluir a devolução #${String(
      devolucao?.id
    ).padStart(6, "0")}?`,

    textoConfirmar: "Excluir devolução",

    tipo: "danger",

    acao: async () => {
      const { error } = await supabase
        .from("estoque_devolucoes")
        .delete()
        .eq("id", devolucao.id);

      if (error) {
        throw error;
      }

      await carregarDados();
    },
  });
}
  // =====================================================
  // EXCLUIR SAÍDA
  // =====================================================

  async function removerSaida(saida) {
    abrirConfirmacao({
      titulo: "Excluir saída",

      mensagem: `Deseja realmente excluir a saída #${String(
        saida.id
      ).padStart(6, "0")}?`,

      textoConfirmar: "Excluir saída",

      tipo: "danger",

      acao: async () => {
        await excluirSaida(
          saida.id
        );

        await carregarDados();
      },
    });
  }

  // =====================================================
  // CÁLCULOS GERAIS
  // =====================================================

  const quantidadeProdutos =
    produtos.length;

  // =====================================================
  // PRODUTO SELECIONADO
  // =====================================================

  const quantidadeSelecionada =
    produtoSelecionado
      ? Number(
          produtoSelecionado.quantidade_atual ||
            0
        )
      : 0;

  const valorEstoqueSelecionado =
    produtoSelecionado
      ? quantidadeSelecionada *
        Number(
          produtoSelecionado.preco ||
            0
        )
      : 0;

  // =====================================================
  // FORMATAÇÃO
  // =====================================================

  function formatarMoeda(valor) {
    return Number(
      valor || 0
    ).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data) {
    if (!data) return "-";

    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString(
      "pt-BR"
    );
  }

  function nomeObraPorId(obraId) {
    if (!obraId) return "ALME ESTOQUE";

    const obra = obras.find(
      (item) => String(item?.id) === String(obraId)
    );

    return obra?.nome || `Obra #${obraId}`;
  }

  // =====================================================
  // GERAR PDF DA ENTRADA
  // =====================================================

  function gerarPdfEntrada({
    entradaId,
    dataEntrada,
    obra,
    nfEntrada,
    nomeItem,
    sku,
    codigoAlme,
    quantidade,
    valorUnitario,
    valorTotal,
    valorUnitarioFinal,
    preco,
  }) {
    const doc = new jsPDF();

    const margem = 20;
    const larguraUtil = 210 - margem * 2;

    const nomeProduto =
      nomeItem ||
      "Produto não informado";

    const dataFormatada =
      formatarData(dataEntrada);

    const obraReferente =
      obra ||
      "ALME ESTOQUE";

    const skuFormatado =
      sku ||
      "-";

    const codigoAlmeFormatado =
      codigoAlme ||
      "-";

    const nfFormatada =
      nfEntrada ||
      "-";

    const numeroEntrada =
      entradaId
        ? `#${String(entradaId).padStart(6, "0")}`
        : "-";

    // =====================================================
    // CABEÇALHO
    // =====================================================

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(20);

    doc.text(
      "ALME MARCENARIA",
      margem,
      25
    );

    doc.setFontSize(10);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      "Controle de movimentação de estoque",
      margem,
      32
    );

    doc.setLineWidth(0.5);

    doc.line(
      margem,
      38,
      210 - margem,
      38
    );

    // =====================================================
    // TÍTULO
    // =====================================================

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(16);

    doc.text(
      "COMPROVANTE DE ENTRADA",
      margem,
      52
    );

    // =====================================================
    // INFORMAÇÕES
    // =====================================================

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.text(
      `Número da entrada: ${numeroEntrada}`,
      margem,
      65
    );

    doc.text(
      `Data: ${dataFormatada}`,
      margem,
      72
    );

    doc.text(
      `Nota fiscal: ${nfFormatada}`,
      margem,
      79
    );

    const linhasObra = doc.splitTextToSize(
      `Obra referente: ${obraReferente}`,
      larguraUtil
    );

    doc.text(
      linhasObra,
      margem,
      86
    );

    // =====================================================
    // PRODUTO
    // =====================================================

    const yProduto =
      99 + (linhasObra.length - 1) * 5;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "PRODUTO",
      margem,
      yProduto
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    const nomeLinhas = doc.splitTextToSize(
      `Nome: ${nomeProduto}`,
      larguraUtil
    );

    doc.text(
      nomeLinhas,
      margem,
      yProduto + 9
    );

    let yProdutoInfo =
      yProduto + 16 + (nomeLinhas.length - 1) * 5;

    doc.text(
      `SKU: ${skuFormatado}`,
      margem,
      yProdutoInfo
    );

    yProdutoInfo += 7;

    doc.text(
      `Código ALME: ${codigoAlmeFormatado}`,
      margem,
      yProdutoInfo
    );

    // =====================================================
    // MOVIMENTAÇÃO
    // =====================================================

    const yMovimentacao =
      yProdutoInfo + 17;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "MOVIMENTAÇÃO",
      margem,
      yMovimentacao
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.text(
      `Quantidade recebida: ${Number(
        quantidade || 0
      ).toLocaleString("pt-BR")}`,
      margem,
      yMovimentacao + 10
    );

    doc.text(
      `Valor unitário: ${formatarMoeda(
        valorUnitario
      )}`,
      margem,
      yMovimentacao + 17
    );

    doc.text(
      `Valor unitário final: ${formatarMoeda(
        valorUnitarioFinal
      )}`,
      margem,
      yMovimentacao + 24
    );

    doc.text(
      `Preço de venda: ${formatarMoeda(
        preco
      )}`,
      margem,
      yMovimentacao + 31
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.text(
      `Valor total da entrada: ${formatarMoeda(
        valorTotal
      )}`,
      margem,
      yMovimentacao + 40
    );

    // =====================================================
    // OBSERVAÇÃO
    // =====================================================

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      "Documento gerado automaticamente pelo sistema de estoque.",
      margem,
      yMovimentacao + 63
    );

    // =====================================================
    // ASSINATURAS
    // =====================================================

    const yAssinaturas =
      yMovimentacao + 98;

    doc.line(
      margem,
      yAssinaturas,
      90,
      yAssinaturas
    );

    doc.line(
      120,
      yAssinaturas,
      190,
      yAssinaturas
    );

    doc.setFontSize(8);

    

   

    doc.save(
      `entrada-estoque-${
        entradaId
          ? String(entradaId).padStart(6, "0")
          : nfFormatada.replace(/[^a-zA-Z0-9]/g, "-")
      }.pdf`
    );
  }

  // =====================================================
  // GERAR PDF DA SAÍDA
  // =====================================================

  function gerarPdfSaida({
    saidaId,
    dataSaida,
    solicitante,
    obra,
    produto,
    quantidade,
    precoUnitario,
    valorTotal,
  }) {
    const doc = new jsPDF();

    const margem = 20;

    const nomeProduto =
      produto?.nome ||
      "Produto não informado";

    const sku =
      produto?.sku || "-";

    const codigoAlme =
      produto?.codigo_alme || "-";

    const numeroSaida =
      `#${String(
        saidaId
      ).padStart(6, "0")}`;

    const dataFormatada =
      formatarData(dataSaida);

    // =====================================================
    // CABEÇALHO
    // =====================================================

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(20);

    doc.text(
      "ALME MARCENARIA",
      margem,
      25
    );

    doc.setFontSize(10);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      "Controle de movimentação de estoque",
      margem,
      32
    );

    doc.setLineWidth(0.5);

    doc.line(
      margem,
      38,
      210 - margem,
      38
    );

    // =====================================================
    // TÍTULO
    // =====================================================

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(16);

    doc.text(
      "COMPROVANTE DE SAÍDA",
      margem,
      52
    );

    // =====================================================
    // INFORMAÇÕES
    // =====================================================

    doc.setFontSize(10);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      `Número da saída: ${numeroSaida}`,
      margem,
      65
    );

    doc.text(
      `Data: ${dataFormatada}`,
      margem,
      72
    );

    doc.text(
      `Solicitante: ${solicitante || "-"}`,
      margem,
      79
    );

    const obraReferente =
      obra ||
      "ALME ESTOQUE";

    const linhasObra = doc.splitTextToSize(
      `Obra referente: ${obraReferente}`,
      210 - margem * 2
    );

    doc.text(
      linhasObra,
      margem,
      86
    );

    // =====================================================
    // PRODUTO
    // =====================================================

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "PRODUTO",
      margem,
      99 + (linhasObra.length - 1) * 5
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.text(
      `Nome: ${nomeProduto}`,
      margem,
      108 + (linhasObra.length - 1) * 5
    );

    doc.text(
      `SKU: ${sku}`,
      margem,
      115 + (linhasObra.length - 1) * 5
    );

    doc.text(
      `Código ALME: ${codigoAlme}`,
      margem,
      122 + (linhasObra.length - 1) * 5
    );

    // =====================================================
    // MOVIMENTAÇÃO
    // =====================================================

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "MOVIMENTAÇÃO",
      margem,
      139 + (linhasObra.length - 1) * 5
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.text(
      `Quantidade retirada: ${Number(
        quantidade || 0
      ).toLocaleString("pt-BR")}`,
      margem,
      149 + (linhasObra.length - 1) * 5
    );

    doc.text(
      `Preço unitário: ${formatarMoeda(
        precoUnitario
      )}`,
      margem,
      156 + (linhasObra.length - 1) * 5
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.text(
      `Valor total da saída: ${formatarMoeda(
        valorTotal
      )}`,
      margem,
      166 + (linhasObra.length - 1) * 5
    );

    // =====================================================
    // OBSERVAÇÃO
    // =====================================================

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      "Documento gerado automaticamente pelo sistema de estoque.",
      margem,
      189 + (linhasObra.length - 1) * 5
    );

    // =====================================================
    // ASSINATURAS
    // =====================================================

    const yAssinaturas =
      220 + (linhasObra.length - 1) * 5;

    doc.line(
      margem,
      yAssinaturas,
      90,
      yAssinaturas
    );

    doc.line(
      120,
      yAssinaturas,
      190,
      yAssinaturas
    );

    doc.setFontSize(8);

    doc.text(
      "Responsável pela retirada",
      margem,
      yAssinaturas + 7
    );

    doc.text(
      "Responsável pelo estoque",
      120,
      yAssinaturas + 7
    );

    // =====================================================
    // DOWNLOAD
    // =====================================================

    doc.save(
      `saida-estoque-${numeroSaida.replace(
        "#",
        ""
      )}.pdf`
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="estoque-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="estoque-header">

        <div>

          <span className="estoque-kicker">
            ADMINISTRAÇÃO
          </span>

          <h1>Estoque</h1>

          <p>
            Controle de produtos e movimentações.
          </p>

        </div>

        <div className="estoque-header-actions">

          <button
            type="button"
            className="btn-secondary"
            onClick={abrirNovoProduto}
          >
            + Produto
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setAba("entradas");
              abrirNovaEntrada();
            }}
          >
            + Entrada
          </button>

          <button
            type="button"
            className="btn-dark"
            onClick={() => {
              setAba("saidas");
              abrirNovaSaida();
            }}
          >
            + Saída
          </button>

        </div>

      </header>

      {/* =====================================================
          FILTRO
      ===================================================== */}

      <section className="estoque-filtro">

        <div className="estoque-filtro-header">

          <div>

            <span>FILTRO</span>

            <strong>
              Consultar estoque
            </strong>

          </div>

          {filtroProduto && (
            <button
              type="button"
              className="estoque-filtro-limpar"
              onClick={() =>
                setFiltroProduto("")
              }
            >
              Limpar filtro
            </button>
          )}

        </div>

        <select
          value={filtroProduto}
          onChange={(event) =>
            setFiltroProduto(
              event.target.value
            )
          }
        >

          <option value="">
            Todos os produtos
          </option>

          {produtos.map(
            (produto) => (
              <option
                key={produto.id}
                value={produto.id}
              >
                {produto.nome}

                {produto.sku
                  ? ` — ${produto.sku}`
                  : ""}
              </option>
            )
          )}

        </select>

        {produtoSelecionado && (
          <div className="estoque-filtro-selecionado">

            Produto selecionado:

            <strong>
              {produtoSelecionado.nome}
            </strong>

          </div>
        )}

      </section>

      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="estoque-stats">

        <div className="estoque-stat">

          <span>
            Produtos
          </span>

          <strong>
            {quantidadeProdutos}
          </strong>

        </div>

        {produtoSelecionado && (
          <>

            <div className="estoque-stat">

              <span>
                Unidades em estoque
              </span>

              <strong>
                {quantidadeSelecionada.toLocaleString(
                  "pt-BR"
                )}
              </strong>

            </div>

            <div className="estoque-stat">

              <span>
                Valor total em estoque (PREÇO DE VENDA)
              </span>

              <strong>
                {formatarMoeda(
                  valorEstoqueSelecionado
                )}
              </strong>

            </div>

          </>
        )}

      </section>

      {/* =====================================================
          ABAS
      ===================================================== */}

      <nav className="estoque-tabs">

        <button
          type="button"
          className={
            aba === "resumo"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("resumo")
          }
        >
          Visão geral
        </button>

        <button
          type="button"
          className={
            aba === "produtos"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("produtos")
          }
        >
          Produtos
        </button>

        <button
          type="button"
          className={
            aba === "entradas"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("entradas")
          }
        >
          Entradas
        </button>

        <button
          type="button"
          className={
            aba === "saidas"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("saidas")
          }
        >
          Saídas
        </button>

        <button
          type="button"
          className={
            aba === "devolucoes"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("devolucoes")
          }
        >
          Devoluções
        </button>

      </nav>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="estoque-loading">
          Carregando estoque...
        </div>
      )}

      {/* =====================================================
          ERRO
      ===================================================== */}

      {!loading && erro && (
        <div className="estoque-error">

          <strong>
            Erro ao carregar estoque
          </strong>

          <p>
            {erro}
          </p>

          <button
            type="button"
            onClick={carregarDados}
          >
            Tentar novamente
          </button>

        </div>
      )}

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      {!loading &&
        !erro && (
          <>

            {/* =================================================
                RESUMO
            ================================================= */}

            {aba === "resumo" && (
              <section className="estoque-content">

                <div className="estoque-section-title">

                  <div>

                    <span>
                      INVENTÁRIO
                    </span>

                    <h2>
                      {produtoSelecionado
                        ? `Estoque de ${produtoSelecionado.nome}`
                        : "Produtos em estoque"}
                    </h2>

                  </div>

                </div>

                <div className="estoque-table-wrapper">

                  <table className="estoque-table">

                    <thead>

                      <tr>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th>Código ALME</th>
                        <th>Estoque</th>
                        <th>Valor unitário</th>
                        <th>Preço</th>
                      </tr>

                    </thead>

                    <tbody>

                      {produtosFiltrados.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="6"
                            className="table-empty"
                          >
                            Nenhum produto encontrado.
                          </td>

                        </tr>

                      ) : (

                        produtosFiltrados.map(
                          (produto) => (

                            <tr
                              key={
                                produto.id
                              }
                            >

                              <td>

                                <strong>
                                  {
                                    produto.nome
                                  }
                                </strong>

                              </td>

                              <td>
                                {
                                  produto.sku ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  produto.codigo_alme ||
                                  "-"
                                }
                              </td>

                              <td>

                                <span
                                  className={
                                    Number(
                                      produto.quantidade_atual ||
                                        0
                                    ) <= 0
                                      ? "estoque-zero"
                                      : "estoque-ok"
                                  }
                                >
                                  {
                                    produto.quantidade_atual ||
                                    0
                                  }
                                </span>

                              </td>

                              <td>
                                {formatarMoeda(
                                  produto.valor_unitario
                                )}
                              </td>

                              <td>
                                {formatarMoeda(
                                  produto.preco
                                )}
                              </td>

                            </tr>

                          )
                        )

                      )}

                    </tbody>

                  </table>

                </div>

                <div className="estoque-section-title ultimas">

                  <div>

                    <span>
                      MOVIMENTAÇÕES
                    </span>

                    <h2>
                      {produtoSelecionado
                        ? `Últimas saídas de ${produtoSelecionado.nome}`
                        : "Últimas saídas"}
                    </h2>

                  </div>

                </div>

                <div className="estoque-table-wrapper">

                  <table className="estoque-table">

                    <thead>

                      <tr>
                        <th>Data</th>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th>Quantidade</th>
                        <th>Preço</th>
                        <th>Total</th>
                      </tr>

                    </thead>

                    <tbody>

                      {ultimasSaidasFiltradas.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="6"
                            className="table-empty"
                          >
                            Nenhuma saída registrada.
                          </td>

                        </tr>

                      ) : (

                        ultimasSaidasFiltradas.map(
                          (saida) => (

                            <tr
                              key={
                                saida.id
                              }
                            >

                              <td>
                                {formatarData(
                                  saida.data_saida
                                )}
                              </td>

                              <td>
                                {
                                  saida.nome ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  saida.sku ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  saida.quantidade ||
                                  0
                                }
                              </td>

                              <td>
                                {formatarMoeda(
                                  saida.preco_unitario
                                )}
                              </td>

                              <td>
                                {formatarMoeda(
                                  saida.valor_total
                                )}
                              </td>

                            </tr>

                          )
                        )

                      )}

                    </tbody>

                  </table>

                </div>

              </section>
            )}

            {/* =================================================
                PRODUTOS
            ================================================= */}

            {aba === "produtos" && (
              <section className="estoque-content">

                <div className="estoque-section-title">

                  <div>

                    <span>
                      CADASTRO
                    </span>

                    <h2>
                      Produtos
                    </h2>

                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={
                      abrirNovoProduto
                    }
                  >
                    + Novo produto
                  </button>

                </div>

                <div className="estoque-table-wrapper">

                  <table className="estoque-table">

                    <thead>

                      <tr>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th>Código ALME</th>
                        <th>Estoque</th>
                        <th>Valor unitário</th>
                        <th>Preço</th>
                        <th>Ações</th>
                      </tr>

                    </thead>

                    <tbody>

                      {produtosFiltrados.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="7"
                            className="table-empty"
                          >
                            Nenhum produto encontrado.
                          </td>

                        </tr>

                      ) : (

                        produtosFiltrados.map(
                          (produto) => (

                            <tr
                              key={
                                produto.id
                              }
                            >

                              <td>

                                <strong>
                                  {
                                    produto.nome
                                  }
                                </strong>

                              </td>

                              <td>
                                {
                                  produto.sku ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  produto.codigo_alme ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  produto.quantidade_atual ||
                                  0
                                }
                              </td>

                              <td>
                                {formatarMoeda(
                                  produto.valor_unitario
                                )}
                              </td>

                              <td>
  {formatarMoeda(
    produto.preco
  )}
</td>

<td>
  <div className="table-actions">

    <button
      type="button"
      onClick={() =>
        abrirEditarProduto(
          produto
        )
      }
    >
      Editar
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        removerProduto(
          produto
        )
      }
    >
      Excluir
    </button>

  </div>
</td>

</tr>


                            

                          )
                        )

                      )}

                    </tbody>

                  </table>

                </div>

              </section>
            )}

            {/* =================================================
                ENTRADAS
            ================================================= */}

            {aba === "entradas" && (
              <section className="estoque-content">

                <div className="estoque-section-title">

                  <div>

                    <span>
                      MOVIMENTAÇÃO
                    </span>

                    <h2>
                      Entradas
                    </h2>

                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={
                      abrirNovaEntrada
                    }
                  >
                    + Nova entrada
                  </button>

                </div>

                <div className="estoque-table-wrapper">

                  <table className="estoque-table">

                    <thead>

                      <tr>
                        <th>NF</th>
                        <th>Data</th>
                        <th>Obra</th>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th>Quantidade</th>
                        <th>Valor total</th>
                        <th>Ações</th>
                      </tr>

                    </thead>

                    <tbody>

                      {entradasFiltradas.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="8"
                            className="table-empty"
                          >
                            Nenhuma entrada encontrada.
                          </td>

                        </tr>

                      ) : (

                        entradasFiltradas.map(
                          (entrada) => (

                            <tr
                              key={
                                entrada.id
                              }
                            >

                              <td>
                                {
                                  entrada.nf_entrada ||
                                  "-"
                                }
                              </td>

                              <td>
                                {formatarData(
                                  entrada.data_entrada
                                )}
                              </td>

                              <td>
                                <strong>
                                  {nomeObraPorId(entrada.obra_id)}
                                </strong>
                              </td>

                              <td>

                                <strong>
                                  {
                                    entrada.nome_item ||
                                    "-"
                                  }
                                </strong>

                              </td>

                              <td>
                                {
                                  entrada.sku ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  entrada.quantidade ||
                                  0
                                }
                              </td>

                              <td>
                                {formatarMoeda(
                                  entrada.valor_total
                                )}
                              </td>

                              <td>

                                <div className="table-actions">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirEditarEntrada(
                                        entrada
                                      )
                                    }
                                  >
                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    className="danger"
                                    onClick={() =>
                                      removerEntrada(
                                        entrada
                                      )
                                    }
                                  >
                                    Excluir
                                  </button>

                                </div>

                              </td>

                            </tr>

                          )
                        )

                      )}

                    </tbody>

                  </table>

                </div>

              </section>
            )}

            {/* =================================================
                SAÍDAS
            ================================================= */}

            {aba === "saidas" && (
              <section className="estoque-content">

                <div className="estoque-section-title">

                  <div>

                    <span>
                      MOVIMENTAÇÃO
                    </span>

                    <h2>
                      Saídas
                    </h2>

                  </div>

                  <button
                    type="button"
                    className="btn-dark"
                    onClick={
                      abrirNovaSaida
                    }
                  >
                    + Nova saída
                  </button>

                </div>

                <div className="estoque-table-wrapper">

                  <table className="estoque-table">

                    <thead>

                      <tr>
                        <th>Nº</th>
                        <th>Data</th>
                        <th>Obra</th>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th>Solicitante</th>
                        <th>Quantidade</th>
                        <th>Preço unitário</th>
                        <th>Total</th>
                        <th>Ações</th>
                      </tr>

                    </thead>

                    <tbody>

                      {saidasFiltradas.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="10"
                            className="table-empty"
                          >
                            Nenhuma saída encontrada.
                          </td>

                        </tr>

                      ) : (

                        saidasFiltradas.flatMap(
                          (saida) => {

                            const itens =
                              saida?.estoque_saida_itens ||
                              [];

                            const itensExibidos =
                              filtroProduto
                                ? itens.filter(
                                    (item) =>
                                      String(
                                        item.produto_id
                                      ) ===
                                      String(
                                        filtroProduto
                                      )
                                  )
                                : itens;

                            return itensExibidos.map(
                              (
                                item,
                                index
                              ) => {

                                const produto =
                                  produtos.find(
                                    (p) =>
                                      String(
                                        p.id
                                      ) ===
                                      String(
                                        item.produto_id
                                      )
                                  );

                                // =========================================
                                // PREÇO HISTÓRICO
                                // =========================================

                                const precoUnitario =
                                  Number(
                                    item.preco_unitario ??
                                      item.preco ??
                                      produto?.preco ??
                                      0
                                  );

                                const quantidade =
                                  Number(
                                    item.quantidade ||
                                      0
                                  );

                                // =========================================
                                // TOTAL
                                // =========================================

                                const valorTotal =
                                  Number(
                                    item.valor_total ??
                                      quantidade *
                                        precoUnitario
                                  );

                                return (
                                  <tr
                                    key={`${saida.id}-${item.id || index}`}
                                  >

                                    <td>
                                      #
                                      {String(
                                        saida.id
                                      ).padStart(
                                        6,
                                        "0"
                                      )}
                                    </td>

                                    <td>
                                      {formatarData(
                                        saida.data_saida
                                      )}
                                    </td>

                                    <td>
                                      <strong>
                                        {nomeObraPorId(saida.obra_id)}
                                      </strong>
                                    </td>

                                    <td>

                                      <strong>
                                        {
                                          produto?.nome ||
                                          item.nome ||
                                          "-"
                                        }
                                      </strong>

                                    </td>

                                    <td>
                                      {
                                        produto?.sku ||
                                        item.sku ||
                                        "-"
                                      }
                                    </td>

                                    <td>
                                      {
                                        saida.solicitante ||
                                        "-"
                                      }
                                    </td>

                                    <td>
                                      {quantidade.toLocaleString(
                                        "pt-BR"
                                      )}
                                    </td>

                                    <td>
                                      {formatarMoeda(
                                        precoUnitario
                                      )}
                                    </td>

                                    <td>
                                      {formatarMoeda(
                                        valorTotal
                                      )}
                                    </td>

                                    <td>

                                      <div className="table-actions">

                                        <button
                                          type="button"
                                          onClick={() =>
                                            abrirEditarSaida(
                                              saida,
                                              item
                                            )
                                          }
                                        >
                                          Editar
                                        </button>

                                        <button
                                          type="button"
                                          className="danger"
                                          onClick={() =>
                                            removerSaida(
                                              saida
                                            )
                                          }
                                        >
                                          Excluir
                                        </button>

                                      </div>

                                    </td>

                                  </tr>
                                );
                              }
                            );
                          }
                        )

                      )}

                    </tbody>

                  </table>

                </div>

              </section>
            )}

            {/* =================================================
                DEVOLUÇÕES
            ================================================= */}

            {aba === "devolucoes" && (
              <section className="estoque-content">

                <div className="estoque-section-title">

                  <div>

                    <span>
                      RETORNO AO ESTOQUE
                    </span>

                    <h2>
                      Devoluções
                    </h2>

                    <p className="estoque-section-description">
                      Registre materiais que foram retirados para uma obra e retornaram ao estoque.
                    </p>

                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={abrirNovaDevolucao}
                  >
                    + Nova devolução
                  </button>

                </div>

                <div className="estoque-table-wrapper estoque-devolucoes-table-wrapper">

                  <table className="estoque-table estoque-devolucoes-table">

                    <thead>
                      <tr>
                        <th>Nº</th>
                        <th>Data</th>
                        <th>Obra</th>
                        <th>Saída</th>
                        <th>Item</th>
                        <th>Solicitante</th>
                        <th>Qtd. retirada</th>
                        <th>Qtd. devolvida</th>
                        <th>Valor retirada</th>
                        <th>Valor devolvido</th>
                        <th>Ações</th>
                      </tr>
                    </thead>

                    <tbody>

                      {devolucoes.length === 0 ? (

                        <tr>
                          <td
                            colSpan="11"
                            className="table-empty"
                          >
                            Nenhuma devolução registrada.
                          </td>
                        </tr>

                      ) : (

                        devolucoes.map((devolucao) => (

                          <tr key={devolucao.id}>

                            <td>
                              #
                              {String(
                                devolucao.id
                              ).padStart(6, "0")}
                            </td>

                            <td>
                              {formatarData(
                                devolucao.data_devolucao
                              )}
                            </td>

                            <td>
                              <strong>
                                {nomeObraPorId(
                                  devolucao.obra_id
                                )}
                              </strong>
                            </td>

                            <td>
                              #
                              {String(
                                devolucao.saida_id
                              ).padStart(6, "0")}
                            </td>

                            <td>
                              <strong>
                                {devolucao.item_nome || "-"}
                              </strong>

                              {devolucao.sku && (
                                <small className="estoque-devolucao-sku">
                                  SKU: {devolucao.sku}
                                </small>
                              )}
                            </td>

                            <td>
                              {devolucao.solicitante || "-"}
                            </td>

                            <td>
                              {Number(
                                devolucao.quantidade_retirada || 0
                              ).toLocaleString("pt-BR")}
                            </td>

                            <td>
                              <span className="estoque-devolucao-quantidade">
                                {Number(
                                  devolucao.quantidade_devolvida || 0
                                ).toLocaleString("pt-BR")}
                              </span>
                            </td>

                            <td>
                              {formatarMoeda(
                                devolucao.valor_retirada
                              )}
                            </td>

                            <td>
                              <strong>
                                {formatarMoeda(
                                  devolucao.valor_devolvido
                                )}
                              </strong>
                            </td>

                            <td>
                              <div className="table-actions">

                                <button
                                  type="button"
                                  onClick={() =>
                                    gerarPdfDevolucaoDaLinha(
                                      devolucao
                                    )
                                  }
                                >
                                  PDF
                                </button>

                                <button
                                  type="button"
                                  className="danger"
                                  title="Excluir devolução"
                                  onClick={() =>
                                    removerDevolucao(
                                      devolucao
                                    )
                                  }
                                >
                                  Excluir
                                </button>

                              </div>
                            </td>

                          </tr>

                        ))

                      )}

                    </tbody>

                  </table>

                </div>

              </section>
            )}

          </>
        )}

      {/* =====================================================
          MODAL PRODUTO
      ===================================================== */}

      {modalProduto && (
        <div
          className="estoque-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModalProduto();
            }
          }}
        >

          <div
            className="estoque-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="estoque-modal-header">

              <div>

                <span>
                  {produtoEditando
                    ? "EDIÇÃO"
                    : "CADASTRO"}
                </span>

                <h2>
                  {produtoEditando
                    ? "Editar produto"
                    : "Novo produto"}
                </h2>

                <p>
                  {produtoEditando
                    ? "Atualize as informações do produto."
                    : "Cadastre um novo produto no estoque."}
                </p>

              </div>

              <button
                type="button"
                className="estoque-modal-close"
                onClick={
                  fecharModalProduto
                }
                disabled={
                  salvandoProduto
                }
              >
                ×
              </button>

            </div>

            <form
              className="estoque-modal-form"
              onSubmit={
                salvarProduto
              }
            >

              <div className="estoque-form-group full">

                <label htmlFor="produto-nome">
                  Nome do produto
                </label>

                <input
                  id="produto-nome"
                  type="text"
                  value={
                    formProduto.nome
                  }
                  onChange={(event) =>
                    alterarProduto(
                      "nome",
                      event.target.value
                    )
                  }
                  placeholder="Ex.: MDF Carvalho Natural 18mm"
                  autoFocus
                  disabled={
                    salvandoProduto
                  }
                />

              </div>

              <div className="estoque-form-grid">

                <div className="estoque-form-group">

                  <label htmlFor="produto-sku">
                    SKU
                  </label>

                  <input
                    id="produto-sku"
                    type="text"
                    value={
                      formProduto.sku
                    }
                    onChange={(event) =>
                      alterarProduto(
                        "sku",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: MDF-CAR-18"
                    disabled={
                      salvandoProduto
                    }
                  />

                </div>

                <div className="estoque-form-group">

                  <label htmlFor="produto-codigo">
                    Código ALME
                  </label>

                  <input
                    id="produto-codigo"
                    type="text"
                    value={
                      formProduto.codigoAlme
                    }
                    onChange={(event) =>
                      alterarProduto(
                        "codigoAlme",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: MAT-001"
                    disabled={
                      salvandoProduto
                    }
                  />

                </div>

              </div>

              <div className="estoque-form-grid">

                <div className="estoque-form-group">

                  <label htmlFor="produto-valor">
                    Valor unitário
                  </label>

                  <div className="estoque-input-money">

                    <span>
                      R$
                    </span>

                    <input
                      id="produto-valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formProduto.valorUnitario
                      }
                      onChange={(event) =>
                        alterarProduto(
                          "valorUnitario",
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                      disabled={
                        salvandoProduto
                      }
                    />

                  </div>

                </div>

                <div className="estoque-form-group">

                  <label htmlFor="produto-preco">
                    Preço de venda
                  </label>

                  <div className="estoque-input-money">

                    <span>
                      R$
                    </span>

                    <input
                      id="produto-preco"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formProduto.preco
                      }
                      onChange={(event) =>
                        alterarProduto(
                          "preco",
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                      disabled={
                        salvandoProduto
                      }
                    />

                  </div>

                </div>

              </div>

              {erroProduto && (
                <div className="estoque-modal-error">
                  {erroProduto}
                </div>
              )}

              <div className="estoque-modal-footer">

                <button
                  type="button"
                  className="estoque-modal-cancel"
                  onClick={
                    fecharModalProduto
                  }
                  disabled={
                    salvandoProduto
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="estoque-modal-save"
                  disabled={
                    salvandoProduto
                  }
                >
                  {salvandoProduto
                    ? "Salvando..."
                    : produtoEditando
                      ? "Salvar alterações"
                      : "Cadastrar produto"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          MODAL ENTRADA
      ===================================================== */}

      {modalEntrada && (
        <div
          className="estoque-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModalEntrada();
            }
          }}
        >

          <div
            className="estoque-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="estoque-modal-header">

              <div>

                <span>
                  {entradaEditando
                    ? "EDIÇÃO"
                    : "MOVIMENTAÇÃO"}
                </span>

                <h2>
                  {entradaEditando
                    ? "Editar entrada"
                    : "Nova entrada"}
                </h2>

                <p>
                  Registre a entrada de materiais no estoque.
                </p>

              </div>

              <button
                type="button"
                className="estoque-modal-close"
                onClick={
                  fecharModalEntrada
                }
                disabled={
                  salvandoEntrada
                }
              >
                ×
              </button>

            </div>

            <form
              className="estoque-modal-form"
              onSubmit={
                salvarEntrada
              }
            >

              <div className="estoque-form-group full">

                <label>
                  Produto
                </label>

                <select
                  value={
                    formEntrada.produtoId
                  }
                  onChange={(event) =>
                    selecionarProdutoEntrada(
                      event.target.value
                    )
                  }
                  disabled={
                    salvandoEntrada
                  }
                >

                  <option value="">
                    Selecione um produto
                  </option>

                  {produtos.map(
                    (produto) => (

                      <option
                        key={
                          produto.id
                        }
                        value={
                          produto.id
                        }
                      >
                        {
                          produto.nome
                        }

                        {produto.sku
                          ? ` — ${produto.sku}`
                          : ""}

                      </option>

                    )
                  )}

                </select>

              </div>

              <div className="estoque-form-group full">

                <label htmlFor="entrada-obra">
                  Obra referente
                </label>

                <select
                  id="entrada-obra"
                  value={formEntrada.obraId}
                  onChange={(event) =>
                    alterarEntrada(
                      "obraId",
                      event.target.value
                    )
                  }
                  disabled={
                    salvandoEntrada ||
                    loadingObras
                  }
                >
                  <option value="">
                    ALME ESTOQUE
                  </option>

                  {obras.map((obra) => (
                    <option
                      key={obra.id}
                      value={obra.id}
                    >
                      {obra.nome || `Obra #${obra.id}`}
                    </option>
                  ))}
                </select>

                <small className="estoque-campo-ajuda">
                  {loadingObras
                    ? "Carregando obras da Produção..."
                    : "Selecione uma obra cadastrada em Produção ou mantenha ALME ESTOQUE."}
                </small>

              </div>

              <div className="estoque-form-grid">

                <div className="estoque-form-group">

                  <label>
                    Nota fiscal
                    <span className="campo-obrigatorio">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      formEntrada.nfEntrada
                    }
                    onChange={(event) =>
                      alterarEntrada(
                        "nfEntrada",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 000123"
                    disabled={
                      salvandoEntrada
                    }
                  />

                  <small className="estoque-campo-ajuda">
                    Obrigatório
                  </small>

                </div>

                <div className="estoque-form-group">

                  <label>
                    Quantidade
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formEntrada.quantidade
                    }
                    onChange={(event) =>
                      alterarQuantidadeEntrada(
                        event.target.value
                      )
                    }
                    placeholder="0"
                    disabled={
                      salvandoEntrada
                    }
                  />

                </div>

              </div>

              <div className="estoque-form-grid">

                <div className="estoque-form-group">

                  <label>
                    Valor unitário
                  </label>

                  <div className="estoque-input-money">

                    <span>
                      R$
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formEntrada.valorUnitario
                      }
                      onChange={(event) =>
                        alterarValorUnitarioEntrada(
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                      disabled={
                        salvandoEntrada
                      }
                    />

                  </div>

                </div>

                <div className="estoque-form-group">

                  <label>
                    Valor total
                  </label>

                  <div className="estoque-input-money">

                    <span>
                      R$
                    </span>

                    <input
                      type="number"
                      value={
                        formEntrada.valorTotal
                      }
                      readOnly
                    />

                  </div>

                </div>

              </div>

              <div className="estoque-form-grid">

                <div className="estoque-form-group">

                  <label>
                    Preço de venda
                  </label>

                  <div className="estoque-input-money">

                    <span>
                      R$
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formEntrada.preco
                      }
                      onChange={(event) =>
                        alterarEntrada(
                          "preco",
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                      disabled={
                        salvandoEntrada
                      }
                    />

                  </div>

                </div>

              </div>

              {erroEntrada && (
                <div className="estoque-modal-error">
                  {erroEntrada}
                </div>
              )}

              <div className="estoque-modal-footer">

                <button
                  type="button"
                  className="estoque-modal-cancel"
                  onClick={
                    fecharModalEntrada
                  }
                  disabled={
                    salvandoEntrada
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="estoque-modal-save"
                  disabled={
                    salvandoEntrada
                  }
                >
                  {salvandoEntrada
                    ? "Salvando..."
                    : entradaEditando
                      ? "Salvar alterações"
                      : "Registrar entrada"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          MODAL SAÍDA
      ===================================================== */}

      {modalSaida && (
        <div
          className="estoque-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModalSaida();
            }
          }}
        >

          <div
            className="estoque-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="estoque-modal-header">

              <div>

                <span>
                  MOVIMENTAÇÃO
                </span>

                <h2>
                  {saidaEditando
                    ? "Editar saída"
                    : "Nova saída"}
                </h2>

                <p>
                  Retire materiais disponíveis do estoque.
                </p>

              </div>

              <button
                type="button"
                className="estoque-modal-close"
                onClick={
                  fecharModalSaida
                }
                disabled={
                  salvandoSaida
                }
              >
                ×
              </button>

            </div>

            <form
              className="estoque-modal-form"
              onSubmit={
                salvarSaida
              }
            >

              <div className="estoque-form-group full">

                <label htmlFor="saida-produto">
                  Produto
                </label>

                <select
                  id="saida-produto"
                  value={
                    formSaida.produtoId
                  }
                  onChange={(event) =>
                    alterarSaida(
                      "produtoId",
                      event.target.value
                    )
                  }
                  disabled={
                    salvandoSaida ||
                    !!saidaEditando
                  }
                >

                  <option value="">
                    Selecione um produto
                  </option>

                  {produtos.map(
                    (produto) => {

                      const estoqueAtual =
                        Number(
                          produto.quantidade_atual ||
                            0
                        );

                      return (
                        <option
                          key={
                            produto.id
                          }
                          value={
                            produto.id
                          }
                          disabled={
                            estoqueAtual <=
                            0
                          }
                        >

                          {
                            produto.nome
                          }

                          {" — "}

                          Estoque:{" "}

                          {
                            estoqueAtual
                          }

                        </option>
                      );
                    }
                  )}

                </select>

              </div>

              <div className="estoque-form-group full">

                <label htmlFor="saida-obra">
                  Obra referente
                </label>

                <select
                  id="saida-obra"
                  value={formSaida.obraId}
                  onChange={(event) =>
                    alterarSaida(
                      "obraId",
                      event.target.value
                    )
                  }
                  disabled={
                    salvandoSaida ||
                    loadingObras
                  }
                >
                  <option value="">
                    ALME ESTOQUE
                  </option>

                  {obras.map((obra) => (
                    <option
                      key={obra.id}
                      value={obra.id}
                    >
                      {obra.nome || `Obra #${obra.id}`}
                    </option>
                  ))}
                </select>

                <small className="estoque-campo-ajuda">
                  {loadingObras
                    ? "Carregando obras da Produção..."
                    : "Selecione uma obra cadastrada em Produção ou mantenha ALME ESTOQUE."}
                </small>

              </div>

              {formSaida.produtoId &&
                !saidaEditando && (
                  <div className="estoque-form-help">

                    Estoque disponível:{" "}

                    <strong>

                      {Number(
                        produtos.find(
                          (produto) =>
                            String(
                              produto.id
                            ) ===
                            String(
                              formSaida.produtoId
                            )
                        )?.quantidade_atual ||
                          0
                      )}

                    </strong>

                  </div>
                )}

              <div className="estoque-form-group full">

                <label htmlFor="saida-solicitante">
                  Nome do solicitante
                  <span className="campo-obrigatorio">
                    *
                  </span>
                </label>

                <input
                  id="saida-solicitante"
                  type="text"
                  value={
                    formSaida.solicitante
                  }
                  onChange={(event) =>
                    alterarSaida(
                      "solicitante",
                      event.target.value
                    )
                  }
                  placeholder="Ex.: João da Silva"
                  disabled={
                    salvandoSaida
                  }
                  autoComplete="off"
                />

              </div>

              <div className="estoque-form-group full">

                <label htmlFor="saida-quantidade">
                  Quantidade
                </label>

                <input
                  id="saida-quantidade"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    formSaida.quantidade
                  }
                  onChange={(event) =>
                    alterarSaida(
                      "quantidade",
                      event.target.value
                    )
                  }
                  placeholder="0"
                  disabled={
                    salvandoSaida
                  }
                />

              </div>

              {saidaEditando && (
                <div className="estoque-form-help">

                  O produto não pode ser alterado
                  durante a edição. Altere somente
                  a quantidade.

                </div>
              )}

              {erroSaida && (
                <div className="estoque-modal-error">
                  {erroSaida}
                </div>
              )}

              <div className="estoque-modal-footer">

                <button
                  type="button"
                  className="estoque-modal-cancel"
                  onClick={
                    fecharModalSaida
                  }
                  disabled={
                    salvandoSaida
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="estoque-modal-save"
                  disabled={
                    salvandoSaida
                  }
                >
                  {salvandoSaida
                    ? "Salvando..."
                    : saidaEditando
                      ? "Salvar alterações"
                      : "Registrar saída"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          MODAL DEVOLUÇÃO
      ===================================================== */}

      {modalDevolucao && (
        <div
          className="estoque-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModalDevolucao();
            }
          }}
        >

          <div
            className="estoque-modal estoque-modal-devolucao"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="estoque-modal-header">

              <div>

                <span>
                  RETORNO AO ESTOQUE
                </span>

                <h2>
                  Nova devolução
                </h2>

                <p>
                  Selecione a obra e a saída para carregar automaticamente os dados do material retirado.
                </p>

              </div>

              <button
                type="button"
                className="estoque-modal-close"
                onClick={fecharModalDevolucao}
                disabled={salvandoDevolucao}
              >
                ×
              </button>

            </div>

            <form
              className="estoque-modal-form"
              onSubmit={salvarDevolucao}
            >

              <div className="estoque-form-group full">

                <label htmlFor="devolucao-obra">
                  Obra referente
                </label>

                <select
                  id="devolucao-obra"
                  value={formDevolucao.obraId}
                  onChange={(event) =>
                    selecionarObraDevolucao(
                      event.target.value
                    )
                  }
                  disabled={
                    salvandoDevolucao ||
                    loadingObras
                  }
                >

                  <option value="">
                    ALME ESTOQUE
                  </option>

                  {obras.map((obra) => (
                    <option
                      key={obra.id}
                      value={obra.id}
                    >
                      {obra.nome ||
                        `Obra #${obra.id}`}
                    </option>
                  ))}

                </select>

                <small className="estoque-campo-ajuda">
                  {loadingObras
                    ? "Carregando obras da Produção..."
                    : "As saídas abaixo serão filtradas pela obra selecionada."}
                </small>

              </div>

              <div className="estoque-form-group full">

                <label htmlFor="devolucao-saida">
                  Saída referente
                </label>

                <select
                  id="devolucao-saida"
                  value={formDevolucao.saidaItemId}
                  onChange={(event) =>
                    selecionarSaidaDevolucao(
                      event.target.value
                    )
                  }
                  disabled={
                    salvandoDevolucao ||
                    !formDevolucao.obraId &&
                      !saidasDevolucaoFiltradas.length &&
                      false
                  }
                >

                  <option value="">
                    {formDevolucao.obraId
                      ? saidasDevolucaoFiltradas.length
                        ? "Selecione a saída"
                        : "Nenhuma saída disponível para devolução"
                      : "Selecione a obra primeiro"}
                  </option>

                  {saidasDevolucaoFiltradas.map(
                    (item) => (
                      <option
                        key={item.saidaItemId}
                        value={item.saidaItemId}
                      >
                        #{String(item.saidaId).padStart(6, "0")}
                        {" — "}
                        {item.itemNome}
                        {" — disponível: "}
                        {Number(
                          item.quantidadeDisponivel || 0
                        ).toLocaleString("pt-BR")}
                      </option>
                    )
                  )}

                </select>

                <small className="estoque-campo-ajuda">
                  A lista mostra somente itens da obra escolhida que ainda possuem quantidade disponível para devolução.
                </small>

              </div>

              {saidaItemSelecionadoDevolucao && (
                <>

                  <div className="estoque-devolucao-info-card">

                    <div className="estoque-devolucao-info-header">
                      <span>
                        DADOS DA SAÍDA
                      </span>

                      <strong>
                        #{String(
                          saidaItemSelecionadoDevolucao.saidaId
                        ).padStart(6, "0")}
                      </strong>
                    </div>

                    <div className="estoque-devolucao-info-grid">

                      <div>
                        <span>Item</span>
                        <strong>
                          {saidaItemSelecionadoDevolucao.itemNome}
                        </strong>
                      </div>

                      <div>
                        <span>Quantidade retirada</span>
                        <strong>
                          {Number(
                            saidaItemSelecionadoDevolucao.quantidadeRetirada || 0
                          ).toLocaleString("pt-BR")}
                        </strong>
                      </div>

                      <div>
                        <span>Já devolvido</span>
                        <strong>
                          {Number(
                            saidaItemSelecionadoDevolucao.quantidadeJaDevolvida || 0
                          ).toLocaleString("pt-BR")}
                        </strong>
                      </div>

                      <div>
                        <span>Disponível para devolução</span>
                        <strong className="estoque-devolucao-disponivel">
                          {Number(
                            saidaItemSelecionadoDevolucao.quantidadeDisponivel || 0
                          ).toLocaleString("pt-BR")}
                        </strong>
                      </div>

                      <div>
                        <span>Solicitante</span>
                        <strong>
                          {saidaItemSelecionadoDevolucao.solicitante}
                        </strong>
                      </div>

                      <div>
                        <span>Valor da retirada</span>
                        <strong>
                          {formatarMoeda(
                            saidaItemSelecionadoDevolucao.valorRetirada
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Preço unitário da retirada</span>
                        <strong>
                          {formatarMoeda(
                            saidaItemSelecionadoDevolucao.precoUnitario
                          )}
                        </strong>
                      </div>

                    </div>

                  </div>

                  <div className="estoque-form-grid">

                    <div className="estoque-form-group">

                      <label htmlFor="devolucao-quantidade">
                        Quantidade devolvida
                      </label>

                      <input
                        id="devolucao-quantidade"
                        type="number"
                        min="0"
                        max={
                          saidaItemSelecionadoDevolucao.quantidadeDisponivel
                        }
                        step="0.01"
                        value={
                          formDevolucao.quantidadeDevolvida
                        }
                        onChange={(event) =>
                          alterarDevolucao(
                            "quantidadeDevolvida",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        disabled={salvandoDevolucao}
                      />

                    </div>

                    <div className="estoque-form-group">

                      <label htmlFor="devolucao-valor">
                        Valor devolvido
                      </label>

                      <div className="estoque-input-money">
                        <span>
                          R$
                        </span>

                        <input
                          id="devolucao-valor"
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            valorDevolvidoCalculado.toFixed(2)
                          }
                          readOnly
                          disabled={salvandoDevolucao}
                        />

                      </div>

                      <small className="estoque-campo-ajuda">
                        Calculado automaticamente pela proporção entre a quantidade devolvida e a quantidade retirada, usando o valor da retirada.
                      </small>

                    </div>

                  </div>

                  {formDevolucao.quantidadeDevolvida && (
                    <>
                      <div className="estoque-form-help">
                        Valor calculado da devolução: {" "}
                        <strong>
                          {formatarMoeda(valorDevolvidoCalculado)}
                        </strong>
                      </div>

                      <div className="estoque-form-help">
                        Após esta devolução, restarão aproximadamente{" "}
                        <strong>
                        {Math.max(
                          0,
                          Number(
                            saidaItemSelecionadoDevolucao.quantidadeDisponivel || 0
                          ) -
                            Number(
                              formDevolucao.quantidadeDevolvida || 0
                            )
                        ).toLocaleString("pt-BR")}
                      </strong>{" "}
                        unidade(s) da saída disponíveis para devolução.
                      </div>
                    </>
                  )}

                </>
              )}

              {erroDevolucao && (
                <div className="estoque-modal-error">
                  {erroDevolucao}
                </div>
              )}

              <div className="estoque-modal-footer">

                <button
                  type="button"
                  className="estoque-modal-cancel"
                  onClick={fecharModalDevolucao}
                  disabled={salvandoDevolucao}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="estoque-modal-save"
                  disabled={
                    salvandoDevolucao ||
                    !saidaItemSelecionadoDevolucao
                  }
                >
                  {salvandoDevolucao
                    ? "Salvando..."
                    : "Registrar devolução"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          MODAL DE CONFIRMAÇÃO
      ===================================================== */}

      {modalConfirmacao && (
        <div
          className="estoque-modal-overlay estoque-confirmacao-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharConfirmacao();
            }
          }}
        >

          <div
            className="estoque-modal estoque-modal-confirmacao"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="estoque-confirmacao-icon">
              !
            </div>

            <div className="estoque-modal-header">

              <div>

                <span>
                  CONFIRMAÇÃO
                </span>

                <h2>
                  {confirmacao.titulo}
                </h2>

                <p>
                  {confirmacao.mensagem}
                </p>

              </div>

              <button
                type="button"
                className="estoque-modal-close"
                onClick={
                  fecharConfirmacao
                }
                disabled={
                  confirmando
                }
              >
                ×
              </button>

            </div>

            <div className="estoque-modal-footer">

              <button
                type="button"
                className="estoque-modal-cancel"
                onClick={
                  fecharConfirmacao
                }
                disabled={
                  confirmando
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  confirmacao.tipo ===
                  "danger"
                    ? "estoque-modal-confirm-danger"
                    : "estoque-modal-save"
                }
                onClick={
                  executarConfirmacao
                }
                disabled={
                  confirmando
                }
              >
                {confirmando
                  ? "Excluindo..."
                  : confirmacao.textoConfirmar}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}