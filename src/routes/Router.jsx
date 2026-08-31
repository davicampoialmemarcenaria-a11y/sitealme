import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";


/*
=====================================================
PÁGINAS PÚBLICAS
=====================================================
*/

import Home from "../pages/Home/Home";

import Sobre from "../pages/Sobre/Sobre";

import Contato from "../pages/Contato/Contato";

import Eua from "../pages/Eua/Eua";

import Duvidas from "../pages/Duvidas/Duvidas";

import Marceneiro from "../pages/Marceneiro/Marceneiro";

import Login from "../pages/Login/Login";


/*
=====================================================
LAYOUT ADMINISTRATIVO
=====================================================
*/

import AdminLayout from "../pages/admin/Layout/AdminLayout";


/*
=====================================================
PÁGINAS ADMINISTRATIVAS
=====================================================
*/

import Dashboard from "../pages/admin/Dashboard/Dashboard";

import News from "../pages/admin/News/News";

import Projetos from "../pages/admin/Projetos/Projetos";

import Estoque from "../pages/admin/Estoque/Estoque";

import Usuarios from "../pages/admin/Usuarios/Usuarios";


/*
=====================================================
PÁGINAS PÚBLICAS DE NEWS
=====================================================
*/

import Newsu from "../pages/Newsu/Newsu";

import NewsPage from "../pages/Newsu/NewsPage/NewsPage";


/*
=====================================================
PÁGINAS PÚBLICAS DE PROJETOS
=====================================================
*/

import Projetosu from "../pages/Projetosu/Projetosu";

import ProjetosPage from "../pages/Projetosu/ProjetosPage/ProjetosPage";


/*
=====================================================
PROTEÇÃO
=====================================================
*/

import ProtectedRoute from "../components/ProtectedRoute";


/*
=====================================================
SCROLL
=====================================================
*/

import ScrollToTop from "../components/ScrollToTop/ScrollToTop";


export default function Router() {

    return (

        <BrowserRouter>

            <ScrollToTop />

            <Routes>


                {/* =====================================================
                    SITE
                ===================================================== */}

                <Route
                    path="/"
                    element={<Home />}
                />


                <Route
                    path="/sobre"
                    element={<Sobre />}
                />


                <Route
                    path="/contato"
                    element={<Contato />}
                />


                <Route
                    path="/eua"
                    element={<Eua />}
                />


                <Route
                    path="/duvidas"
                    element={<Duvidas />}
                />


                <Route
                    path="/marceneiro"
                    element={<Marceneiro />}
                />


                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* =====================================================
                    NEWS PÚBLICO
                ===================================================== */}

                <Route
                    path="/newsu"
                    element={<Newsu />}
                />


                <Route
                    path="/news/:id"
                    element={<NewsPage />}
                />


                {/* =====================================================
                    PROJETOS PÚBLICO
                ===================================================== */}

                <Route
                    path="/projetos"
                    element={<Projetosu />}
                />


                <Route
                    path="/projetos/:id"
                    element={<ProjetosPage />}
                />


                {/* =====================================================
                    ADMINISTRATIVO
                ===================================================== */}

                <Route

                    path="/admin"

                    element={

                        <ProtectedRoute

                            allowedRoles={[
                                "administrativo_geral",
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
                        DASHBOARD

                        SOMENTE ADMINISTRADOR
                    ================================================= */}

                    <Route

                        index

                        element={

                            <ProtectedRoute

                                allowedRoles={[
                                    "administrativo_geral"
                                ]}

                            >

                                <Dashboard />

                            </ProtectedRoute>

                        }

                    />


                    {/* =================================================
                        COMERCIAL

                        ADMINISTRADOR + COMERCIAL
                    ================================================= */}

                    <Route

                        path="comercial"

                        element={

                            <ProtectedRoute

                                allowedRoles={[
                                    "administrativo_geral",
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

                        ADMINISTRADOR + PRODUÇÃO
                    ================================================= */}

                    <Route

                        path="producao"

                        element={

                            <ProtectedRoute

                                allowedRoles={[
                                    "administrativo_geral",
                                    "producao"
                                ]}

                            >

                                <div>

                                    <h1>
                                        Produção
                                    </h1>

                                </div>

                            </ProtectedRoute>

                        }

                    />


                    {/* =================================================
                        FINANCEIRO

                        ADMINISTRADOR + FINANCEIRO
                    ================================================= */}

                    <Route

                        path="financeiro"

                        element={

                            <ProtectedRoute

                                allowedRoles={[
                                    "administrativo_geral",
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

                        ADMINISTRADOR + FINANCEIRO
                    ================================================= */}

                    <Route

                        path="estoque"

                        element={

                            <ProtectedRoute

                                allowedRoles={[
                                    "administrativo_geral",
                                    "financeiro"
                                ]}

                            >

                                <Estoque />

                            </ProtectedRoute>

                        }

                    />


                    {/* =================================================
                        NEWS

                        SOMENTE ADMINISTRADOR
                    ================================================= */}

                    <Route

                        path="news"

                        element={

                            <ProtectedRoute

                                allowedRoles={[
                                    "administrativo_geral"
                                ]}

                            >

                                <News />

                            </ProtectedRoute>

                        }

                    />


                    {/* =================================================
                        PROJETOS

                        SOMENTE ADMINISTRADOR
                    ================================================= */}

                    <Route

                        path="projetos"

                        element={

                            <ProtectedRoute

                                allowedRoles={[
                                    "administrativo_geral"
                                ]}

                            >

                                <Projetos />

                            </ProtectedRoute>

                        }

                    />


                    {/* =================================================
                        USUÁRIOS

                        SOMENTE ADMINISTRADOR
                    ================================================= */}

                    <Route

                        path="usuarios"

                        element={

                            <ProtectedRoute

                                allowedRoles={[
                                    "administrativo_geral"
                                ]}

                            >

                                <Usuarios />

                            </ProtectedRoute>

                        }

                    />


                </Route>


            </Routes>

        </BrowserRouter>

    );

}