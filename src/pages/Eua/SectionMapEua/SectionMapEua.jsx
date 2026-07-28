import React from "react";
import "./SectionMapEua.scss";

import mapaEua from "../../../imgs/mapaeua.png";

import iconeMundo from "../../../imgs/mundo.png";
import iconeCursor from "../../../imgs/cursor.png";
import iconeMala from "../../../imgs/mala.png";
import iconeMarca from "../../../imgs/marca.png";

import fly from "../../../imgs/fly.png";

const SectionMapEua = () => {

    const cards = [
        {
            titulo: "PARCEIROS",
            texto: "Trabalhamos com uma rede selecionada de fabricantes e montadores, garantindo qualidade, confiabilidade, e padronização do início ao fim do processo.",
            icone: iconeMundo
        },
        {
            titulo: "COMPATIBILIZAÇÃO",
            texto: "Todo projeto passa por uma analise detalhada de medidas, ferragens e métodos construtivos para assegurar precisão na instalação.",
            icone: iconeCursor
        },
        {
            titulo: "GESTÃO",
            texto: "coordenamos as etapas do projeto, promovendo alinhamento constante entre todos envolvidos na operação através de comunicação contínua.",
            icone: iconeMala
        },
        {
            titulo: "QUALIDADE",
            texto: "Nosso modelo de operação foi desenvolvido para preservar a mesma organização, qualidade e experiência em cada entrega.",
            icone: iconeMarca
        }
    ];

    return (
        <section className="section-mapaeua">

            <div className="container-mapaeua">

                <div className="content-text-mapaeua">

                    <div className="subtitle-mapaeua">
                        FOCO INTERNACIONAL
                        <span></span>
                    </div>

                    <h1>
                        Construindo conexões que ultrapassam fronteiras.
                    </h1>

                    <p>
                        Desenvolvemos e acompanhamos projetos para o mercado internacional, conectando produção e montagem por meio de processos estruturados à risca, relacionamentos construídos com confiança, compromisso e visão de longo prazo.
                    </p>

                </div>

                <div className="map-area-mapaeua">

                    <img
                        src={mapaEua}
                        alt="Mapa dos Estados Unidos"
                        className="mapa-mapaeua"
                    />

                    <div className="map-info-mapaeua">
                    </div>

                </div>

            </div>

            <div className="cards-container-mapaeua">

                {cards.map((card, index) => (

                    <div
                        className="card-mapaeua"
                        key={index}
                    >

                        <div className="card-title-mapaeua">

                            <img
                                src={card.icone}
                                alt={card.titulo}
                            />

                            <h3>
                                {card.titulo}
                            </h3>

                        </div>

                        <p>
                            {card.texto}
                        </p>

                    </div>

                ))}

            </div>

        </section>
    );
};

export default SectionMapEua;