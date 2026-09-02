
import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FiArrowLeft,
    FiEdit2,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
    FiX,
    FiCheck
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import {
    supabase
} from "../../../../services/supabase";

import "./InforFi.scss";


/*
=====================================================
FORMULÁRIO
=====================================================
*/

const FORM_INICIAL = {

    teto_custo: "",

    meta_custo: "",

    valor_contrato: "",

    comissao_bonificacao_taxa: "",

    valor_destinado_producao: "",

    expectativa_ganho_marceneiro: "",

    outros: ""

};


/*
=====================================================
COMPONENTE
=====================================================
*/

export default function InforFi() {

    const navigate =
        useNavigate();


    /*
    =================================================
    DADOS
    =================================================
    */

    const [
        obras,
        setObras
    ] = useState([]);


    const [
        obrasConcluidas,
        setObrasConcluidas
    ] = useState([]);


    const [
        usuarioAtual,
        setUsuarioAtual
    ] = useState(null);


    /*
    =================================================
    ABA
    =================================================
    */

    const [
        aba,
        setAba
    ] = useState("ativas");


    /*
    =================================================
    LOADING
    =================================================
    */

    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        salvando,
        setSalvando
    ] = useState(false);


    /*
    =================================================
    MODAIS
    =================================================
    */

    const [
        modal,
        setModal
    ] = useState(false);


    const [
        modalSelecionarObra,
        setModalSelecionarObra
    ] = useState(false);


    const [
        modalExcluir,
        setModalExcluir
    ] = useState(false);


    /*
    =================================================
    SELEÇÃO
    =================================================
    */

    const [
        obraSelecionada,
        setObraSelecionada
    ] = useState(null);


    const [
        informacaoSelecionada,
        setInformacaoSelecionada
    ] = useState(null);


    /*
    =================================================
    FORM
    =================================================
    */

    const [
        form,
        setForm
    ] = useState({
        ...FORM_INICIAL
    });


    /*
    =================================================
    ERRO
    =================================================
    */

    const [
        erro,
        setErro
    ] = useState("");


    /*
    =================================================
    BUSCA
    =================================================
    */

    const [
        busca,
        setBusca
    ] = useState("");


    /*
    =================================================
    BUSCA PARA SELEÇÃO DE OBRA
    =================================================
    */

    const [
        buscaObra,
        setBuscaObra
    ] = useState("");


    /*
    =================================================
    CARREGAR DADOS
    =================================================
    */

    async function carregarDados() {

        setLoading(true);

        setErro("");


        try {

            const {
                data,
                error
            } =

                await supabase
                    .functions
                    .invoke(
                        "admin-inforfi",
                        {
                            body: {
                                action:
                                    "list"
                            }
                        }
                    );


            if (error) {

                throw error;

            }


            if (data?.error) {

                throw new Error(
                    data.error
                );

            }


            /*
            =================================================
            O SQL JÁ ESTÁ RETORNANDO AS DUAS OBRAS.
            AQUI APENAS GARANTIMOS QUE O FRONT RECEBA
            TODAS AS OBRAS DEVOLVIDAS.
            =================================================
            */

            setObras(

                Array.isArray(
                    data?.obrasAtivas
                )

                    ? data.obrasAtivas

                    : []

            );


            setObrasConcluidas(

                Array.isArray(
                    data?.obrasConcluidas
                )

                    ? data.obrasConcluidas

                    : []

            );


            setUsuarioAtual(

                data?.usuarioAtual ||

                null

            );

        }

        catch (err) {

            console.error(
                "Erro ao carregar informações financeiras:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível carregar as informações financeiras."

            );


            setObras([]);

            setObrasConcluidas([]);

        }

        finally {

            setLoading(false);

        }

    }


    /*
    =================================================
    CARREGAR
    =================================================
    */

    useEffect(() => {

        carregarDados();

    }, []);


    /*
    =================================================
    USUÁRIO ATUAL
    =================================================
    */

    const ehAdministrador =

        Number(
            usuarioAtual?.role_id
        ) === 1;


    const podeVerTodasObras =

        usuarioAtual?.pode_ver_todas_obras === true;


    /*
    =================================================
    FILTRAR OBRAS DA TABELA
    =================================================
    */

    const obrasFiltradas = useMemo(() => {

        const termo =

            busca
                .trim()
                .toLowerCase();


        const lista =

            aba === "ativas"

                ? obras

                : obrasConcluidas;


        if (!termo) {

            return lista;

        }


        return lista.filter(

            obra => {

                const campos = [

                    obra.nome,

                    obra.rdo_nome,

                    obra.marceneiro_nome,

                    obra.projetista_nome

                ];


                const informacao =

                    obra.informacaoFinanceira;


                if (informacao) {

                    campos.push(

                        informacao.teto_custo,

                        informacao.meta_custo,

                        informacao.valor_contrato,

                        informacao.comissao_bonificacao_taxa,

                        informacao.valor_destinado_producao,

                        informacao.expectativa_ganho_marceneiro,

                        informacao.outros

                    );

                }


                return campos.some(

                    campo =>

                        String(
                            campo ?? ""
                        )
                            .toLowerCase()
                            .includes(
                                termo
                            )

                );

            }

        );

    }, [

        obras,

        obrasConcluidas,

        aba,

        busca

    ]);


    /*
    =================================================
    OBRAS DISPONÍVEIS PARA SELEÇÃO
    =================================================

    IMPORTANTE:

    Antes o filtro era:

        !obra.concluida &&
        !obra.informacaoFinanceira

    Isso fazia uma obra desaparecer da seleção quando
    ela possuía um registro financeiro antigo.

    Agora TODAS as obras ativas retornadas pelo SQL
    ficam disponíveis para seleção.

    Se já existir informação financeira, ao clicar nela
    abriremos a edição em vez de criar outro registro.
    =================================================
    */

    const obrasDisponiveisParaCadastro = useMemo(() => {

        const termo =

            buscaObra
                .trim()
                .toLowerCase();


        /*
        =================================================
        TODAS AS OBRAS ATIVAS
        =================================================
        */

        const disponiveis =

            Array.isArray(obras)

                ? obras.filter(
                    obra =>
                        !obra?.concluida
                )

                : [];


        if (!termo) {

            return disponiveis;

        }


        return disponiveis.filter(

            obra => {

                const campos = [

                    obra.nome,

                    obra.rdo_nome,

                    obra.marceneiro_nome,

                    obra.projetista_nome

                ];


                return campos.some(

                    campo =>

                        String(
                            campo ?? ""
                        )
                            .toLowerCase()
                            .includes(
                                termo
                            )

                );

            }

        );

    }, [

        obras,

        buscaObra

    ]);


    /*
    =================================================
    CONTADORES
    =================================================
    */

    const quantidadeAtivas =
        obras.length;


    const quantidadeConcluidas =
        obrasConcluidas.length;


    /*
    =================================================
    TROCAR ABA
    =================================================
    */

    function trocarAba(
        novaAba
    ) {

        setAba(
            novaAba
        );

        setBusca("");

        setErro("");

    }


    /*
    =================================================
    ABRIR SELEÇÃO DE OBRA
    =================================================
    */

    function abrirSelecaoObra() {

        setErro("");

        setBuscaObra("");

        setModalSelecionarObra(true);

    }


    /*
    =================================================
    FECHAR SELEÇÃO
    =================================================
    */

    function fecharSelecaoObra() {

        if (salvando) {

            return;

        }


        setModalSelecionarObra(false);

        setBuscaObra("");

        setErro("");

    }


    /*
    =================================================
    ESCOLHER OBRA PARA NOVO CADASTRO / EDIÇÃO
    =================================================

    Se a obra já possuir informação financeira, abrimos
    a edição.

    Isso evita:

    - a obra desaparecer da lista;
    - criar informação financeira duplicada;
    - problemas quando uma obra muda de concluída
      para ativa novamente.
    =================================================
    */

    function selecionarObraParaCadastro(
        obra
    ) {

        if (!obra) {

            return;

        }


        if (
            obra.concluida
        ) {

            return;

        }


        /*
        =================================================
        SE JÁ EXISTE INFORMAÇÃO FINANCEIRA
        =================================================
        */

        if (
            obra.informacaoFinanceira
        ) {

            fecharSelecaoObra();

            abrirEdicao(
                obra
            );

            return;

        }


        /*
        =================================================
        NOVO CADASTRO
        =================================================
        */

        setObraSelecionada(
            obra
        );


        setInformacaoSelecionada(
            null
        );


        setForm({
            ...FORM_INICIAL
        });


        setModalSelecionarObra(false);

        setBuscaObra("");

        setErro("");

        setModal(true);

    }


    /*
    =================================================
    ABRIR NOVO DIRETO PELA LINHA
    =================================================
    */

    function abrirNovo(
        obra
    ) {

        if (!obra) {

            return;

        }


        if (
            obra.concluida
        ) {

            return;

        }


        if (
            obra.informacaoFinanceira
        ) {

            abrirEdicao(
                obra
            );

            return;

        }


        selecionarObraParaCadastro(
            obra
        );

    }


    /*
    =================================================
    ABRIR EDIÇÃO
    =================================================
    */

    function abrirEdicao(
        obra
    ) {

        const info =
            obra?.informacaoFinanceira;


        if (!info) {

            abrirNovo(
                obra
            );

            return;

        }


        if (
            obra?.concluida
        ) {

            return;

        }


        setObraSelecionada(
            obra
        );


        setInformacaoSelecionada(
            info
        );


        setForm({

            teto_custo:

                info.teto_custo !== null &&

                info.teto_custo !== undefined

                    ? String(
                        info.teto_custo
                    )

                    : "",


            meta_custo:

                info.meta_custo !== null &&

                info.meta_custo !== undefined

                    ? String(
                        info.meta_custo
                    )

                    : "",


            valor_contrato:

                info.valor_contrato !== null &&

                info.valor_contrato !== undefined

                    ? String(
                        info.valor_contrato
                    )

                    : "",


            comissao_bonificacao_taxa:

                info.comissao_bonificacao_taxa !== null &&

                info.comissao_bonificacao_taxa !== undefined

                    ? String(
                        info.comissao_bonificacao_taxa
                    )

                    : "",


            valor_destinado_producao:

                info.valor_destinado_producao !== null &&

                info.valor_destinado_producao !== undefined

                    ? String(
                        info.valor_destinado_producao
                    )

                    : "",


            expectativa_ganho_marceneiro:

                info.expectativa_ganho_marceneiro !== null &&

                info.expectativa_ganho_marceneiro !== undefined

                    ? String(
                        info.expectativa_ganho_marceneiro
                    )

                    : "",


            outros:

                info.outros !== null &&

                info.outros !== undefined

                    ? String(
                        info.outros
                    )

                    : ""

        });


        setErro("");

        setModal(true);

    }


    /*
    =================================================
    FECHAR MODAL
    =================================================
    */

    function fecharModal() {

        if (salvando) {

            return;

        }


        setModal(false);

        setObraSelecionada(null);

        setInformacaoSelecionada(null);

        setForm({
            ...FORM_INICIAL
        });

        setErro("");

    }


    /*
    =================================================
    ALTERAR FORM
    =================================================
    */

    function alterarCampo(
        e
    ) {

        const {
            name,
            value
        } = e.target;


        setForm(

            prev => ({

                ...prev,

                [name]:
                    value

            })

        );

    }


    /*
    =================================================
    VALIDAR VALORES
    =================================================
    */

    function validarValores() {

        const campos = [

            "teto_custo",

            "meta_custo",

            "valor_contrato",

            "comissao_bonificacao_taxa",

            "valor_destinado_producao",

            "expectativa_ganho_marceneiro",

            "outros"

        ];


        for (

            const campo

            of campos

        ) {

            if (

                form[campo] !== "" &&

                Number(
                    form[campo]
                ) < 0

            ) {

                return false;

            }


            if (

                form[campo] !== "" &&

                Number.isNaN(
                    Number(
                        form[campo]
                    )
                )

            ) {

                return false;

            }

        }


        return true;

    }


    /*
    =================================================
    SALVAR
    =================================================
    */

    async function salvar() {

        setErro("");


        if (!obraSelecionada?.id) {

            setErro(
                "Obra não selecionada."
            );

            return;

        }


        if (!validarValores()) {

            setErro(
                "Os valores financeiros informados são inválidos."
            );

            return;

        }


        setSalvando(true);


        try {

            const payload = {

                action:

                    informacaoSelecionada

                        ? "update"

                        : "create",


                ...(

                    informacaoSelecionada

                        ? {

                            id:
                                informacaoSelecionada.id

                        }

                        : {

                            obra_id:
                                obraSelecionada.id

                        }

                ),


                teto_custo:

                    form.teto_custo

                        ? Number(
                            form.teto_custo
                        )

                        : null,


                meta_custo:

                    form.meta_custo

                        ? Number(
                            form.meta_custo
                        )

                        : null,


                valor_contrato:

                    form.valor_contrato

                        ? Number(
                            form.valor_contrato
                        )

                        : null,


                comissao_bonificacao_taxa:

                    form.comissao_bonificacao_taxa

                        ? Number(
                            form.comissao_bonificacao_taxa
                        )

                        : null,


                valor_destinado_producao:

                    form.valor_destinado_producao

                        ? Number(
                            form.valor_destinado_producao
                        )

                        : null,


                expectativa_ganho_marceneiro:

                    form.expectativa_ganho_marceneiro

                        ? Number(
                            form.expectativa_ganho_marceneiro
                        )

                        : null,


                outros:

                    form.outros

                        ? Number(
                            form.outros
                        )

                        : null

            };


            const {
                data,
                error
            } =

                await supabase
                    .functions
                    .invoke(
                        "admin-inforfi",
                        {
                            body:
                                payload
                        }
                    );


            if (error) {

                throw error;

            }


            if (data?.error) {

                throw new Error(
                    data.error
                );

            }


            fecharModal();

            await carregarDados();

        }

        catch (err) {

            console.error(
                "Erro ao salvar informação financeira:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível salvar as informações financeiras."

            );

        }

        finally {

            setSalvando(false);

        }

    }


    /*
    =================================================
    ABRIR EXCLUSÃO
    =================================================
    */

    function abrirExclusao(
        obra
    ) {

        if (
            !obra?.informacaoFinanceira
        ) {

            return;

        }


        if (
            obra?.concluida
        ) {

            return;

        }


        setObraSelecionada(
            obra
        );


        setInformacaoSelecionada(
            obra.informacaoFinanceira
        );


        setErro("");

        setModalExcluir(true);

    }


    /*
    =================================================
    FECHAR EXCLUSÃO
    =================================================
    */

    function fecharExclusao() {

        if (salvando) {

            return;

        }


        setModalExcluir(false);

        setObraSelecionada(null);

        setInformacaoSelecionada(null);

        setErro("");

    }


    /*
    =================================================
    EXCLUIR
    =================================================
    */

    async function excluir() {

        if (
            !informacaoSelecionada?.id
        ) {

            return;

        }


        setSalvando(true);

        setErro("");


        try {

            const {
                data,
                error
            } =

                await supabase
                    .functions
                    .invoke(
                        "admin-inforfi",
                        {
                            body: {

                                action:
                                    "delete",

                                id:
                                    informacaoSelecionada.id

                            }
                        }
                    );


            if (error) {

                throw error;

            }


            if (data?.error) {

                throw new Error(
                    data.error
                );

            }


            fecharExclusao();

            await carregarDados();

        }

        catch (err) {

            console.error(
                "Erro ao excluir:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível excluir."

            );

        }

        finally {

            setSalvando(false);

        }

    }


    /*
    =================================================
    FORMATAR MOEDA
    =================================================
    */

    function formatarMoeda(
        valor
    ) {

        if (

            valor === null ||

            valor === undefined ||

            valor === ""

        ) {

            return "-";

        }


        const numero =
            Number(
                valor
            );


        if (
            Number.isNaN(numero)
        ) {

            return "-";

        }


        return numero.toLocaleString(

            "pt-BR",

            {

                style:
                    "currency",

                currency:
                    "BRL"

            }

        );

    }


    /*
    =================================================
    RENDER
    =================================================
    */

    return (

        <section className="inforfi-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="inforfi-header">


                <div className="inforfi-header-left">


                    <button

                        type="button"

                        className="inforfi-back"

                        onClick={() =>
                            navigate(
                                "/admin/producao"
                            )
                        }

                        title="Voltar para Produção"

                    >

                        <FiArrowLeft />

                    </button>


                    <div>

                        <span>
                            PRODUÇÃO
                        </span>

                        <h1>
                            Informações financeiras
                        </h1>

                        <p>
                            Acompanhe os principais dados financeiros
                            das obras da ALME.
                        </p>

                    </div>

                </div>


                <div className="inforfi-header-actions">


                    <button

                        type="button"

                        className="inforfi-refresh"

                        onClick={
                            carregarDados
                        }

                        disabled={
                            loading
                        }

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


                    {

                        aba === "ativas" && (

                            <button

                                type="button"

                                className="inforfi-btn-add"

                                onClick={
                                    abrirSelecaoObra
                                }

                            >

                                <FiPlus />

                                Adicionar informações

                            </button>

                        )

                    }


                </div>


            </header>


            {/* =================================================
                ERRO
            ================================================= */}

            {

                erro &&

                !modal &&

                !modalExcluir &&

                !modalSelecionarObra &&

                (

                    <div className="inforfi-error">

                        {
                            erro
                        }

                    </div>

                )

            }


            {/* =================================================
                RESUMO
            ================================================= */}

            <div className="inforfi-summary">


                <div>

                    <span>
                        OBRAS EM ANDAMENTO
                    </span>

                    <strong>
                        {
                            quantidadeAtivas
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        OBRAS CONCLUÍDAS
                    </span>

                    <strong>
                        {
                            quantidadeConcluidas
                        }
                    </strong>

                </div>


            </div>


            {/* =================================================
                ABAS
            ================================================= */}

            <section className="inforfi-tabs">


                <button

                    type="button"

                    className={

                        aba === "ativas"

                            ? "ativa"

                            : ""

                    }

                    onClick={() =>
                        trocarAba(
                            "ativas"
                        )
                    }

                >

                    Em andamento

                    <span>
                        {
                            quantidadeAtivas
                        }
                    </span>

                </button>


                <button

                    type="button"

                    className={

                        aba === "concluidas"

                            ? "ativa"

                            : ""

                    }

                    onClick={() =>
                        trocarAba(
                            "concluidas"
                        )
                    }

                >

                    Concluídas

                    <span>
                        {
                            quantidadeConcluidas
                        }
                    </span>

                </button>


            </section>


            {/* =================================================
                BUSCA
            ================================================= */}

            <section className="inforfi-filters">


                <div className="inforfi-search">

                    <FiSearch />

                    <input

                        type="text"

                        value={
                            busca
                        }

                        onChange={e =>
                            setBusca(
                                e.target.value
                            )
                        }

                        placeholder="Buscar por obra, RDO, marceneiro, projetista ou informação financeira..."

                    />


                    {

                        busca && (

                            <button

                                type="button"

                                onClick={() =>
                                    setBusca("")
                                }

                                className="inforfi-clear-search"

                                title="Limpar busca"

                            >

                                <FiX />

                            </button>

                        )

                    }

                </div>


                <div className="inforfi-view">

                    <span>
                        Visualização
                    </span>

                    <strong>

                        {

                            aba === "ativas"

                                ? (

                                    ehAdministrador ||

                                    podeVerTodasObras

                                        ? "Todas as obras"

                                        : "Minhas obras"

                                )

                                : "Obras concluídas"

                        }

                    </strong>

                </div>

            </section>


            {/* =================================================
                LISTA
            ================================================= */}

            <section className="inforfi-content">


                <div className="inforfi-section-title">


                    <div>

                        <span>

                            {

                                aba === "ativas"

                                    ? "PRODUÇÃO"

                                    : "HISTÓRICO"

                            }

                        </span>


                        <h2>

                            {

                                aba === "ativas"

                                    ? "Informações das obras"

                                    : "Informações das obras concluídas"

                            }

                        </h2>

                    </div>


                    {

                        busca && (

                            <div className="inforfi-counter">

                                {
                                    obrasFiltradas.length
                                }

                                {

                                    obrasFiltradas.length === 1

                                        ? " obra encontrada"

                                        : " obras encontradas"

                                }

                            </div>

                        )

                    }


                </div>


                {

                    loading

                        ? (

                            <div className="inforfi-loading">

                                <FiRefreshCw />

                                Carregando informações financeiras...

                            </div>

                        )

                        : (

                            <div className="inforfi-table-wrapper">


                                <table className="inforfi-table">


                                    <thead>

                                        <tr>

                                            <th>
                                                Obra
                                            </th>

                                            <th>
                                                RDO
                                            </th>

                                            <th>
                                                Marceneiro
                                            </th>

                                            <th>
                                                Projetista
                                            </th>

                                            <th>
                                                Teto de custo
                                            </th>

                                            <th>
                                                Meta de custo
                                            </th>

                                            <th>
                                                Contrato
                                            </th>

                                            <th>
                                                Comissão / Bonificação / Taxa
                                            </th>

                                            <th>
                                                Destinado à produção
                                            </th>

                                            <th>
                                                Ganho marceneiro
                                            </th>

                                            <th>
                                                Ações
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>


                                        {

                                            obrasFiltradas.length === 0

                                                ? (

                                                    <tr>

                                                        <td

                                                            colSpan="11"

                                                            className="inforfi-empty"

                                                        >

                                                            {

                                                                aba === "ativas"

                                                                    ? "Nenhuma obra disponível para este usuário."

                                                                    : "Nenhuma obra concluída."

                                                            }

                                                        </td>

                                                    </tr>

                                                )

                                                : (

                                                    obrasFiltradas.map(

                                                        obra => {

                                                            const info =
                                                                obra.informacaoFinanceira;


                                                            return (

                                                                <tr

                                                                    key={
                                                                        obra.id
                                                                    }

                                                                >


                                                                    <td>

                                                                        <div className="inforfi-obra">

                                                                            <strong>
                                                                                {
                                                                                    obra.nome
                                                                                }
                                                                            </strong>

                                                                            <small>
                                                                                #
                                                                                {
                                                                                    obra.id
                                                                                }
                                                                            </small>

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            obra.rdo_nome ||
                                                                            "-"
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            obra.marceneiro_nome ||
                                                                            "-"
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            obra.projetista_nome ||
                                                                            "-"
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatarMoeda(
                                                                                info?.teto_custo
                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatarMoeda(
                                                                                info?.meta_custo
                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatarMoeda(
                                                                                info?.valor_contrato
                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatarMoeda(
                                                                                info?.comissao_bonificacao_taxa
                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatarMoeda(
                                                                                info?.valor_destinado_producao
                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatarMoeda(
                                                                                info?.expectativa_ganho_marceneiro
                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        <div className="inforfi-actions">


                                                                            {

                                                                                aba === "ativas" &&

                                                                                !info &&

                                                                                (

                                                                                    <button

                                                                                        type="button"

                                                                                        className="inforfi-action add"

                                                                                        title="Adicionar informações financeiras"

                                                                                        onClick={() =>
                                                                                            abrirNovo(
                                                                                                obra
                                                                                            )
                                                                                        }

                                                                                    >

                                                                                        <FiPlus />

                                                                                    </button>

                                                                                )

                                                                            }


                                                                            {

                                                                                aba === "ativas" &&

                                                                                info &&

                                                                                (

                                                                                    <button

                                                                                        type="button"

                                                                                        className="inforfi-action edit"

                                                                                        title="Editar informações financeiras"

                                                                                        onClick={() =>
                                                                                            abrirEdicao(
                                                                                                obra
                                                                                            )
                                                                                        }

                                                                                    >

                                                                                        <FiEdit2 />

                                                                                    </button>

                                                                                )

                                                                            }


                                                                            {

                                                                                aba === "ativas" &&

                                                                                info &&

                                                                                (

                                                                                    <button

                                                                                        type="button"

                                                                                        className="inforfi-action delete"

                                                                                        title="Excluir informações financeiras"

                                                                                        onClick={() =>
                                                                                            abrirExclusao(
                                                                                                obra
                                                                                            )
                                                                                        }

                                                                                    >

                                                                                        <FiTrash2 />

                                                                                    </button>

                                                                                )

                                                                            }


                                                                            {

                                                                                aba === "concluidas" &&

                                                                                (

                                                                                    <span className="inforfi-completed">

                                                                                        <FiCheck />

                                                                                        Concluída

                                                                                    </span>

                                                                                )

                                                                            }


                                                                        </div>

                                                                    </td>


                                                                </tr>

                                                            );

                                                        }

                                                    )

                                                )

                                        }


                                    </tbody>


                                </table>


                            </div>

                        )

                }


            </section>


            {/* =================================================
                MODAL SELECIONAR OBRA
            ================================================= */}

            {

                modalSelecionarObra &&

                (

                    <div className="inforfi-modal-overlay">


                        <div className="inforfi-modal inforfi-modal-select">


                            <header className="inforfi-modal-header">


                                <div>

                                    <span>
                                        NOVO CADASTRO
                                    </span>

                                    <h2>
                                        Selecionar obra
                                    </h2>

                                    <p>
                                        Escolha a obra que receberá as informações financeiras.
                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="inforfi-modal-close"

                                    onClick={
                                        fecharSelecaoObra
                                    }

                                    disabled={
                                        salvando
                                    }

                                >

                                    <FiX />

                                </button>

                            </header>


                            <div className="inforfi-select-body">


                                <div className="inforfi-search inforfi-select-search">

                                    <FiSearch />

                                    <input

                                        type="text"

                                        value={
                                            buscaObra
                                        }

                                        onChange={e =>
                                            setBuscaObra(
                                                e.target.value
                                            )
                                        }

                                        placeholder="Buscar obra..."

                                        autoFocus

                                    />

                                </div>


                                {

                                    obrasDisponiveisParaCadastro.length === 0

                                        ? (

                                            <div className="inforfi-no-obras">

                                                <FiCheck />

                                                <strong>
                                                    Nenhuma obra disponível
                                                </strong>

                                                <p>
                                                    Não existem obras em andamento disponíveis para este usuário.
                                                </p>

                                            </div>

                                        )

                                        : (

                                            <div className="inforfi-obra-selection-list">


                                                {

                                                    obrasDisponiveisParaCadastro.map(

                                                        obra => (

                                                            <button

                                                                key={
                                                                    obra.id
                                                                }

                                                                type="button"

                                                                className="inforfi-obra-selection"

                                                                onClick={() =>
                                                                    selecionarObraParaCadastro(
                                                                        obra
                                                                    )
                                                                }

                                                            >

                                                                <div className="inforfi-selection-main">

                                                                    <strong>
                                                                        {
                                                                            obra.nome
                                                                        }
                                                                    </strong>

                                                                    <small>
                                                                        #{obra.id}
                                                                    </small>

                                                                </div>


                                                                <div className="inforfi-selection-responsaveis">

                                                                    <span>

                                                                        RDO:

                                                                        <strong>
                                                                            {
                                                                                obra.rdo_nome ||
                                                                                "-"
                                                                            }
                                                                        </strong>

                                                                    </span>

                                                                    <span>

                                                                        Marceneiro:

                                                                        <strong>
                                                                            {
                                                                                obra.marceneiro_nome ||
                                                                                "-"
                                                                            }
                                                                        </strong>

                                                                    </span>

                                                                    <span>

                                                                        Projetista:

                                                                        <strong>
                                                                            {
                                                                                obra.projetista_nome ||
                                                                                "-"
                                                                            }
                                                                        </strong>

                                                                    </span>

                                                                </div>


                                                                {

                                                                    obra.informacaoFinanceira

                                                                        ? (

                                                                            <FiEdit2 />

                                                                        )

                                                                        : (

                                                                            <FiPlus />

                                                                        )

                                                                }


                                                            </button>

                                                        )

                                                    )

                                                }


                                            </div>

                                        )

                                }


                            </div>


                            <footer className="inforfi-modal-footer">


                                <button

                                    type="button"

                                    className="inforfi-btn-cancel"

                                    onClick={
                                        fecharSelecaoObra
                                    }

                                >

                                    Cancelar

                                </button>


                            </footer>


                        </div>

                    </div>

                )

            }


            {/* =================================================
                MODAL CRIAR / EDITAR
            ================================================= */}

            {

                modal &&

                (

                    <div className="inforfi-modal-overlay">


                        <div className="inforfi-modal">


                            <header className="inforfi-modal-header">


                                <div>

                                    <span>
                                        INFORMAÇÕES FINANCEIRAS
                                    </span>


                                    <h2>

                                        {

                                            informacaoSelecionada

                                                ? "Editar informações"

                                                : "Cadastrar informações"

                                        }

                                    </h2>


                                    <p>

                                        {
                                            obraSelecionada?.nome
                                        }

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="inforfi-modal-close"

                                    onClick={
                                        fecharModal
                                    }

                                    disabled={
                                        salvando
                                    }

                                >

                                    <FiX />

                                </button>

                            </header>


                            <div className="inforfi-obra-info">


                                <div>

                                    <span>
                                        OBRA
                                    </span>

                                    <strong>
                                        {
                                            obraSelecionada?.nome ||
                                            "-"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        RDO
                                    </span>

                                    <strong>
                                        {
                                            obraSelecionada?.rdo_nome ||
                                            "-"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        MARCENEIRO
                                    </span>

                                    <strong>
                                        {
                                            obraSelecionada?.marceneiro_nome ||
                                            "-"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        PROJETISTA
                                    </span>

                                    <strong>
                                        {
                                            obraSelecionada?.projetista_nome ||
                                            "-"
                                        }
                                    </strong>

                                </div>


                            </div>


                            <form

                                className="inforfi-form"

                                onSubmit={e => {

                                    e.preventDefault();

                                    salvar();

                                }}

                            >


                                <div className="inforfi-form-grid">


                                    <div className="inforfi-form-group">

                                        <label>
                                            Teto de custo
                                        </label>

                                        <div className="inforfi-input-money">

                                            <span>
                                                R$
                                            </span>

                                            <input

                                                type="number"

                                                name="teto_custo"

                                                value={
                                                    form.teto_custo
                                                }

                                                onChange={
                                                    alterarCampo
                                                }

                                                min="0"

                                                step="0.01"

                                                placeholder="0,00"

                                            />

                                        </div>

                                    </div>


                                    <div className="inforfi-form-group">

                                        <label>
                                            Meta de custo
                                        </label>

                                        <div className="inforfi-input-money">

                                            <span>
                                                R$
                                            </span>

                                            <input

                                                type="number"

                                                name="meta_custo"

                                                value={
                                                    form.meta_custo
                                                }

                                                onChange={
                                                    alterarCampo
                                                }

                                                min="0"

                                                step="0.01"

                                                placeholder="0,00"

                                            />

                                        </div>

                                    </div>


                                    <div className="inforfi-form-group">

                                        <label>
                                            Valor de contrato
                                        </label>

                                        <div className="inforfi-input-money">

                                            <span>
                                                R$
                                            </span>

                                            <input

                                                type="number"

                                                name="valor_contrato"

                                                value={
                                                    form.valor_contrato
                                                }

                                                onChange={
                                                    alterarCampo
                                                }

                                                min="0"

                                                step="0.01"

                                                placeholder="0,00"

                                            />

                                        </div>

                                    </div>


                                    <div className="inforfi-form-group">

                                        <label>
                                            Comissão / Bonificação / Taxa
                                        </label>

                                        <div className="inforfi-input-money">

                                            <span>
                                                R$
                                            </span>

                                            <input

                                                type="number"

                                                name="comissao_bonificacao_taxa"

                                                value={
                                                    form.comissao_bonificacao_taxa
                                                }

                                                onChange={
                                                    alterarCampo
                                                }

                                                min="0"

                                                step="0.01"

                                                placeholder="0,00"

                                            />

                                        </div>

                                    </div>


                                    <div className="inforfi-form-group">

                                        <label>
                                            Valor destinado à produção
                                        </label>

                                        <div className="inforfi-input-money">

                                            <span>
                                                R$
                                            </span>

                                            <input

                                                type="number"

                                                name="valor_destinado_producao"

                                                value={
                                                    form.valor_destinado_producao
                                                }

                                                onChange={
                                                    alterarCampo
                                                }

                                                min="0"

                                                step="0.01"

                                                placeholder="0,00"

                                            />

                                        </div>

                                    </div>


                                    <div className="inforfi-form-group">

                                        <label>
                                            Expectativa de ganho do marceneiro
                                        </label>

                                        <div className="inforfi-input-money">

                                            <span>
                                                R$
                                            </span>

                                            <input

                                                type="number"

                                                name="expectativa_ganho_marceneiro"

                                                value={
                                                    form.expectativa_ganho_marceneiro
                                                }

                                                onChange={
                                                    alterarCampo
                                                }

                                                min="0"

                                                step="0.01"

                                                placeholder="0,00"

                                            />

                                        </div>

                                    </div>


                                    <div className="inforfi-form-group">

                                        <label>
                                            Outros
                                        </label>

                                        <div className="inforfi-input-money">

                                            <span>
                                                R$
                                            </span>

                                            <input

                                                type="number"

                                                name="outros"

                                                value={
                                                    form.outros
                                                }

                                                onChange={
                                                    alterarCampo
                                                }

                                                min="0"

                                                step="0.01"

                                                placeholder="0,00"

                                            />

                                        </div>

                                    </div>


                                </div>


                                {

                                    erro &&

                                    (

                                        <div className="inforfi-form-error">

                                            {
                                                erro
                                            }

                                        </div>

                                    )

                                }


                                <footer className="inforfi-modal-footer">


                                    <button

                                        type="button"

                                        className="inforfi-btn-cancel"

                                        onClick={
                                            fecharModal
                                        }

                                        disabled={
                                            salvando
                                        }

                                    >

                                        Cancelar

                                    </button>


                                    <button

                                        type="submit"

                                        className="inforfi-btn-save"

                                        disabled={
                                            salvando
                                        }

                                    >

                                        {

                                            salvando

                                                ? "Salvando..."

                                                : informacaoSelecionada

                                                    ? "Salvar alterações"

                                                    : "Cadastrar informações"

                                        }

                                    </button>


                                </footer>


                            </form>


                        </div>

                    </div>

                )

            }


            {/* =================================================
                MODAL EXCLUSÃO
            ================================================= */}

            {

                modalExcluir &&

                (

                    <div className="inforfi-modal-overlay">


                        <div className="inforfi-modal inforfi-modal-small">


                            <header className="inforfi-modal-header">


                                <div>

                                    <span>
                                        ATENÇÃO
                                    </span>


                                    <h2>
                                        Excluir informações?
                                    </h2>


                                    <p>

                                        As informações financeiras da obra{" "}

                                        <strong>

                                            {
                                                obraSelecionada?.nome
                                            }

                                        </strong>{" "}

                                        serão excluídas.

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="inforfi-modal-close"

                                    onClick={
                                        fecharExclusao
                                    }

                                    disabled={
                                        salvando
                                    }

                                >

                                    <FiX />

                                </button>

                            </header>


                            {

                                erro &&

                                (

                                    <div className="inforfi-form-error">

                                        {
                                            erro
                                        }

                                    </div>

                                )

                            }


                            <footer className="inforfi-modal-footer">


                                <button

                                    type="button"

                                    className="inforfi-btn-cancel"

                                    onClick={
                                        fecharExclusao
                                    }

                                    disabled={
                                        salvando
                                    }

                                >

                                    Cancelar

                                </button>


                                <button

                                    type="button"

                                    className="inforfi-btn-delete"

                                    onClick={
                                        excluir
                                    }

                                    disabled={
                                        salvando
                                    }

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

