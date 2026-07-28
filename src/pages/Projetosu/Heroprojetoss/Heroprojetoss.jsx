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
                    Da ideia ao projeto,
                    <br />
                    do projeto a realidade
                </h1>

                <p>
                    O acompanhamento próximo e alinhamento de informações são fundamentais para transformar seu projeto em realidade.
                </p>

            </div>

        </section>
    );
}

export default Heroprojetoss;