import "./HeroDuvidas.scss";
import Navbar from "../../../components/Navbar/Navbar";

function HeroDuvidas() {
    return (
        <section className="hero-duvidas">

            <div className="hero-duvidas__bg"></div>

            <div className="hero-duvidas__overlay"></div>

            <Navbar />

            <div className="hero-duvidas__content">

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

export default HeroDuvidas;