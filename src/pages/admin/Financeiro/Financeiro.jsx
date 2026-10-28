import {
    FiArrowRight,
    FiFileText
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import "./Financeiro.scss";

export default function Financeiro() {
    const navigate = useNavigate();

    function abrirExtratosUnificados() {
        navigate("/admin/financeiro/extratos-uni");
    }

    return (
        <section className="financeiro-page">
            <header className="financeiro-header">
                <div className="financeiro-header-copy">
                    <span className="financeiro-eyebrow">
                        PAINEL ADMINISTRATIVO
                    </span>

                    <h1>Financeiro</h1>

                    <p>
                        Consulte e organize as informações financeiras da ALME.
                    </p>
                </div>
            </header>

            <section className="financeiro-content">
                <div className="financeiro-section-heading">
                    
                </div>

                <div className="financeiro-cards">
                    <button
                        type="button"
                        className="financeiro-card"
                        onClick={abrirExtratosUnificados}
                        aria-label="Abrir Extratos unificados"
                    >
                        <div className="financeiro-card-icon" aria-hidden="true">
                            <FiFileText />
                        </div>

                        <div className="financeiro-card-content">
                            <span>FINANCEIRO</span>
                            <h2>Extratos unificados</h2>
                            <p>
                                Consulte e acompanhe valores financeiros em uma visão unificada.
                            </p>
                        </div>

                        <div className="financeiro-card-arrow" aria-hidden="true">
                            <FiArrowRight />
                        </div>
                    </button>
                </div>
            </section>
        </section>
    );
}
