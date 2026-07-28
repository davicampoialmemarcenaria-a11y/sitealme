import "./Heronewsu.scss";
import Navbar from "../../../components/Navbar/Navbar";

function Heronewsu() {
    return (
        <section className="hero-duvidas">

            <div className="hero-news__bg"></div>

            <div className="hero-duvidas__overlay"></div>

            <Navbar />

            <div className="hero-duvidas__content">

                <h1>
                    Acompanhe notícias e tendências 
                </h1>

                <p>
                  Fique por dentro de todas as tendências, novidades e curiosidades do mundo da marcenaria e entenda novos temas e dúvidas frequentes.
                </p>

            </div>

        </section>
    );
}

export default Heronewsu;