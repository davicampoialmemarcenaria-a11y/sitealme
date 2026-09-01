import {
    useEffect,
    useState
} from "react";

import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiKey,
    FiX,
    FiRefreshCw,
    FiEye
} from "react-icons/fi";

import {
    supabase
} from "../../../services/supabase";

import "./Usuarios.scss";


/*
=====================================================
FORMULÁRIO INICIAL
=====================================================
*/

const FORM_INICIAL = {

    nome: "",

    email: "",

    username: "",

    role_id: "",

    senha: "",

    pode_ver_todas_obras: false

};


/*
=====================================================
COMPONENTE
=====================================================
*/

export default function Usuarios() {

    /*
    =================================================
    ESTADOS
    =================================================
    */

    const [
        usuarios,
        setUsuarios
    ] = useState([]);

    const [
        roles,
        setRoles
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        salvando,
        setSalvando
    ] = useState(false);

    const [
        modal,
        setModal
    ] = useState(false);

    const [
        modalSenha,
        setModalSenha
    ] = useState(false);

    const [
        modalExcluir,
        setModalExcluir
    ] = useState(false);

    const [
        editando,
        setEditando
    ] = useState(null);

    const [
        usuarioSelecionado,
        setUsuarioSelecionado
    ] = useState(null);

    const [
        form,
        setForm
    ] = useState({
        ...FORM_INICIAL
    });

    const [
        novaSenha,
        setNovaSenha
    ] = useState("");

    const [
        erro,
        setErro
    ] = useState("");


    /*
    =================================================
    CARREGAR USUÁRIOS
    =================================================
    */

    async function carregarUsuarios() {

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
                        "admin-users",
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


            setUsuarios(

                Array.isArray(
                    data?.usuarios
                )
                    ? data.usuarios
                    : []

            );


            if (
                Array.isArray(
                    data?.roles
                )
            ) {

                setRoles(
                    data.roles
                );

            }

            else {

                const {
                    data: rolesData,
                    error: rolesError
                } =
                    await supabase
                        .from("roles")
                        .select(
                            "id, nome"
                        )
                        .order(
                            "nome",
                            {
                                ascending: true
                            }
                        );


                if (rolesError) {
                    throw rolesError;
                }


                setRoles(
                    Array.isArray(
                        rolesData
                    )
                        ? rolesData
                        : []
                );
            }

        }
        catch (err) {

            console.error(
                "Erro ao carregar usuários:",
                err
            );

            setErro(

                err?.message ||

                "Não foi possível carregar os usuários."

            );

        }
        finally {

            setLoading(false);

        }
    }


    /*
    =================================================
    CARREGAR AO ABRIR
    =================================================
    */

    useEffect(() => {

        carregarUsuarios();

    }, []);


    /*
    =================================================
    ABRIR NOVO
    =================================================
    */

    function abrirNovoUsuario() {

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
        usuario
    ) {

        setEditando(
            usuario
        );


        setForm({

            nome:
                usuario.nome ||
                "",

            email:
                usuario.email ||
                "",

            username:
                usuario.username ||
                "",

            role_id:
                usuario.role_id !== null &&
                usuario.role_id !== undefined

                    ? String(
                        usuario.role_id
                    )

                    : "",

            senha:
                "",

            pode_ver_todas_obras:
                usuario.pode_ver_todas_obras === true

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

        setEditando(null);

        setForm({
            ...FORM_INICIAL
        });

        setErro("");
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
            value,
            type,
            checked
        } = e.target;


        setForm(
            prev => ({

                ...prev,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value

            })
        );
    }


    /*
    =================================================
    GERAR USERNAME
    =================================================
    */

    function gerarUsernameAutomatico() {

        if (
            form.username.trim()
        ) {

            return form.username.trim();

        }


        if (
            form.email.trim()
        ) {

            return form.email
                .trim()
                .toLowerCase()
                .split("@")[0];

        }


        return "";
    }


    /*
    =================================================
    SALVAR USUÁRIO
    =================================================
    */

    async function salvarUsuario(
        e
    ) {

        e.preventDefault();

        setErro("");


        const nome =
            form.nome.trim();

        const email =
            form.email
                .trim()
                .toLowerCase();

        const username =
            gerarUsernameAutomatico();

        const roleId =
            form.role_id
                ? Number(
                    form.role_id
                )
                : null;

        const podeVerTodasObras =
            form.pode_ver_todas_obras === true;


        /*
        =================================================
        VALIDAR
        =================================================
        */

        if (!nome) {

            setErro(
                "Informe o nome do usuário."
            );

            return;
        }


        if (!email) {

            setErro(
                "Informe o e-mail do usuário."
            );

            return;
        }


        if (!username) {

            setErro(
                "Informe um username ou preencha o e-mail."
            );

            return;
        }


        if (!roleId) {

            setErro(
                "Selecione um perfil de acesso."
            );

            return;
        }


        /*
        =================================================
        SENHA SOMENTE NA CRIAÇÃO
        =================================================
        */

        if (
            !editando &&
            !form.senha.trim()
        ) {

            setErro(
                "Informe uma senha para o novo usuário."
            );

            return;
        }


        if (
            !editando &&
            form.senha.length < 6
        ) {

            setErro(
                "A senha deve ter pelo menos 6 caracteres."
            );

            return;
        }


        setSalvando(true);


        try {

            /*
            =================================================
            CRIAR
            =================================================
            */

            if (!editando) {

                const {
                    data,
                    error
                } =
                    await supabase
                        .functions
                        .invoke(
                            "admin-users",
                            {
                                body: {

                                    action:
                                        "create",

                                    nome,

                                    email,

                                    username,

                                    role_id:
                                        roleId,

                                    password:
                                        form.senha,

                                    pode_ver_todas_obras:
                                        podeVerTodasObras

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
            }


            /*
            =================================================
            EDITAR
            =================================================
            */

            else {

                const {
                    data,
                    error
                } =
                    await supabase
                        .functions
                        .invoke(
                            "admin-users",
                            {
                                body: {

                                    action:
                                        "update",

                                    id:
                                        editando.id,

                                    nome,

                                    email,

                                    username,

                                    role_id:
                                        roleId,

                                    pode_ver_todas_obras:
                                        podeVerTodasObras

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
            }


            /*
            =================================================
            FINALIZAR
            =================================================
            */

            fecharModal();

            await carregarUsuarios();

        }
        catch (err) {

            console.error(
                "Erro ao salvar usuário:",
                err
            );

            setErro(

                err?.message ||

                "Não foi possível salvar o usuário."

            );

        }
        finally {

            setSalvando(false);

        }
    }


    /*
    =================================================
    ABRIR SENHA
    =================================================
    */

    function abrirSenha(
        usuario
    ) {

        setUsuarioSelecionado(
            usuario
        );

        setNovaSenha("");

        setErro("");

        setModalSenha(true);
    }


    /*
    =================================================
    FECHAR SENHA
    =================================================
    */

    function fecharSenha() {

        if (salvando) {
            return;
        }

        setModalSenha(false);

        setUsuarioSelecionado(null);

        setNovaSenha("");

        setErro("");
    }


    /*
    =================================================
    ALTERAR SENHA
    =================================================
    */

    async function salvarSenha(
        e
    ) {

        e.preventDefault();

        setErro("");


        if (!novaSenha.trim()) {

            setErro(
                "Informe a nova senha."
            );

            return;
        }


        if (
            novaSenha.length < 6
        ) {

            setErro(
                "A senha deve ter pelo menos 6 caracteres."
            );

            return;
        }


        if (
            !usuarioSelecionado?.id
        ) {

            setErro(
                "Usuário inválido."
            );

            return;
        }


        setSalvando(true);


        try {

            const {
                data,
                error
            } =
                await supabase
                    .functions
                    .invoke(
                        "admin-users",
                        {
                            body: {

                                action:
                                    "password",

                                id:
                                    usuarioSelecionado.id,

                                password:
                                    novaSenha

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


            fecharSenha();

            await carregarUsuarios();

        }
        catch (err) {

            console.error(
                "Erro ao alterar senha:",
                err
            );

            setErro(

                err?.message ||

                "Não foi possível alterar a senha."

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
        usuario
    ) {

        setUsuarioSelecionado(
            usuario
        );

        setErro("");

        setModalExcluir(true);
    }


    /*
    =================================================
    EXCLUIR USUÁRIO
    =================================================
    */

    async function excluirUsuario() {

        if (
            !usuarioSelecionado?.id
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
                        "admin-users",
                        {
                            body: {

                                action:
                                    "delete",

                                id:
                                    usuarioSelecionado.id

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


            setModalExcluir(false);

            setUsuarioSelecionado(null);

            await carregarUsuarios();

        }
        catch (err) {

            console.error(
                "Erro ao excluir usuário:",
                err
            );

            setErro(

                err?.message ||

                "Não foi possível excluir o usuário."

            );

        }
        finally {

            setSalvando(false);

        }
    }


    /*
    =================================================
    NOME DA ROLE
    =================================================
    */

    function nomeRole(
        usuario
    ) {

        if (
            usuario.role
        ) {

            return usuario.role;
        }


        const role =
            roles.find(
                item =>
                    String(item.id) ===
                    String(usuario.role_id)
            );


        return (
            role?.nome ||
            "Sem perfil"
        );
    }


    /*
    =================================================
    DATA
    =================================================
    */

    function formatarData(
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


        return dataObj
            .toLocaleDateString(
                "pt-BR"
            );
    }


    /*
    =================================================
    TEXTO DA PERMISSÃO
    =================================================
    */

    function textoPermissaoObras(
        usuario
    ) {

        return usuario?.pode_ver_todas_obras === true

            ? "Todas as obras"

            : "Somente relacionadas";
    }


    /*
    =================================================
    RENDER
    =================================================
    */

    return (

        <section className="usuarios-page">

            {/* HEADER */}

            <div className="usuarios-header">

                <div>

                    <span>
                        PAINEL ADMINISTRATIVO
                    </span>

                    <h1>
                        Usuários
                    </h1>

                    <p>
                        Gerencie os usuários, perfis de acesso,
                        permissões e senhas do sistema.
                    </p>

                </div>


                <div className="usuarios-header-actions">

                    <button
                        type="button"
                        className="usuarios-btn-refresh"
                        onClick={
                            carregarUsuarios
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


                    <button
                        type="button"
                        className="usuarios-btn-add"
                        onClick={
                            abrirNovoUsuario
                        }
                    >

                        <FiPlus />

                        Novo usuário

                    </button>

                </div>

            </div>


            {/* ERRO */}

            {
                erro &&
                !modal &&
                !modalSenha &&
                !modalExcluir &&

                (

                    <div className="usuarios-error">
                        {erro}
                    </div>

                )
            }


            {/* SUMMARY */}

            <div className="usuarios-summary">

                <div>

                    <span>
                        USUÁRIOS
                    </span>

                    <strong>
                        {usuarios.length}
                    </strong>

                </div>


                <div>

                    <span>
                        PERFIS
                    </span>

                    <strong>
                        {roles.length}
                    </strong>

                </div>


                <div>

                    <span>
                        ACESSO A TODAS AS OBRAS
                    </span>

                    <strong>

                        {
                            usuarios.filter(
                                usuario =>
                                    usuario.pode_ver_todas_obras === true
                            ).length
                        }

                    </strong>

                </div>

            </div>


            {/* TABELA */}

            <section className="usuarios-content">

                <div className="usuarios-section-title">

                    <div>

                        <span>
                            ACESSOS
                        </span>

                        <h2>
                            Usuários cadastrados
                        </h2>

                    </div>

                </div>


                {
                    loading

                        ?

                        (

                            <div className="usuarios-loading">

                                <FiRefreshCw />

                                Carregando usuários...

                            </div>

                        )

                        :

                        (

                            <div className="usuarios-table-wrapper">

                                <table className="usuarios-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                Usuário
                                            </th>

                                            <th>
                                                E-mail
                                            </th>

                                            <th>
                                                Username
                                            </th>

                                            <th>
                                                Perfil
                                            </th>

                                            <th>
                                                Visualização de obras
                                            </th>

                                            <th>
                                                Criado em
                                            </th>

                                            <th>
                                                Ações
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {
                                            usuarios.length === 0

                                                ?

                                                (

                                                    <tr>

                                                        <td
                                                            colSpan="7"
                                                            className="usuarios-empty"
                                                        >
                                                            Nenhum usuário cadastrado.
                                                        </td>

                                                    </tr>

                                                )

                                                :

                                                (

                                                    usuarios.map(
                                                        usuario => (

                                                            <tr
                                                                key={
                                                                    usuario.id
                                                                }
                                                            >

                                                                <td>

                                                                    <div className="usuario-identidade">

                                                                        <div className="usuario-avatar">

                                                                            {
                                                                                (
                                                                                    usuario.nome ||
                                                                                    usuario.email ||
                                                                                    "U"
                                                                                )
                                                                                    .charAt(0)
                                                                                    .toUpperCase()
                                                                            }

                                                                        </div>

                                                                        <div>

                                                                            <strong>

                                                                                {
                                                                                    usuario.nome ||
                                                                                    "Sem nome"
                                                                                }

                                                                            </strong>

                                                                            <small>

                                                                                {
                                                                                    usuario.id
                                                                                }

                                                                            </small>

                                                                        </div>

                                                                    </div>

                                                                </td>


                                                                <td>

                                                                    {
                                                                        usuario.email ||
                                                                        "-"
                                                                    }

                                                                </td>


                                                                <td>

                                                                    {
                                                                        usuario.username ||
                                                                        "-"
                                                                    }

                                                                </td>


                                                                <td>

                                                                    <span className="usuario-role">

                                                                        {
                                                                            nomeRole(
                                                                                usuario
                                                                            )
                                                                        }

                                                                    </span>

                                                                </td>


                                                                <td>

                                                                    <span

                                                                        className={

                                                                            usuario.pode_ver_todas_obras === true

                                                                                ? "usuario-permissao liberado"

                                                                                : "usuario-permissao restrito"

                                                                        }

                                                                    >

                                                                        {

                                                                            usuario.pode_ver_todas_obras === true &&

                                                                            (
                                                                                <FiEye />
                                                                            )

                                                                        }

                                                                        {
                                                                            textoPermissaoObras(
                                                                                usuario
                                                                            )
                                                                        }

                                                                    </span>

                                                                </td>


                                                                <td>

                                                                    {
                                                                        formatarData(
                                                                            usuario.created_at
                                                                        )
                                                                    }

                                                                </td>


                                                                <td>

                                                                    <div className="usuario-acoes">

                                                                        <button

                                                                            type="button"

                                                                            className="usuario-action edit"

                                                                            title="Editar usuário"

                                                                            onClick={() =>
                                                                                abrirEdicao(
                                                                                    usuario
                                                                                )
                                                                            }

                                                                        >

                                                                            <FiEdit2 />

                                                                        </button>


                                                                        <button

                                                                            type="button"

                                                                            className="usuario-action password"

                                                                            title="Alterar senha"

                                                                            onClick={() =>
                                                                                abrirSenha(
                                                                                    usuario
                                                                                )
                                                                            }

                                                                        >

                                                                            <FiKey />

                                                                        </button>


                                                                        <button

                                                                            type="button"

                                                                            className="usuario-action delete"

                                                                            title="Excluir usuário"

                                                                            onClick={() =>
                                                                                abrirExclusao(
                                                                                    usuario
                                                                                )
                                                                            }

                                                                        >

                                                                            <FiTrash2 />

                                                                        </button>

                                                                    </div>

                                                                </td>

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
                modal && (

                    <div className="usuarios-modal-overlay">

                        <div className="usuarios-modal">

                            <header className="usuarios-modal-header">

                                <div>

                                    <span>

                                        {
                                            editando
                                                ? "EDITAR USUÁRIO"
                                                : "NOVO USUÁRIO"
                                        }

                                    </span>

                                    <h2>

                                        {
                                            editando
                                                ? "Editar usuário"
                                                : "Cadastrar usuário"
                                        }

                                    </h2>

                                    <p>

                                        {
                                            editando
                                                ? "Atualize os dados, perfil e permissões do usuário."
                                                : "Preencha os dados para criar um novo acesso."
                                        }

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="usuarios-modal-close"

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

                                className="usuarios-form"

                                onSubmit={
                                    salvarUsuario
                                }

                            >

                                <div className="usuarios-form-grid">


                                    <div className="usuarios-form-group">

                                        <label>

                                            Nome

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

                                            placeholder="Nome completo"

                                            autoComplete="off"

                                            required

                                        />

                                    </div>


                                    <div className="usuarios-form-group">

                                        <label>

                                            Username

                                            <span>
                                                *
                                            </span>

                                        </label>


                                        <input

                                            type="text"

                                            name="username"

                                            value={
                                                form.username
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            placeholder="Ex.: joao.silva"

                                            autoComplete="off"

                                            required

                                        />

                                    </div>


                                    <div className="usuarios-form-group full">

                                        <label>

                                            E-mail

                                            <span>
                                                *
                                            </span>

                                        </label>


                                        <input

                                            type="email"

                                            name="email"

                                            value={
                                                form.email
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            placeholder="usuario@alme.com.br"

                                            autoComplete="off"

                                            required

                                        />

                                    </div>


                                    <div className="usuarios-form-group">

                                        <label>

                                            Perfil de acesso

                                            <span>
                                                *
                                            </span>

                                        </label>


                                        <select

                                            name="role_id"

                                            value={
                                                form.role_id
                                            }

                                            onChange={
                                                alterarCampo
                                            }

                                            required

                                        >

                                            <option value="">

                                                Selecione um perfil

                                            </option>


                                            {
                                                roles.map(
                                                    role => (

                                                        <option
                                                            key={
                                                                role.id
                                                            }
                                                            value={
                                                                role.id
                                                            }
                                                        >

                                                            {
                                                                role.nome
                                                            }

                                                        </option>

                                                    )
                                                )
                                            }

                                        </select>

                                    </div>


                                    {
                                        !editando && (

                                            <div className="usuarios-form-group">

                                                <label>

                                                    Senha

                                                    <span>
                                                        *
                                                    </span>

                                                </label>


                                                <input

                                                    type="password"

                                                    name="senha"

                                                    value={
                                                        form.senha
                                                    }

                                                    onChange={
                                                        alterarCampo
                                                    }

                                                    placeholder="Mínimo 6 caracteres"

                                                    autoComplete="new-password"

                                                    required

                                                />

                                            </div>

                                        )
                                    }


                                    {/* =================================================
                                        PERMISSÃO
                                    ================================================= */}

                                    <div className="usuarios-permissao-box full">

                                        <div className="usuarios-permissao-texto">

                                            <strong>
                                                Visualização das obras
                                            </strong>

                                            <span>

                                                Sem esta permissão, o usuário vê somente
                                                as obras em que seu username está cadastrado
                                                como RDO, marceneiro ou projetista.

                                            </span>

                                        </div>


                                        <label className="usuarios-switch">

                                            <input

                                                type="checkbox"

                                                name="pode_ver_todas_obras"

                                                checked={
                                                    form.pode_ver_todas_obras === true
                                                }

                                                onChange={
                                                    alterarCampo
                                                }

                                            />

                                            <span className="usuarios-switch-slider"></span>

                                        </label>

                                    </div>


                                    <div

                                        className={

                                            form.pode_ver_todas_obras

                                                ? "usuarios-permissao-status liberado"

                                                : "usuarios-permissao-status restrito"

                                        }

                                    >

                                        {
                                            form.pode_ver_todas_obras

                                                ? "Este usuário poderá visualizar todas as obras."

                                                : "Este usuário visualizará somente as obras relacionadas ao próprio username."
                                        }

                                    </div>


                                </div>


                                {
                                    erro && (

                                        <div className="usuarios-form-error">

                                            {
                                                erro
                                            }

                                        </div>

                                    )
                                }


                                <footer className="usuarios-modal-footer">

                                    <button

                                        type="button"

                                        className="usuarios-btn-cancel"

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

                                        className="usuarios-btn-save"

                                        disabled={
                                            salvando
                                        }

                                    >

                                        {
                                            salvando

                                                ? "Salvando..."

                                                : editando

                                                    ? "Salvar alterações"

                                                    : "Criar usuário"
                                        }

                                    </button>

                                </footer>

                            </form>

                        </div>

                    </div>

                )
            }


            {/* =================================================
                MODAL SENHA
            ================================================= */}

            {
                modalSenha && (

                    <div className="usuarios-modal-overlay">

                        <div className="usuarios-modal usuarios-modal-small">

                            <header className="usuarios-modal-header">

                                <div>

                                    <span>
                                        SEGURANÇA
                                    </span>

                                    <h2>
                                        Alterar senha
                                    </h2>

                                    <p>

                                        Defina uma nova senha para{" "}

                                        <strong>

                                            {
                                                usuarioSelecionado?.nome ||
                                                usuarioSelecionado?.email
                                            }

                                        </strong>

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="usuarios-modal-close"

                                    onClick={
                                        fecharSenha
                                    }

                                    disabled={
                                        salvando
                                    }

                                >

                                    <FiX />

                                </button>

                            </header>


                            <form

                                className="usuarios-form"

                                onSubmit={
                                    salvarSenha
                                }

                            >

                                <div className="usuarios-form-group">

                                    <label>

                                        Nova senha

                                        <span>
                                            *
                                        </span>

                                    </label>


                                    <input

                                        type="password"

                                        value={
                                            novaSenha
                                        }

                                        onChange={
                                            e =>
                                                setNovaSenha(
                                                    e.target.value
                                                )
                                        }

                                        placeholder="Mínimo 6 caracteres"

                                        autoComplete="new-password"

                                        autoFocus

                                    />

                                </div>


                                {
                                    erro && (

                                        <div className="usuarios-form-error">

                                            {
                                                erro
                                            }

                                        </div>

                                    )
                                }


                                <footer className="usuarios-modal-footer">

                                    <button

                                        type="button"

                                        className="usuarios-btn-cancel"

                                        onClick={
                                            fecharSenha
                                        }

                                        disabled={
                                            salvando
                                        }

                                    >
                                        Cancelar
                                    </button>


                                    <button

                                        type="submit"

                                        className="usuarios-btn-save"

                                        disabled={
                                            salvando
                                        }

                                    >

                                        {
                                            salvando
                                                ? "Salvando..."
                                                : "Alterar senha"
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
                modalExcluir && (

                    <div className="usuarios-modal-overlay">

                        <div className="usuarios-modal usuarios-modal-small">

                            <header className="usuarios-modal-header">

                                <div>

                                    <span>
                                        ATENÇÃO
                                    </span>

                                    <h2>
                                        Excluir usuário?
                                    </h2>

                                    <p>

                                        Você está prestes a excluir o acesso de{" "}

                                        <strong>

                                            {
                                                usuarioSelecionado?.nome ||
                                                usuarioSelecionado?.email
                                            }

                                        </strong>

                                        . Essa ação não poderá ser desfeita.

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    className="usuarios-modal-close"

                                    onClick={() => {

                                        if (!salvando) {

                                            setModalExcluir(false);

                                            setUsuarioSelecionado(null);

                                            setErro("");

                                        }

                                    }}

                                    disabled={
                                        salvando
                                    }

                                >

                                    <FiX />

                                </button>

                            </header>


                            {
                                erro && (

                                    <div className="usuarios-form-error usuarios-delete-error">

                                        {
                                            erro
                                        }

                                    </div>

                                )
                            }


                            <footer className="usuarios-modal-footer">

                                <button

                                    type="button"

                                    className="usuarios-btn-cancel"

                                    onClick={() => {

                                        if (!salvando) {

                                            setModalExcluir(false);

                                            setUsuarioSelecionado(null);

                                            setErro("");

                                        }

                                    }}

                                    disabled={
                                        salvando
                                    }

                                >
                                    Cancelar
                                </button>


                                <button

                                    type="button"

                                    className="usuarios-btn-delete"

                                    onClick={
                                        excluirUsuario
                                    }

                                    disabled={
                                        salvando
                                    }

                                >

                                    {
                                        salvando
                                            ? "Excluindo..."
                                            : "Excluir usuário"
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