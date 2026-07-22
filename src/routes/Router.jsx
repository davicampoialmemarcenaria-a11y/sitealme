import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Sobre from "../pages/Sobre/Sobre";
import Contato from "../pages/Contato/Contato";
import Eua from "../pages/Eua/Eua";
import Duvidas from "../pages/Duvidas/Duvidas";
import Marceneiro from "../pages/Marceneiro/Marceneiro";

import Login from "../pages/login/Login";


import AdminLayout from "../pages/admin/Layout/AdminLayout";
import Dashboard from "../pages/admin/Dashboard/Dashboard";
import News from "../pages/admin/News/News";
import Projetos from "../pages/admin/Projetos/Projetos";


import Newsu from "../pages/Newsu/Newsu";
import NewsPage from "../pages/Newsu/NewsPage/NewsPage";


import ProjetosPage from "../pages/Projetosu/Projetosu";

import ProjetoPage from "../pages/Projetosu/ProjetosPage/ProjetosPage";


import ProtectedRoute from "../components/ProtectedRoute";



export default function Router() {


    return (

        <BrowserRouter>


            <Routes>



                {/* =====================
                    SITE
                ====================== */}



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




                {/* =====================
                    NEWS PÚBLICO
                ====================== */}



                <Route 
                    path="/newsu" 
                    element={<Newsu />} 
                />



                <Route 
                    path="/news/:id" 
                    element={<NewsPage />} 
                />





                {/* =====================
                    PROJETOS PÚBLICO
                ====================== */}



                <Route 
                    path="/projetos" 
                    element={<ProjetosPage />} 
                />



                <Route 
                    path="/projetos/:id" 
                    element={<ProjetoPage />} 
                />







                {/* =====================
                    ADMINISTRATIVO
                ====================== */}



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



                    <Route

                        index

                        element={<Dashboard />}

                    />



                    <Route

                        path="news"

                        element={<News />}

                    />



                    <Route

                        path="projetos"

                        element={<Projetos />}

                    />



                </Route>





            </Routes>



        </BrowserRouter>

    );

}