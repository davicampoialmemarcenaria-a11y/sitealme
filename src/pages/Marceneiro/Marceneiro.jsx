import "./Marceneiro.scss";
import Navbar from "../../components/Navbar/Navbar";
import fundo from "../../imgs/fundoma.png";
import Footer from "../../components/Footer/Footer";

export default function Marceneiro() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section
        className="marceneiro-hero"
        style={{ backgroundImage: `url(${fundo})` }}
      >
        <div className="overlay"></div>

        <Navbar />

        <div className="hero-content">
          <div></div>

          <div className="texto">
            <h1>
              Faça parte da
              <br />
              equipe, seja um
              <br />
              marceneiro
              <br />
              homologado
            </h1>

            <p>
              Acompanhamos todas as etapas, do início ao fim,
              garantindo organização, alinhamento e uma execução
              fluida em cada detalhe.
            </p>
          </div>
        </div>

        {/* ========= FORMULÁRIO SOBRE O HERO ========= */}

        <div className="formulario-wrapper">
          <div className="formulario">
            <iframe
              src="https://app.pipefy.com/public/form/PPeFD_qA"
              title="Formulário Pipefy"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ================= SEGUNDA SEÇÃO ================= */}

      <section className="marceneiro-conteudo">
        <div className="conteudo">

          {/* Espaço reservado para acompanhar a largura do formulário */}
          <div></div>

          <div className="sobre">
            <h2>
              Gestão Completa do Projeto
            </h2>

            <p>
              Compromisso não é diferencial, é padrão. Na Alme,
              entregamos o que prometemos, com a qualidade que
              seu projeto exige e o cuidado com quem vai viver
              naquele espaço.
            </p>

            <br />

            <p>
              Desde a homologação do marceneiro até a instalação
              final, acompanhamos cada etapa para garantir
              alinhamento entre projeto, produção e execução.
            </p>

            <br />

            <p>
              Nosso objetivo é que cada ambiente seja entregue
              exatamente como foi pensado, respeitando prazos,
              acabamento e qualidade em todos os detalhes.
            </p>
          </div>

        </div>
      </section>
      <Footer />

    </>
  );
}