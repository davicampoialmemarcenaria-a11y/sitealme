import {
    useEffect,
    useState
} from "react";

import {
    FiPlus,
    FiChevronDown,
    FiChevronRight,
    FiEdit2,
    FiTrash2,
    FiRefreshCw,
    FiCalendar,
    FiX
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import {
    supabase
} from "../../../../services/supabase";

import "./Cronogramas.scss";


export default function Cronogramas() {

    const navigate = useNavigate();


    /*
    =====================================================
    ESTADOS
    =====================================================
    */

    const [cronogramas, setCronogramas] = useState([]);

    const [obrasDisponiveis, setObrasDisponiveis] = useState([]);

    const [loading, setLoading] = useState(true);

    const [salvando, setSalvando] = useState(false);

    const [erro, setErro] = useState("");

    const [busca, setBusca] = useState("");

    const [expandidos, setExpandidos] = useState({});

    const [modalNovo, setModalNovo] = useState(false);

    const [obraSelecionada, setObraSelecionada] = useState("");

    const [confirmacao, setConfirmacao] = useState(null);


    /*
    =====================================================
    CARREGAR DADOS
    =====================================================
    */

    async function carregarDados() {

        setLoading(true);
        setErro("");

        try {

            const {
                data,
                error
            } = await supabase.functions.invoke(
                "admin-cronogramas",
                {
                    body: {
                        action: "list"
                    }
                }
            );


            console.log(
                "RESPOSTA ADMIN-CRONOGRAMAS:",
                data,
                error
            );


            if (error) {
                throw error;
            }


            if (data?.error) {
                throw new Error(data.error);
            }


            setCronogramas(
                Array.isArray(data?.cronogramas)
                    ? data.cronogramas
                    : []
            );


            setObrasDisponiveis(
                Array.isArray(data?.obrasDisponiveis)
                    ? data.obrasDisponiveis
                    : []
            );

        }

        catch (err) {

            console.error(
                "Erro ao carregar cronogramas:",
                err
            );

            setErro(
                err?.message ||
                "Não foi possível carregar os cronogramas."
            );

        }

        finally {

            setLoading(false);

        }
    }


    /*
    =====================================================
    CARREGAR AO ABRIR
    =====================================================
    */

    useEffect(() => {

        carregarDados();

    }, []);


    /*
    =====================================================
    EXPANDIR / RECOLHER
    =====================================================
    */

    function alternarCronograma(id) {

        setExpandidos(prev => ({
            ...prev,
            [id]: !prev[id]
        }));

    }


    /*
    =====================================================
    FILTRO
    =====================================================
    */

    const cronogramasFiltrados =
        cronogramas.filter(cronograma => {

            const termo =
                busca.trim().toLowerCase();


            if (!termo) {
                return true;
            }


            const nomeObra =
                String(
                    cronograma?.obra?.nome || ""
                ).toLowerCase();


            return nomeObra.includes(termo);

        });


    /*
    =====================================================
    FORMATAR DATA
    =====================================================
    */

    function formatarData(valor) {

        if (!valor) {
            return "-";
        }


        const data =
            new Date(valor);


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return "-";
        }


        return data.toLocaleDateString(
            "pt-BR"
        );

    }


    /*
    =====================================================
    FORMATAR DATA / HORA
    =====================================================
    */

    function formatarDataHora(valor) {

        if (!valor) {
            return "-";
        }


        const data =
            new Date(valor);


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return "-";
        }


        return data.toLocaleString(
            "pt-BR",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );

    }


    /*
    =====================================================
    NOVO
    =====================================================
    */

    function abrirNovo() {

        setObraSelecionada("");

        setErro("");

        setModalNovo(true);

    }


    /*
    =====================================================
    FECHAR NOVO
    =====================================================
    */

    function fecharNovo() {

        if (salvando) {
            return;
        }


        setModalNovo(false);

        setObraSelecionada("");

        setErro("");

    }


    /*
    =====================================================
    CRIAR CRONOGRAMA
    =====================================================
    */

    async function criarCronograma() {

        if (!obraSelecionada) {

            setErro(
                "Selecione uma obra."
            );

            return;

        }


        setSalvando(true);

        setErro("");


        try {

            const {
                data,
                error
            } = await supabase.functions.invoke(
                "admin-cronogramas",
                {
                    body: {
                        action: "create",
                        obra_id: Number(
                            obraSelecionada
                        )
                    }
                }
            );


            console.log(
                "RESPOSTA CREATE CRONOGRAMA:",
                data,
                error
            );


            if (error) {
                throw error;
            }


            if (data?.error) {
                throw new Error(
                    data.error
                );
            }


            setModalNovo(false);

            setObraSelecionada("");

            setErro("");


            await carregarDados();


            if (
                data?.cronograma?.id &&
                data?.versao?.id
            ) {

                navigate(
                    `/admin/cronogramas/${data.cronograma.id}/${data.versao.id}`
                );

            }

        }

        catch (err) {

            console.error(
                "Erro ao criar cronograma:",
                err
            );


            setErro(
                err?.message ||
                "Não foi possível criar o cronograma."
            );

        }

        finally {

            setSalvando(false);

        }

    }


    /*
    =====================================================
    EXCLUIR CRONOGRAMA
    =====================================================
    */

    async function excluirCronograma() {

        if (
            !confirmacao?.cronogramaId
        ) {
            return;
        }


        setSalvando(true);

        setErro("");


        try {

            const {
                data,
                error
            } = await supabase.functions.invoke(
                "admin-cronogramas",
                {
                    body: {
                        action: "delete",
                        cronograma_id:
                            confirmacao.cronogramaId
                    }
                }
            );


            console.log(
                "RESPOSTA DELETE CRONOGRAMA:",
                data,
                error
            );


            if (error) {
                throw error;
            }


            if (data?.error) {
                throw new Error(
                    data.error
                );
            }


            setConfirmacao(null);

            await carregarDados();

        }

        catch (err) {

            console.error(
                "Erro ao excluir cronograma:",
                err
            );


            setErro(
                err?.message ||
                "Não foi possível excluir o cronograma."
            );

        }

        finally {

            setSalvando(false);

        }

    }


    /*
    =====================================================
    EXCLUIR VERSÃO
    =====================================================
    */

    async function excluirVersao() {

        if (
            !confirmacao?.versaoId
        ) {
            return;
        }


        setSalvando(true);

        setErro("");


        try {

            const {
                data,
                error
            } = await supabase.functions.invoke(
                "admin-cronogramas",
                {
                    body: {
                        action: "delete_version",
                        versao_id:
                            confirmacao.versaoId
                    }
                }
            );


            console.log(
                "RESPOSTA DELETE VERSÃO:",
                data,
                error
            );


            if (error) {
                throw error;
            }


            if (data?.error) {
                throw new Error(
                    data.error
                );
            }


            setConfirmacao(null);

            await carregarDados();

        }

        catch (err) {

            console.error(
                "Erro ao excluir versão:",
                err
            );


            setErro(
                err?.message ||
                "Não foi possível excluir a versão."
            );

        }

        finally {

            setSalvando(false);

        }

    }


    /*
    =====================================================
    RENDER
    =====================================================
    */

    return (
        <section className="cronogramas-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="cronogramas-header">

                <div>

                    <span>
                        PRODUÇÃO
                    </span>

                    <h1>
                        Cronogramas
                    </h1>

                    <p>
                        Gerencie os cronogramas e o histórico
                        de versões dos projetos.
                    </p>

                </div>


                <div className="cronogramas-header-actions">

                    <button
                        type="button"
                        className="cronogramas-btn-refresh"
                        onClick={carregarDados}
                        disabled={loading}
                    >

                        <FiRefreshCw
                            className={
                                loading
                                    ? "girando"
                                    : ""
                            }
                        />

                        Atualizar

                    </button>


                    <button
                        type="button"
                        className="cronogramas-btn-add"
                        onClick={abrirNovo}
                    >

                        <FiPlus />

                        Novo cronograma

                    </button>

                </div>

            </header>


            {/* =================================================
                ERRO GERAL
            ================================================= */}

            {
                erro &&
                !modalNovo &&
                !confirmacao && (
                    <div className="cronogramas-error">
                        {erro}
                    </div>
                )
            }


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <section className="cronogramas-toolbar">

                <div className="cronogramas-search">

                    <FiCalendar />

                    <input
                        type="text"
                        value={busca}
                        onChange={e =>
                            setBusca(
                                e.target.value
                            )
                        }
                        placeholder="Buscar por projeto..."
                    />


                    {
                        busca && (
                            <button
                                type="button"
                                className="cronogramas-search-clear"
                                onClick={() =>
                                    setBusca("")
                                }
                                title="Limpar busca"
                            >
                                <FiX />
                            </button>
                        )
                    }

                </div>


                <div className="cronogramas-count">

                    <strong>
                        {
                            cronogramasFiltrados.length
                        }
                    </strong>

                    {
                        cronogramasFiltrados.length === 1
                            ? " cronograma"
                            : " cronogramas"
                    }

                </div>

            </section>


            {/* =================================================
                LISTA
            ================================================= */}

            <section className="cronogramas-content">

                {
                    loading ? (

                        <div className="cronogramas-loading">

                            <FiRefreshCw />

                            Carregando cronogramas...

                        </div>

                    ) : cronogramasFiltrados.length === 0 ? (

                        <div className="cronogramas-empty">

                            <FiCalendar />

                            <h2>
                                Nenhum cronograma encontrado
                            </h2>

                            <p>
                                Crie o primeiro cronograma
                                a partir de uma obra cadastrada.
                            </p>

                            <button
                                type="button"
                                className="cronogramas-btn-add"
                                onClick={abrirNovo}
                            >

                                <FiPlus />

                                Novo cronograma

                            </button>

                        </div>

                    ) : (

                        <div className="cronogramas-list">

                            {
                                cronogramasFiltrados.map(
                                    cronograma => {

                                        const aberto =
                                            Boolean(
                                                expandidos[
                                                    cronograma.id
                                                ]
                                            );


                                        return (
                                            <div
                                                className={
                                                    aberto
                                                        ? "cronograma-item aberto"
                                                        : "cronograma-item"
                                                }
                                                key={
                                                    cronograma.id
                                                }
                                            >


                                                {/* =========================================
                                                    CABEÇALHO
                                                ========================================= */}

                                                <div className="cronograma-item-head">


                                                    <button
                                                        type="button"
                                                        className="cronograma-expand"
                                                        onClick={() =>
                                                            alternarCronograma(
                                                                cronograma.id
                                                            )
                                                        }
                                                        title={
                                                            aberto
                                                                ? "Recolher"
                                                                : "Expandir"
                                                        }
                                                    >

                                                        {
                                                            aberto
                                                                ? <FiChevronDown />
                                                                : <FiChevronRight />
                                                        }

                                                    </button>


                                                    <div className="cronograma-item-icon">

                                                        <FiCalendar />

                                                    </div>


                                                    <div className="cronograma-item-info">

                                                        <strong>

                                                            {
                                                                cronograma?.obra?.nome ||
                                                                "Projeto sem nome"
                                                            }

                                                        </strong>


                                                        <small>

                                                            Última atualização:{" "}

                                                            {
                                                                formatarDataHora(
                                                                    cronograma.updated_at
                                                                )
                                                            }

                                                        </small>

                                                    </div>


                                                    <div className="cronograma-item-versoes">

                                                        <span>
                                                            {
                                                                cronograma?.versoes?.length || 0
                                                            }
                                                        </span>

                                                        {
                                                            cronograma?.versoes?.length === 1
                                                                ? " versão"
                                                                : " versões"
                                                        }

                                                    </div>


                                                    <button
                                                        type="button"
                                                        className="cronograma-delete"
                                                        title="Excluir cronograma inteiro"
                                                        onClick={() =>
                                                            setConfirmacao({
                                                                tipo: "cronograma",
                                                                cronogramaId:
                                                                    cronograma.id,
                                                                nome:
                                                                    cronograma?.obra?.nome
                                                            })
                                                        }
                                                    >

                                                        <FiTrash2 />

                                                    </button>

                                                </div>


                                                {/* =========================================
                                                    VERSÕES EXPANDIDAS
                                                ========================================= */}

                                                {
                                                    aberto && (

                                                        <div className="cronograma-versoes">


                                                            <div className="cronograma-versoes-title">

                                                                <span>
                                                                    HISTÓRICO
                                                                </span>

                                                                <strong>
                                                                    Versões salvas
                                                                </strong>

                                                            </div>


                                                            {
                                                                Array.isArray(
                                                                    cronograma?.versoes
                                                                ) &&
                                                                cronograma.versoes.length > 0 ? (

                                                                    cronograma.versoes.map(
                                                                        versao => {

                                                                            return (
                                                                                <div
                                                                                    className="cronograma-versao"
                                                                                    key={
                                                                                        versao.id
                                                                                    }
                                                                                >


                                                                                    {/* BOTÃO DA VERSÃO */}

                                                                                    <button
                                                                                        type="button"
                                                                                        className="cronograma-versao-main"
                                                                                        onClick={() =>
                                                                                            navigate(
                                                                                                `/admin/cronogramas/${cronograma.id}/${versao.id}`
                                                                                            )
                                                                                        }
                                                                                    >


                                                                                        <div className="cronograma-versao-number">

                                                                                            v
                                                                                            {
                                                                                                versao.numero
                                                                                            }

                                                                                        </div>


                                                                                        <div className="cronograma-versao-info">

                                                                                            <strong>

                                                                                                Versão{" "}

                                                                                                {
                                                                                                    versao.numero
                                                                                                }

                                                                                            </strong>


                                                                                            <small>

                                                                                                Criada em{" "}

                                                                                                {
                                                                                                    formatarDataHora(
                                                                                                        versao.created_at
                                                                                                    )
                                                                                                }

                                                                                            </small>

                                                                                        </div>


                                                                                        {
                                                                                            versao.sharepoint_id && (

                                                                                                <span className="cronograma-sharepoint">

                                                                                                    SP:{" "}

                                                                                                    {
                                                                                                        versao.sharepoint_id
                                                                                                    }

                                                                                                </span>

                                                                                            )
                                                                                        }


                                                                                    </button>


                                                                                    {/* AÇÕES DA VERSÃO */}

                                                                                    <div className="cronograma-versao-actions">


                                                                                        <button
                                                                                            type="button"
                                                                                            className="cronograma-version-edit"
                                                                                            title="Editar versão"
                                                                                            onClick={() =>
                                                                                                navigate(
                                                                                                    `/admin/cronogramas/${cronograma.id}/${versao.id}`
                                                                                                )
                                                                                            }
                                                                                        >

                                                                                            <FiEdit2 />

                                                                                        </button>


                                                                                        <button
                                                                                            type="button"
                                                                                            className="cronograma-version-delete"
                                                                                            title="Excluir versão"
                                                                                            onClick={() =>
                                                                                                setConfirmacao({
                                                                                                    tipo: "versao",
                                                                                                    versaoId:
                                                                                                        versao.id,
                                                                                                    nome:
                                                                                                        cronograma?.obra?.nome,
                                                                                                    numero:
                                                                                                        versao.numero
                                                                                                })
                                                                                            }
                                                                                        >

                                                                                            <FiTrash2 />

                                                                                        </button>


                                                                                    </div>


                                                                                </div>
                                                                            );
                                                                        }
                                                                    )

                                                                ) : (

                                                                    <div className="cronograma-versoes-empty">

                                                                        Nenhuma versão salva.

                                                                    </div>

                                                                )
                                                            }


                                                        </div>

                                                    )
                                                }


                                            </div>
                                        );

                                    }
                                )
                            }

                        </div>

                    )
                }

            </section>


            {/* =================================================
                MODAL NOVO CRONOGRAMA
            ================================================= */}

            {
                modalNovo && (

                    <div className="cronogramas-modal-overlay">

                        <div className="cronogramas-modal">


                            <header className="cronogramas-modal-header">

                                <div>

                                    <span>
                                        NOVO CRONOGRAMA
                                    </span>

                                    <h2>
                                        Selecionar obra
                                    </h2>

                                    <p>
                                        O cronograma será vinculado
                                        a uma obra já cadastrada.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="cronogramas-modal-close"
                                    onClick={fecharNovo}
                                    disabled={salvando}
                                >

                                    <FiX />

                                </button>

                            </header>


                            <div className="cronogramas-modal-form">


                                <label>
                                    Obra
                                </label>


                                <select
                                    value={obraSelecionada}
                                    onChange={e =>
                                        setObraSelecionada(
                                            e.target.value
                                        )
                                    }
                                    disabled={salvando}
                                >

                                    <option value="">
                                        Selecione uma obra
                                    </option>


                                    {
                                        obrasDisponiveis.map(
                                            obra => (
                                                <option
                                                    key={
                                                        obra.id
                                                    }
                                                    value={
                                                        obra.id
                                                    }
                                                >
                                                    {
                                                        obra.nome
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </select>


                                {
                                    obrasDisponiveis.length === 0 && (

                                        <div className="cronogramas-no-obras">

                                            Todas as obras disponíveis
                                            já possuem cronograma.

                                        </div>

                                    )
                                }


                                {
                                    erro && (

                                        <div className="cronogramas-form-error">

                                            {
                                                erro
                                            }

                                        </div>

                                    )
                                }


                                <footer className="cronogramas-modal-footer">


                                    <button
                                        type="button"
                                        className="cronogramas-btn-cancel"
                                        onClick={fecharNovo}
                                        disabled={salvando}
                                    >

                                        Cancelar

                                    </button>


                                    <button
                                        type="button"
                                        className="cronogramas-btn-confirm"
                                        onClick={criarCronograma}
                                        disabled={
                                            salvando ||
                                            !obraSelecionada
                                        }
                                    >

                                        <FiPlus />

                                        {
                                            salvando
                                                ? "Criando..."
                                                : "Criar cronograma"
                                        }

                                    </button>

                                </footer>


                            </div>


                        </div>

                    </div>

                )
            }


            {/* =================================================
                MODAL DE CONFIRMAÇÃO
            ================================================= */}

            {
                confirmacao && (

                    <div className="cronogramas-modal-overlay">

                        <div className="cronogramas-modal cronogramas-modal-small">


                            <header className="cronogramas-modal-header">

                                <div>

                                    <span>
                                        ATENÇÃO
                                    </span>


                                    <h2>

                                        {
                                            confirmacao.tipo === "cronograma"
                                                ? "Excluir cronograma?"
                                                : "Excluir versão?"
                                        }

                                    </h2>


                                    <p>

                                        {
                                            confirmacao.tipo === "cronograma" ? (

                                                <>
                                                    Você está prestes a excluir
                                                    o cronograma de{" "}

                                                    <strong>
                                                        {
                                                            confirmacao.nome
                                                        }
                                                    </strong>

                                                    . Todas as versões serão excluídas.
                                                </>

                                            ) : (

                                                <>
                                                    Você está prestes a excluir
                                                    a versão{" "}

                                                    <strong>
                                                        v{
                                                            confirmacao.numero
                                                        }
                                                    </strong>

                                                    {" "}do projeto{" "}

                                                    <strong>
                                                        {
                                                            confirmacao.nome
                                                        }
                                                    </strong>

                                                    .
                                                </>
                                            )
                                        }

                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="cronogramas-modal-close"
                                    onClick={() =>
                                        setConfirmacao(null)
                                    }
                                    disabled={salvando}
                                >

                                    <FiX />

                                </button>

                            </header>


                            {
                                erro && (

                                    <div className="cronogramas-form-error">

                                        {
                                            erro
                                        }

                                    </div>

                                )
                            }


                            <footer className="cronogramas-modal-footer">


                                <button
                                    type="button"
                                    className="cronogramas-btn-cancel"
                                    onClick={() =>
                                        setConfirmacao(null)
                                    }
                                    disabled={salvando}
                                >

                                    Cancelar

                                </button>


                                <button
                                    type="button"
                                    className="cronogramas-btn-delete-confirm"
                                    onClick={
                                        confirmacao.tipo === "cronograma"
                                            ? excluirCronograma
                                            : excluirVersao
                                    }
                                    disabled={salvando}
                                >

                                    <FiTrash2 />

                                    {
                                        salvando
                                            ? "Excluindo..."
                                            : "Excluir"
                                    }

                                </button>

                            </footer>


                        </div>

                    </div>

                )
            }


        </section>
    );
}