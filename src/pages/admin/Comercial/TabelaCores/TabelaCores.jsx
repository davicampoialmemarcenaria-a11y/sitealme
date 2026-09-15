
import { useEffect, useState } from "react";

import {
    FiEdit2,
    FiPlus,
    FiSearch,
    FiTrash2,
    FiX,
    FiDroplet
} from "react-icons/fi";

import {
    supabase
} from "../../../../services/supabase";

import "./TabelaCores.scss";


/* =====================================================
   STORAGE
===================================================== */

const TABELA_CORES_STORAGE_KEY =
    "alme_tabela_cores_formulario";


export default function TabelaCores() {

    const [mdfs, setMdfs] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        nome: "",
        preco_m2: "",
        fora_preco_mdf: false
    });


    /* =====================================================
       CARREGAR MDFs
    ===================================================== */

    async function carregarMdfs() {

        setLoading(true);

        setError("");

        const {
            data,
            error: supabaseError
        } = await supabase
            .from("mdfs")
            .select("*")
            .order("nome", {
                ascending: true
            });


        if (supabaseError) {

            console.error(
                "Erro ao carregar MDFs:",
                supabaseError
            );

            setError(
                "Não foi possível carregar a tabela de cores."
            );

            setMdfs([]);

        } else {

            setMdfs(data || []);

        }

        setLoading(false);
    }


    /* =====================================================
       CARREGAR TABELA AO ENTRAR
    ===================================================== */

    useEffect(() => {

        carregarMdfs();

    }, []);


    /* =====================================================
       RESTAURAR FORMULÁRIO
    ===================================================== */

    useEffect(() => {

        try {

            const salvo =
                sessionStorage.getItem(
                    TABELA_CORES_STORAGE_KEY
                );


            if (!salvo) {

                return;

            }


            const dados =
                JSON.parse(salvo);


            if (
                !dados ||
                typeof dados !== "object"
            ) {

                return;

            }


            if (dados.modalOpen) {

                setModalOpen(true);

            }


            if (
                dados.editingId !== undefined
            ) {

                setEditingId(
                    dados.editingId || null
                );

            }


            if (dados.form) {

                setForm({
                    nome:
                        dados.form.nome || "",

                    preco_m2:
                        dados.form.preco_m2 || "",

                    fora_preco_mdf:
                        Boolean(
                            dados.form
                                .fora_preco_mdf
                        )
                });

            }

        } catch (storageError) {

            console.error(
                "Erro ao restaurar formulário:",
                storageError
            );

        }

    }, []);


    /* =====================================================
       SALVAR RASCUNHO AUTOMATICAMENTE
    ===================================================== */

    useEffect(() => {

        if (!modalOpen) {

            return;

        }


        try {

            const dados = {

                modalOpen: true,

                editingId,

                form

            };


            sessionStorage.setItem(
                TABELA_CORES_STORAGE_KEY,
                JSON.stringify(dados)
            );

        } catch (storageError) {

            console.error(
                "Erro ao salvar rascunho:",
                storageError
            );

        }

    }, [
        modalOpen,
        editingId,
        form
    ]);


    /* =====================================================
       AVISO AO RECARREGAR / FECHAR ABA
    ===================================================== */

    useEffect(() => {

        if (!modalOpen) {

            return;

        }


        const handleBeforeUnload = (event) => {

            event.preventDefault();

            event.returnValue = "";

        };


        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );


        return () => {

            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );

        };

    }, [modalOpen]);


    /* =====================================================
       LIMPAR RASCUNHO
    ===================================================== */

    function limparRascunho() {

        try {

            sessionStorage.removeItem(
                TABELA_CORES_STORAGE_KEY
            );

        } catch (storageError) {

            console.error(
                "Erro ao limpar rascunho:",
                storageError
            );

        }

    }


    /* =====================================================
       LIMPAR MENSAGENS
    ===================================================== */

    function limparMensagens() {

        setError("");

        setSuccess("");

    }


    /* =====================================================
       ABRIR NOVO MDF
    ===================================================== */

    function abrirNovo() {

        limparMensagens();

        setEditingId(null);

        setForm({
            nome: "",
            preco_m2: "",
            fora_preco_mdf: false
        });

        setModalOpen(true);

    }


    /* =====================================================
       EDITAR MDF
    ===================================================== */

    function abrirEdicao(mdf) {

        limparMensagens();

        setEditingId(mdf.id);

        setForm({
            nome: mdf.nome || "",

            preco_m2:
                mdf.preco_m2 !== null &&
                mdf.preco_m2 !== undefined
                    ? String(mdf.preco_m2)
                    : "",

            fora_preco_mdf:
                Boolean(mdf.fora_preco_mdf)
        });

        setModalOpen(true);

    }


    /* =====================================================
       FECHAR MODAL
    ===================================================== */

    function fecharModal() {

        if (saving) {

            return;

        }


        setModalOpen(false);

        setEditingId(null);

        setForm({
            nome: "",
            preco_m2: "",
            fora_preco_mdf: false
        });

        limparRascunho();

    }


    /* =====================================================
       FORM
    ===================================================== */

    function handleChange(event) {

        const {
            name,
            value,
            type,
            checked
        } = event.target;


        setForm((current) => ({

            ...current,

            [name]:
                type === "checkbox"
                    ? checked
                    : value

        }));

    }


    /* =====================================================
       CLASSIFICAÇÃO VISUAL
    ===================================================== */

    function calcularCor() {

        if (form.fora_preco_mdf) {

            return "Cor 6";

        }


        if (!form.preco_m2) {

            return null;

        }


        const preco = Number(
            String(form.preco_m2)
                .replace(",", ".")
        );


        if (Number.isNaN(preco)) {

            return null;

        }


        if (preco <= 300) {

            return "Cor 1";

        }


        if (preco <= 400) {

            return "Cor 2";

        }


        if (preco <= 500) {

            return "Cor 3";

        }


        if (preco <= 580) {

            return "Cor 4";

        }


        return "Cor 5";

    }


    /* =====================================================
       SALVAR
    ===================================================== */

    async function salvarMdf(event) {

        event.preventDefault();

        limparMensagens();


        const nome =
            form.nome.trim();


        if (!nome) {

            setError(
                "Informe o nome do MDF."
            );

            return;

        }


        let preco = null;


        if (!form.fora_preco_mdf) {

            if (
                form.preco_m2 === "" ||
                form.preco_m2 === null ||
                form.preco_m2 === undefined
            ) {

                setError(
                    "Informe o preço por m²."
                );

                return;

            }


            preco = Number(
                String(form.preco_m2)
                    .replace(",", ".")
            );


            if (
                Number.isNaN(preco) ||
                preco < 0
            ) {

                setError(
                    "Informe um preço válido."
                );

                return;

            }

        }


        setSaving(true);


        const payload = {

            nome,

            preco_m2: preco,

            fora_preco_mdf:
                form.fora_preco_mdf

        };


        /* =================================================
           EDIÇÃO
        ================================================= */

        if (editingId) {

            const {
                data,
                error: supabaseError
            } = await supabase
                .from("mdfs")
                .update(payload)
                .eq("id", editingId)
                .select()
                .single();


            if (supabaseError) {

                console.error(
                    "Erro ao atualizar MDF:",
                    supabaseError
                );

                setError(
                    supabaseError.message ||
                    "Não foi possível atualizar o MDF."
                );

                setSaving(false);

                return;

            }


            /* =============================================
               ATUALIZA SOMENTE O ITEM NA TABELA
            ============================================= */

            setMdfs((current) =>

                current.map((mdf) =>

                    mdf.id === editingId
                        ? data
                        : mdf

                )

            );


            setSaving(false);

            setModalOpen(false);

            setEditingId(null);

            setForm({
                nome: "",
                preco_m2: "",
                fora_preco_mdf: false
            });

            limparRascunho();

            setSuccess(
                "MDF atualizado com sucesso."
            );

            return;

        }


        /* =================================================
           NOVO CADASTRO
        ================================================= */

        const {
            data,
            error: supabaseError
        } = await supabase
            .from("mdfs")
            .insert(payload)
            .select()
            .single();


        if (supabaseError) {

            console.error(
                "Erro ao cadastrar MDF:",
                supabaseError
            );

            setError(
                supabaseError.message ||
                "Não foi possível cadastrar o MDF."
            );

            setSaving(false);

            return;

        }


        /* =============================================
           ADICIONA O NOVO ITEM SEM RECARREGAR A PÁGINA
        ============================================= */

        setMdfs((current) => {

            const novaLista = [
                ...current,
                data
            ];


            return novaLista.sort(
                (a, b) =>
                    (a.nome || "")
                        .localeCompare(
                            b.nome || "",
                            "pt-BR"
                        )
            );

        });


        setSaving(false);

        setModalOpen(false);

        setEditingId(null);

        setForm({
            nome: "",
            preco_m2: "",
            fora_preco_mdf: false
        });

        limparRascunho();

        setSuccess(
            "MDF cadastrado com sucesso."
        );

    }


    /* =====================================================
       EXCLUIR
    ===================================================== */

    async function excluirMdf(mdf) {

        const confirmar =
            window.confirm(
                `Deseja realmente excluir o MDF "${mdf.nome}"?`
            );


        if (!confirmar) {

            return;

        }


        limparMensagens();


        const {
            error: supabaseError
        } = await supabase
            .from("mdfs")
            .delete()
            .eq("id", mdf.id);


        if (supabaseError) {

            console.error(
                "Erro ao excluir MDF:",
                supabaseError
            );

            setError(
                "Não foi possível excluir o MDF."
            );

            return;

        }


        /* =============================================
           REMOVE DIRETAMENTE DO ESTADO
        ============================================= */

        setMdfs((current) =>
            current.filter(
                (item) =>
                    item.id !== mdf.id
            )
        );


        setSuccess(
            "MDF excluído com sucesso."
        );

    }


    /* =====================================================
       FILTRO
    ===================================================== */

    const termo = search
        .trim()
        .toLowerCase();


    const mdfsFiltrados =
        mdfs.filter((mdf) => {

            if (!termo) {

                return true;

            }


            return (

                mdf.nome
                    ?.toLowerCase()
                    .includes(termo)

                ||

                mdf.cor
                    ?.toLowerCase()
                    .includes(termo)

            );

        });


    /* =====================================================
       FORMATAR PREÇO
    ===================================================== */

    function formatarPreco(valor) {

        if (
            valor === null ||
            valor === undefined
        ) {

            return "—";

        }


        return Number(valor)
            .toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <section className="tabela-cores-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="tabela-cores-header">

                <div>

                    <span>
                        COMERCIAL
                    </span>

                    <h1>
                        Tabela de cores
                    </h1>

                    <p>
                        Cadastre e gerencie os MDFs
                        utilizados pela ALME.
                    </p>

                </div>


                <button
                    type="button"
                    className="tabela-cores-new-button"
                    onClick={abrirNovo}
                >

                    <FiPlus />

                    <span>
                        Novo MDF
                    </span>

                </button>

            </header>


            {/* =================================================
                MENSAGENS
            ================================================= */}

            {error && (

                <div className="tabela-cores-message error">

                    {error}

                </div>

            )}


            {success && (

                <div className="tabela-cores-message success">

                    {success}

                </div>

            )}


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="tabela-cores-toolbar">

                <div className="tabela-cores-search">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Buscar MDF..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />


                    {search && (

                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Limpar busca"
                        >

                            <FiX />

                        </button>

                    )}

                </div>


                <span className="tabela-cores-counter">

                    {mdfsFiltrados.length}

                    {mdfsFiltrados.length === 1
                        ? " MDF"
                        : " MDFs"
                    }

                </span>

            </div>


            {/* =================================================
                TABELA
            ================================================= */}

            <div className="tabela-cores-table-wrapper">

                <table className="tabela-cores-table">

                    <thead>

                        <tr>

                            <th>
                                MDF
                            </th>

                            <th>
                                Preço / m²
                            </th>

                            <th>
                                Tipo de cor
                            </th>

                            <th>
                                Fora do preço MDF
                            </th>

                            <th className="actions-column">
                                Ações
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {loading ? (

                            <tr>

                                <td
                                    colSpan="5"
                                    className="empty-row"
                                >
                                    Carregando MDFs...
                                </td>

                            </tr>

                        ) : mdfsFiltrados.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="5"
                                    className="empty-row"
                                >

                                    <div className="empty-content">

                                        <FiDroplet />

                                        <strong>
                                            Nenhum MDF encontrado
                                        </strong>

                                        <span>
                                            Cadastre o primeiro MDF
                                            para começar.
                                        </span>

                                    </div>

                                </td>

                            </tr>

                        ) : (

                            mdfsFiltrados.map((mdf) => (

                                <tr key={mdf.id}>


                                    <td>

                                        <div className="mdf-name">

                                            <span>
                                                {mdf.nome}
                                            </span>

                                        </div>

                                    </td>


                                    <td>

                                        <span className="mdf-price">

                                            {formatarPreco(
                                                mdf.preco_m2
                                            )}

                                        </span>

                                    </td>


                                    <td>

                                        <span
                                            className={`color-badge color-${mdf.cor
                                                ?.replace(
                                                    "Cor ",
                                                    ""
                                                )}`}
                                        >

                                            {mdf.cor}

                                        </span>

                                    </td>


                                    <td>

                                        {mdf.fora_preco_mdf ? (

                                            <span className="status-badge yes">
                                                Sim
                                            </span>

                                        ) : (

                                            <span className="status-badge no">
                                                Não
                                            </span>

                                        )}

                                    </td>


                                    <td>

                                        <div className="table-actions">


                                            <button
                                                type="button"
                                                className="edit-button"
                                                onClick={() =>
                                                    abrirEdicao(
                                                        mdf
                                                    )
                                                }
                                                title="Editar MDF"
                                            >

                                                <FiEdit2 />

                                            </button>


                                            <button
                                                type="button"
                                                className="delete-button"
                                                onClick={() =>
                                                    excluirMdf(
                                                        mdf
                                                    )
                                                }
                                                title="Excluir MDF"
                                            >

                                                <FiTrash2 />

                                            </button>


                                        </div>

                                    </td>


                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>


            {/* =================================================
                MODAL
            ================================================= */}

            {modalOpen && (

                <div
                    className="tabela-cores-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            fecharModal();

                        }

                    }}
                >

                    <div className="tabela-cores-modal">


                        {/* =================================================
                            MODAL HEADER
                        ================================================= */}

                        <div className="tabela-cores-modal-header">

                            <div>

                                <span>
                                    {editingId
                                        ? "EDIÇÃO"
                                        : "CADASTRO"
                                    }
                                </span>

                                <h2>
                                    {editingId
                                        ? "Editar MDF"
                                        : "Novo MDF"
                                    }
                                </h2>

                            </div>


                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={saving}
                                aria-label="Fechar"
                            >

                                <FiX />

                            </button>

                        </div>


                        {/* =================================================
                            FORM
                        ================================================= */}

                        <form
                            className="tabela-cores-form"
                            onSubmit={salvarMdf}
                        >


                            {/* =================================================
                                NOME
                            ================================================= */}

                            <div className="form-group">

                                <label htmlFor="nome">
                                    Nome do MDF
                                </label>

                                <input
                                    id="nome"
                                    name="nome"
                                    type="text"
                                    value={form.nome}
                                    onChange={handleChange}
                                    placeholder="Ex.: MDF Carvalho Natural"
                                    autoComplete="off"
                                    disabled={saving}
                                />

                            </div>


                            {/* =================================================
                                FORA DO PREÇO
                            ================================================= */}

                            <label className="outside-price-toggle">

                                <input
                                    name="fora_preco_mdf"
                                    type="checkbox"
                                    checked={
                                        form.fora_preco_mdf
                                    }
                                    onChange={handleChange}
                                    disabled={saving}
                                />

                                <span className="custom-checkbox">
                                </span>

                                <div>

                                    <strong>
                                        Fora do preço de MDF
                                    </strong>

                                    <small>
                                        Marque esta opção para
                                        classificar o item como
                                        Cor 6.
                                    </small>

                                </div>

                            </label>


                            {/* =================================================
                                PREÇO
                            ================================================= */}

                            <div className="form-group">

                                <label htmlFor="preco_m2">
                                    Preço por m²
                                </label>


                                <div
                                    className={`price-input ${
                                        form.fora_preco_mdf
                                            ? "disabled"
                                            : ""
                                    }`}
                                >

                                    <span>
                                        R$
                                    </span>


                                    <input
                                        id="preco_m2"
                                        name="preco_m2"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            form.preco_m2
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="0,00"
                                        disabled={
                                            saving ||
                                            form.fora_preco_mdf
                                        }
                                    />

                                </div>


                                {form.fora_preco_mdf && (

                                    <small className="field-help">

                                        O preço não é preenchido
                                        para itens classificados
                                        como Cor 6.

                                    </small>

                                )}

                            </div>


                            {/* =================================================
                                CLASSIFICAÇÃO
                            ================================================= */}

                            <div className="classification-preview">

                                <div>

                                    <span>
                                        CLASSIFICAÇÃO
                                    </span>

                                    <strong>
                                        {calcularCor() ||
                                            "—"}
                                    </strong>

                                </div>


                                <p>

                                    {form.fora_preco_mdf

                                        ? "Item fora do preço de MDF."

                                        : "A classificação é definida automaticamente pelo preço."

                                    }

                                </p>

                            </div>


                            {/* =================================================
                                AÇÕES
                            ================================================= */}

                            <div className="tabela-cores-form-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={fecharModal}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>


                                <button
                                    type="submit"
                                    className="save-button"
                                    disabled={saving}
                                >

                                    {saving

                                        ? "Salvando..."

                                        : editingId

                                            ? "Salvar alterações"

                                            : "Cadastrar MDF"

                                    }

                                </button>

                            </div>


                        </form>

                    </div>

                </div>

            )}

        </section>

    );

}

