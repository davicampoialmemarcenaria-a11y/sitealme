import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useState } from "react";

import "./AdminLayout.scss";

export default function AdminLayout() {

    const { role, logout } = useAuth();

    const navigate = useNavigate();

    const [menuAberto, setMenuAberto] = useState(false);


    async function sair() {

        await logout();

        navigate("/login");

    }


    function fecharMenu(){

        setMenuAberto(false);

    }


    return (

        <section className="admin">


            <button

                className="menu-mobile"

                onClick={() => setMenuAberto(!menuAberto)}

            >

                ☰

            </button>



            <aside 
            
                className={`admin__sidebar ${menuAberto ? "ativo" : ""}`}
            
            >


                <div className="admin__logo">

                    <h2>ALME</h2>

                    <span>Painel Administrativo</span>

                </div>



                <nav>


                    <NavLink 

                        to="/admin"

                        onClick={fecharMenu}

                    >

                        Dashboard

                    </NavLink>



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



                    {
                        role === "administrativo_geral" && (

                            <>


                                <NavLink 

                                    to="/admin/financeiro"

                                    onClick={fecharMenu}

                                >

                                    Financeiro

                                </NavLink>



                                <NavLink 

                                    to="/admin/producao"

                                    onClick={fecharMenu}

                                >

                                    Produção

                                </NavLink>



                                <NavLink 

                                    to="/admin/usuarios"

                                    onClick={fecharMenu}

                                >

                                    Usuários

                                </NavLink>


                            </>

                        )
                    }


                </nav>



                <button

                    onClick={sair}

                    className="logout"

                >

                    Sair

                </button>



            </aside>



            <main className="admin__content">

                <Outlet />

            </main>



        </section>

    );

}
