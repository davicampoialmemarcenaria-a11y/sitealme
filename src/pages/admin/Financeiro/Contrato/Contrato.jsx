import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiBookOpen, FiCheck, FiChevronRight, FiDownload, FiFileText, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { jsPDF } from "jspdf";
import { supabase } from "../../../../services/supabase";
import { useAuth } from "../../../../contexts/AuthContext";
import { CONTRATO_TEMPLATE } from "./contratoTemplate";
import "./Contrato.scss";

const FASES = ["Em análise", "Concluído", "Assinado"];
const AUTORIZACAO_PADRAO = "Autorizo, através desta, a empresa JK MADEIRAS E FERRAGENS LTDA, inscrita no CNPJ 45.915.623/0001-22, a debitar do meu cartão de crédito o valor de R$**{{phase319492352.field356059856}}**\n\nAutorizo ainda a utilização deste crédito por meio dos responsáveis pelas compras da empresa AURA COMERCIO E SERVIÇOS EM MARCENARIA LTDA., inscrita no CNPJ 37.769.397/0001-90.";
const CLIENTE_VAZIO = { nome: "", endereco: "", bairro: "", cidade: "", uf: "", cep: "", cpf: "", telefone: "" };
const TERMOS_VAZIOS = { prazo_entrega_dias: "", valor_contrato: "", valor_entrada: "", parcelas_cartao: 8, codigo_projeto: "", espacamento_paragrafos: 10 };
const errText = error => error?.message || "Não foi possível concluir a operação.";
const nomeVersao = value => Number(value?.versao ?? value?.numero ?? 0);
const maisRecente = (items, field = "versao") => [...(items || [])].sort((a, b) => Number(b[field] || 0) - Number(a[field] || 0))[0] || null;
const dinheiro = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataHora = value => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const medidaEmMm = (item, eixo) => {
  const metros = item[eixo];
  if (metros !== "" && metros != null && Number.isFinite(Number(metros))) return String(Math.round(Number(metros) * 1000));
  const milimetros = item[`${eixo}_mm`];
  if (milimetros !== "" && milimetros != null && Number.isFinite(Number(milimetros))) return String(Math.round(Number(milimetros)));
  const centimetros = item[`${eixo}_cm`];
  if (centimetros !== "" && centimetros != null && Number.isFinite(Number(centimetros))) return String(Math.round(Number(centimetros) * 10));
  return "";
};
const itemTitle = item => {
  const mdf = String(item.mdf_nome || item.cor_mdf || "").trim().replace(/^MDF\s+/i, "").replace(/\s*[—-]\s*cor\s*\d+\s*$/i, "");
  const medidas = [["A", medidaEmMm(item, "altura")], ["L", medidaEmMm(item, "largura")], ["P", medidaEmMm(item, "profundidade")]].filter(([, valor]) => valor).map(([eixo, valor]) => `${eixo}${valor}`).join("x");
  return [item.nome_item || item.base_item_nome || item.nome || "Item", mdf ? `MDF ${mdf}` : "", medidas].filter(Boolean).join(" | ");
};
const valorItem = item => item.preco_final ?? item.valor_final ?? item.valor_total ?? item.calculadoValorComRtArredondado ?? item.valor_memorial_descritivo ?? item.valor_unitario ?? 0;

function escreverGrupo(numero) {
  const unidades = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  if (!numero) return "";
  if (numero === 100) return "cem";
  const partes = [];
  const centena = Math.floor(numero / 100);
  const resto = numero % 100;
  if (centena) partes.push(centenas[centena]);
  if (resto >= 10 && resto < 20) partes.push(especiais[resto - 10]);
  else {
    const dezena = Math.floor(resto / 10);
    const unidade = resto % 10;
    if (dezena) partes.push(dezenas[dezena]);
    if (unidade) partes.push(unidades[unidade]);
  }
  return partes.join(" e ");
}

function numeroPorExtenso(numero) {
  const valor = Math.floor(Math.abs(Number(numero) || 0));
  if (valor === 0) return "zero";
  if (valor > 999999999999) return String(valor);
  const escalas = [
    { base: 1000000000, singular: "bilhão", plural: "bilhões" },
    { base: 1000000, singular: "milhão", plural: "milhões" },
    { base: 1000, singular: "mil", plural: "mil" },
    { base: 1, singular: "", plural: "" }
  ];
  let restante = valor;
  const partes = [];
  escalas.forEach(({ base, singular, plural }) => {
    const grupo = Math.floor(restante / base);
    restante %= base;
    if (!grupo) return;
    if (base === 1000 && grupo === 1) partes.push("mil");
    else if (base === 1) partes.push(escreverGrupo(grupo));
    else partes.push(`${numeroPorExtenso(grupo)} ${grupo === 1 ? singular : plural}`.trim());
  });
  return partes.join(" e ");
}

function valorPorExtenso(valor) {
  const centavosTotal = Math.round(Math.abs(Number(valor) || 0) * 100);
  const reais = Math.floor(centavosTotal / 100);
  const centavos = centavosTotal % 100;
  const reaisTexto = `${numeroPorExtenso(reais)} ${reais === 1 ? "real" : "reais"}`;
  return centavos ? `${reaisTexto} e ${numeroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}` : reaisTexto;
}

const totalOrcamento = snapshot => Number(snapshot?.versao?.valor_final_desejado ?? snapshot?.versao?.preco_final_total ?? snapshot?.versao?.valor_memorial_total ?? 0);
const formatarValorContrato = value => Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PDF_CORES = { marrom: [74, 34, 12], tinta: [53, 37, 27], muted: [125, 108, 92], linha: [225, 213, 200], creme: [248, 242, 232], branco: [255, 255, 255] };
const PDF_MARGEM = 13;
const textoPdf = valor => String(valor ?? "—").replace(/[–—−]/g, "-");

function obterParagrafosContrato(texto) {
  return String(texto || "").split(/\r?\n\s*\r?\n+/).map(paragrafo => paragrafo.trim()).filter(Boolean);
}

async function imagemComoDataUrl(foto) {
  let url = typeof foto === "string" ? foto : null;
  if (!url && foto?.path) {
    const { data } = await supabase.storage.from("memorial-fotos").createSignedUrl(foto.path, 3600);
    url = data?.signedUrl || foto.url;
  }
  if (!url && foto?.url) url = foto.url;
  if (!url) return null;
  try {
    if (url.startsWith("data:image/")) return url;
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function criarPdfContrato({ draft, cotacao, memorial }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - PDF_MARGEM * 2;
  const footerLimit = pageH - 18;
  const paragraphGap = Math.max(0, Math.min(24, Number(draft.termos?.espacamento_paragrafos ?? 10))) * 0.35;
  let y = 0;

  const desenharCabecalho = () => {
    doc.setTextColor(...PDF_CORES.marrom);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ALME MARCENARIA", PDF_MARGEM, 16);
    doc.setFontSize(8);
    doc.setTextColor(...PDF_CORES.muted);
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", PDF_MARGEM, 21);
    doc.setFont("helvetica", "normal");
    doc.text(`Versão ${draft.numero || 1}  ·  ${draft.fase || "Em análise"}`, pageW - PDF_MARGEM, 18, { align: "right" });
    doc.setDrawColor(...PDF_CORES.linha);
    doc.setLineWidth(0.45);
    doc.line(PDF_MARGEM, 25, pageW - PDF_MARGEM, 25);
    y = 31;
  };

  const adicionarPagina = () => {
    doc.addPage();
    desenharCabecalho();
  };

  const garantirEspaco = altura => {
    if (y + altura > footerLimit) adicionarPagina();
  };

  const textoEmBloco = (texto, { bold = false, size = 9, gap = paragraphGap, color = PDF_CORES.tinta, align = "left" } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(textoPdf(texto), contentW);
    const lineH = size * 0.43;
    garantirEspaco(lines.length * lineH + gap + 1);
    const textX = align === "center" ? pageW / 2 : align === "right" ? pageW - PDF_MARGEM : PDF_MARGEM;
    doc.text(lines, textX, y, { align, lineHeightFactor: 1.2 });
    y += lines.length * lineH + gap;
  };

  const desenharTituloSecao = (titulo, subtitulo = "") => {
    garantirEspaco(subtitulo ? 16 : 12);
    doc.setFillColor(...PDF_CORES.creme);
    doc.roundedRect(PDF_MARGEM, y, contentW, subtitulo ? 14 : 10, 2, 2, "F");
    doc.setTextColor(...PDF_CORES.marrom);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(titulo, PDF_MARGEM + 4, y + 6.5);
    if (subtitulo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...PDF_CORES.muted);
      doc.text(subtitulo, PDF_MARGEM + 4, y + 11.2);
    }
    y += subtitulo ? 18 : 14;
  };

  const desenharTabela = async ({ colunas, larguras, linhas, ambiente, memorialMode = false }) => {
    const alturaCabecalho = 8;
    const desenharCabecalhoTabela = () => {
      let x = PDF_MARGEM;
      colunas.forEach((coluna, i) => {
        doc.setFillColor(...PDF_CORES.marrom);
        doc.setDrawColor(...PDF_CORES.marrom);
        doc.rect(x, y, larguras[i], alturaCabecalho, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.3);
        doc.setTextColor(...PDF_CORES.branco);
        doc.text(doc.splitTextToSize(coluna, larguras[i] - 3), x + 1.5, y + 5.2);
        x += larguras[i];
      });
      y += alturaCabecalho;
    };
    if (ambiente) {
      garantirEspaco(13);
      doc.setFillColor(247, 239, 225);
      doc.setDrawColor(...PDF_CORES.linha);
      doc.roundedRect(PDF_MARGEM, y, contentW, 8, 1.5, 1.5, "FD");
      doc.setTextColor(...PDF_CORES.marrom);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(ambiente, PDF_MARGEM + 3, y + 5.3);
      y += 8;
    }
    desenharCabecalhoTabela();
    for (let rowIndex = 0; rowIndex < linhas.length; rowIndex += 1) {
      const row = linhas[rowIndex];
      const imageRows = memorialMode ? Math.ceil((row.fotos?.length || 0) / 2) : 0;
      const imageH = imageRows ? imageRows * 19 + 2 : 0;
      const cellLines = row.valores.map((valor, i) => doc.splitTextToSize(textoPdf(valor || "—"), larguras[i] - 4));
      const maxLines = Math.max(1, ...cellLines.map(lines => lines.length));
      const rowH = Math.max(maxLines * 3.5 + 5, imageH + 5, 11);
      if (y + rowH > footerLimit) {
        adicionarPagina();
        desenharCabecalhoTabela();
      }
      let x = PDF_MARGEM;
      cellLines.forEach((lines, i) => {
        doc.setFillColor(rowIndex % 2 ? 252 : 255, rowIndex % 2 ? 249 : 255, rowIndex % 2 ? 245 : 255);
        doc.setDrawColor(...PDF_CORES.linha);
        doc.rect(x, y, larguras[i], rowH, "FD");
        doc.setTextColor(...PDF_CORES.tinta);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        const align = i === 0 ? "center" : "left";
        doc.text(lines, align === "center" ? x + larguras[i] / 2 : x + 2, y + 4.5, { align, lineHeightFactor: 1.15 });
        if (memorialMode && i === 3 && row.fotos?.length) {
          const cellMaxW = larguras[i] - 4;
          row.fotos.forEach((foto, photoIndex) => {
            if (!foto) return;
            try {
              const col = photoIndex % 2;
              const line = Math.floor(photoIndex / 2);
              const w = Math.min((cellMaxW - 2) / 2, 18);
              const h = 16;
              const imageX = x + 2 + col * (w + 2);
              const imageY = y + 3 + line * 19;
              const type = foto.startsWith("data:image/png") ? "PNG" : foto.startsWith("data:image/webp") ? "WEBP" : "JPEG";
              doc.addImage(foto, type, imageX, imageY, w, h, undefined, "FAST");
            } catch { /* Ignora foto em formato incompatível e mantém o restante do PDF. */ }
          });
        }
        x += larguras[i];
      });
      y += rowH;
    }
    y += 5;
  };

  desenharCabecalho();
  const cliente = draft.cliente || {};
  const dadosCliente = [
    ["CLIENTE", cliente.nome || "—"], ["CPF", cliente.cpf || "—"], ["TELEFONE", cliente.telefone || "—"],
    ["ENDEREÇO", [cliente.endereco, cliente.bairro, cliente.cidade, cliente.uf, cliente.cep].filter(Boolean).join(" · ") || "—"]
  ];
  const cardH = 24;
  garantirEspaco(cardH + 3);
  doc.setDrawColor(...PDF_CORES.linha);
  doc.setFillColor(255, 253, 250);
  doc.roundedRect(PDF_MARGEM, y, contentW, cardH, 2, 2, "FD");
  dadosCliente.forEach(([label, value], index) => {
    const x = PDF_MARGEM + 4 + (index % 3) * (contentW / 3);
    const yy = y + 5 + Math.floor(index / 3) * 8;
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(...PDF_CORES.muted); doc.text(label, x, yy);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...PDF_CORES.tinta); doc.text(doc.splitTextToSize(value, contentW / 3 - 7), x, yy + 3.5);
  });
  y += cardH + 6;

  obterParagrafosContrato(montarTextoContrato(draft.texto_contrato, cliente, draft.termos || {}, cotacao)).forEach((paragrafo, index) => {
    const isTitle = index === 0 && /^INSTRUMENTO PARTICULAR/i.test(paragrafo);
    const isHeading = /^[-–—]\s*(?:\d+\s*[–—-]\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s,./()ºª-]*$/.test(paragrafo);
    textoEmBloco(paragrafo, { bold: isTitle || isHeading, size: isTitle ? 11 : isHeading ? 8.5 : 8.2, gap: isTitle ? 4 : isHeading ? 2.5 : paragraphGap, color: isHeading || isTitle ? PDF_CORES.marrom : PDF_CORES.tinta, align: isTitle ? "center" : "left" });
  });

  if (draft.autorizacao_texto) {
    const authLines = doc.splitTextToSize(draft.autorizacao_texto.replace(/\*\*/g, ""), contentW - 8);
    const authH = authLines.length * 3.6 + 12;
    garantirEspaco(authH + 4);
    doc.setFillColor(...PDF_CORES.creme); doc.setDrawColor(...PDF_CORES.linha); doc.roundedRect(PDF_MARGEM, y, contentW, authH, 2, 2, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...PDF_CORES.marrom); doc.text("AUTORIZAÇÃO DE PAGAMENTO", PDF_MARGEM + 4, y + 5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...PDF_CORES.tinta); doc.text(authLines, PDF_MARGEM + 4, y + 10, { lineHeightFactor: 1.2 });
    y += authH + 6;
  }

  const ambientesOrcamento = cotacao.ambientes || [];
  adicionarPagina();
  desenharTituloSecao("ANEXO I · ORÇAMENTO APROVADO", `${cotacao.orcamento?.nome || "Orçamento"} · Código ${cotacao.orcamento?.codigo || "—"} · Versão ${cotacao.versao?.versao || "—"}`);
  const budgetWidths = [12, 55, 75, 42];
  for (const ambiente of ambientesOrcamento) {
    const rows = (ambiente.itens || []).map(item => ({ valores: [item.quantidade ?? 1, item.nome_item || item.base_item_nome || "Item", [item.altura_cm || item.largura_cm || item.profundidade_cm ? `A${item.altura_cm || 0} × L${item.largura_cm || 0} × P${item.profundidade_cm || 0} mm` : "—", item.mdf_nome || item.cor_mdf || ""].filter(Boolean).join("\n"), dinheiro(valorItem(item))] }));
    await desenharTabela({ colunas: ["QTD.", "DESCRIÇÃO DO ITEM", "MEDIDAS / MDF", "VALOR"], larguras: budgetWidths, linhas: rows, ambiente: ambiente.nome || "Ambiente" });
  }
  const totalQuote = cotacao.versao?.valor_final_desejado ?? cotacao.versao?.preco_final_total ?? cotacao.versao?.valor_memorial_total;
  if (totalQuote != null) textoEmBloco(`TOTAL DO ORÇAMENTO: ${dinheiro(totalQuote)}`, { bold: true, size: 9, align: "right", gap: 6 });

  adicionarPagina();
  desenharTituloSecao("ANEXO II · MEMORIAL DESCRITIVO APROVADO", `${memorial.memorial?.nome_orcamento || "Memorial"} · Versão ${memorial.versao?.numero || "—"} · ${memorial.versao?.status || "—"}`);
  const memorialWidths = [12, 55, 78, 39];
  for (const ambiente of memorial.versao?.itens || []) {
    const rows = await Promise.all((ambiente.itens || []).map(async item => {
      const fotos = [...(item.fotos_comercial || []), ...(item.fotos_coordenador || [])];
      return { valores: [item.quantidade ?? 1, itemTitle(item), item.descricao_comercial || "—", ""], fotos: (await Promise.all(fotos.map(imagemComoDataUrl))).filter(Boolean) };
    }));
    await desenharTabela({ colunas: ["QTD.", "DESCRIÇÃO DO ITEM", "DESCRIÇÃO DOS ITENS", "FOTOS"], larguras: memorialWidths, linhas: rows, ambiente: ambiente.nome || "Ambiente", memorialMode: true });
  }

  const codigoProjeto = draft.termos?.codigo_projeto?.trim() || "—";
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setDrawColor(...PDF_CORES.linha);
    doc.setLineWidth(0.35);
    doc.line(PDF_MARGEM, pageH - 13, pageW - PDF_MARGEM, pageH - 13);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...PDF_CORES.muted);
    doc.text("ALME MARCENARIA", PDF_MARGEM, pageH - 8);
    doc.setFont("helvetica", "normal");
    doc.text(`Código do projeto: ${codigoProjeto}`, pageW / 2, pageH - 8, { align: "center" });
    doc.text(`Página ${pagina} de ${totalPaginas}`, pageW - PDF_MARGEM, pageH - 8, { align: "right" });
  }
  const codigoArquivo = codigoProjeto === "—" ? cotacao.orcamento?.codigo || "ALME" : codigoProjeto;
  doc.save(`Contrato-${codigoArquivo.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`);
}

function montarTextoContrato(template, cliente, termos = {}, snapshot = null) {
  const total = Number(termos.valor_contrato ?? totalOrcamento(snapshot));
  const entradaInformada = termos.valor_entrada !== "" && termos.valor_entrada != null;
  const entrada = entradaInformada ? Number(termos.valor_entrada) || 0 : null;
  const cartao = Math.max(0, total - (entrada ?? 0));
  const endereco = [cliente.endereco, cliente.bairro].filter(Boolean).join(", ") || "Endereço a preencher";
  const cidadeUf = [cliente.cidade, cliente.uf].filter(Boolean).join("-") || "Cidade/UF a preencher";
  return String(template || CONTRATO_TEMPLATE)
    .replace("XXXXXXXXXXXXXXX", cliente.nome || "Nome a preencher")
    .replace("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", endereco)
    .replace("XXX.XXX.XXX-XX", cliente.cpf || "CPF a preencher")
    .replace("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", endereco)
    .replace("XXXXXXX-XX", cidadeUf)
    .replace("XXXXX-XX", cliente.cep || "CEP a preencher")
    .replace("R$XXXXX,00 (XXXXXXXXXXXXXXXXX reais)", `R$ ${formatarValorContrato(total)} (${valorPorExtenso(total)})`)
    .replace("R$ XXXXXX,00 (XXXXXXXXXXXXXX reais)", entradaInformada ? `R$ ${formatarValorContrato(entrada)} (${valorPorExtenso(entrada)})` : "R$ a definir (valor da entrada a definir)")
    .replace("R$ XXXXXX,00 (XXXXXXXXXXXXXXXXXXXXXX reais)", `R$ ${formatarValorContrato(cartao)} (${valorPorExtenso(cartao)})`)
    .replace("oito vezes parcelas", `${Number(termos.parcelas_cartao) || 8} parcelas`)
    .replace("______ dias corridos", `${termos.prazo_entrega_dias || "a definir"} dias corridos`);
}

function TextoAutorizacao({ texto }) {
  const partes = String(texto || "").split(/(\*\*[^*]+\*\*)/g);
  return <>{partes.map((parte, index) => parte.startsWith("**") && parte.endsWith("**")
    ? <strong key={index}>{parte.slice(2, -2)}</strong>
    : <span key={index}>{parte}</span>)}</>;
}

function TextoContrato({ texto }) {
  const paragrafos = String(texto || "").split(/\r?\n\s*\r?\n+/).map(paragrafo => paragrafo.trim()).filter(Boolean);
  return <div className="contrato-paper-copy">{paragrafos.map((paragrafo, index) => {
    const tituloCapa = index === 0 && /^INSTRUMENTO PARTICULAR/i.test(paragrafo);
    const tituloClausula = /^[-–—]\s*(?:\d+\s*[–—-]\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s,./()ºª-]*$/.test(paragrafo);
    return <p className={tituloCapa ? "contrato-copy-title" : tituloClausula ? "contrato-copy-heading" : ""} key={index}>{paragrafo}</p>;
  })}</div>;
}

function Campo({ label, name, value, onChange, required = false }) {
  return <label className="contrato-field"><span>{label}{required && <b> *</b>}</span>
    <input name={name} value={value || ""} onChange={onChange} required={required} />
  </label>;
}

function CampoTermo({ label, name, value, onChange, type = "text", step }) {
  return <label className="contrato-field"><span>{label}</span><input type={type} step={step} min={type === "number" ? 0 : undefined} name={name} value={value ?? ""} onChange={onChange} /></label>;
}

function FotosContrato({ fotos = [] }) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    let ativo = true;
    Promise.all((fotos || []).map(async foto => {
      if (typeof foto === "string") return foto;
      if (foto?.url) return foto.url;
      if (!foto?.path) return null;
      const { data } = await supabase.storage.from("memorial-fotos").createSignedUrl(foto.path, 3600);
      return data?.signedUrl || null;
    })).then(result => { if (ativo) setUrls(result); });
    return () => { ativo = false; };
  }, [fotos]);
  return <div className="contrato-memorial-photos">{urls.map((url, index) => url && <a href={url} target="_blank" rel="noreferrer" key={`${url}-${index}`}><img src={url} alt={`Foto de referência ${index + 1}`} /></a>)}</div>;
}

export default function Contrato() {
  const { user } = useAuth();
  const [view, setView] = useState("list");
  const [contratos, setContratos] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [memoriais, setMemoriais] = useState([]);
  const [selected, setSelected] = useState(null);
  const [versions, setVersions] = useState([]);
  const [version, setVersion] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [assistantFilter, setAssistantFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfExportando, setPdfExportando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true); setError("");
    const [quoteResult, memorialResult, contractResult] = await Promise.all([
      supabase.from("orcamentos").select("*").eq("status", "aprovado").order("updated_at", { ascending: false }),
      supabase.from("memoriais").select("id,orcamento_id,nome_orcamento,codigo_orcamento,cliente,assistente,vendedor,memorial_versoes(id,numero,status,itens,updated_at,created_at)").order("updated_at", { ascending: false }),
      supabase.from("contratos").select("id,orcamento_id,memorial_id,created_at,updated_at,contrato_versoes(id,numero,fase,created_at,updated_at)").order("updated_at", { ascending: false })
    ]);
    let quoteVersions = [];
    let quoteVersionsError = null;
    if (!quoteResult.error && (quoteResult.data || []).length) {
      const { data, error } = await supabase.from("orcamento_versoes")
        .select("id,orcamento_id,versao,updated_at,created_at,preco_final_total,valor_final_desejado,valor_memorial_total")
        .in("orcamento_id", quoteResult.data.map(quote => quote.id)).order("versao", { ascending: false });
      quoteVersionsError = error;
      quoteVersions = data || [];
    }
    const failed = quoteResult.error || quoteVersionsError || memorialResult.error || contractResult.error;
    if (failed) setError(errText(failed));
    setOrcamentos((quoteResult.data || []).map(quote => ({ ...quote, orcamento_versoes: quoteVersions.filter(version => String(version.orcamento_id) === String(quote.id)) })));
    setMemoriais(memorialResult.data || []);
    setContratos(contractResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const contratosMap = useMemo(() => new Map(contratos.map(contract => [String(contract.orcamento_id), contract])), [contratos]);
  const memoriaisAprovados = useMemo(() => memoriais.map(memorial => ({
    ...memorial,
    ultima: maisRecente(memorial.memorial_versoes, "numero")
  })).filter(memorial => memorial.ultima?.status === "Aprovado pelo coordenador"), [memoriais]);
  const disponiveis = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return orcamentos.map(orcamento => {
      const memorial = memoriaisAprovados.find(row => String(row.orcamento_id) === String(orcamento.id));
      return { orcamento, memorial };
    }).filter(({ orcamento, memorial }) => {
      if (!memorial || contratosMap.has(String(orcamento.id))) return false;
      const seller = memorial.vendedor || "";
      const assistant = memorial.assistente || "";
      const searchable = [orcamento.nome, orcamento.codigo, orcamento.cliente, memorial.nome_orcamento, memorial.cliente, seller, assistant].join(" ").toLocaleLowerCase("pt-BR");
      return (!query || searchable.includes(query)) && (!sellerFilter || seller === sellerFilter) && (!assistantFilter || assistant === assistantFilter);
    });
  }, [orcamentos, memoriaisAprovados, contratosMap, search, sellerFilter, assistantFilter]);
  const vendedores = useMemo(() => [...new Set(memoriaisAprovados.map(row => row.vendedor).filter(Boolean))].sort((a,b) => a.localeCompare(b, "pt-BR")), [memoriaisAprovados]);
  const assistentes = useMemo(() => [...new Set(memoriaisAprovados.map(row => row.assistente).filter(Boolean))].sort((a,b) => a.localeCompare(b, "pt-BR")), [memoriaisAprovados]);
  const contratosFiltrados = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return contratos.filter(contract => {
      const latest = maisRecente(contract.contrato_versoes, "numero");
      const quote = orcamentos.find(row => String(row.id) === String(contract.orcamento_id));
      const memorial = memoriais.find(row => String(row.id) === String(contract.memorial_id));
      const searchable = [quote?.nome, quote?.codigo, quote?.cliente, memorial?.nome_orcamento, memorial?.cliente].join(" ").toLocaleLowerCase("pt-BR");
      return (!query || searchable.includes(query)) && (!phaseFilter || latest?.fase === phaseFilter);
    });
  }, [contratos, orcamentos, memoriais, search, phaseFilter]);

  const lerSnapshotAtual = async (orcamentoId, memorialId) => {
    const { data: quote, error: quoteError } = await supabase.from("orcamentos").select("*").eq("id", orcamentoId).single();
    if (quoteError) throw quoteError;
    if (String(quote.status || "").toLowerCase() !== "aprovado") throw new Error("O orçamento não está mais aprovado.");
    const { data: quoteVersions, error: quoteVersionError } = await supabase.from("orcamento_versoes").select("*").eq("orcamento_id", orcamentoId).order("versao", { ascending: false });
    if (quoteVersionError) throw quoteVersionError;
    const quoteVersion = maisRecente(quoteVersions, "versao");
    if (!quoteVersion) throw new Error("Não foi encontrada uma versão salva para este orçamento.");

    const { data: memorial, error: memorialError } = await supabase.from("memoriais").select("id,orcamento_id,nome_orcamento,codigo_orcamento,cliente,assistente,vendedor").eq("id", memorialId).single();
    if (memorialError) throw memorialError;
    if (String(memorial.orcamento_id) !== String(orcamentoId)) throw new Error("O memorial selecionado não pertence a este orçamento.");
    const { data: memorialVersions, error: memorialVersionError } = await supabase.from("memorial_versoes").select("id,numero,status,itens,updated_at,created_at").eq("memorial_id", memorialId).order("numero", { ascending: false });
    if (memorialVersionError) throw memorialVersionError;
    const memorialVersion = maisRecente(memorialVersions, "numero");
    if (!memorialVersion || memorialVersion.status !== "Aprovado pelo coordenador") throw new Error("O memorial não possui uma versão mais recente aprovada pelo coordenador.");

    const [environmentResult, itemResult] = await Promise.all([
      supabase.from("orcamento_versao_ambientes").select("*").eq("versao_id", quoteVersion.id).order("ordem", { ascending: true }),
      supabase.from("orcamento_itens").select("*").eq("versao_id", quoteVersion.id).order("ordem", { ascending: true })
    ]);
    if (environmentResult.error) throw environmentResult.error;
    if (itemResult.error) throw itemResult.error;
    const ambientes = (environmentResult.data || []).map(environment => ({
      ...environment,
      itens: (itemResult.data || []).filter(item => String(item.ambiente_id) === String(environment.id))
    }));
    return {
      versao_orcamento_id: quoteVersion.id,
      versao_memorial_id: memorialVersion.id,
      orcamento_snapshot: { orcamento: quote, versao: quoteVersion, ambientes },
      memorial_snapshot: { memorial, versao: memorialVersion }
    };
  };

  const abrirCriacao = async ({ orcamento, memorial }) => {
    setError(""); setSuccess(""); setSaving(true);
    try {
      const snapshots = await lerSnapshotAtual(orcamento.id, memorial.id);
      setSelected(null); setVersions([]); setVersion(null); setEditing(true);
      setDraft({
        numero: 1, fase: "Em análise", cliente: { ...CLIENTE_VAZIO, nome: memorial.cliente || orcamento.cliente || "" },
        termos: { ...TERMOS_VAZIOS, valor_contrato: totalOrcamento(snapshots.orcamento_snapshot) },
        autorizacao_texto: AUTORIZACAO_PADRAO, texto_contrato: CONTRATO_TEMPLATE, ...snapshots
      });
      setView("form"); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(errText(err)); }
    finally { setSaving(false); }
  };

  const abrirContrato = async (contract, versionId = null) => {
    setError(""); setSuccess(""); setSaving(true);
    try {
      const { data, error: versionError } = await supabase.from("contrato_versoes").select("*").eq("contrato_id", contract.id).order("numero", { ascending: false });
      if (versionError) throw versionError;
      const rows = data || [];
      const chosen = rows.find(row => row.id === versionId) || rows[0];
      if (!chosen) throw new Error("Este contrato ainda não possui versões.");
      setSelected(contract); setVersions(rows); setVersion(chosen); setDraft({ ...chosen, cliente: { ...CLIENTE_VAZIO, ...(chosen.cliente || {}) }, termos: { ...TERMOS_VAZIOS, ...(chosen.termos || {}), valor_contrato: chosen.termos?.valor_contrato ?? totalOrcamento(chosen.orcamento_snapshot) } });
      setEditing(false); setView("document"); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(errText(err)); }
    finally { setSaving(false); }
  };

  const atualizarCliente = event => {
    const { name, value } = event.target;
    setDraft(current => ({ ...current, cliente: { ...current.cliente, [name]: value } }));
  };

  const salvarNovoContrato = async event => {
    event.preventDefault();
    if (!draft || !user?.id) return;
    setSaving(true); setError("");
    let newContractId = null;
    try {
      const fresh = await lerSnapshotAtual(draft.orcamento_snapshot.orcamento.id, draft.memorial_snapshot.memorial.id);
      const { data: contract, error: contractError } = await supabase.from("contratos").insert({
        orcamento_id: draft.orcamento_snapshot.orcamento.id,
        memorial_id: draft.memorial_snapshot.memorial.id,
        criado_por: user.id
      }).select("*").single();
      if (contractError) throw contractError;
      newContractId = contract.id;
      const { data: savedVersion, error: saveVersionError } = await supabase.from("contrato_versoes").insert({
        contrato_id: contract.id, numero: 1, fase: draft.fase || "Em análise", cliente: draft.cliente,
        autorizacao_texto: draft.autorizacao_texto, texto_contrato: draft.texto_contrato || CONTRATO_TEMPLATE, termos: draft.termos || TERMOS_VAZIOS,
        ...fresh, criado_por: user.id
      }).select("*").single();
      if (saveVersionError) throw saveVersionError;
      await carregar();
      setSelected(contract); setVersions([savedVersion]); setVersion(savedVersion); setDraft({ ...savedVersion }); setEditing(false); setView("document");
      setSuccess("Contrato criado com as versões aprovadas mais recentes do orçamento e do memorial.");
    } catch (err) {
      if (newContractId) await supabase.from("contratos").delete().eq("id", newContractId);
      setError(errText(err));
    } finally { setSaving(false); }
  };

  const salvarEdicao = async event => {
    event.preventDefault();
    if (!draft || !selected || !user?.id) return;
    setSaving(true); setError("");
    try {
      const payload = {
        contrato_id: selected.id, numero: draft.numero, fase: draft.fase, cliente: draft.cliente,
        autorizacao_texto: draft.autorizacao_texto, texto_contrato: draft.texto_contrato, termos: draft.termos || TERMOS_VAZIOS,
        versao_orcamento_id: draft.versao_orcamento_id, versao_memorial_id: draft.versao_memorial_id,
        orcamento_snapshot: draft.orcamento_snapshot, memorial_snapshot: draft.memorial_snapshot,
        criado_por: user.id
      };
      let result;
      if (draft.id) result = await supabase.from("contrato_versoes").update(payload).eq("id", draft.id).eq("contrato_id", selected.id).select("*").single();
      else result = await supabase.from("contrato_versoes").insert(payload).select("*").single();
      if (result.error) throw result.error;
      const { data: history, error: historyError } = await supabase.from("contrato_versoes").select("*").eq("contrato_id", selected.id).order("numero", { ascending: false });
      if (historyError) throw historyError;
      setVersions(history || []); setVersion(result.data); setDraft({ ...result.data }); setEditing(false); setSuccess("Versão do contrato salva.");
      await carregar();
    } catch (err) { setError(errText(err)); }
    finally { setSaving(false); }
  };

  const criarNovaVersao = async () => {
    if (!selected || !version) return;
    setSaving(true); setError("");
    try {
      const snapshots = await lerSnapshotAtual(selected.orcamento_id, selected.memorial_id);
      const numero = Math.max(0, ...versions.map(row => Number(row.numero) || 0)) + 1;
      const baseVersion = maisRecente(versions) || version;
      setDraft({ ...baseVersion, id: null, numero, fase: baseVersion.fase || "Em análise", termos: { ...TERMOS_VAZIOS, ...(baseVersion.termos || {}), valor_contrato: totalOrcamento(snapshots.orcamento_snapshot) }, ...snapshots });
      setEditing(true); setView("document");
      setSuccess(`Nova versão v${numero} iniciada com o orçamento e memorial aprovados mais recentes.`);
    } catch (err) { setError(errText(err)); }
    finally { setSaving(false); }
  };

  const excluirContrato = async () => {
    if (!selected || !window.confirm("Excluir este contrato e todas as suas versões? Esta ação não pode ser desfeita.")) return;
    setSaving(true); setError("");
    const { error: deleteError } = await supabase.from("contratos").delete().eq("id", selected.id);
    if (deleteError) setError(errText(deleteError));
    else { setSelected(null); setVersion(null); setVersions([]); setDraft(null); setView("list"); setSuccess("Contrato excluído."); await carregar(); }
    setSaving(false);
  };

  const voltarLista = () => { setView("list"); setSelected(null); setVersion(null); setDraft(null); setEditing(false); };

  const salvarForm = view === "form" ? salvarNovoContrato : salvarEdicao;
  const cotacaoAtual = draft?.orcamento_snapshot || {};
  const memorialAtual = draft?.memorial_snapshot || {};
  const contratoRenderizado = draft ? montarTextoContrato(draft.texto_contrato, draft.cliente || {}, draft.termos || {}, cotacaoAtual) : "";
  const atualizarTermo = event => {
    const { name, value } = event.target;
    setDraft(current => ({ ...current, termos: { ...TERMOS_VAZIOS, ...(current.termos || {}), [name]: value } }));
  };
  const exportarPdf = async () => {
    setError("");
    setPdfExportando(true);
    try {
      await criarPdfContrato({ draft, cotacao: cotacaoAtual, memorial: memorialAtual });
    } catch (err) {
      setError(err?.message || "Não foi possível gerar o PDF do contrato.");
    } finally {
      setPdfExportando(false);
    }
  };

  return <main className="contrato-page">
    <header className="contrato-header">
      <div><span className="contrato-eyebrow">PAINEL ADMINISTRATIVO · FINANCEIRO</span>
        <h1>{view === "document" ? "Contrato" : "Contratos"}</h1>
        <p>{view === "list" ? "Crie e acompanhe contratos vinculados a orçamentos e memoriais aprovados." : "Documento, dados do cliente e anexos aprovados do projeto."}</p>
      </div>
      <button type="button" className="contrato-button contrato-button--light" onClick={async () => {
        if (view === "document" && selected) await abrirContrato(selected, version?.id);
        else await carregar();
      }} disabled={loading || saving}><FiRefreshCw /> Atualizar</button>
    </header>
    {error && <div className="contrato-alert contrato-alert--error" role="alert">{error}</div>}
    {success && <div className="contrato-alert contrato-alert--success" role="status"><FiCheck />{success}<button type="button" onClick={() => setSuccess("")} aria-label="Fechar aviso"><FiX /></button></div>}

    {view === "list" && <>
      <section className="contrato-panel">
        <div className="contrato-toolbar"><div><h2>Contratos cadastrados</h2><p>{contratosFiltrados.length} contrato(s)</p></div>
          <label className="contrato-search"><FiSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar contrato, orçamento ou cliente" /></label>
          <label className="contrato-filter"><span>Fase</span><select value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}><option value="">Todas</option>{FASES.map(phase => <option key={phase}>{phase}</option>)}</select></label>
        </div>
        {loading ? <div className="contrato-empty">Carregando contratos…</div> : contratosFiltrados.length === 0 ? <div className="contrato-empty"><FiFileText /><strong>Nenhum contrato encontrado</strong><span>Use os orçamentos aprovados abaixo para criar um contrato.</span></div> :
          <div className="contrato-list">{contratosFiltrados.map(contract => {
            const quote = orcamentos.find(row => String(row.id) === String(contract.orcamento_id));
            const memorial = memoriais.find(row => String(row.id) === String(contract.memorial_id));
      const latest = maisRecente(contract.contrato_versoes, "numero");
            return <article className="contrato-list-row" key={contract.id}>
              <div><span className="contrato-code">{quote?.codigo || memorial?.codigo_orcamento || "ORÇAMENTO"}</span><h3>{quote?.nome || memorial?.nome_orcamento || "Contrato"}</h3><p>{latest?.cliente?.nome || quote?.cliente || memorial?.cliente || "Cliente não informado"}</p></div>
              <div className="contrato-row-meta"><span>v{latest?.numero || "—"}</span><span className={`contrato-phase contrato-phase--${String(latest?.fase || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ","-")}`}>{latest?.fase || "Sem fase"}</span></div>
              <button type="button" className="contrato-button contrato-button--primary" onClick={() => abrirContrato(contract)}>Abrir contrato <FiChevronRight /></button>
            </article>;
          })}</div>}
      </section>

      <section className="contrato-panel contrato-quotes-panel">
        <div className="contrato-toolbar contrato-toolbar--quotes"><div><span className="contrato-eyebrow">NOVOS CONTRATOS</span><h2>Orçamentos com memorial aprovado</h2><p>Ao criar, o contrato guarda a versão aprovada mais recente do orçamento e do memorial.</p></div>
          <label className="contrato-search"><FiSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar orçamento, código, cliente ou responsável" /></label>
          <label className="contrato-filter"><span>Vendedor</span><select value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}><option value="">Todos</option>{vendedores.map(name => <option key={name}>{name}</option>)}</select></label>
          <label className="contrato-filter"><span>Assistente</span><select value={assistantFilter} onChange={e => setAssistantFilter(e.target.value)}><option value="">Todos</option>{assistentes.map(name => <option key={name}>{name}</option>)}</select></label>
        </div>
        {loading ? <div className="contrato-empty">Carregando orçamentos…</div> : disponiveis.length === 0 ? <div className="contrato-empty"><FiBookOpen /><strong>Nenhum orçamento disponível</strong><span>São exibidos somente orçamentos aprovados com memorial aprovado pelo coordenador.</span></div> :
          <div className="contrato-list">{disponiveis.map(({ orcamento, memorial }) => {
            const quoteLatest = maisRecente(orcamento.orcamento_versoes || [], "versao");
            const memorialLatest = memorial.ultima;
            return <article className="contrato-list-row contrato-quote-row" key={orcamento.id}>
              <div><span className="contrato-code">{orcamento.codigo || memorial.codigo_orcamento || "ORÇAMENTO"}</span><h3>{orcamento.nome || memorial.nome_orcamento || "Orçamento"}</h3><p>{orcamento.cliente || memorial.cliente || "Cliente não informado"}</p>
                <small>Vendedor: {memorial.vendedor || "—"} · Assistente: {memorial.assistente || "—"}</small></div>
              <div className="contrato-row-meta"><span>Orçamento v{quoteLatest?.versao || "—"}</span><span>Memorial v{memorialLatest?.numero || "—"}</span><span className="contrato-phase contrato-phase--aprovado">Aprovado</span></div>
              <button type="button" className="contrato-button contrato-button--primary" disabled={saving} onClick={() => abrirCriacao({ orcamento, memorial })}><FiPlus /> Criar contrato</button>
            </article>;
          })}</div>}
      </section>
    </>}

    {view === "form" && draft && <>
      <button className="contrato-back" type="button" onClick={voltarLista}><FiArrowLeft /> Voltar</button>
      <section className="contrato-form-context"><div><span className="contrato-eyebrow">ORÇAMENTO VINCULADO</span><h2>{cotacaoAtual.orcamento?.nome || "Orçamento"}</h2><p>{cotacaoAtual.orcamento?.codigo || ""} · {cotacaoAtual.orcamento?.cliente || "Cliente não informado"}</p></div>
        <div><span>Orçamento v{cotacaoAtual.versao?.versao}</span><span>Memorial v{memorialAtual.versao?.numero}</span></div></section>
      <form className="contrato-panel contrato-form" onSubmit={salvarForm}>
        <div className="contrato-form-heading"><span className="contrato-eyebrow">DADOS DO CONTRATANTE</span><h2>Preencha as informações do cliente</h2><p>Os dados e os anexos aprovados ficam salvos nesta versão do contrato.</p></div>
        <div className="contrato-fields-grid">
          <Campo label="Nome" name="nome" value={draft.cliente.nome} onChange={atualizarCliente} required />
          <Campo label="Endereço e N°" name="endereco" value={draft.cliente.endereco} onChange={atualizarCliente} required />
          <Campo label="Bairro" name="bairro" value={draft.cliente.bairro} onChange={atualizarCliente} />
          <Campo label="Cidade" name="cidade" value={draft.cliente.cidade} onChange={atualizarCliente} required />
          <Campo label="UF" name="uf" value={draft.cliente.uf} onChange={atualizarCliente} required />
          <Campo label="CEP" name="cep" value={draft.cliente.cep} onChange={atualizarCliente} required />
          <Campo label="CPF" name="cpf" value={draft.cliente.cpf} onChange={atualizarCliente} required />
          <Campo label="Telefone" name="telefone" value={draft.cliente.telefone} onChange={atualizarCliente} required />
          <CampoTermo label="Valor do contrato (R$)" name="valor_contrato" value={draft.termos?.valor_contrato} onChange={atualizarTermo} type="number" step="0.01" />
          <CampoTermo label="Valor da entrada (R$)" name="valor_entrada" value={draft.termos?.valor_entrada} onChange={atualizarTermo} type="number" step="0.01" />
          <CampoTermo label="Parcelas no cartão" name="parcelas_cartao" value={draft.termos?.parcelas_cartao} onChange={atualizarTermo} type="number" step="1" />
          <CampoTermo label="Prazo de entrega (dias corridos)" name="prazo_entrega_dias" value={draft.termos?.prazo_entrega_dias} onChange={atualizarTermo} type="number" step="1" />
          <CampoTermo label="Código manual do projeto (rodapés)" name="codigo_projeto" value={draft.termos?.codigo_projeto} onChange={atualizarTermo} />
          <CampoTermo label="Espaçamento entre parágrafos (px)" name="espacamento_paragrafos" value={draft.termos?.espacamento_paragrafos} onChange={atualizarTermo} type="number" step="1" />
        </div>
        <label className="contrato-textarea-field"><span>Autorização de débito <small>Texto editável</small></span><textarea rows={5} value={draft.autorizacao_texto || ""} onChange={e => setDraft(current => ({ ...current, autorizacao_texto: e.target.value }))} /></label>
        <div className="contrato-form-actions"><button type="button" className="contrato-button contrato-button--light" onClick={voltarLista}>Cancelar</button><button className="contrato-button contrato-button--primary" type="submit" disabled={saving}>{saving ? "Criando…" : <><FiPlus /> Criar contrato</>}</button></div>
      </form>
    </>}

    {view === "document" && draft && selected && <>
      <div className="contrato-document-actions"><button className="contrato-back" type="button" onClick={voltarLista}><FiArrowLeft /> Voltar à lista</button>
        <div className="contrato-action-group"><button className="contrato-button contrato-button--light" type="button" onClick={exportarPdf} disabled={pdfExportando} title="Gerar PDF sem cabeçalhos do navegador"><FiDownload /> {pdfExportando ? "Gerando PDF…" : "Exportar PDF"}</button><label className="contrato-version-select"><span>Versão</span><select value={draft.id ? (version?.id || "draft") : "draft"} onChange={e => abrirContrato(selected, e.target.value)}>{versions.map(row => <option key={row.id} value={row.id}>v{row.numero} · {row.fase}</option>)}{!draft.id && <option value="draft">v{draft.numero} · Nova versão</option>}</select></label>
          {!editing && <><button className="contrato-button contrato-button--light" type="button" onClick={criarNovaVersao} disabled={saving}><FiPlus /> Nova versão</button><button className="contrato-button contrato-button--light" type="button" onClick={() => setEditing(true)}><FiFileText /> Editar versão</button><button className="contrato-button contrato-button--danger" type="button" onClick={excluirContrato} disabled={saving}><FiTrash2 /></button></>}
        </div>
      </div>
      {editing && <form className="contrato-panel contrato-edit-panel" onSubmit={salvarForm}>
        <div className="contrato-form-heading"><span className="contrato-eyebrow">EDIÇÃO {draft.id ? `DA VERSÃO V${draft.numero}` : `DA NOVA VERSÃO V${draft.numero}`}</span><h2>Dados e fase do contrato</h2></div>
        <div className="contrato-fields-grid">
          <Campo label="Nome" name="nome" value={draft.cliente.nome} onChange={atualizarCliente} required />
          <Campo label="Endereço e N°" name="endereco" value={draft.cliente.endereco} onChange={atualizarCliente} required />
          <Campo label="Bairro" name="bairro" value={draft.cliente.bairro} onChange={atualizarCliente} />
          <Campo label="Cidade" name="cidade" value={draft.cliente.cidade} onChange={atualizarCliente} required />
          <Campo label="UF" name="uf" value={draft.cliente.uf} onChange={atualizarCliente} required />
          <Campo label="CEP" name="cep" value={draft.cliente.cep} onChange={atualizarCliente} required />
          <Campo label="CPF" name="cpf" value={draft.cliente.cpf} onChange={atualizarCliente} required />
          <Campo label="Telefone" name="telefone" value={draft.cliente.telefone} onChange={atualizarCliente} required />
          <CampoTermo label="Valor do contrato (R$)" name="valor_contrato" value={draft.termos?.valor_contrato} onChange={atualizarTermo} type="number" step="0.01" />
          <CampoTermo label="Valor da entrada (R$)" name="valor_entrada" value={draft.termos?.valor_entrada} onChange={atualizarTermo} type="number" step="0.01" />
          <CampoTermo label="Parcelas no cartão" name="parcelas_cartao" value={draft.termos?.parcelas_cartao} onChange={atualizarTermo} type="number" step="1" />
          <CampoTermo label="Prazo de entrega (dias corridos)" name="prazo_entrega_dias" value={draft.termos?.prazo_entrega_dias} onChange={atualizarTermo} type="number" step="1" />
          <CampoTermo label="Código manual do projeto (rodapés)" name="codigo_projeto" value={draft.termos?.codigo_projeto} onChange={atualizarTermo} />
          <CampoTermo label="Espaçamento entre parágrafos (px)" name="espacamento_paragrafos" value={draft.termos?.espacamento_paragrafos} onChange={atualizarTermo} type="number" step="1" />
          <label className="contrato-field"><span>Fase do contrato</span><select value={draft.fase} onChange={e => setDraft(current => ({ ...current, fase: e.target.value }))}>{FASES.map(phase => <option key={phase}>{phase}</option>)}</select></label>
        </div>
        <label className="contrato-textarea-field"><span>Autorização de débito</span><textarea rows={5} value={draft.autorizacao_texto || ""} onChange={e => setDraft(current => ({ ...current, autorizacao_texto: e.target.value }))} /></label>
        <label className="contrato-textarea-field"><span>Texto do contrato</span><textarea className="contrato-body-edit" value={draft.texto_contrato || ""} onChange={e => setDraft(current => ({ ...current, texto_contrato: e.target.value }))} /></label>
        <div className="contrato-form-actions"><button type="button" className="contrato-button contrato-button--light" onClick={() => { if (version) setDraft({ ...version, cliente: { ...CLIENTE_VAZIO, ...(version.cliente || {}) }, termos: { ...TERMOS_VAZIOS, ...(version.termos || {}) } }); setEditing(false); setSuccess(""); }}>Cancelar</button><button className="contrato-button contrato-button--primary" type="submit" disabled={saving}>{saving ? "Salvando…" : <><FiSave /> Salvar versão</>}</button></div>
      </form>}
      <article className="contrato-document">
        <header className="contrato-paper-header"><div className="contrato-brand"><span>ALME</span><small>COMÉRCIO E SERVIÇOS EM MARCENARIA</small></div><div><span>DOCUMENTO</span><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong><small>Versão {draft.numero} · {draft.fase}</small></div></header>
        <section className="contrato-client-summary"><h2>Dados do contratante</h2><div><span><small>Nome</small><b>{draft.cliente.nome || "—"}</b></span><span><small>CPF</small><b>{draft.cliente.cpf || "—"}</b></span><span><small>Telefone</small><b>{draft.cliente.telefone || "—"}</b></span><span><small>Endereço</small><b>{[draft.cliente.endereco,draft.cliente.bairro,draft.cliente.cidade,draft.cliente.uf,draft.cliente.cep].filter(Boolean).join(" · ") || "—"}</b></span></div></section>
        <section className="contrato-paper-body" style={{ "--ct-paragraph-gap": `${Number(draft.termos?.espacamento_paragrafos ?? 10)}px` }}><TextoContrato texto={contratoRenderizado} /></section>
        {draft.autorizacao_texto && <section className="contrato-authorization"><span className="contrato-eyebrow">AUTORIZAÇÃO DE PAGAMENTO</span><p><TextoAutorizacao texto={draft.autorizacao_texto} /></p></section>}
        <section className="contrato-annex">
          <header><span>ANEXO I</span><div><h2>Orçamento aprovado</h2><p>{cotacaoAtual.orcamento?.nome || "Orçamento"} · Código {cotacaoAtual.orcamento?.codigo || "—"} · Versão {cotacaoAtual.versao?.versao || "—"}</p></div></header>
          {(cotacaoAtual.ambientes || []).map((environment, index) => <div className="contrato-annex-environment" key={environment.id || index}><h3>{environment.nome || `Ambiente ${index + 1}`}</h3>
            <div className="contrato-table-wrap"><table><thead><tr><th>Qtd.</th><th>Descrição do item</th><th>Medidas / MDF</th><th>Valor</th></tr></thead><tbody>{(environment.itens || []).map((item, itemIndex) => <tr key={item.id || itemIndex}><td>{item.quantidade ?? 1}</td><td>{item.nome_item || item.base_item_nome || "Item"}</td><td>{item.altura_cm || item.largura_cm || item.profundidade_cm ? `A${item.altura_cm || 0} × L${item.largura_cm || 0} × P${item.profundidade_cm || 0} mm` : "—"}{(item.mdf_nome || item.cor_mdf) && <small>{item.mdf_nome || item.cor_mdf}</small>}</td><td>{dinheiro(valorItem(item))}</td></tr>)}</tbody></table></div>
          </div>)}
          <div className="contrato-quote-total"><span>Total do orçamento</span><strong>{dinheiro(cotacaoAtual.versao?.valor_final_desejado ?? cotacaoAtual.versao?.preco_final_total ?? cotacaoAtual.versao?.valor_memorial_total)}</strong></div>
        </section>
        <section className="contrato-annex">
          <header><span>ANEXO II</span><div><h2>Memorial descritivo aprovado</h2><p>{memorialAtual.memorial?.nome_orcamento || "Memorial"} · Versão {memorialAtual.versao?.numero || "—"} · {memorialAtual.versao?.status || "—"}</p></div></header>
          {(memorialAtual.versao?.itens || []).map((environment, index) => <div className="contrato-annex-environment" key={environment.id || index}><h3>{environment.nome || `Ambiente ${index + 1}`}</h3>
            <div className="contrato-table-wrap"><table className="contrato-memorial-table"><thead><tr><th>Qtd.</th><th>Descrição do item</th><th>Descrição dos itens</th><th>Fotos</th></tr></thead><tbody>{(environment.itens || []).map((item, itemIndex) => <tr key={item.id || itemIndex}><td>{item.quantidade ?? 1}</td><td>{itemTitle(item)}</td><td className="contrato-memorial-description">{item.descricao_comercial || "—"}</td><td><FotosContrato fotos={[...(item.fotos_comercial || []), ...(item.fotos_coordenador || [])]} /></td></tr>)}</tbody></table></div>
          </div>)}
        </section>
      </article>
      <footer className="contrato-paper-footer contrato-print-footer"><span>ALME MARCENARIA</span><span>Código do projeto: {draft.termos?.codigo_projeto?.trim() || "—"}</span><span>Contrato · {cotacaoAtual.orcamento?.codigo || ""} · {draft.fase}</span></footer>
    </>}
  </main>;
}
