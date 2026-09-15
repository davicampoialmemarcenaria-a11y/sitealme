
import {
    FiArrowRight,
    FiUsers,
    FiDroplet,
    FiFileText
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import {
    useAuth
} from "../../../contexts/AuthContext";

import "./Comercial.scss";


export default function Comercial() {

    const navigate = useNavigate();

    const {
        role
    } = useAuth();


    /* =====================================================
       SEGURANÇA
    ===================================================== */

    if (
        role !== "Administrativo Geral" &&
        role !== "comercial"
    ) {

        return null;

    }


    return (

        <section className="comercial-page">


            {/* =================================================
                CABEÇALHO
            ================================================= */}

            <header className="comercial-header">

                <div>

                    <span>
                        PAINEL ADMINISTRATIVO
                    </span>

                    <h1>
                        Comercial
                    </h1>

                    <p>
                        Gerencie os processos comerciais e
                        acompanhe as oportunidades da ALME.
                    </p>

                </div>

            </header>


            {/* =================================================
                CONTEÚDO
            ================================================= */}

            <section className="comercial-content">


                {/* =================================================
                    CARD TABELA DE PREÇOS
                ================================================= */}

                <button
                    type="button"
                    className="comercial-card"
                    onClick={() =>
                        navigate(
                            "/admin/comercial/tabela-preco"
                        )
                    }
                >

                    <div
                        className="comercial-card-icon"
                    >

                        <FiUsers />

                    </div>


                    <div
                        className="comercial-card-content"
                    >

                        <span>
                            COMERCIAL
                        </span>

                        <h2>
                            Tabela de preços
                        </h2>

                        <p>
                            Cadastre, consulte, edite e
                            acompanhe os itens da ALME.
                        </p>

                    </div>


                    <div
                        className="comercial-card-arrow"
                    >

                        <FiArrowRight />

                    </div>

                </button>


                {/* =================================================
                    CARD TABELA DE CORES
                ================================================= */}

                <button
                    type="button"
                    className="comercial-card"
                    onClick={() =>
                        navigate(
                            "/admin/comercial/tabela-cores"
                        )
                    }
                >

                    <div
                        className="comercial-card-icon"
                    >

                        <FiDroplet />

                    </div>


                    <div
                        className="comercial-card-content"
                    >

                        <span>
                            COMERCIAL
                        </span>

                        <h2>
                            Tabela de cores
                        </h2>

                        <p>
                            Cadastre, consulte e gerencie
                            as opções de cores disponíveis na ALME.
                        </p>

                    </div>


                    <div
                        className="comercial-card-arrow"
                    >

                        <FiArrowRight />

                    </div>

                </button>


                {/* =================================================
                    CARD ORÇAMENTO
                ================================================= */}

                <button
                    type="button"
                    className="comercial-card"
                    onClick={() =>
                        navigate(
                            "/admin/comercial/tabela-orcamento"
                        )
                    }
                >

                    <div
                        className="comercial-card-icon"
                    >

                        <FiFileText />

                    </div>


                    <div
                        className="comercial-card-content"
                    >

                        <span>
                            COMERCIAL
                        </span>

                        <h2>
                            Orçamento
                        </h2>

                        <p>
                            Cadastre, consulte e gerencie
                            os orçamentos comerciais da ALME.
                        </p>

                    </div>


                    <div
                        className="comercial-card-arrow"
                    >

                        <FiArrowRight />

                    </div>

                </button>


            </section>

        </section>

    );

}

