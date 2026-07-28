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

        <div className="marceneiro-hero-content">
          <div></div>

          <div className="texto">
            <h1>
              Cresça com quem valoriza a excelência. Seja um Homologado Alme. 
            </h1>

            <p>
              Expandimos nossa atuação por meio de uma rede de marceneiros homologados que executam projetos seguindo os padrões da Alme. Se você busca novas oportunidades e acredita que excelência deve estar presente em cada detalhe, queremos conhecer o seu trabalho. 
            </p>
          </div>
        </div>

        {/* ========= FORMULÁRIO SOBRE O HERO ========= */}

        <div className="formulario-wrapper-marceneiro">
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
             Nossa abordagem
            </h2>

            <p>Nosso processo reúne desenvolvimento técnico, organização e acompanhamento para que cada etapa aconteça de forma eficiente e alinhada às expectativas do cliente. Dessa forma, garantimos maior previsibilidade, padronização e segurança na execução, refletindo o compromisso da Alme. 
<br />
<br />
A homologação representa mais do que fazer parte da nossa rede de parceiros: é o reconhecimento de profissionais que compartilham dos nossos valores, compromisso e responsabilidade. Trabalhamos ao lado de nossos homologado para fortalecer processos, gerar novas oportunidades e promover um crescimento consistente para todos os envolvidos. 
<br />
<br />
Com uma gestão especializada, a Alme coordena os principais aspectos do projeto, promovendo mais previsibilidade, melhor aproveitamento de recursos e decisões que contribuem para reduzir desperdícios, otimizar custos e elevar a qualidade da entrega. Um modelo que fortalece nossos parceiros e assegura consistência em cada resultado.
            </p>
          </div>

        </div>
      </section>
      <Footer />

    </>
  );
}