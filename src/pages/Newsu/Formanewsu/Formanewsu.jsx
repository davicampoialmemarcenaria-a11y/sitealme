import "./Formanewsu.scss";
import forma from "../../../imgs/forma.png";

export default function Formanewsu() {
  return (
    <section className="formanewsu">
      <div className="formanewsu__container">
        <div className="formanewsu__text">
          <h2>
            Não projetamos
            <br />
            apenas espaços.
          </h2>

          <h3>Projetamos experiências</h3>

          <div className="linha"></div>

          <p>
            Acompanhamos todas as etapas, do início ao fim, garantindo
            organização, alinhamento e uma execução fluida em cada detalhe
            feito.
          </p>
        </div>

        <div className="formanewsu__img">
          <img src={forma} alt="Projetamos experiências" />
        </div>
      </div>
    </section>
  );
}  
