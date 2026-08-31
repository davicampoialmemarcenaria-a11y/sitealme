import { useEffect, useState } from "react";

import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiKey,
    FiX,
    FiRefreshCw
} from "react-icons/fi";

import { supabase } from "../../../services/supabase";

import "./Usuarios.scss";


const FORM_INICIAL = {
    nome: "",
    email: "",
    username: "",
    role_id: "",
    senha: ""
};


export default function Usuarios() {

    const [usuarios, setUsuarios] = useState([]);

    const [roles, setRoles] = useState([]);

    const [loading, setLoading] = useState(true);

    const [salvando, setSalvando] = useState(false);

    const [modal, setModal] = useState(false);

    const [modalSenha, setModalSenha] = useState(false);

    const [modalExcluir, setModalExcluir] = useState(false);

    const [editando, setEditando] = useState(null);

    const [usuarioSelecionado, setUsuarioSelecionado] =
        useState(null);

    const [form, setForm] =
        useState(FORM_INICIAL);

    const [novaSenha, setNovaSenha] =
        useState("");

    const [erro, setErro] =
        useState("");


    /*
    =====================================================
    CARREGAR USUÁRIOS E PERFIS
    =====================================================
    */

    async function carregarUsuarios() {

        setLoading(true);

        setErro("");

        try {

            /*
            =============================================
            LISTAR USUÁRIOS PELA EDGE FUNCTION
            =============================================
            */

            const {
                data,
                error
            } = await supabase.functions.invoke(
                "admin-users",
                {
                    body: {
                        action: "list"
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
            =============================================
            A EDGE FUNCTION RETORNA "usuarios"
            =============================================
            */

            setUsuarios(
                Array.isArray(data?.usuarios)
                    ? data.usuarios
                    : []
            );


            /*
            =============================================
            BUSCAR ROLES DIRETAMENTE DA TABELA
            =============================================
            */

            const {
                data: rolesData,
                error: rolesError
            } = await supabase

                .from("roles")

                .select("id, nome")

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
                Array.isArray(rolesData)
                    ? rolesData
                    : []
            );

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
    =====================================================
    CARREGAR AO ABRIR
    =====================================================
    */

    useEffect(() => {

        carregarUsuarios();

    }, []);


    /*
    =====================================================
    ABRIR NOVO USUÁRIO
    =====================================================
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
    =====================================================
    ABRIR EDIÇÃO
    =====================================================
    */

    function abrirEdicao(usuario) {

        setEditando(usuario);

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
                usuario.role_id
                    ? String(usuario.role_id)
                    : "",

            senha: ""

        });

        setErro("");

        setModal(true);

    }


    /*
    =====================================================
    FECHAR MODAL
    =====================================================
    */

    function fecharModal() {

        if (salvando) return;

        setModal(false);

        setEditando(null);

        setForm({
            ...FORM_INICIAL
        });

        setErro("");

    }


    /*
    =====================================================
    ALTERAR FORM
    =====================================================
    */

    function alterarCampo(e) {

        const {
            name,
            value
        } = e.target;


        setForm(prev => ({

            ...prev,

            [name]: value

        }));

    }


    /*
    =====================================================
    GERAR USERNAME AUTOMATICAMENTE
    =====================================================
    */

    function gerarUsernameAutomatico() {

        if (form.username.trim()) {

            return form.username.trim();

        }


        /*
        Se o usuário não preencher username,
        usamos a parte anterior do e-mail.
        */

        if (form.email.trim()) {

            return form.email
                .trim()
                .toLowerCase()
                .split("@")[0];

        }


        return "";

    }


    /*
    =====================================================
    SALVAR USUÁRIO
    =====================================================
    */

    async function salvarUsuario(e) {

        e.preventDefault();

        setErro("");


        /*
        =============================================
        VALIDAÇÕES
        =============================================
        */

        const nome =
            form.nome.trim();

        const email =
            form.email.trim().toLowerCase();

        const username =
            gerarUsernameAutomatico();

        const roleId =
            form.role_id
                ? Number(form.role_id)
                : null;


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
        =============================================
        SENHA SOMENTE NA CRIAÇÃO
        =============================================
        */

        if (!editando && !form.senha.trim()) {

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
            =============================================
            CRIAR
            =============================================
            */

            if (!editando) {

                console.log(
                    "ENVIANDO CREATE:",
                    {
                        action: "create",
                        nome,
                        email,
                        username,
                        role_id: roleId,
                        password: form.senha
                    }
                );


                const {
                    data,
                    error
                } = await supabase.functions.invoke(
                    "admin-users",
                    {
                        body: {

                            action: "create",

                            nome,

                            email,

                            username,

                            role_id: roleId,

                            password:
                                form.senha

                        }
                    }
                );


                console.log(
                    "RESPOSTA CREATE:",
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

            }


            /*
            =============================================
            EDITAR
            =============================================
            */

            else {

                console.log(
                    "ENVIANDO UPDATE:",
                    {
                        action: "update",
                        id: editando.id,
                        nome,
                        email,
                        username,
                        role_id: roleId
                    }
                );


                const {
                    data,
                    error
                } = await supabase.functions.invoke(
                    "admin-users",
                    {
                        body: {

                            action: "update",

                            /*
                            IMPORTANTE:
                            A Edge Function espera "id",
                            não "user_id".
                            */

                            id:
                                editando.id,

                            nome,

                            email,

                            username,

                            role_id:
                                roleId

                        }
                    }
                );


                console.log(
                    "RESPOSTA UPDATE:",
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

            }


            /*
            =============================================
            FINALIZAR
            =============================================
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
    =====================================================
    ABRIR ALTERAÇÃO DE SENHA
    =====================================================
    */

    function abrirSenha(usuario) {

        setUsuarioSelecionado(
            usuario
        );

        setNovaSenha("");

        setErro("");

        setModalSenha(true);

    }


    /*
    =====================================================
    FECHAR SENHA
    =====================================================
    */

    function fecharSenha() {

        if (salvando) return;

        setModalSenha(false);

        setUsuarioSelecionado(null);

        setNovaSenha("");

        setErro("");

    }


    /*
    =====================================================
    SALVAR SENHA
    =====================================================
    */

    async function salvarSenha(e) {

        e.preventDefault();

        setErro("");


        if (!novaSenha.trim()) {

            setErro(
                "Informe a nova senha."
            );

            return;

        }


        if (novaSenha.length < 6) {

            setErro(
                "A senha deve ter pelo menos 6 caracteres."
            );

            return;

        }


        if (!usuarioSelecionado?.id) {

            setErro(
                "Usuário inválido."
            );

            return;

        }


        setSalvando(true);


        try {

            console.log(
                "ENVIANDO PASSWORD:",
                {
                    action: "password",
                    id:
                        usuarioSelecionado.id
                }
            );


            const {
                data,
                error
            } = await supabase.functions.invoke(
                "admin-users",
                {
                    body: {

                        action: "password",

                        /*
                        IMPORTANTE:
                        A Edge Function espera "id".
                        */

                        id:
                            usuarioSelecionado.id,

                        password:
                            novaSenha

                    }
                }
            );


            console.log(
                "RESPOSTA PASSWORD:",
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
    =====================================================
    CONFIRMAR EXCLUSÃO
    =====================================================
    */

    function abrirExclusao(usuario) {

        setUsuarioSelecionado(
            usuario
        );

        setErro("");

        setModalExcluir(true);

    }


    /*
    =====================================================
    EXCLUIR
    =====================================================
    */

    async function excluirUsuario() {

        if (!usuarioSelecionado?.id) {

            return;

        }


        setSalvando(true);

        setErro("");


        try {

            console.log(
                "ENVIANDO DELETE:",
                {
                    action: "delete",
                    id:
                        usuarioSelecionado.id
                }
            );


            const {
                data,
                error
            } = await supabase.functions.invoke(
                "admin-users",
                {
                    body: {

                        action: "delete",

                        /*
                        IMPORTANTE:
                        A Edge Function espera "id".
                        */

                        id:
                            usuarioSelecionado.id

                    }
                }
            );


            console.log(
                "RESPOSTA DELETE:",
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
    =====================================================
    NOME DA ROLE
    =====================================================
    */

    function nomeRole(usuario) {

        if (usuario.role) {

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
    =====================================================
    DATA
    =====================================================
    */

    function formatarData(data) {

        if (!data) return "-";


        const dataObj =
            new Date(data);


        if (Number.isNaN(
            dataObj.getTime()
        )) {

            return "-";

        }


        return dataObj
            .toLocaleDateString(
                "pt-BR"
            );

    }


    /*
    =====================================================
    TELA
    =====================================================
    */

    return (

        <section className="usuarios-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="usuarios-header">

                <div>

                    <span>
                        PAINEL ADMINISTRATIVO
                    </span>

                    <h1>
                        Usuários
                    </h1>

                    <p>
                        Gerencie os usuários, perfis de acesso
                        e senhas do sistema.
                    </p>

                </div>


                <div className="usuarios-header-actions">

                    <button
                        className="usuarios-btn-refresh"
                        onClick={carregarUsuarios}
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
                        className="usuarios-btn-add"
                        onClick={abrirNovoUsuario}
                    >

                        <FiPlus />

                        Novo usuário

                    </button>

                </div>

            </div>


            {/* =================================================
                ERRO
            ================================================= */}

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


            {/* =================================================
                RESUMO
            ================================================= */}

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

            </div>


            {/* =================================================
                TABELA
            ================================================= */}

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
                                                    colSpan="6"
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

                                                            {
                                                                formatarData(
                                                                    usuario.created_at
                                                                )
                                                            }

                                                        </td>


                                                        <td>

                                                            <div className="usuario-acoes">


                                                                <button

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
                                                ? "Atualize os dados e o perfil de acesso."
                                                : "Preencha os dados para criar um novo acesso."
                                        }

                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="usuarios-modal-close"
                                    onClick={fecharModal}
                                    disabled={salvando}
                                >

                                    <FiX />

                                </button>

                            </header>


                            <form
                                className="usuarios-form"
                                onSubmit={salvarUsuario}
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
                                            value={form.nome}
                                            onChange={alterarCampo}
                                            placeholder="Nome completo"
                                            autoComplete="off"
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
                                            value={form.username}
                                            onChange={alterarCampo}
                                            placeholder="Ex.: joao.silva"
                                            autoComplete="off"
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
                                            value={form.email}
                                            onChange={alterarCampo}
                                            placeholder="usuario@alme.com.br"
                                            autoComplete="off"
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
                                            value={form.role_id}
                                            onChange={alterarCampo}
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
                                                    value={form.senha}
                                                    onChange={alterarCampo}
                                                    placeholder="Mínimo 6 caracteres"
                                                    autoComplete="new-password"
                                                />

                                            </div>

                                        )
                                    }


                                </div>


                                {
                                    erro && (

                                        <div className="usuarios-form-error">

                                            {erro}

                                        </div>

                                    )
                                }


                                <footer className="usuarios-modal-footer">

                                    <button
                                        type="button"
                                        className="usuarios-btn-cancel"
                                        onClick={fecharModal}
                                        disabled={salvando}
                                    >

                                        Cancelar

                                    </button>


                                    <button
                                        type="submit"
                                        className="usuarios-btn-save"
                                        disabled={salvando}
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
                                    onClick={fecharSenha}
                                    disabled={salvando}
                                >

                                    <FiX />

                                </button>

                            </header>


                            <form
                                className="usuarios-form"
                                onSubmit={salvarSenha}
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
                                        value={novaSenha}
                                        onChange={e =>
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

                                            {erro}

                                        </div>

                                    )
                                }


                                <footer className="usuarios-modal-footer">

                                    <button
                                        type="button"
                                        className="usuarios-btn-cancel"
                                        onClick={fecharSenha}
                                        disabled={salvando}
                                    >

                                        Cancelar

                                    </button>


                                    <button
                                        type="submit"
                                        className="usuarios-btn-save"
                                        disabled={salvando}
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
                                    onClick={() =>
                                        setModalExcluir(false)
                                    }
                                    disabled={salvando}
                                >

                                    <FiX />

                                </button>

                            </header>


                            {
                                erro && (

                                    <div className="usuarios-form-error usuarios-delete-error">

                                        {erro}

                                    </div>

                                )
                            }


                            <footer className="usuarios-modal-footer">

                                <button
                                    type="button"
                                    className="usuarios-btn-cancel"
                                    onClick={() =>
                                        setModalExcluir(false)
                                    }
                                    disabled={salvando}
                                >

                                    Cancelar

                                </button>


                                <button
                                    type="button"
                                    className="usuarios-btn-delete"
                                    onClick={excluirUsuario}
                                    disabled={salvando}
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