import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiImage, FiMessageCircle, FiMessageSquare, FiRefreshCw, FiSave, FiSend, FiSearch, FiX } from "react-icons/fi";
import { supabase } from "../../../../services/supabase";
import { useAuth } from "../../../../contexts/AuthContext";
import "./Memorialprod.scss";

const STATUS_APROVADO = "Aprovado pelo coordenador";
const erroTexto = error => error?.message || "Não foi possível concluir a operação.";
const nomeItem = item => {
  const mdf = String(item.cor_mdf || "").trim().replace(/\s*[—-]\s*cor\s*\d+\s*$/i, "").replace(/^MDF\s+/i, "");
  const mm = value => value === "" || value == null || !Number.isFinite(Number(value)) ? "" : String(Math.round(Number(value) * 1000));
  const medidas = [["A", mm(item.altura)], ["L", mm(item.largura)], ["P", mm(item.profundidade)]].filter(([, value]) => value).map(([axis, value]) => axis + value).join("x");
  return [item.nome_item || "Item sem nome", mdf ? `MDF ${mdf}` : "", medidas].filter(Boolean).join(" | ");
};
const dataHora = value => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)) : "";
const chaveItem = item => String(item.id || item.item_orcamento_id || item.nome_item || "item");

function FotosDoItem({ fotos = [], editavel = false, aoRemover }) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    let ativo = true;
    Promise.all(fotos.map(async foto => {
      if (typeof foto === "string") return foto;
      if (foto?.url) return foto.url;
      if (!foto?.path) return null;
      const { data } = await supabase.storage.from("memorial-fotos").createSignedUrl(foto.path, 3600);
      return data?.signedUrl || null;
    })).then(resultados => { if (ativo) setUrls(resultados); });
    return () => { ativo = false; };
  }, [fotos]);
  if (!urls.length) return null;
  if (!fotos.length && !editavel) return null;
  return <div className="mp-images">{fotos.map((foto, index) => {
    const url = typeof foto === "string" ? foto : (foto?.url || urls[index]);
    return <div className="mp-image-card" key={foto?.path || foto?.url || url || index}>
      {url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={foto?.name || `Imagem de referência ${index + 1}`} /></a> : <span className="mp-image-loading">Carregando foto…</span>}
      {editavel && <button type="button" className="mp-photo-remove" onClick={() => aoRemover?.(foto)} aria-label={`Remover ${foto?.name || "foto"}`} title="Remover foto"><FiX /></button>}
    </div>;
  })}</div>;
}

export default function Memorialprod() {
  const { user, role } = useAuth();
  const admin = role === "Administrativo Geral";
  const [memoriais, setMemoriais] = useState([]);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [versao, setVersao] = useState(null);
  const [itensEditados, setItensEditados] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [perfis, setPerfis] = useState({});
  const [rascunhos, setRascunhos] = useState({});
  const [respostas, setRespostas] = useState({});
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comentando, setComentando] = useState(false);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [comentarioAberto, setComentarioAberto] = useState(null);

  const carregarLista = useCallback(async () => {
    setLoading(true); setErro("");
    const { data, error } = await supabase.from("memoriais")
      .select("id,nome_orcamento,codigo_orcamento,cliente,assistente,vendedor,updated_at,memorial_versoes(id,numero,status,itens,updated_at,created_at)")
      .order("updated_at", { ascending: false });
    if (error) { setErro(erroTexto(error)); setMemoriais([]); setLoading(false); return; }
    const aprovados = (data || []).map(m => ({ ...m, ultima: [...(m.memorial_versoes || [])].sort((a,b) => Number(b.numero)-Number(a.numero))[0] }))
      .filter(m => m.ultima?.status === STATUS_APROVADO);
    setMemoriais(aprovados); setLoading(false);
  }, []);

  const carregarComentarios = useCallback(async memorialId => {
    const { data, error } = await supabase.from("memorial_item_comentarios")
      .select("id,memorial_id,item_id,parent_id,texto,autor_id,autor_nome,created_at,updated_at")
      .eq("memorial_id", memorialId).order("created_at", { ascending: true });
    if (error) { setErro(erroTexto(error)); return; }
    const rows = data || [];
    setComentarios(rows);
    setPerfis(Object.fromEntries(rows.map(row => [row.autor_id, { nome: row.autor_nome }])));
  }, []);

  useEffect(() => { carregarLista(); }, [carregarLista]);

  const abrirMemorial = async memorial => {
    setErro("");
    const { data, error } = await supabase.from("memorial_versoes").select("id,numero,status,itens,updated_at,created_at,atualizado_por")
      .eq("memorial_id", memorial.id).order("numero", { ascending: false }).limit(1).maybeSingle();
    if (error) { setErro(erroTexto(error)); return; }
    if (!data || data.status !== STATUS_APROVADO) { setErro("Este memorial não está mais na situação aprovada para Produção."); await carregarLista(); return; }
    setSelecionado(memorial); setVersao(data); setItensEditados(structuredClone(data.itens || []));
    setModoEdicao(false); setComentarioAberto(null);
    await carregarComentarios(memorial.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const memoriaisFiltrados = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return memoriais.filter(m => !q || [m.nome_orcamento,m.codigo_orcamento,m.cliente,m.vendedor,m.assistente].some(v => String(v || "").toLocaleLowerCase("pt-BR").includes(q)));
  }, [memoriais, busca]);
  const alterouItens = useMemo(() => JSON.stringify(itensEditados) !== JSON.stringify(versao?.itens || []), [itensEditados, versao]);

  const alterarDescricao = (ambienteIndex, itemIndex, campo, valor) => setItensEditados(prev => prev.map((ambiente, ai) => ai !== ambienteIndex ? ambiente : ({
    ...ambiente, itens: (ambiente.itens || []).map((item, ii) => ii !== itemIndex ? item : ({ ...item, [campo]: valor }))
  })));

  const atualizarFotos = (ambienteIndex, itemIndex, campo, atualizar) => setItensEditados(prev => prev.map((ambiente, ai) => ai !== ambienteIndex ? ambiente : ({
    ...ambiente, itens: (ambiente.itens || []).map((item, ii) => ii !== itemIndex ? item : ({
      ...item, [campo]: atualizar(item[campo] || [])
    }))
  })));

  const adicionarFotos = async (ambienteIndex, itemIndex, campo, arquivos) => {
    if (!admin || !user?.id) return;
    setEnviandoFotos(true); setErro("");
    const anexadas = [];
    for (const arquivo of Array.from(arquivos || [])) {
      if (!arquivo.type.startsWith("image/")) { setErro(`O arquivo ${arquivo.name} não é uma imagem.`); continue; }
      if (arquivo.size > 8 * 1024 * 1024) { setErro(`A imagem ${arquivo.name} excede o limite de 8 MB.`); continue; }
      const slug = String(arquivo.name || "foto").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, "");
      const path = `${user.id}/${crypto.randomUUID()}-${slug}`;
      const { error } = await supabase.storage.from("memorial-fotos").upload(path, arquivo, { upsert: false });
      if (error) { setErro(`Não foi possível anexar ${arquivo.name}: ${error.message}`); continue; }
      anexadas.push({ path, name: arquivo.name });
    }
    if (anexadas.length) atualizarFotos(ambienteIndex, itemIndex, campo, atuais => [...atuais, ...anexadas]);
    setEnviandoFotos(false);
  };

  const removerFoto = (ambienteIndex, itemIndex, campo, foto) => {
    atualizarFotos(ambienteIndex, itemIndex, campo, atuais => atuais.filter(item => (item?.path || item?.url || item?.name) !== (foto?.path || foto?.url || foto?.name)));
  };

  const salvarEdicoes = async () => {
    if (!admin || !versao || !selecionado) return;
    setSaving(true); setErro("");
    const { data: maisRecente, error: erroVersao } = await supabase.from("memorial_versoes")
      .select("id,numero,status,itens,updated_at,created_at,atualizado_por")
      .eq("memorial_id", selecionado.id).order("numero", { ascending: false }).limit(1).maybeSingle();
    if (erroVersao) { setErro(erroTexto(erroVersao)); setSaving(false); return; }
    if (!maisRecente || maisRecente.status !== STATUS_APROVADO) {
      setErro("Este memorial não possui mais uma versão aprovada para edição.");
      setSelecionado(null); setVersao(null); setSaving(false); await carregarLista(); return;
    }
    if (maisRecente.id !== versao.id) {
      setVersao(maisRecente); setItensEditados(structuredClone(maisRecente.itens || [])); setModoEdicao(false);
      setErro(`Uma versão mais recente (v${maisRecente.numero}) foi aprovada no Comercial. Carreguei essa versão; confira as alterações antes de salvar.`);
      setSaving(false); await carregarLista(); return;
    }
    const { data, error } = await supabase.from("memorial_versoes").update({ itens: itensEditados, atualizado_por: user.id })
      .eq("id", versao.id).eq("memorial_id", selecionado.id).select("id,numero,status,itens,updated_at,created_at,atualizado_por").single();
    if (error) setErro(erroTexto(error));
    else { setVersao(data); setItensEditados(structuredClone(data.itens || [])); await carregarLista(); }
    setSaving(false);
  };

  const enviarComentario = async ({ itemId, parentId = null, texto }) => {
    const clean = texto.trim();
    if (!clean || !user?.id || !selecionado) return;
    setComentando(true); setErro("");
    const { error } = await supabase.from("memorial_item_comentarios").insert({
      memorial_id: selecionado.id, item_id: String(itemId), parent_id: parentId, texto: clean, autor_id: user.id
    });
    if (error) setErro(erroTexto(error));
    else {
      setRascunhos(prev => ({ ...prev, [itemId]: "" }));
      if (parentId) setRespostas(prev => ({ ...prev, [parentId]: "" }));
      await carregarComentarios(selecionado.id);
    }
    setComentando(false);
  };

  const perfilAutor = id => perfis[id]?.nome || perfis[id]?.username || perfis[id]?.email || (id === user?.id ? user?.email : "Usuário");
  const porItem = useMemo(() => comentarios.reduce((acc, comment) => {
    (acc[comment.item_id] ||= []).push(comment); return acc;
  }, {}), [comentarios]);

  return <main className="memorialprod-page">
    <header className="mp-heading">
      <div><span className="mp-eyebrow">PAINEL ADMINISTRATIVO · PRODUÇÃO</span><h1>Memoriais aprovados</h1>
        <p>Acesse a versão aprovada mais recente e converse sobre cada item do projeto.</p></div>
      <button className="mp-button mp-button--light" type="button" onClick={async () => {
        if (!selecionado) { await carregarLista(); return; }
        if (admin && alterouItens && !window.confirm("Há alterações ainda não salvas. Deseja descartar e carregar a versão aprovada mais recente?")) return;
        const { data, error } = await supabase.from("memorial_versoes").select("id,numero,status,itens,updated_at,created_at,atualizado_por")
          .eq("memorial_id", selecionado.id).order("numero", { ascending: false }).limit(1).maybeSingle();
        if (error) { setErro(erroTexto(error)); return; }
        if (!data || data.status !== STATUS_APROVADO) { setErro("Este memorial não possui uma versão mais recente aprovada pelo coordenador."); setSelecionado(null); setVersao(null); await carregarLista(); return; }
        setVersao(data); setItensEditados(structuredClone(data.itens || [])); setModoEdicao(false);
        await Promise.all([carregarComentarios(selecionado.id), carregarLista()]);
      }}><FiRefreshCw /> Atualizar</button>
    </header>
    {erro && <div className="mp-alert" role="alert">{erro}</div>}

    {!selecionado ? <section className="mp-panel">
      <div className="mp-toolbar"><div><h2>Memoriais para produção</h2><p>{memoriaisFiltrados.length} memorial(is) aprovado(s)</p></div>
        <label className="mp-search"><FiSearch /><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar orçamento ou cliente" /></label></div>
      {loading ? <div className="mp-empty">Carregando memoriais…</div> : memoriaisFiltrados.length === 0 ? <div className="mp-empty">Nenhum memorial aprovado encontrado.</div> :
        <div className="mp-list">{memoriaisFiltrados.map(m => <article className="mp-list-row" key={m.id}>
          <div className="mp-list-main"><span className="mp-code">{m.codigo_orcamento || "ORÇAMENTO"}</span><h3>{m.nome_orcamento || "Memorial descritivo"}</h3>
            <p>{m.cliente || "Cliente não informado"}</p></div>
          <div className="mp-list-meta"><span>Versão <b>v{m.ultima.numero}</b></span><span className="mp-approved">{m.ultima.status}</span></div>
          <button className="mp-button mp-button--primary" type="button" onClick={() => abrirMemorial(m)}>Abrir memorial <FiArrowLeft className="mp-arrow" /></button>
        </article>)}</div>}
    </section> : <>
      <button className="mp-back" type="button" onClick={() => { setSelecionado(null); setVersao(null); }}>← Voltar à lista</button>
      <section className="mp-detail-head"><div><span className="mp-eyebrow">{selecionado.codigo_orcamento || "MEMORIAL APROVADO"}</span>
        <h2>{selecionado.nome_orcamento || "Memorial descritivo"}</h2><p>{selecionado.cliente || "Cliente não informado"}</p></div>
        <div className="mp-detail-meta"><span>Assistente<strong>{selecionado.assistente || "—"}</strong></span><span>Vendedor<strong>{selecionado.vendedor || "—"}</strong></span>
          <span>Versão<strong>v{versao?.numero}</strong></span><span className="mp-approved">{versao?.status}</span></div></section>
      <div className="mp-summary-toolbar">
        <div><span className="mp-eyebrow">VISUALIZAÇÃO</span><h3>{modoEdicao ? "Edição do memorial" : "Resumo do memorial"}</h3><p>{modoEdicao ? "Edite as descrições e salve esta versão." : "Tabela consolidada por ambiente. Passe o mouse ou clique na bolinha para abrir os comentários do item."}</p></div>
        {admin && <div className="mp-summary-actions">
          <button className={`mp-button ${modoEdicao ? "mp-button--light" : "mp-button--primary"}`} type="button" onClick={() => setModoEdicao(value => !value)}>{modoEdicao ? "Voltar ao resumo" : "Editar memorial"}</button>
          {modoEdicao && <button className="mp-button mp-button--primary" type="button" disabled={!alterouItens || saving || enviandoFotos} onClick={salvarEdicoes}><FiSave /> {saving ? "Salvando…" : enviandoFotos ? "Enviando foto…" : "Salvar alterações"}</button>}
        </div>}
      </div>
      <div className="mp-environments">{(itensEditados || []).map((ambiente, ai) => <section className="mp-environment" key={ambiente.id || ai}>
        <div className="mp-environment-title"><span>{String(ai + 1).padStart(2,"0")}</span><h3>{ambiente.nome || `Ambiente ${ai + 1}`}</h3><small>{(ambiente.itens || []).length} itens</small></div>
        <div className="mp-table-scroll"><table className="mp-summary-table"><thead><tr>
          <th className="mp-col-qty">QTD</th><th>AMBIENTE / DESCRIÇÃO DO ITEM</th><th className="mp-col-value">VALOR MEMORIAL</th>
          <th>DESCRIÇÃO DOS ITENS</th><th>DESCRIÇÃO DOS ITENS PARA MEMORIAL INTERNO</th>
        </tr></thead><tbody>{(ambiente.itens || []).map((item, ii) => {
          const itemKey = chaveItem(item); const comments = porItem[itemKey] || []; const roots = comments.filter(c => !c.parent_id);
          const aberto = comentarioAberto === itemKey;
          return <Fragment key={itemKey}>
            <tr className="mp-summary-row" key={itemKey}>
              <td className="mp-qty-cell">{item.quantidade || 1}</td>
              <td><div className="mp-item-label">
                <button className={`mp-comment-bubble ${aberto ? "is-open" : ""}`} type="button" aria-label={`${comments.length} comentários neste item`} aria-expanded={aberto}
                  title="Comentários do item" onClick={() => setComentarioAberto(current => current === itemKey ? null : itemKey)}>
                  <FiMessageCircle /><span>{comments.length}</span>
                </button>
                <div><strong>{nomeItem(item)}</strong></div>
              </div></td>
              <td className="mp-value-cell">{item.valor_memorial == null ? "—" : Number(item.valor_memorial).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td>
              <td><div className="mp-table-description">{admin && modoEdicao ? <textarea rows={4} value={item.descricao_comercial || ""} onChange={e => alterarDescricao(ai,ii,"descricao_comercial",e.target.value)} placeholder="Descrição comercial do item" /> : <p>{item.descricao_comercial || "—"}</p>}
                {admin && modoEdicao && <label className="mp-photo-upload"><FiImage />{enviandoFotos ? "Enviando foto…" : "Adicionar fotos"}<input type="file" accept="image/*" multiple disabled={enviandoFotos} onChange={e => { adicionarFotos(ai,ii,"fotos_comercial",e.target.files); e.target.value = ""; }} /></label>}
                <FotosDoItem fotos={item.fotos_comercial || []} editavel={admin && modoEdicao} aoRemover={foto => removerFoto(ai,ii,"fotos_comercial",foto)} /></div></td>
              <td><div className="mp-table-description">{admin && modoEdicao ? <textarea rows={4} value={item.descricao_coordenador || ""} onChange={e => alterarDescricao(ai,ii,"descricao_coordenador",e.target.value)} placeholder="Descrição interna do coordenador" /> : <p>{item.descricao_coordenador || "—"}</p>}
                {admin && modoEdicao && <label className="mp-photo-upload"><FiImage />{enviandoFotos ? "Enviando foto…" : "Adicionar fotos"}<input type="file" accept="image/*" multiple disabled={enviandoFotos} onChange={e => { adicionarFotos(ai,ii,"fotos_coordenador",e.target.files); e.target.value = ""; }} /></label>}
                <FotosDoItem fotos={item.fotos_coordenador || []} editavel={admin && modoEdicao} aoRemover={foto => removerFoto(ai,ii,"fotos_coordenador",foto)} /></div></td>
            </tr>
            <tr className={`mp-comment-panel-row ${aberto ? "is-open" : ""}`}><td colSpan={5}><section className="mp-inline-comments">
              <header><div><FiMessageSquare /><strong>Comentários do item</strong><span>{comments.length}</span></div><button type="button" onClick={() => setComentarioAberto(null)} aria-label="Fechar comentários"><FiX /></button></header>
              {roots.length ? <div className="mp-thread">{roots.map(comment => <article className="mp-comment" key={comment.id}>
                <div className="mp-avatar">{perfilAutor(comment.autor_id).trim().charAt(0).toUpperCase()}</div><div className="mp-comment-body"><div className="mp-comment-author"><strong>{perfilAutor(comment.autor_id)}</strong><time>{dataHora(comment.created_at)}</time></div><p>{comment.texto}</p>
                  <button className="mp-reply-trigger" type="button" onClick={() => setRespostas(prev => ({...prev,[comment.id]: prev[comment.id] ?? ""}))}>Responder</button>
                  {comments.filter(reply => reply.parent_id === comment.id).map(reply => <div className="mp-reply" key={reply.id}><div className="mp-avatar mp-avatar--small">{perfilAutor(reply.autor_id).trim().charAt(0).toUpperCase()}</div><div><div className="mp-comment-author"><strong>{perfilAutor(reply.autor_id)}</strong><time>{dataHora(reply.created_at)}</time></div><p>{reply.texto}</p></div></div>)}
                  {Object.hasOwn(respostas, comment.id) && <form className="mp-reply-form" onSubmit={e => { e.preventDefault(); enviarComentario({itemId:itemKey,parentId:comment.id,texto:respostas[comment.id] || ""}); }}><textarea value={respostas[comment.id]} onChange={e => setRespostas(prev => ({...prev,[comment.id]:e.target.value}))} rows={2} maxLength={20000} placeholder="Escreva uma resposta…" /><button type="submit" disabled={comentando || !respostas[comment.id]?.trim()}><FiSend /> Enviar</button></form>}
                </div></article>)}</div> : <p className="mp-no-comments">Ainda não há comentários neste item.</p>}
              <form className="mp-comment-form" onSubmit={e => { e.preventDefault(); enviarComentario({itemId:itemKey,texto:rascunhos[itemKey] || ""}); }}>
                <textarea rows={3} maxLength={20000} value={rascunhos[itemKey] || ""} onChange={e => setRascunhos(prev => ({...prev,[itemKey]:e.target.value}))} placeholder="Adicionar comentário para este item…" />
                <div><small>Seu nome e horário serão registrados automaticamente.</small><button type="submit" disabled={comentando || !rascunhos[itemKey]?.trim()}><FiSend /> Comentar</button></div>
              </form>
            </section></td></tr>
          </Fragment>;
        })}</tbody></table></div>
      </section>)}</div>
      <footer className="mp-updated">Versão salva em {dataHora(versao?.updated_at || versao?.created_at)}.</footer>
    </>}
  </main>;
}
