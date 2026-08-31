import {
    Outlet,
    NavLink,
    useNavigate,
    useLocation
} from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";

import { supabase } from "../../../services/supabase";

import { useEffect, useState } from "react";

import "./AdminLayout.scss";


export default function AdminLayout() {

    const {
        user,
        role,
        logout
    } = useAuth();

    const navigate = useNavigate();

    const location = useLocation();


    /*
    =====================================================
    ESTADOS
    =====================================================
    */

    const [menuAberto, setMenuAberto] = useState(false);

    const [marketingAberto, setMarketingAberto] = useState(false);

    const [financeiroAberto, setFinanceiroAberto] = useState(false);

    const [admAberto, setAdmAberto] = useState(false);

    const [nomeUsuario, setNomeUsuario] = useState("");


    /*
    =====================================================
    BUSCAR NOME / USERNAME DO PERFIL
    =====================================================
    */

    useEffect(() => {

        async function carregarPerfil() {

            if (!user?.id) {

                setNomeUsuario("");

                return;

            }


            const {
                data,
                error
            } = await supabase

                .from("profiles")

                .select("username, nome, email")

                .eq("id", user.id)

                .maybeSingle();


            if (error) {

                console.error(
                    "Erro ao carregar perfil:",
                    error
                );

                setNomeUsuario(
                    user?.email || "Usuário"
                );

                return;

            }


            /*
            =================================================
            PRIORIDADE:

            1. username
            2. nome
            3. email do perfil
            4. email do Auth
            5. Usuário
            =================================================
            */

            setNomeUsuario(

                data?.username ||

                data?.nome ||

                data?.email ||

                user?.email ||

                "Usuário"

            );

        }


        carregarPerfil();

    }, [user]);


    /*
    =====================================================
    ABRIR AUTOMATICAMENTE OS SUBMENUS
    QUANDO ESTIVER EM UMA DAS PÁGINAS
    =====================================================
    */

    useEffect(() => {


        /*
        ================================================
        MARKETING
        ================================================
        */

        if (

            location.pathname.startsWith(
                "/admin/news"
            )

            ||

            location.pathname.startsWith(
                "/admin/projetos"
            )

        ) {

            setMarketingAberto(true);

        }


        /*
        ================================================
        FINANCEIRO
        ================================================
        */

        if (

            location.pathname.startsWith(
                "/admin/financeiro"
            )

            ||

            location.pathname.startsWith(
                "/admin/estoque"
            )

        ) {

            setFinanceiroAberto(true);

        }


        /*
        ================================================
        ADM
        ================================================
        */

        if (

            location.pathname.startsWith(
                "/admin/usuarios"
            )

        ) {

            setAdmAberto(true);

        }

    }, [location.pathname]);


    /*
    =====================================================
    SAIR
    =====================================================
    */

    async function sair() {

        await logout();

        navigate("/login");

    }


    /*
    =====================================================
    FECHAR MENU MOBILE
    =====================================================
    */

    function fecharMenu() {

        setMenuAberto(false);

    }


    /*
    =====================================================
    VERIFICAR SE MARKETING ESTÁ ATIVO
    =====================================================
    */

    const marketingAtivo =

        location.pathname.startsWith(
            "/admin/news"
        )

        ||

        location.pathname.startsWith(
            "/admin/projetos"
        );


    /*
    =====================================================
    VERIFICAR SE FINANCEIRO ESTÁ ATIVO
    =====================================================
    */

    const financeiroAtivo =

        location.pathname.startsWith(
            "/admin/financeiro"
        )

        ||

        location.pathname.startsWith(
            "/admin/estoque"
        );


    /*
    =====================================================
    VERIFICAR SE ADM ESTÁ ATIVO
    =====================================================
    */

    const admAtivo =

        location.pathname.startsWith(
            "/admin/usuarios"
        );


    /*
    =====================================================
    NOME AMIGÁVEL DA ROLE
    =====================================================
    */

    const nomesRoles = {

        administrativo_geral:
            "Administrador",

        comercial:
            "Comercial",

        producao:
            "Produção",

        financeiro:
            "Financeiro",

        homologado:
            "Homologado",

        parceiro:
            "Parceiro"

    };


    const nomeRole =
        nomesRoles[role] || "Usuário";


    /*
    =====================================================
    RENDER
    =====================================================
    */

    return (

        <section className="admin">


            {/* =================================================
                BOTÃO MENU MOBILE
            ================================================= */}

            <button

                className="menu-mobile"

                onClick={() =>
                    setMenuAberto(!menuAberto)
                }

                aria-label="Abrir menu"

            >

                ☰

            </button>


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside

                className={`
                    admin__sidebar
                    ${menuAberto ? "ativo" : ""}
                `}

            >


                {/* =================================================
                    PARTE SUPERIOR
                ================================================= */}

                <div className="admin__top">


                    {/* =================================================
                        LOGO
                    ================================================= */}

                    <div className="admin__logo">

                        <h2>
                            ALME
                        </h2>

                        <span>
                            Painel Administrativo
                        </span>

                    </div>


                    {/* =================================================
                        NAVEGAÇÃO
                    ================================================= */}

                    <nav>


                        {/* ==========================================
                            DASHBOARD
                        ========================================== */}

                        {

                            role === "administrativo_geral"

                            && (

                                <NavLink

                                    to="/admin"

                                    end

                                    onClick={fecharMenu}

                                >

                                    Dashboard

                                </NavLink>

                            )

                        }


                        {/* ==========================================
                            COMERCIAL
                        ========================================== */}

                        {

                            (

                                role ===
                                    "administrativo_geral"

                                ||

                                role ===
                                    "comercial"

                            )

                            && (

                                <NavLink

                                    to="/admin/comercial"

                                    onClick={fecharMenu}

                                >

                                    Comercial

                                </NavLink>

                            )

                        }


                        {/* ==========================================
                            PRODUÇÃO
                        ========================================== */}

                        {

                            (

                                role ===
                                    "administrativo_geral"

                                ||

                                role ===
                                    "producao"

                            )

                            && (

                                <NavLink

                                    to="/admin/producao"

                                    onClick={fecharMenu}

                                >

                                    Produção

                                </NavLink>

                            )

                        }


                        {/* ==========================================
                            FINANCEIRO
                        ========================================== */}

                        {

                            (

                                role ===
                                    "administrativo_geral"

                                ||

                                role ===
                                    "financeiro"

                            )

                            && (

                                <div

                                    className={`
                                        admin__menu-group
                                        ${
                                            financeiroAtivo
                                                ? "ativo"
                                                : ""
                                        }
                                    `}

                                >


                                    <button

                                        type="button"

                                        className={`
                                            admin__menu-toggle
                                            ${
                                                financeiroAtivo
                                                    ? "active"
                                                    : ""
                                            }
                                        `}

                                        onClick={() =>
                                            setFinanceiroAberto(
                                                !financeiroAberto
                                            )
                                        }

                                    >

                                        <span>
                                            Financeiro
                                        </span>


                                        <span
                                            className={`
                                                admin__arrow
                                                ${
                                                    financeiroAberto
                                                        ? "aberta"
                                                        : ""
                                                }
                                            `}
                                        >

                                            ›

                                        </span>

                                    </button>


                                    <div

                                        className={`
                                            admin__submenu
                                            ${
                                                financeiroAberto
                                                    ? "aberto"
                                                    : ""
                                            }
                                        `}

                                    >


                                        <NavLink

                                            to="/admin/financeiro"

                                            onClick={fecharMenu}

                                        >

                                            Financeiro

                                        </NavLink>


                                        <NavLink

                                            to="/admin/estoque"

                                            onClick={fecharMenu}

                                        >

                                            Estoque

                                        </NavLink>


                                    </div>


                                </div>

                            )

                        }


                        {/* ==========================================
                            MARKETING
                        ========================================== */}

                        {

                            role ===
                                "administrativo_geral"

                            && (

                                <div

                                    className={`
                                        admin__menu-group
                                        ${
                                            marketingAtivo
                                                ? "ativo"
                                                : ""
                                        }
                                    `}

                                >


                                    <button

                                        type="button"

                                        className={`
                                            admin__menu-toggle
                                            ${
                                                marketingAtivo
                                                    ? "active"
                                                    : ""
                                            }
                                        `}

                                        onClick={() =>
                                            setMarketingAberto(
                                                !marketingAberto
                                            )
                                        }

                                    >

                                        <span>
                                            Marketing
                                        </span>


                                        <span
                                            className={`
                                                admin__arrow
                                                ${
                                                    marketingAberto
                                                        ? "aberta"
                                                        : ""
                                                }
                                            `}
                                        >

                                            ›

                                        </span>

                                    </button>


                                    <div

                                        className={`
                                            admin__submenu
                                            ${
                                                marketingAberto
                                                    ? "aberto"
                                                    : ""
                                            }
                                        `}

                                    >


                                        <NavLink

                                            to="/admin/news"

                                            onClick={fecharMenu}

                                        >

                                            News

                                        </NavLink>


                                        <NavLink

                                            to="/admin/projetos"

                                            onClick={fecharMenu}

                                        >

                                            Projetos

                                        </NavLink>


                                    </div>


                                </div>

                            )

                        }


                        {/* ==========================================
                            ADM
                        ========================================== */}

                        {

                            role ===
                                "administrativo_geral"

                            && (

                                <div

                                    className={`
                                        admin__menu-group
                                        ${
                                            admAtivo
                                                ? "ativo"
                                                : ""
                                        }
                                    `}

                                >


                                    <button

                                        type="button"

                                        className={`
                                            admin__menu-toggle
                                            ${
                                                admAtivo
                                                    ? "active"
                                                    : ""
                                            }
                                        `}

                                        onClick={() =>
                                            setAdmAberto(
                                                !admAberto
                                            )
                                        }

                                    >

                                        <span>
                                            ADM
                                        </span>


                                        <span
                                            className={`
                                                admin__arrow
                                                ${
                                                    admAberto
                                                        ? "aberta"
                                                        : ""
                                                }
                                            `}
                                        >

                                            ›

                                        </span>

                                    </button>


                                    <div

                                        className={`
                                            admin__submenu
                                            ${
                                                admAberto
                                                    ? "aberto"
                                                    : ""
                                            }
                                        `}

                                    >


                                        <NavLink

                                            to="/admin/usuarios"

                                            onClick={fecharMenu}

                                        >

                                            Usuários

                                        </NavLink>


                                    </div>


                                </div>

                            )

                        }


                    </nav>


                </div>


                {/* =================================================
                    PERFIL + SAIR
                ================================================= */}

                <div className="admin__footer">


                    {/* =================================================
                        PERFIL
                    ================================================= */}

                    <div className="admin__profile">


                        <div className="admin__profile-avatar">

                            {

                                (

                                    nomeUsuario ||

                                    "U"

                                )

                                    .charAt(0)

                                    .toUpperCase()

                            }

                        </div>


                        <div className="admin__profile-info">


                            <strong>

                                {

                                    nomeUsuario ||

                                    "Usuário"

                                }

                            </strong>


                            <span>

                                {nomeRole}

                            </span>


                        </div>


                    </div>


                    {/* =================================================
                        BOTÃO SAIR
                    ================================================= */}

                    <button

                        onClick={sair}

                        className="logout"

                    >

                        <span>
                            Sair
                        </span>

                    </button>


                </div>


            </aside>


            {/* =================================================
                CONTEÚDO
            ================================================= */}

            <main className="admin__content">

                <Outlet />

            </main>


        </section>

    );

}