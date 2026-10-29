import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiBookOpen, FiCheck, FiCopy, FiDownload, FiEdit2, FiPlus, FiSave, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { jsPDF } from "jspdf";
import { supabase } from "../../../../services/supabase";
import { useAuth } from "../../../../contexts/AuthContext";
import logoAlme from "../../../../imgs/logoamarela.png";
import "./Memorial.scss";

const STATUSES = ["Em alinhamento", "Concluído pelo vendedor", "Analisado pelo coordenador", "Aprovado pelo coordenador"];
const EMPTY = { descricao_comercial: "", descricao_coordenador: "", fotos_comercial: [], fotos_coordenador: [] };
const isAdmin = role => role === "Administrativo Geral";
const errText = error => error?.message || "Não foi possível concluir a operação.";
const quoteLatestVersion = versions => [...(versions || [])].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))[0];
const fileSlug = value => String(value || "memorial").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const money = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarMedidaMm = value => {
  if (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) <= 0) return "";
  return String(Math.round(Number(value) * 1000));
};
const formatarDescricaoItem = item => {
  const mdf = String(item.cor_mdf || "").trim().replace(/\s*[—-]\s*cor\s*\d+\s*$/i, "").replace(/^MDF\s+/i, "");
  const medidas = [
    ["A", formatarMedidaMm(item.altura)],
    ["L", formatarMedidaMm(item.largura)],
    ["P", formatarMedidaMm(item.profundidade)]
  ].filter(([, value]) => value).map(([eixo, value]) => eixo + value).join("x");
  return [item.nome_item || "Item", mdf ? "MDF " + mdf : "", medidas].filter(Boolean).join(" | ");
};
const obterUltimaVersao = memorial => [...(memorial.memorial_versoes || [])].sort((a, b) => b.numero - a.numero)[0];

export default function Memorial() {
  const { user, role } = useAuth();
  const admin = isAdmin(role);
  const [memoriais, setMemoriais] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [versoes, setVersoes] = useState([]);
  const [versao, setVersao] = useState(null);
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [buscaOrcamento, setBuscaOrcamento] = useState("");
  const [loading, setLoading] = useState(true);
  const [rascunhoRestaurado, setRascunhoRestaurado] = useState(false);
  const [scrollRestaurar, setScrollRestaurar] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const chaveRascunho = user?.id ? `alme_memorial_rascunho_${user.id}` : null;
  const userId = user && user.id ? user.id : "";
  const [chaveRascunhoCarregada, setChaveRascunhoCarregada] = useState(null);

  useEffect(() => {
    if (!chaveRascunho) return;
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveRascunho) || "null");
      if (salvo) {
        setSelecionado(salvo.selecionado || null);
        setVersoes(salvo.versoes || []);
        setVersao(salvo.versao || null);
        setDados(salvo.dados || null);
        setBusca(salvo.busca || "");
        setBuscaOrcamento(salvo.buscaOrcamento || "");
        setScrollRestaurar(Number(salvo.scrollY) || 0);
      }
    } catch (error) {
      console.warn("Não foi possível restaurar o rascunho do memorial:", error);
    } finally {
      setRascunhoRestaurado(true);
      setChaveRascunhoCarregada(chaveRascunho);
    }
  }, [chaveRascunho]);

  useEffect(() => {
    if (!rascunhoRestaurado || !chaveRascunho || chaveRascunhoCarregada !== chaveRascunho) return undefined;
    if (!dados) {
      localStorage.removeItem(chaveRascunho);
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(chaveRascunho, JSON.stringify({
          selecionado, versoes, versao, dados, busca, buscaOrcamento,
          scrollY: window.scrollY,
          salvoEm: new Date().toISOString()
        }));
      } catch (error) {
        console.warn("Não foi possível salvar o rascunho local do memorial:", error);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [rascunhoRestaurado, chaveRascunho, chaveRascunhoCarregada, selecionado, versoes, versao, dados, busca, buscaOrcamento]);

  useEffect(() => {
    if (!rascunhoRestaurado || chaveRascunhoCarregada !== chaveRascunho || loading || scrollRestaurar === null) return undefined;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollRestaurar, behavior: "auto" });
      setScrollRestaurar(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [rascunhoRestaurado, chaveRascunho, chaveRascunhoCarregada, loading, scrollRestaurar, dados]);

  useEffect(() => {
    if (!rascunhoRestaurado || !chaveRascunho || chaveRascunhoCarregada !== chaveRascunho) return undefined;
    let timeout;
    const guardarPosicao = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        try {
          const salvo = JSON.parse(localStorage.getItem(chaveRascunho) || "null");
          if (salvo) localStorage.setItem(chaveRascunho, JSON.stringify({ ...salvo, scrollY: window.scrollY }));
        } catch { /* erro de storage não deve bloquear a navegação */ }
      }, 180);
    };
    window.addEventListener("scroll", guardarPosicao, { passive: true });
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("scroll", guardarPosicao);
    };
  }, [rascunhoRestaurado, chaveRascunho, chaveRascunhoCarregada]);

  const carregar = useCallback(async () => {
    setLoading(true); setErro("");
    let quoteQuery = supabase.from("orcamentos")
      .select("id,nome,codigo,cliente,status,assistente_responsavel_id,vendedor_responsavel_id")
      .eq("status", "aprovado");
    if (!admin) {
      quoteQuery = userId
        ? quoteQuery.or("vendedor_responsavel_id.eq." + userId + ",assistente_responsavel_id.eq." + userId)
        : null;
    }
    const [m, q, u] = await Promise.all([
      supabase.from("memoriais").select("*,memorial_versoes(id,numero,status,updated_at,created_at)").order("updated_at", { ascending: false }),
      quoteQuery ? quoteQuery.order("nome", { ascending: true }) : Promise.resolve({ data: [], error: null }),
      supabase.functions.invoke("admin-users", { body: { action: "list" } })
    ]);
    if (m.error) setErro(errText(m.error));
    setMemoriais(m.data || []); setOrcamentos(q.data || []); setUsuarios(u.data?.users || []); setLoading(false);
  }, [admin, userId]);
  useEffect(() => { carregar(); }, [carregar]);

  const itensVisiveis = useMemo(() => memoriais.filter(m => {
    const correspondeBusca = `${m.nome_orcamento} ${m.cliente} ${m.codigo_orcamento || ""}`.toLowerCase().includes(busca.toLowerCase());
    const correspondeStatus = !statusFiltro || (obterUltimaVersao(m)?.status || "") === statusFiltro;
    return correspondeBusca && correspondeStatus;
  }), [memoriais, busca, statusFiltro]);
  const orcamentosDisponiveis = useMemo(() => orcamentos.filter(q => !memoriais.some(m => String(m.orcamento_id) === String(q.id))), [orcamentos, memoriais]);
  const orcamentosPesquisados = useMemo(() => orcamentosDisponiveis.filter(q => `${q.nome || ""} ${q.codigo || ""} ${q.cliente || ""}`.toLowerCase().includes(buscaOrcamento.trim().toLowerCase())), [orcamentosDisponiveis, buscaOrcamento]);
  const nomeResponsavel = id => usuarios.find(u => String(u.id) === String(id))?.nome || usuarios.find(u => String(u.id) === String(id))?.username || usuarios.find(u => String(u.id) === String(id))?.email || "—";

  const carregarMemorial = async (memorial, versionId = null) => {
    setErro("");
    const { data: rows, error: versionError } = await supabase.from("memorial_versoes").select("*").eq("memorial_id", memorial.id).order("numero", { ascending: false });
    if (versionError) { setErro(errText(versionError)); return; }
    const selected = (rows || []).find(v => v.id === versionId) || rows?.[0];
    setSelecionado(memorial); setVersoes(rows || []); setVersao(selected || null);
    setDados(selected ? { ...selected, itens: selected.itens || [] } : null);
  };

  const abrirNovo = async quote => {
    setErro(""); setSucesso("");
    const [quoteResult, versionsResult] = await Promise.all([
      supabase.from("orcamentos").select("*").eq("id", quote.id).single(),
      supabase.from("orcamento_versoes").select("*").eq("orcamento_id", quote.id)
    ]);
    if (quoteResult.error) return setErro(errText(quoteResult.error));
    if (String(quoteResult.data.status || "").toLowerCase() !== "aprovado") return setErro("O memorial só pode ser criado a partir de um orçamento aprovado.");
    if (versionsResult.error) return setErro(errText(versionsResult.error));
    const currentQuoteVersion = quoteLatestVersion(versionsResult.data);
    if (!currentQuoteVersion) return setErro("Este orçamento ainda não tem uma versão salva.");
    const [environmentResult, itemResult] = await Promise.all([
      supabase.from("orcamento_versao_ambientes").select("id,nome,ordem").eq("versao_id", currentQuoteVersion.id).order("ordem", { ascending: true }),
      supabase.from("orcamento_itens").select("*").eq("versao_id", currentQuoteVersion.id).order("ordem", { ascending: true })
    ]);
    if (environmentResult.error || itemResult.error) return setErro(errText(environmentResult.error || itemResult.error));
    if (!(itemResult.data || []).length) return setErro("A versão atual do orçamento não possui itens.");
    const quoteData = quoteResult.data;
    const ambientes = (environmentResult.data || []).map(env => ({ id: env.id, nome: env.nome || "Ambiente", itens: (itemResult.data || []).filter(i => String(i.ambiente_id) === String(env.id)).map(i => ({
      id: crypto.randomUUID(), item_orcamento_id: i.id, quantidade: i.quantidade ?? 0, nome_item: i.nome_item || i.base_item_nome || "Item", altura: i.altura_cm == null ? "" : Number(i.altura_cm) / 100, largura: i.largura_cm == null ? "" : Number(i.largura_cm) / 100, profundidade: i.profundidade_cm == null ? "" : Number(i.profundidade_cm) / 100, cor_mdf: i.mdf_nome || "", valor_memorial: i.valor_memorial_descritivo ?? 0, ...EMPTY
    })) }));
    const header = { orcamento_id: quoteData.id, nome_orcamento: quoteData.nome, cliente: quoteData.cliente || "", codigo_orcamento: quoteData.codigo || "", assistente: nomeResponsavel(quoteData.assistente_responsavel_id), vendedor: nomeResponsavel(quoteData.vendedor_responsavel_id), status: STATUSES[0], versao_orcamento_id: currentQuoteVersion.id, itens: ambientes };
    setSelecionado(null); setVersoes([]); setVersao(null); setDados(header);
  };

  const novaVersao = () => {
    if (!dados || !selecionado) return;
    const next = { ...dados, numero: (versoes[0]?.numero || 0) + 1, status: dados.status || STATUSES[0], itens: structuredClone(dados.itens || []) };
    setVersao(null); setDados(next); setSucesso("Nova versão em edição. Salve para registrar no histórico.");
  };

  const mudarCampo = (ambienteIndex, itemIndex, campo, valor) => setDados(prev => ({ ...prev, itens: prev.itens.map((env, ei) => ei !== ambienteIndex ? env : ({ ...env, itens: env.itens.map((item, ii) => ii !== itemIndex ? item : ({ ...item, [campo]: valor })) })) }));

  const adicionarFotos = async (ambienteIndex, itemIndex, campo, files) => {
    const fotos = [];
    for (const file of Array.from(files || [])) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 8 * 1024 * 1024) { setErro(`A imagem ${file.name} excede 8 MB.`); continue; }
      const path = `${user.id}/${crypto.randomUUID()}-${fileSlug(file.name)}`;
      const { error } = await supabase.storage.from("memorial-fotos").upload(path, file, { upsert: false });
      if (error) { setErro(`Não foi possível anexar ${file.name}: ${error.message}`); continue; }
      fotos.push({ path, name: file.name });
    }
    setDados(prev => ({ ...prev, itens: prev.itens.map((env, ei) => ei !== ambienteIndex ? env : ({ ...env, itens: env.itens.map((item, ii) => ii !== itemIndex ? item : ({ ...item, [campo]: [...(item[campo] || []), ...fotos] })) })) }));
  };

  const removerFoto = (ambienteIndex, itemIndex, campo, foto) => {
    if (!window.confirm(`Remover a foto “${foto.name || "anexada"}” desta versão do memorial?`)) return;
    setDados(prev => ({
      ...prev,
      itens: prev.itens.map((env, ei) => ei !== ambienteIndex ? env : ({
        ...env,
        itens: env.itens.map((item, ii) => ii !== itemIndex ? item : ({
          ...item,
          [campo]: (item[campo] || []).filter(candidate => (candidate.path || candidate.url || candidate.name) !== (foto.path || foto.url || foto.name))
        }))
      }))
    }));
  };

  const salvar = async () => {
    if (!dados) return;
    setSalvando(true); setErro(""); setSucesso("");
    try {
      let memorial = selecionado;
      if (!memorial) {
        const quote = orcamentos.find(q => String(q.id) === String(dados.orcamento_id)) || null;
        if (!quote) throw new Error("Volte à lista e escolha um orçamento aprovado para iniciar o memorial.");
        const { data: newMemorial, error } = await supabase.from("memoriais").insert({ orcamento_id: quote.id, versao_orcamento_id: dados.versao_orcamento_id, nome_orcamento: dados.nome_orcamento, cliente: dados.cliente, codigo_orcamento: dados.codigo_orcamento, assistente: dados.assistente, vendedor: dados.vendedor, criado_por: user.id }).select("*").single();
        if (error) throw error;
        memorial = newMemorial;
      }
      const number = dados.numero || (versoes[0]?.numero || 0) + 1;
      const payload = { memorial_id: memorial.id, numero: number, status: dados.status || STATUSES[0], itens: dados.itens || [], atualizado_por: user.id };
      let result;
      if (versao?.id) result = await supabase.from("memorial_versoes").update(payload).eq("id", versao.id).select("*").single();
      else result = await supabase.from("memorial_versoes").insert(payload).select("*").single();
      if (result.error) throw result.error;
      await carregar(); await carregarMemorial(memorial, result.data.id); setSucesso("Memorial salvo.");
    } catch (error) { setErro(errText(error)); }
    finally { setSalvando(false); }
  };

  const excluir = async memorial => {
    if (!window.confirm(`Excluir o memorial de “${memorial.nome_orcamento}” e todas as suas versões?`)) return;
    const { error } = await supabase.from("memoriais").delete().eq("id", memorial.id);
    if (error) setErro(errText(error)); else { setSucesso("Memorial excluído."); setSelecionado(null); setDados(null); carregar(); }
  };

  const exportarPdf = async () => {
    if (!dados) return;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 9;
    const tableWidth = pageWidth - margin * 2;
    const colors = { brown: "#4B2108", dark: "#321505", gold: "#C98A3D", beige: "#F5EBDD", white: "#FFFFFF", stripe: "#FCFAF7", border: "#E7DCCF", text: "#302720", gray: "#81766D", line: "#EEE7DF" };
    const widths = [14, 92, tableWidth - 106];
    const xs = [margin, margin + widths[0], margin + widths[0] + widths[1]];
    let y = 0;

    const toDataUrl = async source => {
      if (!source) return null;
      if (String(source).startsWith("data:")) return source;
      const response = await fetch(source);
      if (!response.ok) throw new Error("Não foi possível carregar a imagem.");
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };
    const normalizeImage = source => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth || image.width;
          canvas.height = image.naturalHeight || image.height;
          const context = canvas.getContext("2d");
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", .9));
        } catch (error) { reject(error); }
      };
      image.onerror = reject;
      image.src = source;
    });

    let logoData = null;
    try { logoData = await toDataUrl(logoAlme); } catch { /* o nome da empresa permanece no cabeçalho */ }
    const photoCache = new Map();
    const carregarFoto = async photo => {
      const key = photo.path || photo.url || photo.name;
      if (photoCache.has(key)) return photoCache.get(key);
      let url = photo.url;
      if (!url && photo.path) {
        const { data, error } = await supabase.storage.from("memorial-fotos").createSignedUrl(photo.path, 1800);
        if (error) return null;
        url = data?.signedUrl;
      }
      try {
        const image = await normalizeImage(await toDataUrl(url));
        photoCache.set(key, image);
        return image;
      } catch { return null; }
    };

    const desenharTopo = () => {
      pdf.setFillColor(colors.brown);
      pdf.rect(0, 0, pageWidth, 23, "F");
      if (logoData) {
        try { pdf.addImage(logoData, "PNG", margin, 4, 15, 15); } catch { /* logo opcional */ }
      }
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("ALME MARCENARIA", margin + 19, 11.5);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.text("MARCENARIA SOB MEDIDA", margin + 19, 16);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.text("MEMORIAL DESCRITIVO", pageWidth - margin, 9.5, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      

      pdf.setFillColor(colors.stripe);
      pdf.setDrawColor(colors.border);
      pdf.setLineWidth(.35);
      pdf.roundedRect(margin, 26, tableWidth, 16, 2, 2, "FD");
      const fields = [
        { label: "CLIENTE", value: dados.cliente || "—", x: margin + 4, width: 88 },
        { label: "ASSISTENTE", value: dados.assistente || "—", x: 105, width: 52 },
        { label: "VENDEDOR", value: dados.vendedor || "—", x: 163, width: 52 },
        { label: "VERSÃO / STATUS", value: "v" + String(dados.numero || 1), x: 221, width: 65 }
      ];
      fields.forEach(field => {
        pdf.setTextColor(colors.gray);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(5.8);
        pdf.text(field.label, field.x, 31);
        pdf.setTextColor(colors.text);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.2);
        pdf.text(pdf.splitTextToSize(field.value, field.width), field.x, 37);
      });
      pdf.setDrawColor(colors.line);
      [100, 158, 216].forEach(x => pdf.line(x, 29, x, 39));
      y = 48;
    };
    const desenharCabecalho = () => {
      const labels = ["QTD", "DESCRIÇÃO DO ITEM", "DESCRIÇÃO DOS ITENS"];
      pdf.setFillColor(colors.dark);
      pdf.rect(margin, y, tableWidth, 10, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.8);
      pdf.setTextColor(255, 255, 255);
      labels.forEach((label, index) => {
        pdf.text(label, index === 0 ? xs[index] + widths[index] / 2 : xs[index] + 4, y + 6.4, { align: index === 0 ? "center" : "left" });
      });
      pdf.setDrawColor(colors.dark);
      pdf.setLineWidth(.25);
      for (let index = 1; index < xs.length; index += 1) pdf.line(xs[index], y, xs[index], y + 10);
      y += 10;
    };
    const desenharAmbiente = (environment, index) => {
      pdf.setFillColor(colors.beige);
      pdf.setDrawColor(colors.border);
      pdf.roundedRect(margin, y, tableWidth, 9, 2, 2, "FD");
      pdf.setFillColor(colors.gold);
      pdf.circle(margin + 6.5, y + 4.5, 2.6, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(String(index + 1).padStart(2, "0"), margin + 6.5, y + 4.9, { align: "center" });
      pdf.setFontSize(8.2);
      pdf.setTextColor(colors.brown);
      pdf.text(environment.nome || "Ambiente", margin + 12, y + 5.8);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(colors.gray);
      pdf.text(String((environment.itens || []).length) + " item(ns)", pageWidth - margin - 4, y + 5.7, { align: "right" });
      y += 12;
      desenharCabecalho();
    };
    const novaPagina = (environment, index) => {
      pdf.addPage();
      desenharTopo();
      desenharAmbiente(environment, index);
    };

    desenharTopo();
    for (const [environmentIndex, environment] of (dados.itens || []).entries()) {
      if (y + 24 > pageHeight - 12) {
        pdf.addPage();
        desenharTopo();
      }
      desenharAmbiente(environment, environmentIndex);
      for (const [itemIndex, item] of (environment.itens || []).entries()) {
        const photosUnique = [...(item.fotos_comercial || [])].filter((photo, index, all) => {
          const key = photo.path || photo.url || photo.name;
          return key && all.findIndex(other => (other.path || other.url || other.name) === key) === index;
        });
        const photos = (await Promise.all(photosUnique.map(carregarFoto))).filter(Boolean);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        const itemLines = pdf.splitTextToSize(
          formatarDescricaoItem(item),
          widths[1] - 7
        );
        const descriptionLines = pdf.splitTextToSize(String(item.descricao_comercial || "—"), widths[2] - 8);
        const maxRow = pageHeight - 82;
        const descriptionTextHeight = descriptionLines.length * 3.6 + 10;
        const photoRows = Math.ceil(photos.length / 2);
        const photoBoxHeight = photoRows ? Math.max(22, Math.min(44, (maxRow - descriptionTextHeight - 12) / photoRows - 5)) : 0;
        const photoAreaHeight = photoRows ? photoRows * (photoBoxHeight + 5) : 0;
        const itemTextHeight = itemLines.length * 3.7 + 12;
        const rowHeight = Math.min(maxRow, Math.max(29, itemTextHeight, descriptionTextHeight + photoAreaHeight));
        if (y + rowHeight > pageHeight - 11) novaPagina(environment, environmentIndex);

        const top = y;
        pdf.setFillColor(itemIndex % 2 === 0 ? colors.white : colors.stripe);
        pdf.rect(margin, top, tableWidth, rowHeight, "F");
        pdf.setDrawColor(colors.border);
        pdf.setLineWidth(.25);
        pdf.rect(margin, top, tableWidth, rowHeight, "S");
        pdf.setDrawColor(colors.line);
        pdf.line(xs[1], top + 2, xs[1], top + rowHeight - 2);
        pdf.line(xs[2], top + 2, xs[2], top + rowHeight - 2);

        pdf.setFillColor(colors.beige);
        pdf.roundedRect(xs[0] + 2.5, top + rowHeight / 2 - 4.5, widths[0] - 5, 9, 3, 3, "F");
        pdf.setTextColor(colors.brown);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(String(item.quantidade ?? "—"), xs[0] + widths[0] / 2, top + rowHeight / 2 + 1, { align: "center" });

        pdf.setTextColor(colors.text);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(itemLines[0] || "Item", xs[1] + 4, top + 7);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.2);
        if (itemLines.length > 1) {
          pdf.text(itemLines.slice(1, Math.max(2, Math.floor((rowHeight - 10) / 3.7))), xs[1] + 4, top + 12);
        }

        pdf.setTextColor(colors.text);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.7);
        const maxTextLines = Math.max(1, Math.floor((rowHeight - photoAreaHeight - 8) / 3.6));
        pdf.text(descriptionLines.slice(0, maxTextLines), xs[2] + 5, top + 7);

        const imageWidth = (widths[2] - 14) / 2;
        photos.forEach((imageData, photoIndex) => {
          const imageRow = Math.floor(photoIndex / 2);
          const imageColumn = photoIndex % 2;
          const boxY = top + descriptionTextHeight + imageRow * (photoBoxHeight + 5);
          if (boxY + photoBoxHeight > top + rowHeight - 2) return;
          try {
            const props = pdf.getImageProperties(imageData);
            const scale = Math.min(imageWidth / props.width, photoBoxHeight / props.height);
            const drawWidth = props.width * scale;
            const drawHeight = props.height * scale;
          const boxX = xs[2] + 5 + imageColumn * (imageWidth + 5);
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(colors.border);
          pdf.roundedRect(boxX, boxY, imageWidth, photoBoxHeight, 2, 2, "FD");
          pdf.addImage(imageData, "JPEG", boxX + 1.5 + (imageWidth - 3 - drawWidth) / 2, boxY + 1.5 + (photoBoxHeight - 3 - drawHeight) / 2, Math.min(drawWidth, imageWidth - 3), Math.min(drawHeight, photoBoxHeight - 3));
          } catch {
            // Uma foto inválida não interrompe a exportação do memorial.
          }
        });
        y = top + rowHeight;
      }
      y += 6;
    }

    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setDrawColor(colors.border);
      pdf.setLineWidth(.35);
      pdf.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);
      pdf.setTextColor(colors.gray);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("ALME MARCENARIA  ·  MEMORIAL DESCRITIVO", margin, pageHeight - 3);
      pdf.text("Página " + page + " de " + pages, pageWidth - margin, pageHeight - 3, { align: "right" });
    }
    pdf.save("memorial-" + fileSlug(dados.nome_orcamento) + "-v" + String(dados.numero || 1) + ".pdf");
  };

  const voltar = () => { setSelecionado(null); setVersao(null); setDados(null); setErro(""); setSucesso(""); };

  return <main className="memorial-page">
    <header className="memorial-top"><div><span className="memorial-eyebrow">PAINEL ADMINISTRATIVO · COMERCIAL</span><h1>Memorial descritivo</h1><p>Organize as especificações por ambiente e acompanhe cada versão do projeto.</p></div>{dados && <button className="memorial-button memorial-button--ghost" onClick={voltar}><FiArrowLeft /> Voltar à lista</button>}</header>
    {erro && <div className="memorial-alert memorial-alert--error" role="alert">{erro}<button onClick={() => setErro("")} aria-label="Fechar"><FiX /></button></div>}{sucesso && <div className="memorial-alert memorial-alert--success">{sucesso}<button onClick={() => setSucesso("")} aria-label="Fechar"><FiX /></button></div>}
    {!dados ? <section className="memorial-list-panel"><div className="memorial-list-toolbar"><div><h2>Memoriais cadastrados</h2><p>{itensVisiveis.length} de {memoriais.length} projeto(s)</p></div><div className="memorial-list-controls"><label className="memorial-search"><FiSearch /><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar orçamento ou cliente" /></label><label className="memorial-status-filter"><span>Status</span><select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}><option value="">Todos</option>{STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select></label></div></div>
      {loading ? <div className="memorial-empty">Carregando memoriais…</div> : <>
        {itensVisiveis.length > 0 ? <div className="memorial-table-wrap"><table className="memorial-list-table"><thead><tr><th>Orçamento</th><th>Cliente</th><th>Versão atual</th><th>Status</th><th>Atualizado</th><th>Ações</th></tr></thead><tbody>{itensVisiveis.map(m => { const latest = obterUltimaVersao(m); return <tr key={m.id}><td><strong>{m.nome_orcamento}</strong><small>{m.codigo_orcamento || "Sem código"}</small></td><td>{m.cliente || "—"}</td><td>v{latest?.numero || "—"}</td><td><span className={`memorial-status memorial-status--${fileSlug(latest?.status)}`}>{latest?.status || "Sem versão"}</span></td><td>{latest?.updated_at ? new Date(latest.updated_at).toLocaleDateString("pt-BR") : "—"}</td><td className="memorial-actions"><button title="Abrir e editar" onClick={() => carregarMemorial(m)}><FiEdit2 /></button><button title="Excluir" onClick={() => excluir(m)}><FiTrash2 /></button></td></tr>; })}</tbody></table></div> : <div className="memorial-empty"><FiBookOpen /><strong>{memoriais.length ? "Nenhum memorial corresponde à busca ou ao status" : "Nenhum memorial criado"}</strong><span>Escolha um orçamento aprovado abaixo para começar.</span></div>}
        <div className="memorial-quotes">
          <div className="memorial-quotes-heading">
            <div><h3>Criar a partir de orçamento aprovado</h3><p>O memorial será iniciado a partir da versão mais recente do orçamento.</p></div>
            <label className="memorial-search memorial-search--quotes"><FiSearch /><input value={buscaOrcamento} onChange={event => setBuscaOrcamento(event.target.value)} placeholder="Buscar orçamento, código ou cliente" /></label>
          </div>
          {orcamentosPesquisados.length ? orcamentosPesquisados.map(q => <article className="memorial-quote" key={q.id}><div><strong>{q.nome}</strong><span>{q.codigo || "Sem código"} · {q.cliente || "Cliente não informado"}</span></div><button className="memorial-button memorial-button--primary" onClick={() => abrirNovo(q)}><FiPlus /> Criar memorial</button></article>) : <p className="memorial-quotes-empty">{orcamentosDisponiveis.length ? "Nenhum orçamento aprovado corresponde à busca." : admin ? "Nenhum orçamento aprovado disponível para criar um novo memorial." : "Nenhum orçamento aprovado vinculado ao seu usuário."}</p>}
        </div>
      </>}
    </section> : <section className="memorial-editor"><div className="memorial-summary"><div><span className="memorial-eyebrow">ORÇAMENTO {dados.codigo_orcamento || ""}</span><h2>{dados.nome_orcamento}</h2><p>Cliente: <b>{dados.cliente || "—"}</b> <span>·</span> Assistente: <b>{dados.assistente || "—"}</b> <span>·</span> Vendedor: <b>{dados.vendedor || "—"}</b></p></div><div className="memorial-version-control"><label>Versão<select value={versao?.id || "draft"} onChange={e => carregarMemorial(selecionado, e.target.value)} disabled={!selecionado}><option value="draft">{dados.numero ? `Nova versão ${dados.numero}` : "Nova versão"}</option>{versoes.map(v => <option key={v.id} value={v.id}>v{v.numero} · {v.status}</option>)}</select></label>{selecionado && <button className="memorial-button memorial-button--ghost" onClick={novaVersao}><FiCopy /> Criar versão</button>}</div></div>
      <div className="memorial-status-bar"><label>Status<select value={dados.status || STATUSES[0]} onChange={e => setDados({ ...dados, status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><div className="memorial-toolbar"><button className="memorial-button memorial-button--ghost" onClick={exportarPdf}><FiDownload /> Exportar PDF</button><button className="memorial-button memorial-button--primary" disabled={salvando} onClick={salvar}><FiSave /> {salvando ? "Salvando…" : "Salvar versão"}</button></div></div>
      {(dados.itens || []).map((ambiente, ai) => <section className="memorial-environment" key={`${ambiente.id}-${ai}`}>
        <div className="memorial-environment-title"><span>{String(ai + 1).padStart(2, "0")}</span><h3>{ambiente.nome}</h3><small>{ambiente.itens.length} item(ns)</small></div>
        <div className="memorial-fill-table-scroll"><table className="memorial-fill-table"><colgroup><col className="memorial-col-qty"/><col className="memorial-col-item"/><col className="memorial-col-value"/><col className="memorial-col-description"/><col className="memorial-col-description"/></colgroup>
          <thead><tr><th>QTD</th><th>AMBIENTE / DESCRIÇÃO DO ITEM</th><th>VALOR MEMORIAL</th><th>DESCRIÇÃO DOS ITENS</th><th>DESCRIÇÃO DOS ITENS PARA MEMORIAL INTERNO</th></tr></thead>
          <tbody>{ambiente.itens.map((item, ii) => <tr key={item.id}>
            <td className="memorial-qty-cell">{item.quantidade}</td>
            <td className="memorial-item-description"><strong>{formatarDescricaoItem(item)}</strong></td>
            <td className="memorial-value-cell">{money(item.valor_memorial)}</td>
            <td><label className="memorial-table-description"><textarea rows={7} value={item.descricao_comercial || ""} onChange={e => mudarCampo(ai, ii, "descricao_comercial", e.target.value)} placeholder="Descrição comercial do item…"/><span className="memorial-photo-label">Fotos do item</span><input type="file" accept="image/*" multiple onChange={e => adicionarFotos(ai, ii, "fotos_comercial", e.target.files)}/><PhotoList photos={item.fotos_comercial} onRemove={photo => removerFoto(ai, ii, "fotos_comercial", photo)}/></label></td>
            <td><label className={`memorial-table-description ${!admin ? "is-readonly" : ""}`}><textarea rows={7} disabled={!admin} value={item.descricao_coordenador || ""} onChange={e => mudarCampo(ai, ii, "descricao_coordenador", e.target.value)} placeholder={admin ? "Descrição interna para análise do coordenador…" : "Disponível para Administrativo Geral"}/>{admin && <><span className="memorial-photo-label">Fotos do coordenador</span><input type="file" accept="image/*" multiple onChange={e => adicionarFotos(ai, ii, "fotos_coordenador", e.target.files)}/><PhotoList photos={item.fotos_coordenador} onRemove={photo => removerFoto(ai, ii, "fotos_coordenador", photo)}/></>}</label></td>
          </tr>)}</tbody>
        </table></div>
      </section>)}
      <div className="memorial-bottom-actions"><button className="memorial-button memorial-button--ghost" onClick={voltar}><FiArrowLeft /> Voltar</button><button className="memorial-button memorial-button--primary" disabled={salvando} onClick={salvar}><FiCheck /> Salvar versão</button></div>
    </section>}
  </main>;
}

function PhotoList({ photos = [], onRemove }) {
  const [urls, setUrls] = useState({});
  useEffect(() => { let active = true; Promise.all((photos || []).map(async photo => { if (photo.url) return [photo.path || photo.url, photo.url]; const { data } = await supabase.storage.from("memorial-fotos").createSignedUrl(photo.path, 3600); return [photo.path, data?.signedUrl]; })).then(rows => { if (active) setUrls(Object.fromEntries(rows.filter(([, url]) => url))); }); return () => { active = false; }; }, [photos]);
  if (!photos?.length) return null;
  return <div className="memorial-photos">{photos.map((photo, i) => <div className="memorial-photo-card" key={photo.path || i}><a href={urls[photo.path]} target="_blank" rel="noreferrer" title={photo.name}>{urls[photo.path] ? <img src={urls[photo.path]} alt={photo.name || "Imagem do item"}/> : <span>Carregando imagem…</span>}</a>{onRemove && <button type="button" className="memorial-photo-remove" onClick={() => onRemove(photo)} aria-label={`Remover foto ${photo.name || i + 1}`} title="Remover foto"><FiX /></button>}</div>)}</div>;
}
