import {
    FiArrowRight,
    FiBox,
    FiCalendar,
    FiDollarSign,
    FiFolder,
    FiFileText,
    FiGitBranch
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import {
    useAuth
} from "../../../contexts/AuthContext";

import "./Producao.scss";

export default function Producao() {

    const navigate =
        useNavigate();
    const { role } = useAuth();

    return (

        <section className="producao-page">

            {/* =================================================
                CABEÇALHO
            ================================================= */}

            <header className="producao-header">

                <div>

                    <span>
                        PAINEL ADMINISTRATIVO
                    </span>

                    <h1>
                        Produção
                    </h1>

                    <p>
                        Gerencie as obras e acompanhe
                        os processos de produção.
                    </p>

                </div>

            </header>


            {/* =================================================
                CONTEÚDO
            ================================================= */}

            <section className="producao-content">


                {/* =================================================
                    CARD OBRAS
                ================================================= */}

                {role !== "Agregado" && <button
                    type="button"
                    className="producao-card"
                    onClick={() =>
                        navigate(
                            "/admin/obras"
                        )
                    }
                >

                    <div
                        className="producao-card-icon"
                    >

                        <FiBox />

                    </div>


                    <div
                        className="producao-card-content"
                    >

                        <span>
                            PRODUÇÃO
                        </span>

                        <h2>
                            Obras
                        </h2>

                        <p>
                            Cadastre, consulte, edite
                            e acompanhe as obras da ALME.
                        </p>

                    </div>


                    <div
                        className="producao-card-arrow"
                    >

                        <FiArrowRight />

                    </div>

                </button>}


                {/* =================================================
                    CARD CRONOGRAMA
                ================================================= */}

                <button
                    type="button"
                    className="producao-card"
                    onClick={() => {

                        navigate(
                            "/admin/cronogramas"
                        );

                    }}
                >

                    <div
                        className="producao-card-icon"
                    >

                        <FiCalendar />

                    </div>


                    <div
                        className="producao-card-content"
                    >

                        <span>
                            PRODUÇÃO
                        </span>

                        <h2>
                            Cronograma
                        </h2>

                        <p>
                            Organize os prazos e acompanhe
                            o cronograma das obras da ALME.
                        </p>

                    </div>


                    <div
                        className="producao-card-arrow"
                    >

                        <FiArrowRight />

                    </div>

                </button>


                {/* =================================================
                    CARD INFORMAÇÕES FINANCEIRAS
                ================================================= */}

                {role !== "Agregado" && <button
                    type="button"
                    className="producao-card"
                    onClick={() => {

                        navigate(
                            "/admin/producao/inforfi"
                        );

                    }}
                >

                    <div
                        className="producao-card-icon"
                    >

                        <FiDollarSign />

                    </div>


                    <div
                        className="producao-card-content"
                    >

                        <span>
                            PRODUÇÃO
                        </span>

                        <h2>
                            Informações financeiras
                        </h2>

                        <p>
                            Consulte e acompanhe as informações
                            financeiras relacionadas às obras.
                        </p>

                    </div>


                    <div
                        className="producao-card-arrow"
                    >

                        <FiArrowRight />

                    </div>

                </button>}


                {role !== "Agregado" && <button
                    type="button"
                    className="producao-card"
                    onClick={() => navigate("/admin/producao/memorialprod")}
                >
                    <div className="producao-card-icon"><FiFileText /></div>
                    <div className="producao-card-content">
                        <span>PRODUÇÃO</span>
                        <h2>Memoriais descritivos</h2>
                        <p>Consulte memoriais aprovados e registre comentários nos itens.</p>
                    </div>
                    <div className="producao-card-arrow"><FiArrowRight /></div>
                </button>}


               
{/* =================================================
    CARD FLUXO
================================================= */}

{role !== "Agregado" && <button
    type="button"
    className="producao-card"
    onClick={() => {
        navigate("/admin/producao/fluxo");
    }}
>
    <div className="producao-card-icon">
        <FiGitBranch />
    </div>

    <div className="producao-card-content">
        <span>
            PRODUÇÃO
        </span>

        <h2>
            Fluxo Fisico e Financeiro
        </h2>

        <p>
            Consulte e acompanhe o fluxo das obras
            de produção da ALME.
        </p>
    </div>

    <div className="producao-card-arrow">
        <FiArrowRight />
    </div>
</button>}
            </section>

        </section>

    );
}
