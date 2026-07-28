import "./Formanewsu.scss";
import forma from "../../../imgs/forma.png";

export default function Formanewsu() {
  return (
    <section className="formanewsu">
      <div className="formanewsu__container">
        <div className="formanewsu__text">
          <h2>
            As principais  tendências, em um só lugar.
          </h2>

          <h3>O mercado evolui e nós acompanhamos</h3>

          <div className="linha"></div>

          <p>
            Neste espaço compartilhamos tendências, notícias, processos e inovações que fazem parte do universo da marcenaria. 
          </p>
        </div>

        <div className="formanewsu__img">
          <img src={forma} alt="Projetamos experiências" />
        </div>
      </div>
    </section>
  );
}  
