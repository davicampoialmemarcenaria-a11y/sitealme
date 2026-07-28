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
                    Inovando projetos de marcenaria com nosso modelo de negócio
                </h1>

                <p>
                    A Alme apresenta um grande diferencial quando se trata de processos e princípios. Nós valorizamos nossos processos como uma parte importante da nossa trajetória.
                </p>

            </div>

        </section>
    );
}

export default HeroSobre;