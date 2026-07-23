import "./ProjetosSectionHome.scss";

import fotoCasa from "../../../imgs/fotocasahome.png";
import { HiArrowRight } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

function ProjetosSectionHome() {
  const navigate = useNavigate();  
  
  return (


         


        <section className="projetos-home">

            <img
                src={fotoCasa}
                alt="Projeto"
                className="projetos-home__image"
            />

            <div className="projetos-home__overlay"></div>

            <div className="projetos-home__content">

               

                <h2>Sonhos realizados</h2>

                <p>
                    Cada detalhe é pensado e executado especialmente para você.
                </p>
                 <span>DESTAQUES DA MARCENARIA</span>
                
                <button onClick={() => navigate("/Projetos")}>
                    VEJA NOSSOS PROJETOS DE PERTO
                    <HiArrowRight />
                </button>

            </div>

        </section>
    );
}

export default ProjetosSectionHome;