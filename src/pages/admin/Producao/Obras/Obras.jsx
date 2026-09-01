import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiX,
    FiRefreshCw,
    FiArrowLeft,
    FiSearch,
    FiFilter,
    FiCheck,
    FiRotateCcw
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import {
    supabase
} from "../../../../services/supabase";

import "./Obras.scss";


/*
=====================================================
FORMULÁRIO INICIAL
=====================================================
*/

const FORM_INICIAL = {

    nome: "",

    endereco: "",

    cliente_nome: "",

    arquiteto_empresa: "",

    data_inicio_esperada: "",

    valor: "",

    rdo_nome: "",

    marceneiro_nome: "",

    projetista_nome: "",

    dias_finalizacao_esperado: ""

};


/*
=====================================================
CHAVE DO RASCUNHO
=====================================================
*/

const STORAGE_KEY =
    "alme_obras_rascunho";


/*
=====================================================
ROLES DOS RESPONSÁVEIS
=====================================================
*/

const ROLE_RDO = 3;

const ROLE_MARCENEIRO = 5;

const ROLE_PROJETISTA = 3;


/*
=====================================================
COMPONENTE
=====================================================
*/

export default function Obras() {

    const navigate =
        useNavigate();


    /*
    =================================================
    OBRAS ATIVAS
    =================================================
    */

    const [
        obras,
        setObras
    ] = useState([]);


    /*
    =================================================
    OBRAS CONCLUÍDAS
    =================================================
    */

    const [
        obrasConcluidas,
        setObrasConcluidas
    ] = useState([]);


    /*
    =================================================
    USUÁRIOS
    =================================================
    */

    const [
        usuarios,
        setUsuarios
    ] = useState([]);


    /*
    =================================================
    USUÁRIO ATUAL
    =================================================
    */

    const [
        usuarioAtual,
        setUsuarioAtual
    ] = useState(null);


    /*
    =================================================
    ABA ATUAL
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
        loadingConcluidas,
        setLoadingConcluidas
    ] = useState(false);


    const [
        loadingUsuarios,
        setLoadingUsuarios
    ] = useState(true);


    /*
    =================================================
    SALVAMENTO
    =================================================
    */

    const [
        salvando,
        setSalvando
    ] = useState(false);


    const [
        concluindo,
        setConcluindo
    ] = useState(false);


    const [
        desconcluindo,
        setDesconcluindo
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
        modalExcluir,
        setModalExcluir
    ] = useState(false);


    const [
        modalConcluir,
        setModalConcluir
    ] = useState(false);


    const [
        modalDesconcluir,
        setModalDesconcluir
    ] = useState(false);


    /*
    =================================================
    EDIÇÃO / SELEÇÃO
    =================================================
    */

    const [
        editando,
        setEditando
    ] = useState(null);


    const [
        obraSelecionada,
        setObraSelecionada
    ] = useState(null);


    const [
        obraParaConcluir,
        setObraParaConcluir
    ] = useState(null);


    const [
        obraParaDesconcluir,
        setObraParaDesconcluir
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
    FILTROS
    =================================================
    */

    const [
        busca,
        setBusca
    ] = useState("");


    const [
        filtroResponsavel,
        setFiltroResponsavel
    ] = useState("");


    /*
    =================================================
    CARREGAR OBRAS ATIVAS + USUÁRIOS
    =================================================
    */

    async function carregarDados() {

        setLoading(true);

        setLoadingUsuarios(true);

        setErro("");

        try {

            console.log(
                "===================================="
            );

            console.log(
                "CARREGANDO OBRAS ATIVAS"
            );

            console.log(
                "===================================="
            );


            const {
                data,
                error
            } =
                await supabase
                    .functions
                    .invoke(
                        "admin-obras",
                        {
                            body: {
                                action:
                                    "list"
                            }
                        }
                    );


            console.log(
                "RESPOSTA ADMIN-OBRAS:",
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


            /*
            =============================================
            OBRAS ATIVAS
            =============================================
            */

            const listaObras =

                Array.isArray(
                    data?.obras
                )

                    ? data.obras

                    : [];


            setObras(
                listaObras.filter(
                    obra =>
                        obra.concluida !== true
                )
            );


            /*
            =============================================
            USUÁRIOS
            =============================================
            */

            const listaUsuarios =

                Array.isArray(
                    data?.usuarios
                )

                    ? data.usuarios

                    : [];


            setUsuarios(
                listaUsuarios
            );


            /*
            =============================================
            USUÁRIO ATUAL
            =============================================
            */

            setUsuarioAtual(

                data?.usuarioAtual
                    ? data.usuarioAtual
                    : null

            );


        }

        catch (err) {

            console.error(
                "Erro ao carregar obras:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível carregar os dados."

            );


            setObras([]);

            setUsuarios([]);

            setUsuarioAtual(null);

        }

        finally {

            setLoading(false);

            setLoadingUsuarios(false);

        }

    }


    /*
    =================================================
    CARREGAR OBRAS CONCLUÍDAS
    =================================================
    */

    async function carregarObrasConcluidas() {

        setLoadingConcluidas(true);

        try {

            const {
                data,
                error
            } =
                await supabase
                    .functions
                    .invoke(
                        "admin-obras",
                        {
                            body: {
                                action:
                                    "list_concluidas"
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


            const lista =

                Array.isArray(
                    data?.obras
                )

                    ? data.obras

                    : [];


            setObrasConcluidas(

                lista.filter(
                    obra =>
                        obra.concluida === true
                )

            );

        }

        catch (err) {

            console.error(
                "Erro ao carregar obras concluídas:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível carregar as obras concluídas."

            );


            setObrasConcluidas([]);

        }

        finally {

            setLoadingConcluidas(false);

        }

    }


    /*
    =================================================
    CARREGAR AO ABRIR
    =================================================
    */

    useEffect(() => {

        carregarDados();

        carregarObrasConcluidas();

    }, []);


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

        setFiltroResponsavel("");

        setErro("");

        if (
            novaAba === "concluidas"
        ) {

            carregarObrasConcluidas();

        }

    }


    /*
    =================================================
    RESTAURAR RASCUNHO
    =================================================
    */

    useEffect(() => {

        try {

            const salvo =
                sessionStorage.getItem(
                    STORAGE_KEY
                );


            if (!salvo) {
                return;
            }


            const dados =
                JSON.parse(
                    salvo
                );


            if (
                dados?.form
            ) {

                setForm({

                    ...FORM_INICIAL,

                    ...dados.form

                });

            }


            if (
                dados?.editando
            ) {

                setEditando(
                    dados.editando
                );

            }


            if (
                dados?.modal === true
            ) {

                setModal(
                    true
                );

            }

        }

        catch (error) {

            console.error(
                "Erro ao restaurar rascunho:",
                error
            );

        }

    }, []);


    /*
    =================================================
    SALVAR RASCUNHO
    =================================================
    */

    useEffect(() => {

        if (!modal) {
            return;
        }


        try {

            sessionStorage.setItem(

                STORAGE_KEY,

                JSON.stringify({

                    form,

                    editando,

                    modal: true

                })

            );

        }

        catch (error) {

            console.error(
                "Erro ao salvar rascunho:",
                error
            );

        }

    }, [
        form,
        editando,
        modal
    ]);


    /*
    =================================================
    LIMPAR RASCUNHO
    =================================================
    */

    function limparRascunho() {

        try {

            sessionStorage.removeItem(
                STORAGE_KEY
            );

        }

        catch (error) {

            console.error(
                "Erro ao limpar rascunho:",
                error
            );

        }

    }


    /*
    =================================================
    IDENTIFICAR ADMINISTRADOR
    =================================================
    */

    const ehAdministrador =
        Number(
            usuarioAtual?.role_id
        ) === 1;


    /*
    =================================================
    IDENTIFICAR PRODUÇÃO
    =================================================
    */

    const ehProducao =
        Number(
            usuarioAtual?.role_id
        ) === 3;


    /*
    =================================================
    PERMISSÃO ESPECIAL
    =================================================
    */

    const podeVerTodasObras =
        usuarioAtual?.pode_ver_todas_obras === true;


    /*
    =================================================
    USUÁRIOS VÁLIDOS
    =================================================
    */

    const usuariosValidos = useMemo(() => {

        return (

            usuarios

                .filter(
                    usuario =>
                        Boolean(
                            usuario?.username
                        )
                )

                .sort(
                    (a, b) =>
                        String(
                            a.username
                        ).localeCompare(
                            String(
                                b.username
                            ),
                            "pt-BR"
                        )
                )

        );

    }, [
        usuarios
    ]);


    /*
    =================================================
    RDO
    =================================================
    */

    const usuariosRdo = useMemo(() => {

        return usuariosValidos.filter(

            usuario =>
                Number(
                    usuario.role_id
                ) === ROLE_RDO

        );

    }, [
        usuariosValidos
    ]);


    /*
    =================================================
    MARCENEIROS
    =================================================
    */

    const usuariosMarceneiros = useMemo(() => {

        return usuariosValidos.filter(

            usuario =>
                Number(
                    usuario.role_id
                ) === ROLE_MARCENEIRO

        );

    }, [
        usuariosValidos
    ]);


    /*
    =================================================
    PROJETISTAS
    =================================================
    */

    const usuariosProjetistas = useMemo(() => {

        return usuariosValidos.filter(

            usuario =>
                Number(
                    usuario.role_id
                ) === ROLE_PROJETISTA

        );

    }, [
        usuariosValidos
    ]);


    /*
    =================================================
    FILTRAR OBRAS ATIVAS
    =================================================
    */

    const obrasFiltradas = useMemo(() => {

        const termo =
            busca
                .trim()
                .toLowerCase();


        const responsavel =
            filtroResponsavel
                .trim()
                .toLowerCase();


        return obras.filter(

            obra => {

                /*
                =========================================
                FILTRO RESPONSÁVEL
                =========================================
                */

                if (

                    responsavel &&

                    (

                        ehAdministrador ||

                        podeVerTodasObras

                    )

                ) {

                    const rdo =
                        String(
                            obra.rdo_nome || ""
                        )
                            .trim()
                            .toLowerCase();


                    const marceneiro =
                        String(
                            obra.marceneiro_nome || ""
                        )
                            .trim()
                            .toLowerCase();


                    const projetista =
                        String(
                            obra.projetista_nome || ""
                        )
                            .trim()
                            .toLowerCase();


                    const corresponde =

                        rdo === responsavel ||

                        marceneiro === responsavel ||

                        projetista === responsavel;


                    if (
                        !corresponde
                    ) {

                        return false;

                    }

                }


                /*
                =========================================
                BUSCA
                =========================================
                */

                if (!termo) {

                    return true;

                }


                const campos = [

                    obra.nome,

                    obra.endereco,

                    obra.cliente_nome,

                    obra.arquiteto_empresa,

                    obra.rdo_nome,

                    obra.marceneiro_nome,

                    obra.projetista_nome,

                    obra.data_inicio_esperada,

                    obra.valor,

                    obra.dias_finalizacao_esperado

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

        busca,

        filtroResponsavel,

        ehAdministrador,

        podeVerTodasObras

    ]);


    /*
    =================================================
    FILTRAR CONCLUÍDAS
    =================================================
    */

    const obrasConcluidasFiltradas = useMemo(() => {

        const termo =
            busca
                .trim()
                .toLowerCase();


        if (!termo) {

            return obrasConcluidas;

        }


        return obrasConcluidas.filter(

            obra => {

                const campos = [

                    obra.nome,

                    obra.endereco,

                    obra.cliente_nome,

                    obra.arquiteto_empresa,

                    obra.rdo_nome,

                    obra.marceneiro_nome,

                    obra.projetista_nome,

                    obra.data_inicio_esperada,

                    obra.valor,

                    obra.dias_finalizacao_esperado,

                    obra.concluida_at

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

        obrasConcluidas,

        busca

    ]);


    /*
    =================================================
    OBRAS EXIBIDAS
    =================================================
    */

    const obrasExibidas =

        aba === "ativas"

            ? obrasFiltradas

            : obrasConcluidasFiltradas;


    /*
    =================================================
    CONTADORES
    =================================================
    */

    const quantidadeObrasAtivas =
        obrasFiltradas.length;


    const quantidadeObrasConcluidas =
        obrasConcluidas.length;


    /*
    =================================================
    TEXTO DE VISUALIZAÇÃO
    =================================================
    */

    const textoVisualizacao =

        aba === "concluidas"

            ? "Todas as concluídas"

            : ehAdministrador

                ? (

                    filtroResponsavel

                        ? "Obras do responsável"

                        : "Todas as obras"

                )

                : podeVerTodasObras

                    ? (

                        filtroResponsavel

                            ? "Obras do responsável"

                            : "Todas as obras"

                    )

                    : "Minhas obras";


    /*
    =================================================
    LIMPAR FILTROS
    =================================================
    */

    function limparFiltros() {

        setBusca("");

        setFiltroResponsavel("");

    }


    /*
    =================================================
    ABRIR NOVA OBRA
    =================================================
    */

    function abrirNovaObra() {

        limparRascunho();

        setEditando(null);

        setForm({
            ...FORM_INICIAL
        });

        setErro("");

        setModal(true);

    }


    /*
    =================================================
    ABRIR EDIÇÃO
    =================================================
    */

    function abrirEdicao(
        obra
    ) {

        limparRascunho();

        setEditando(
            obra
        );


        setForm({

            nome:
                obra.nome || "",

            endereco:
                obra.endereco || "",

            cliente_nome:
                obra.cliente_nome || "",

            arquiteto_empresa:
                obra.arquiteto_empresa || "",

            data_inicio_esperada:
                obra.data_inicio_esperada || "",

            valor:

                obra.valor !== null &&

                obra.valor !== undefined

                    ? String(
                        obra.valor
                    )

                    : "",

            rdo_nome:
                obra.rdo_nome || "",

            marceneiro_nome:
                obra.marceneiro_nome || "",

            projetista_nome:
                obra.projetista_nome || "",

            dias_finalizacao_esperado:

                obra.dias_finalizacao_esperado !== null &&

                obra.dias_finalizacao_esperado !== undefined

                    ? String(
                        obra.dias_finalizacao_esperado
                    )

                    : ""

        });


        setErro("");

        setModal(true);

    }


    /*
    =================================================
    CONCLUIR
    =================================================
    */

    function abrirConclusao(
        obra
    ) {

        setObraParaConcluir(
            obra
        );

        setErro("");

        setModalConcluir(
            true
        );

    }


    function fecharConclusao() {

        if (concluindo) {
            return;
        }


        setModalConcluir(
            false
        );

        setObraParaConcluir(
            null
        );

        setErro("");

    }


    async function confirmarConclusao() {

        if (
            !obraParaConcluir?.id
        ) {

            return;

        }


        setConcluindo(true);

        setErro("");


        try {

            const {
                data,
                error
            } =
                await supabase
                    .functions
                    .invoke(
                        "admin-obras",
                        {
                            body: {

                                action:
                                    "complete",

                                id:
                                    obraParaConcluir.id

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


            setModalConcluir(
                false
            );

            setObraParaConcluir(
                null
            );


            await carregarDados();

            await carregarObrasConcluidas();

        }

        catch (err) {

            console.error(
                "Erro ao concluir obra:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível concluir a obra."

            );

        }

        finally {

            setConcluindo(false);

        }

    }


    /*
    =================================================
    DESCONCLUIR
    =================================================
    */

    function abrirDesconclusao(
        obra
    ) {

        setObraParaDesconcluir(
            obra
        );

        setErro("");

        setModalDesconcluir(
            true
        );

    }


    function fecharDesconclusao() {

        if (desconcluindo) {
            return;
        }


        setModalDesconcluir(
            false
        );

        setObraParaDesconcluir(
            null
        );

        setErro("");

    }


    async function confirmarDesconclusao() {

        if (
            !obraParaDesconcluir?.id
        ) {

            return;

        }


        setDesconcluindo(true);

        setErro("");


        try {

            const {
                data,
                error
            } =
                await supabase
                    .functions
                    .invoke(
                        "admin-obras",
                        {
                            body: {

                                action:
                                    "uncomplete",

                                id:
                                    obraParaDesconcluir.id

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


            setModalDesconcluir(
                false
            );

            setObraParaDesconcluir(
                null
            );


            await carregarDados();

            await carregarObrasConcluidas();


            /*
            =============================================
            VOLTAR AUTOMATICAMENTE PARA ATIVAS
            =============================================
            */

            setAba("ativas");

        }

        catch (err) {

            console.error(
                "Erro ao desconcluir obra:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível desconcluir a obra."

            );

        }

        finally {

            setDesconcluindo(false);

        }

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

        setEditando(null);

        setForm({
            ...FORM_INICIAL
        });

        setErro("");

        limparRascunho();

    }


    /*
    =================================================
    ALTERAR CAMPO
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
    SALVAR OBRA
    =================================================
    */

    async function salvarObra(
        e
    ) {

        e.preventDefault();

        setErro("");


        if (
            !form.nome.trim()
        ) {

            setErro(
                "Informe o nome da obra."
            );

            return;

        }


        if (

            form.valor &&

            Number(
                form.valor
            ) < 0

        ) {

            setErro(
                "O valor não pode ser negativo."
            );

            return;

        }


        if (

            form.dias_finalizacao_esperado &&

            Number(
                form.dias_finalizacao_esperado
            ) < 0

        ) {

            setErro(
                "O número de dias não pode ser negativo."
            );

            return;

        }


        if (

            form.rdo_nome &&

            !usuariosRdo.some(

                usuario =>

                    usuario.username ===
                    form.rdo_nome

            )

        ) {

            setErro(
                "O RDO selecionado não está disponível."
            );

            return;

        }


        if (

            form.marceneiro_nome &&

            !usuariosMarceneiros.some(

                usuario =>

                    usuario.username ===
                    form.marceneiro_nome

            )

        ) {

            setErro(
                "O marceneiro selecionado não está disponível."
            );

            return;

        }


        if (

            form.projetista_nome &&

            !usuariosProjetistas.some(

                usuario =>

                    usuario.username ===
                    form.projetista_nome

            )

        ) {

            setErro(
                "O projetista selecionado não está disponível."
            );

            return;

        }


        setSalvando(true);


        try {

            const payload = {

                action:

                    editando

                        ? "update"

                        : "create",


                ...(

                    editando

                        ? {

                            id:
                                editando.id

                        }

                        : {}

                ),


                nome:
                    form.nome.trim(),


                endereco:
                    form.endereco.trim(),


                cliente_nome:
                    form.cliente_nome.trim(),


                arquiteto_empresa:
                    form.arquiteto_empresa.trim(),


                data_inicio_esperada:

                    form.data_inicio_esperada ||

                    null,


                valor:

                    form.valor

                        ? Number(
                            form.valor
                        )

                        : null,


                rdo_nome:

                    form.rdo_nome ||

                    null,


                marceneiro_nome:

                    form.marceneiro_nome ||

                    null,


                projetista_nome:

                    form.projetista_nome ||

                    null,


                dias_finalizacao_esperado:

                    form.dias_finalizacao_esperado

                        ? Number(
                            form.dias_finalizacao_esperado
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
                        "admin-obras",
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


            limparRascunho();

            setModal(false);

            setEditando(null);

            setForm({
                ...FORM_INICIAL
            });

            setErro("");


            await carregarDados();

            await carregarObrasConcluidas();

        }

        catch (err) {

            console.error(
                "Erro ao salvar obra:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível salvar a obra."

            );

        }

        finally {

            setSalvando(false);

        }

    }


    /*
    =================================================
    EXCLUSÃO
    =================================================
    */

    function abrirExclusao(
        obra
    ) {

        setObraSelecionada(
            obra
        );

        setErro("");

        setModalExcluir(true);

    }


    function fecharExclusao() {

        if (salvando) {
            return;
        }


        setModalExcluir(false);

        setObraSelecionada(null);

        setErro("");

    }


    async function excluirObra() {

        if (
            !obraSelecionada?.id
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
                        "admin-obras",
                        {
                            body: {

                                action:
                                    "delete",

                                id:
                                    obraSelecionada.id

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

            await carregarObrasConcluidas();

        }

        catch (err) {

            console.error(
                "Erro ao excluir obra:",
                err
            );


            setErro(

                err?.message ||

                "Não foi possível excluir a obra."

            );

        }

        finally {

            setSalvando(false);

        }

    }


    /*
    =================================================
    TEXTO DO USUÁRIO
    =================================================
    */

    function textoUsuario(
        usuario
    ) {

        if (!usuario) {
            return "";
        }


        if (
            usuario.nome
        ) {

            return (
                `${usuario.username} — ${usuario.nome}`
            );

        }


        return (
            usuario.username
        );

    }


    /*
    =================================================
    FORMATAR DATA
    =================================================
    */

    function formatarData(
        data
    ) {

        if (!data) {
            return "-";
        }


        const partes =
            String(
                data
            ).split("-");


        if (
            partes.length !== 3
        ) {
            return "-";
        }


        const [
            ano,
            mes,
            dia
        ] =
            partes;


        return (
            `${dia}/${mes}/${ano}`
        );

    }


    /*
    =================================================
    FORMATAR DATA/HORA
    =================================================
    */

    function formatarDataHora(
        data
    ) {

        if (!data) {
            return "-";
        }


        const dataObj =
            new Date(
                data
            );


        if (
            Number.isNaN(
                dataObj.getTime()
            )
        ) {

            return "-";

        }


        return dataObj.toLocaleDateString(
            "pt-BR"
        );

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

        <section className="obras-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="obras-header">


                <div className="obras-header-left">


                    <button

                        type="button"

                        className="obras-back"

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
                            Obras
                        </h1>


                        <p>
                            Gerencie as obras cadastradas
                            para a produção.
                        </p>

                    </div>

                </div>


                <div className="obras-header-actions">


                    <button

                        type="button"

                        className="obras-btn-refresh"

                        onClick={() => {

                            carregarDados();

                            carregarObrasConcluidas();

                        }}

                        disabled={

                            loading ||

                            loadingConcluidas

                        }

                    >

                        <FiRefreshCw

                            className={

                                (

                                    loading ||

                                    loadingConcluidas

                                )

                                    ? "girando"

                                    : ""

                            }

                        />

                        Atualizar

                    </button>


                    {

                        aba === "ativas" &&

                        (

                            <button

                                type="button"

                                className="obras-btn-add"

                                onClick={
                                    abrirNovaObra
                                }

                            >

                                <FiPlus />

                                Nova obra

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

                !modalConcluir &&

                !modalDesconcluir &&

                (

                    <div className="obras-error">

                        {
                            erro
                        }

                    </div>

                )

            }


            {/* =================================================
                RESUMO
            ================================================= */}

            <div className="obras-summary">


                <div>

                    <span>
                        OBRAS EM ANDAMENTO
                    </span>

                    <strong>
                        {
                            quantidadeObrasAtivas
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        OBRAS CONCLUÍDAS
                    </span>

                    <strong>
                        {
                            quantidadeObrasConcluidas
                        }
                    </strong>

                </div>


            </div>


            {/* =================================================
                ABAS
            ================================================= */}

            <section className="obras-abas">


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
                            quantidadeObrasAtivas
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
                            quantidadeObrasConcluidas
                        }

                    </span>

                </button>


            </section>


            {/* =================================================
                FILTROS
            ================================================= */}

            <section className="obras-filtros">


                <div className="obras-filtro-busca">


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

                        placeholder={

                            aba === "ativas"

                                ? "Buscar por obra, endereço, cliente, arquiteto, RDO, marceneiro ou projetista..."

                                : "Buscar entre as obras concluídas..."

                        }

                    />


                    {

                        busca && (

                            <button

                                type="button"

                                className="obras-filtro-limpar"

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


                {

                    aba === "ativas" &&

                    (

                        (
                            ehAdministrador ||

                            podeVerTodasObras
                        )

                        &&

                        (

                            <div className="obras-filtro-responsavel">


                                <FiFilter />


                                <select

                                    value={
                                        filtroResponsavel
                                    }

                                    onChange={e =>
                                        setFiltroResponsavel(
                                            e.target.value
                                        )
                                    }

                                    disabled={
                                        loadingUsuarios
                                    }

                                >

                                    <option value="">

                                        {

                                            loadingUsuarios

                                                ? "Carregando responsáveis..."

                                                : "Todas as obras"

                                        }

                                    </option>


                                    {

                                        usuariosValidos.map(

                                            usuario => (

                                                <option

                                                    key={
                                                        usuario.id
                                                    }

                                                    value={
                                                        usuario.username
                                                    }

                                                >

                                                    {
                                                        textoUsuario(
                                                            usuario
                                                        )
                                                    }

                                                </option>

                                            )

                                        )

                                    }


                                </select>


                            </div>

                        )

                    )

                }


                <div className="obras-filtro-info">

                    <span>
                        Visualização
                    </span>

                    <strong>
                        {
                            textoVisualizacao
                        }
                    </strong>

                </div>


                {

                    (
                        busca ||

                        filtroResponsavel

                    )

                    &&

                    (

                        <button

                            type="button"

                            className="obras-filtros-clear"

                            onClick={
                                limparFiltros
                            }

                        >

                            <FiX />

                            Limpar

                        </button>

                    )

                }


            </section>


            {/* =================================================
                LISTA
            ================================================= */}

            <section className="obras-content">


                <div className="obras-section-title">


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

                                    ? "Obras em andamento"

                                    : "Obras concluídas"

                            }

                        </h2>

                    </div>


                    {

                        (
                            busca ||

                            filtroResponsavel

                        )

                        &&

                        (

                            <div className="obras-section-counter">

                                {

                                    obrasExibidas.length

                                }

                                {

                                    obrasExibidas.length === 1

                                        ? " obra encontrada"

                                        : " obras encontradas"

                                }

                            </div>

                        )

                    }


                </div>


                {

                    (

                        aba === "ativas"

                            ? loading

                            : loadingConcluidas

                    )

                        ? (

                            <div className="obras-loading">

                                <FiRefreshCw />

                                {

                                    aba === "ativas"

                                        ? "Carregando obras..."

                                        : "Carregando obras concluídas..."

                                }

                            </div>

                        )

                        : (

                            <div className="obras-table-wrapper">


                                <table className="obras-table">


                                    <thead>

                                        <tr>

                                            <th>
                                                Obra
                                            </th>

                                            <th>
                                                Endereço
                                            </th>

                                            <th>
                                                Cliente
                                            </th>

                                            <th>
                                                Arquiteto / Empresa
                                            </th>

                                            <th>
                                                Início
                                            </th>

                                            <th>
                                                Valor
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
                                                Dias
                                            </th>

                                            {

                                                aba === "concluidas"

                                                    ? (

                                                        <th>
                                                            Concluída em
                                                        </th>

                                                    )

                                                    : (

                                                        <th>
                                                            Ações
                                                        </th>

                                                    )

                                            }

                                        </tr>

                                    </thead>


                                    <tbody>


                                        {

                                            obrasExibidas.length === 0

                                                ? (

                                                    <tr>

                                                        <td

                                                            colSpan="11"

                                                            className="obras-empty"

                                                        >

                                                            {

                                                                aba === "ativas"

                                                                    ? (

                                                                        obras.length === 0

                                                                            ? "Nenhuma obra disponível para este usuário."

                                                                            : "Nenhuma obra corresponde aos filtros."

                                                                    )

                                                                    : (

                                                                        obrasConcluidas.length === 0

                                                                            ? "Nenhuma obra concluída."

                                                                            : "Nenhuma obra concluída corresponde aos filtros."

                                                                    )

                                                            }

                                                        </td>

                                                    </tr>

                                                )

                                                : (

                                                    obrasExibidas.map(

                                                        obra => (

                                                            <tr

                                                                key={
                                                                    obra.id
                                                                }

                                                            >


                                                                <td>

                                                                    <div className="obra-nome">

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

                                                                        obra.endereco ||

                                                                        "-"

                                                                    }

                                                                </td>


                                                                <td>

                                                                    {

                                                                        obra.cliente_nome ||

                                                                        "-"

                                                                    }

                                                                </td>


                                                                <td>

                                                                    {

                                                                        obra.arquiteto_empresa ||

                                                                        "-"

                                                                    }

                                                                </td>


                                                                <td>

                                                                    {

                                                                        formatarData(

                                                                            obra.data_inicio_esperada

                                                                        )

                                                                    }

                                                                </td>


                                                                <td>

                                                                    {

                                                                        formatarMoeda(

                                                                            obra.valor

                                                                        )

                                                                    }

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

                                                                        obra.dias_finalizacao_esperado !== null &&

                                                                        obra.dias_finalizacao_esperado !== undefined

                                                                            ? `${obra.dias_finalizacao_esperado} dias`

                                                                            : "-"

                                                                    }

                                                                </td>


                                                                {

                                                                    aba === "concluidas"

                                                                        ? (

                                                                            <td>

                                                                                <div className="obra-acoes">


                                                                                    <button

                                                                                        type="button"

                                                                                        className="obra-action uncomplete"

                                                                                        title="Desconcluir obra"

                                                                                        onClick={() =>
                                                                                            abrirDesconclusao(
                                                                                                obra
                                                                                            )
                                                                                        }

                                                                                    >

                                                                                        <FiRotateCcw />

                                                                                    </button>


                                                                                    <button

                                                                                        type="button"

                                                                                        className="obra-action delete"

                                                                                        title="Excluir obra"

                                                                                        onClick={() =>
                                                                                            abrirExclusao(
                                                                                                obra
                                                                                            )
                                                                                        }

                                                                                    >

                                                                                        <FiTrash2 />

                                                                                    </button>


                                                                                </div>

                                                                            </td>

                                                                        )

                                                                        : (

                                                                            <td>

                                                                                <div className="obra-acoes">


                                                                                    <button

                                                                                        type="button"

                                                                                        className="obra-action edit"

                                                                                        title="Editar obra"

                                                                                        onClick={() =>
                                                                                            abrirEdicao(
                                                                                                obra
                                                                                            )
                                                                                        }

                                                                                    >

                                                                                        <FiEdit2 />

                                                                                    </button>


                                                                                    <button

                                                                                        type="button"

                                                                                        className="obra-action complete"

                                                                                        title="Concluir obra"

                                                                                        onClick={() =>
                                                                                            abrirConclusao(
                                                                                                obra
                                                                                            )
                                                                                        }

                                                                                    >

                                                                                        <FiCheck />

                                                                                    </button>


                                                                                    <button

                                                                                        type="button"

                                                                                        className="obra-action delete"

                                                                                        title="Excluir obra"

                                                                                        onClick={() =>
                                                                                            abrirExclusao(
                                                                                                obra
                                                                                            )
                                                                                        }

                                                                                    >

                                                                                        <FiTrash2 />

                                                                                    </button>


                                                                                </div>

                                                                            </td>

                                                                        )

                                                                }


                                                            </tr>

                                                        )

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
                MODAL CRIAR / EDITAR
            ================================================= */}

            {

                modal &&

                (

                    <div className="obras-modal-overlay">


                        <div className="obras-modal">


                            <header className="obras-modal-header">


                                <div>

                                    <span>

                                        {

                                            editando

                                                ? "EDITAR OBRA"

                                                : "NOVA OBRA"

                                        }

                                    </span>


                                    <h2>

                                        {

                                            editando

                                                ? "Editar obra"

                                                : "Cadastrar obra"

                                        }

                                    </h2>


                                    <p>

                                        {

                                            editando

                                                ? "Atualize as informações da obra."

                                                : "Preencha as informações para cadastrar uma nova obra."

                                        }

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="obras-modal-close"

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


                            <form

                                className="obras-form"

                                onSubmit={
                                    salvarObra
                                }

                            >


                                <div className="obras-form-grid">


                                    <div className="obras-form-group full">

                                        <label>

                                            Nome da obra

                                            <span>
                                                *
                                            </span>

                                        </label>


                                        <input

                                            type="text"

                                            name="nome"

                                            value={
                                                form.nome
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            placeholder="Ex.: Residência Alphaville"

                                            autoComplete="off"

                                            required

                                        />

                                    </div>


                                    <div className="obras-form-group full">

                                        <label>
                                            Endereço
                                        </label>


                                        <input

                                            type="text"

                                            name="endereco"

                                            value={
                                                form.endereco
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            placeholder="Rua, número, cidade..."

                                            autoComplete="off"

                                        />

                                    </div>


                                    <div className="obras-form-group">

                                        <label>
                                            Nome do cliente
                                        </label>


                                        <input

                                            type="text"

                                            name="cliente_nome"

                                            value={
                                                form.cliente_nome
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            placeholder="Nome do cliente"

                                            autoComplete="off"

                                        />

                                    </div>


                                    <div className="obras-form-group">

                                        <label>
                                            Arquiteto / Empresa
                                        </label>


                                        <input

                                            type="text"

                                            name="arquiteto_empresa"

                                            value={
                                                form.arquiteto_empresa
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            placeholder="Nome do arquiteto ou empresa"

                                            autoComplete="off"

                                        />

                                    </div>


                                    <div className="obras-form-group">

                                        <label>
                                            Data esperada de início
                                        </label>


                                        <input

                                            type="date"

                                            name="data_inicio_esperada"

                                            value={
                                                form.data_inicio_esperada
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                        />

                                    </div>


                                    <div className="obras-form-group">

                                        <label>
                                            Valor da obra
                                        </label>


                                        <input

                                            type="number"

                                            name="valor"

                                            value={
                                                form.valor
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            placeholder="0,00"

                                            min="0"

                                            step="0.01"

                                        />

                                    </div>


                                    <div className="obras-form-group">

                                        <label>
                                            RDO
                                        </label>


                                        <select

                                            name="rdo_nome"

                                            value={
                                                form.rdo_nome
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            disabled={
                                                loadingUsuarios
                                            }

                                        >

                                            <option value="">

                                                {

                                                    loadingUsuarios

                                                        ? "Carregando usuários..."

                                                        : usuariosRdo.length === 0

                                                            ? "Nenhum RDO disponível"

                                                            : "Selecione o RDO"

                                                }

                                            </option>


                                            {

                                                usuariosRdo.map(

                                                    usuario => (

                                                        <option

                                                            key={
                                                                usuario.id
                                                            }

                                                            value={
                                                                usuario.username
                                                            }

                                                        >

                                                            {
                                                                textoUsuario(
                                                                    usuario
                                                                )
                                                            }

                                                        </option>

                                                    )

                                                )

                                            }

                                        </select>

                                    </div>


                                    <div className="obras-form-group">

                                        <label>
                                            Marceneiro
                                        </label>


                                        <select

                                            name="marceneiro_nome"

                                            value={
                                                form.marceneiro_nome
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            disabled={
                                                loadingUsuarios
                                            }

                                        >

                                            <option value="">

                                                {

                                                    loadingUsuarios

                                                        ? "Carregando usuários..."

                                                        : usuariosMarceneiros.length === 0

                                                            ? "Nenhum marceneiro disponível"

                                                            : "Selecione o marceneiro"

                                                }

                                            </option>


                                            {

                                                usuariosMarceneiros.map(

                                                    usuario => (

                                                        <option

                                                            key={
                                                                usuario.id
                                                            }

                                                            value={
                                                                usuario.username
                                                            }

                                                        >

                                                            {
                                                                textoUsuario(
                                                                    usuario
                                                                )
                                                            }

                                                        </option>

                                                    )

                                                )

                                            }

                                        </select>

                                    </div>


                                    <div className="obras-form-group">

                                        <label>
                                            Projetista
                                        </label>


                                        <select

                                            name="projetista_nome"

                                            value={
                                                form.projetista_nome
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            disabled={
                                                loadingUsuarios
                                            }

                                        >

                                            <option value="">

                                                {

                                                    loadingUsuarios

                                                        ? "Carregando usuários..."

                                                        : usuariosProjetistas.length === 0

                                                            ? "Nenhum projetista disponível"

                                                            : "Selecione o projetista"

                                                }

                                            </option>


                                            {

                                                usuariosProjetistas.map(

                                                    usuario => (

                                                        <option

                                                            key={
                                                                usuario.id
                                                            }

                                                            value={
                                                                usuario.username
                                                            }

                                                        >

                                                            {
                                                                textoUsuario(
                                                                    usuario
                                                                )
                                                            }

                                                        </option>

                                                    )

                                                )

                                            }

                                        </select>

                                    </div>


                                    <div className="obras-form-group">

                                        <label>
                                            Dias esperados para finalizar
                                        </label>


                                        <input

                                            type="number"

                                            name="dias_finalizacao_esperado"

                                            value={
                                                form.dias_finalizacao_esperado
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            placeholder="Ex.: 45"

                                            min="0"

                                            step="1"

                                        />

                                    </div>


                                </div>


                                {

                                    erro &&

                                    (

                                        <div className="obras-form-error">

                                            {
                                                erro
                                            }

                                        </div>

                                    )

                                }


                                <footer className="obras-modal-footer">


                                    <button

                                        type="button"

                                        className="obras-btn-cancel"

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

                                        className="obras-btn-save"

                                        disabled={
                                            salvando
                                        }

                                    >

                                        {

                                            salvando

                                                ? "Salvando..."

                                                : editando

                                                    ? "Salvar alterações"

                                                    : "Criar obra"

                                        }

                                    </button>


                                </footer>


                            </form>


                        </div>


                    </div>

                )

            }


            {/* =================================================
                MODAL CONCLUIR
            ================================================= */}

            {

                modalConcluir &&

                (

                    <div className="obras-modal-overlay">


                        <div className="obras-modal obras-modal-small">


                            <header className="obras-modal-header">


                                <div>

                                    <span>
                                        CONCLUSÃO
                                    </span>


                                    <h2>
                                        Concluir obra?
                                    </h2>


                                    <p>

                                        Você está prestes a marcar a obra{" "}

                                        <strong>

                                            {
                                                obraParaConcluir?.nome
                                            }

                                        </strong>

                                        {" "}como concluída.

                                        Ela será movida para a aba de concluídas.

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="obras-modal-close"

                                    onClick={
                                        fecharConclusao
                                    }

                                    disabled={
                                        concluindo
                                    }

                                >

                                    <FiX />

                                </button>


                            </header>


                            {

                                erro &&

                                (

                                    <div className="obras-form-error">

                                        {
                                            erro
                                        }

                                    </div>

                                )

                            }


                            <footer className="obras-modal-footer">


                                <button

                                    type="button"

                                    className="obras-btn-cancel"

                                    onClick={
                                        fecharConclusao
                                    }

                                    disabled={
                                        concluindo
                                    }

                                >

                                    Cancelar

                                </button>


                                <button

                                    type="button"

                                    className="obras-btn-complete"

                                    onClick={
                                        confirmarConclusao
                                    }

                                    disabled={
                                        concluindo
                                    }

                                >

                                    <FiCheck />

                                    {

                                        concluindo

                                            ? "Concluindo..."

                                            : "Concluir obra"

                                    }

                                </button>


                            </footer>


                        </div>


                    </div>

                )

            }


            {/* =================================================
                MODAL DESCONCLUIR
            ================================================= */}

            {

                modalDesconcluir &&

                (

                    <div className="obras-modal-overlay">


                        <div className="obras-modal obras-modal-small">


                            <header className="obras-modal-header">


                                <div>

                                    <span>
                                        RETORNAR PARA PRODUÇÃO
                                    </span>


                                    <h2>
                                        Desconcluir obra?
                                    </h2>


                                    <p>

                                        Você está prestes a retirar a obra{" "}

                                        <strong>

                                            {
                                                obraParaDesconcluir?.nome
                                            }

                                        </strong>

                                        {" "}da lista de concluídas.

                                        Ela voltará para as obras em andamento.

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="obras-modal-close"

                                    onClick={
                                        fecharDesconclusao
                                    }

                                    disabled={
                                        desconcluindo
                                    }

                                >

                                    <FiX />

                                </button>


                            </header>


                            {

                                erro &&

                                (

                                    <div className="obras-form-error">

                                        {
                                            erro
                                        }

                                    </div>

                                )

                            }


                            <footer className="obras-modal-footer">


                                <button

                                    type="button"

                                    className="obras-btn-cancel"

                                    onClick={
                                        fecharDesconclusao
                                    }

                                    disabled={
                                        desconcluindo
                                    }

                                >

                                    Cancelar

                                </button>


                                <button

                                    type="button"

                                    className="obras-btn-uncomplete"

                                    onClick={
                                        confirmarDesconclusao
                                    }

                                    disabled={
                                        desconcluindo
                                    }

                                >

                                    <FiRotateCcw />

                                    {

                                        desconcluindo

                                            ? "Desconcluindo..."

                                            : "Desconcluir obra"

                                    }

                                </button>


                            </footer>


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

                    <div className="obras-modal-overlay">


                        <div className="obras-modal obras-modal-small">


                            <header className="obras-modal-header">


                                <div>

                                    <span>
                                        ATENÇÃO
                                    </span>


                                    <h2>
                                        Excluir obra?
                                    </h2>


                                    <p>

                                        Você está prestes a excluir a obra{" "}

                                        <strong>

                                            {
                                                obraSelecionada?.nome
                                            }

                                        </strong>

                                        .

                                        Essa ação não poderá ser desfeita.

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="obras-modal-close"

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

                                    <div className="obras-form-error">

                                        {
                                            erro
                                        }

                                    </div>

                                )

                            }


                            <footer className="obras-modal-footer">


                                <button

                                    type="button"

                                    className="obras-btn-cancel"

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

                                    className="obras-btn-delete"

                                    onClick={
                                        excluirObra
                                    }

                                    disabled={
                                        salvando
                                    }

                                >

                                    {

                                        salvando

                                            ? "Excluindo..."

                                            : "Excluir obra"

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