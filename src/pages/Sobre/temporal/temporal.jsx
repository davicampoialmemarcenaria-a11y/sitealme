import { useState } from "react";
import "./Temporal.scss";

// Imagens
import foto2020 from "../../../imgs/2020.jpg";
import foto2022 from "../../../imgs/2022.jpg";
import foto2024 from "../../../imgs/2024.jpg";
import foto2025 from "../../../imgs/2025.jpg";
import fotoHoje from "../../../imgs/hoje.jpg";

const timeline = [
  {
    year: "2020",
    image: foto2020,
    text: "Tudo começou antes da primeira marcenaria. Antes mesmo da abertura da empresa, iniciamos um período intenso de estudos sobre o mercado moveleiro. Conversamos com arquitetos, clientes, fornecedores e marceneiros para entender onde estavam as maiores dificuldades do setor. A Alme que nasceu como Aura Marcenaria, veio da convicção de que um bom projeto não depende apenas de móveis bem executados, mas de processos bem conduzidos."



  },
  {
    year: "2022",
    image: foto2022,
    text: "O primeiro projeto. A primeira entrega. A certeza de que estávamos no caminho certo. Com o início das operações, realizamos nosso primeiro contrato e entregamos a primeira obra. Mais do que fabricar mobiliário, começávamos a construir uma reputação baseada em organização, compromisso e confiança. "
  },
  {
    year: "2024",
    image: foto2024,
    text: "Assinamos nosso primeiro contrato para o setor hoteleiro.  146 apartamentos e centenas de ambientes executados sob os mesmos padrões de qualidade. Reestruturamos a equipe, redefinimos nosso posicionamento estratégico e passamos a atuar em um novo segmento de mercado. Foi nesse momento que a Aura Marcenaria tornou-se oficialmente Alme Marcenaria. "
  },
  {
    year: "2025",
    image: foto2025,
    text: "Evoluir também significa saber mudar. O mercado havia mudado. Nós também. Reestruturamos a equipe, redefinimos nosso posicionamento estratégico e passamos a atuar em um novo segmento de mercado. Foi nesse momento que a Aura Marcenaria tornou-se oficialmente Alme Marcenaria. Mais do que uma nova marca, uma empresa mais madura, preparada para desafios ainda maiores. "
  },
  {
    year: "2026",
    image: fotoHoje,
    text: "Começamos a estudar o mercado norte-americano. Meses de pesquisas, reuniões e planejamento culminaram em uma viagem à Flórida para entender de perto as particularidades do setor e consolidar relações. Era o início da nossa expansão internacional e todo o planejamento ganhou forma. Concluímos a venda e a entrega do primeiro projeto executado nos Estados Unidos, marcando o início de uma nova etapa da nossa história. Uma conquista que simboliza o mesmo compromisso que deu origem à empresa: entregar excelência, independentemente da distância. "
  }
];

function Temporal() {

  const [active, setActive] = useState(0);

  return (

    <section className="temporal">

      <div className="temporal__container">

        {/* ESQUERDA */}

        <div className="temporal__left">

          <span className="temporal__tag">
            QUEM SOMOS
          </span>

          <h2>
            Uma trajetória construída
            <br />
            com dedicação, evolução
            <br />
            e propósito.
          </h2>

          <p>
           Cada etapa da nossa trajetória representa uma decisão de evoluir. Cada projeto entregue reforça o compromisso que assumimos desde o primeiro dia: transformar desafios em processos bem executados e entregar excelência do início ao fim. E esta história continua sendo escrita, projeto após projeto. 
          </p>
          <p>Mais do que produzir mobiliário sob medida, assumimos a responsabilidade de conduzir cada projeto com planejamento, acompanhamento técnico e compromisso absoluto com aquilo que foi definido.  </p>


        </div>

        {/* DIREITA */}

        <div className="temporal__right">

          {/* TIMELINE */}

          <div className="temporal__timeline">

            {timeline.map((item, index) => (

              <div
                className="temporal__item"
                key={index}
              >

                <div
                  className="temporal__marker"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => setActive(index)}
                >

                  <div
                    className={`temporal__circle ${
                      active === index ? "active" : ""
                    }`}
                  />

                </div>

                <span
                  className={`temporal__year ${
                    active === index ? "active" : ""
                  }`}
                >
                  {item.year}
                </span>

              </div>

            ))}

          </div>

          {/* CARD */}

          <div
            className="temporal__card"
            key={active}
          >

            <div className="temporal__cardArrow"></div>

            <img
              src={timeline[active].image}
              alt={timeline[active].year}
            />

            <div className="temporal__cardContent">

              <p>
                {timeline[active].text}
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}

export default Temporal;