import {
    FiArrowRight,
    FiBox
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import "./Producao.scss";


export default function Producao() {

    const navigate =
        useNavigate();


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
                    BOTÃO OBRAS
                ================================================= */}

                <button

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

                </button>


            </section>


        </section>
    );
}