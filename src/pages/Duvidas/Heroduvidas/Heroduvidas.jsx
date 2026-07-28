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
                    Reunimos as respostas para as perguntas mais frequentes sobre nossos serviços e processos.
                </p>

            </div>

        </section>
    );
}

export default HeroDuvidas;