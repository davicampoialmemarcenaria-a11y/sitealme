import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

import "./AdminLayout.scss";

export default function AdminLayout() {

    const { role, logout } = useAuth();

    const navigate = useNavigate();

    async function sair() {

        await logout();

        navigate("/login");

    }

    return (

        <section className="admin">

            <aside className="admin__sidebar">

                <div className="admin__logo">

                    <h2>ALME</h2>

                    <span>Painel Administrativo</span>

                </div>

                <nav>

                    <NavLink to="/admin">
                        Dashboard
                    </NavLink>

                    <NavLink to="/admin/news">
                        News
                    </NavLink>

                    <NavLink to="/admin/projetos">
                        Projetos
                    </NavLink>

                    {
                        role === "administrativo_geral" && (

                            <>
                                <NavLink to="/admin/financeiro">
                                    Financeiro
                                </NavLink>

                                <NavLink to="/admin/producao">
                                    Produção
                                </NavLink>

                                <NavLink to="/admin/usuarios">
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