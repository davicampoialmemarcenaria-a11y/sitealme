import "./Heroprojetoss.scss";
import Navbar from "../../../components/Navbar/Navbar";

function Heroprojetoss() {
    return (
        <section className="hero-projetoss">

            <div className="hero-projetoss__bg"></div>

            <div className="hero-projetoss__overlay"></div>

            <Navbar />

            <div className="hero-projetoss__content">

                <h1>
                    Acompanhe as dúvidas
                    <br />
                    frequentes
                </h1>

                <p>
                    Acompanhamos todas as etapas, do início ao fim,
                    garantindo organização, alinhamento e uma execução
                    fluida em cada detalhe feito.
                </p>

            </div>

        </section>
    );
}

export default Heroprojetoss;