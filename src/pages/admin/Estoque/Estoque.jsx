import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

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

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // =====================================================
  // MODAL PRODUTO
  // =====================================================

  const [modalProduto, setModalProduto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [erroProduto, setErroProduto] = useState("");

  const [formProduto, setFormProduto] = useState({
    nome: "",
    sku: "",
    codigoAlme: "",
    valorUnitario: "",
    preco: "",
  });

  // =====================================================
  // MODAL ENTRADA
  // =====================================================

  const [modalEntrada, setModalEntrada] = useState(false);
  const [entradaEditando, setEntradaEditando] = useState(null);
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);
  const [erroEntrada, setErroEntrada] = useState("");

  const [formEntrada, setFormEntrada] = useState({
    produtoId: "",
    nfEntrada: "",
    nomeItem: "",
    sku: "",
    codigoAlme: "",
    quantidade: "",
    valorUnitario: "",
    valorTotal: "",
    valorUnitarioFinal: "",
    preco: "",
  });

  // =====================================================
  // MODAL SAÍDA
  // =====================================================

  const [modalSaida, setModalSaida] = useState(false);
  const [saidaEditando, setSaidaEditando] = useState(null);
  const [salvandoSaida, setSalvandoSaida] = useState(false);
  const [erroSaida, setErroSaida] = useState("");

  const [formSaida, setFormSaida] = useState({
    produtoId: "",
    quantidade: "",
    solicitante: "",
  });

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

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const [
        produtosData,
        entradasData,
        saidasData,
        ultimasData,
      ] = await Promise.all([
        listarProdutos(),
        listarEntradas(),
        listarSaidas(),
        listarUltimasSaidas(),
      ]);

      setProdutos(produtosData || []);
      setEntradas(entradasData || []);
      setSaidas(saidasData || []);
      setUltimasSaidas(ultimasData || []);
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

  useEffect(() => {
    carregarDados();
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
  // PRODUTO
  // =====================================================

  function abrirNovoProduto() {
    setProdutoEditando(null);

    setFormProduto({
      nome: "",
      sku: "",
      codigoAlme: "",
      valorUnitario: "",
      preco: "",
    });

    setErroProduto("");
    setModalProduto(true);
  }

  function abrirEditarProduto(produto) {
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

    setFormProduto({
      nome: "",
      sku: "",
      codigoAlme: "",
      valorUnitario: "",
      preco: "",
    });
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
    setFormEntrada({
      produtoId: "",
      nfEntrada: "",
      nomeItem: "",
      sku: "",
      codigoAlme: "",
      quantidade: "",
      valorUnitario: "",
      valorTotal: "",
      valorUnitarioFinal: "",
      preco: "",
    });
  }

  function abrirNovaEntrada() {
    setEntradaEditando(null);
    limparFormEntrada();

    setErroEntrada("");
    setModalEntrada(true);
  }

  function abrirEditarEntrada(entrada) {
    setEntradaEditando(entrada);

    setFormEntrada({
      produtoId:
        entrada?.produto_id ?? "",
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
    setFormSaida({
      produtoId: "",
      quantidade: "",
      solicitante: "",
    });
  }

  function abrirNovaSaida() {
    setSaidaEditando(null);
    limparFormSaida();

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

  // =====================================================
  // GERAR PDF
  // =====================================================

  function gerarPdfSaida({
    saidaId,
    dataSaida,
    solicitante,
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
      95
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.text(
      `Nome: ${nomeProduto}`,
      margem,
      104
    );

    doc.text(
      `SKU: ${sku}`,
      margem,
      111
    );

    doc.text(
      `Código ALME: ${codigoAlme}`,
      margem,
      118
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
      135
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
      145
    );

    doc.text(
      `Preço unitário: ${formatarMoeda(
        precoUnitario
      )}`,
      margem,
      152
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
      162
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
      185
    );

    // =====================================================
    // ASSINATURAS
    // =====================================================

    doc.line(
      margem,
      220,
      90,
      220
    );

    doc.line(
      120,
      220,
      190,
      220
    );

    doc.setFontSize(8);

    doc.text(
      "Responsável pela retirada",
      margem,
      227
    );

    doc.text(
      "Responsável pelo estoque",
      120,
      227
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
                            colSpan="7"
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
                            colSpan="9"
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