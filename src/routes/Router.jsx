import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import {
    useAuth
} from "../contexts/AuthContext";

/*
=====================================================
PÁGINAS PÚBLICAS
=====================================================
*/

import Home
    from "../pages/Home/Home";

import Sobre
    from "../pages/Sobre/Sobre";

import Contato
    from "../pages/Contato/Contato";

import Eua
    from "../pages/Eua/Eua";

import Duvidas
    from "../pages/Duvidas/Duvidas";

import Marceneiro
    from "../pages/Marceneiro/Marceneiro";

import Login
    from "../pages/Login/Login";

/*
=====================================================
LAYOUT ADMINISTRATIVO
=====================================================
*/

import AdminLayout
    from "../pages/admin/Layout/AdminLayout";

/*
=====================================================
PÁGINAS ADMINISTRATIVAS
=====================================================
*/

import Dashboard
    from "../pages/admin/Dashboard/Dashboard";

import News
    from "../pages/admin/News/News";

import Projetos
    from "../pages/admin/Projetos/Projetos";

import Estoque
    from "../pages/admin/Estoque/Estoque";

import Usuarios
    from "../pages/admin/Usuarios/Usuarios";

import Producao
    from "../pages/admin/Producao/Producao";

import Obras
    from "../pages/admin/Producao/Obras/Obras";

/*
=====================================================
INFORMAÇÕES FINANCEIRAS DA PRODUÇÃO
=====================================================
*/

import InforFi
    from "../pages/admin/Producao/InforFi/InforFi";

/*
=====================================================
DOCUMENTOS DO CLIENTE
=====================================================
*/

import DocumentosCliente
    from "../pages/admin/Producao/DocumentosCliente/DocumentosCliente";

/*
=====================================================
CRONOGRAMAS
=====================================================
*/

import Cronogramas
    from "../pages/admin/Producao/Cronogramas/Cronogramas";

/*
=====================================================
CRONOGRAMA INDIVIDUAL
=====================================================
*/

import Cronograma
    from "../pages/admin/Producao/Cronogramas/Cronograma";

/*
=====================================================
PÁGINAS PÚBLICAS DE NEWS
=====================================================
*/

import Newsu
    from "../pages/Newsu/Newsu";

import NewsPage
    from "../pages/Newsu/NewsPage/NewsPage";

/*
=====================================================
PÁGINAS PÚBLICAS DE PROJETOS
=====================================================
*/

import Projetosu
    from "../pages/Projetosu/Projetosu";

import ProjetosPage
    from "../pages/Projetosu/ProjetosPage/ProjetosPage";

/*
=====================================================
PROTEÇÃO
=====================================================
*/

import ProtectedRoute
    from "../components/ProtectedRoute";

/*
=====================================================
SCROLL
=====================================================
*/

import ScrollToTop
    from "../components/ScrollToTop/ScrollToTop";

/*
=====================================================
INÍCIO DO ADMIN
=====================================================
*/

function AdminInicio() {

    const {
        role
    } = useAuth();

    /*
    =================================================
    ADMINISTRATIVO GERAL
    =================================================
    */

    if (
        role === "Administrativo Geral"
    ) {
        return (
            <Dashboard />
        );
    }

    /*
    =================================================
    COMERCIAL
    =================================================
    */

    if (
        role === "comercial"
    ) {
        return (
            <Navigate
                to="/admin/comercial"
                replace
            />
        );
    }

    /*
    =================================================
    PRODUÇÃO
    =================================================
    */

    if (
        role === "producao"
    ) {
        return (
            <Navigate
                to="/admin/producao"
                replace
            />
        );
    }

    /*
    =================================================
    FINANCEIRO
    =================================================
    */

    if (
        role === "financeiro"
    ) {
        return (
            <Navigate
                to="/admin/financeiro"
                replace
            />
        );
    }

    /*
    =================================================
    ROLE DESCONHECIDA
    =================================================
    */

    return (
        <Navigate
            to="/"
            replace
        />
    );
}

/*
=====================================================
ROUTER
=====================================================
*/

export default function Router() {

    return (

        <BrowserRouter>

            <ScrollToTop />

            <Routes>

                {/* =================================================
                    SITE
                ================================================= */}

                <Route
                    path="/"
                    element={
                        <Home />
                    }
                />

                <Route
                    path="/sobre"
                    element={
                        <Sobre />
                    }
                />

                <Route
                    path="/contato"
                    element={
                        <Contato />
                    }
                />

                <Route
                    path="/eua"
                    element={
                        <Eua />
                    }
                />

                <Route
                    path="/duvidas"
                    element={
                        <Duvidas />
                    }
                />

                <Route
                    path="/marceneiro"
                    element={
                        <Marceneiro />
                    }
                />

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />

                {/* =================================================
                    NEWS PÚBLICO
                ================================================= */}

                <Route
                    path="/newsu"
                    element={
                        <Newsu />
                    }
                />

                <Route
                    path="/news/:id"
                    element={
                        <NewsPage />
                    }
                />

                {/* =================================================
                    PROJETOS PÚBLICOS
                ================================================= */}

                <Route
                    path="/projetos"
                    element={
                        <Projetosu />
                    }
                />

                <Route
                    path="/projetos/:id"
                    element={
                        <ProjetosPage />
                    }
                />

                {/* =================================================
                    ADMINISTRATIVO
                ================================================= */}

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "Administrativo Geral",
                                "comercial",
                                "producao",
                                "financeiro"
                            ]}
                        >
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >

                    {/* =================================================
                        INÍCIO DO ADMIN
                    ================================================= */}

                    <Route
                        index
                        element={
                            <AdminInicio />
                        }
                    />

                    {/* =================================================
                        COMERCIAL
                    ================================================= */}

                    <Route
                        path="comercial"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "comercial"
                                ]}
                            >
                                <div>
                                    <h1>
                                        Comercial
                                    </h1>
                                </div>
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        PRODUÇÃO
                    ================================================= */}

                    <Route
                        path="producao"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "producao"
                                ]}
                            >
                                <Producao />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        OBRAS
                    ================================================= */}

                    <Route
                        path="obras"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "producao"
                                ]}
                            >
                                <Obras />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        INFORMAÇÕES FINANCEIRAS DA PRODUÇÃO

                        URL:
                        /admin/producao/inforfi
                    ================================================= */}

                    <Route
                        path="producao/inforfi"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "producao"
                                ]}
                            >
                                <InforFi />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        DOCUMENTOS DO CLIENTE

                        URL:
                        /admin/producao/documentos-cliente
                    ================================================= */}

                    <Route
                        path="producao/documentos-cliente"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "producao"
                                ]}
                            >
                                <DocumentosCliente />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        CRONOGRAMAS
                    ================================================= */}

                    <Route
                        path="cronogramas"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "producao"
                                ]}
                            >
                                <Cronogramas />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        CRONOGRAMA INDIVIDUAL
                    ================================================= */}

                    <Route
                        path="cronogramas/:cronogramaId/:versaoId"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "producao"
                                ]}
                            >
                                <Cronograma />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        FINANCEIRO
                    ================================================= */}

                    <Route
                        path="financeiro"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "financeiro"
                                ]}
                            >
                                <div>
                                    <h1>
                                        Financeiro
                                    </h1>
                                </div>
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        ESTOQUE
                    ================================================= */}

                    <Route
                        path="estoque"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral",
                                    "financeiro"
                                ]}
                            >
                                <Estoque />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        NEWS
                    ================================================= */}

                    <Route
                        path="news"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral"
                                ]}
                            >
                                <News />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        PROJETOS
                    ================================================= */}

                    <Route
                        path="projetos"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral"
                                ]}
                            >
                                <Projetos />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        USUÁRIOS
                    ================================================= */}

                    <Route
                        path="usuarios"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrativo Geral"
                                ]}
                            >
                                <Usuarios />
                            </ProtectedRoute>
                        }
                    />

                </Route>

                {/* =====================================================
                    ROTA NÃO ENCONTRADA
                ===================================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}