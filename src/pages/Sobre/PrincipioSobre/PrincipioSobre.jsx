import "./PrincipioSobre.scss";

import user from "../../../imgs/user.png";
import estrela from "../../../imgs/estrela.png";
import vital from "../../../imgs/vital.png";
import barras from "../../../imgs/barras.png";



function Sobre() {
  return (
    <>
      {/* outras seções */}

      <PrincipioSobre />

      {/* próximas seções */}
    </>
  );
}


const principios = [
  {
    titulo: "EXCELÊNCIA",
    icon: user,
    texto:
      "Buscamos realizar cada etapa com atenção, organização e cuidado, para que o resultado seja tão bom quando o processo que levou até ele.  Acompanhamos todas as etapas, do início ao fim. Garantimos acolhimento, atenção aos detalhes e um ambiente pensado para oferecer tranquilidade durante toda a jornada.",
  },
  {
    titulo: "COMPROMISSO",
    icon: estrela,
    texto:
      "Assumimos cada projeto com responsabilidade, cumprindo o que foi acordado e mantendo relações baseadas em confiança, transparência e respeito.  Cada decisão é guiada pelo respeito e pela serenidade. Estamos presentes em todos os momentos para tornar cada etapa mais leve e segura.",
  },
  {
    titulo: "EVOLUÇÃO",
    icon: vital,
    texto:
      "Crescemos junto com quem caminha ao nosso lado. Investimos no desenvolvimento de parceiros, colaboradores e processos, porque acreditamos que resultados extraordinários são construídos coletivamente. ",
  },
  {
    titulo: "PERENIDADE",
    icon: barras,
    texto:
      "Não buscamos apenas a próxima entrega, mas a próxima década. Tomamos decisões pensando em relações duradouras, na solidez do negócio e no impacto positivo que queremos deixar para clientes, parceiros e equipe. ",
  },
];

export default function PrincipioSobre() {
  return (
    <section className="principioSobre">

      <div className="topo">

        <div className="quemSomos">
          <span>QUEM SOMOS</span>
          <div className="linha"></div>
        </div>

        <h2>
          Princípios que guiam nossas escolhas
        </h2>

      </div>

      <div className="cards">

        {principios.map((item, index) => (
         <div className="principio-card" key={index}>
            <div className="titulo">

              <img src={item.icon} alt={item.titulo} />

              <h3>{item.titulo}</h3>

            </div>

            <p>{item.texto}</p>

          </div>
        ))}

      </div>

    </section>
  );
}