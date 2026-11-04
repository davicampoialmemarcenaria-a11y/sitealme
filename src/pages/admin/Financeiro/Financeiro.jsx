import {
    FiArrowRight,
    FiFileText,
    FiBookOpen,
    FiClipboard
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import {
    useAuth
} from "../../../contexts/AuthContext";

import "./Financeiro.scss";

export default function Financeiro() {
    const navigate = useNavigate();
    const { role } = useAuth();

    function abrirExtratosUnificados() {
        navigate("/admin/financeiro/extratos-uni");
    }

    function abrirContratos() {
        navigate("/admin/financeiro/contrato");
    }

    function abrirFormularioCustos() {
        navigate("/admin/financeiro/formulario-custo");
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
                    {role !== "Agregado" && <button
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
                    </button>}

                    <button
                        type="button"
                        className="financeiro-card"
                        onClick={abrirContratos}
                        aria-label="Abrir Contratos"
                    >
                        <div className="financeiro-card-icon" aria-hidden="true">
                            <FiBookOpen />
                        </div>

                        <div className="financeiro-card-content">
                            <span>FINANCEIRO</span>
                            <h2>Contratos</h2>
                            <p>
                                Acesse a área para preparar e organizar os contratos da ALME.
                            </p>
                        </div>

                        <div className="financeiro-card-arrow" aria-hidden="true">
                            <FiArrowRight />
                        </div>
                    </button>

                    <button
                        type="button"
                        className="financeiro-card"
                        onClick={abrirFormularioCustos}
                        aria-label="Abrir Formulário de custos"
                    >
                        <div className="financeiro-card-icon" aria-hidden="true">
                            <FiClipboard />
                        </div>

                        <div className="financeiro-card-content">
                            <span>FINANCEIRO</span>
                            <h2>Formulário de custos</h2>
                            <p>
                                Preencha e envie uma solicitação de custos pelo formulário do Pipefy.
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
