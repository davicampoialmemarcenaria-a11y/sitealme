import {
    FiArrowLeft,
    FiExternalLink,
    FiClipboard
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import "./FormularioCusto.scss";

const PIPEFY_FORM_URL = "https://app.pipefy.com/public/form/w0wf9J2L";

export default function FormularioCusto() {
    const navigate = useNavigate();

    return (
        <main className="formulario-custo-page">
            <header className="formulario-custo-header">
                <button
                    type="button"
                    className="formulario-custo-back"
                    onClick={() => navigate("/admin/financeiro")}
                >
                    <FiArrowLeft aria-hidden="true" />
                    <span>Voltar ao Financeiro</span>
                </button>

                <div className="formulario-custo-heading">
                    <span className="formulario-custo-eyebrow">
                        PAINEL ADMINISTRATIVO · FINANCEIRO
                    </span>
                    <h1>Formulário de custos</h1>
                    <p>
                        Preencha os dados da solicitação. O envio será registrado
                        diretamente no Pipefy.
                    </p>
                </div>

                <a
                    className="formulario-custo-open-link"
                    href={PIPEFY_FORM_URL}
                    target="_blank"
                    rel="noreferrer"
                >
                    <FiExternalLink aria-hidden="true" />
                    <span>Abrir em nova aba</span>
                </a>
            </header>

            <section className="formulario-custo-panel" aria-label="Formulário do Pipefy">
                <div className="formulario-custo-panel-heading">
                    <div className="formulario-custo-panel-icon" aria-hidden="true">
                        <FiClipboard />
                    </div>
                    <div>
                        <h2>Solicitação de custos</h2>
                        <p>Formulário conectado ao Pipefy</p>
                    </div>
                </div>

                <div className="formulario-custo-frame-wrap">
                    <iframe
                        className="formulario-custo-frame"
                        src={PIPEFY_FORM_URL}
                        title="Formulário de custos da ALME no Pipefy"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="clipboard-read; clipboard-write"
                    />
                </div>
            </section>
        </main>
    );
}
