import "./HeroSobre.scss";
import Navbar from "../../../components/Navbar/Navbar";

function HeroSobre() {
    return (
        <section className="hero-sobre">

            <div className="hero-sobre__bg"></div>

            <div className="hero-sobre__overlay"></div>

            <Navbar />

            <div className="hero__content">

               

                <h1>
                    Aplicando excelência e criando experiências
                </h1>

                <p>
                    Acompanhamos todas as etapas, do início ao fim, garantindo organização, alinhamento e uma execução fluida em cada detalhe feito
                </p>

            </div>

        </section>
    );
}

export default HeroSobre;