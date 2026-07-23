import "./Heroeua.scss";
import Navbar from "../../../components/Navbar/Navbar";

function Heroeua() {
    return (
        <section className="hero-eua">

            <div className="hero-eua__bg"></div>

            <div className="hero-eua__overlay"></div>

            <Navbar />

            <div className="hero-eua__content">

                <h1>
                    Nossa excelência
                    <br />
                    ultrapassa fronteiras.
                    <br />
                    Somos internacionais
                </h1>

                <div className="hero-eua__line"></div>

                <p>
                   Padrão de processos,  <br /> construções e qualidade  <br />independente da distância.
                </p>

            </div>

        </section>
    );
}

export default Heroeua;