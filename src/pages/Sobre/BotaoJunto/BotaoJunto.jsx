import "./BotaoJunto.scss";
import logo from "../../../imgs/logoamarela.png";

const BotaoJunto = () => {
  return (
    <section className="botao-junto">
      <div className="conteudo">
        <div className="lado-esquerdo">
          <img src={logo} alt="Logo Alme" className="logo" />

          <div className="textos">
            <h2>Vamos criar algo incrível juntos?</h2>

            <p>
              Venha fazer um orçamento conosco e descubra como podemos transformar seu projeto em realidade. 
            </p>
          </div>
        </div>

        <a href="/projetos" className="btn-projetos">
          <span>VEJA NOSSOS PROJETOS DE PERTO</span>

          <span className="seta">→</span>
        </a>
      </div>
    </section>
  );
};

export default BotaoJunto;