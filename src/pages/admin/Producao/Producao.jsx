import {
    FiArrowRight,
    FiBox,
    FiCalendar
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
                    CARD OBRAS
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



                {/* =================================================
                    CARD CRONOGRAMA
                ================================================= */}
<button
    type="button"
    className="producao-card"
    onClick={() => {
        console.log("CLICOU CRONOGRAMAS");
        console.log("INDO PARA:", "/admin/cronogramas");

        navigate("/admin/cronogramas");
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


            </section>


        </section>

    );

}