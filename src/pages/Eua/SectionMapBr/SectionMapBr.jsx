import React from "react";
import "./SectionMapBr.scss";

import mapaBr from "../../../imgs/mapabr.png";

import iconeGlobo from "../../../imgs/globog.png";
import iconeFly from "../../../imgs/fly.png";
import iconeAlvo from "../../../imgs/alvo.png";
import iconeLupa from "../../../imgs/lupa.png";

const SectionMapBr = () => {

    const cards = [

        {
            titulo: "ATENDIMENTO",
            texto: " Todos os projetos são conduzidos com transparência e alinhados às necessidades de cada cliente.",
            icone: iconeGlobo
        },

        {
            titulo: "GERENCIAMENTO",
            texto: "Coordenamos todas as etapas, promovendo a conexão entre desenvolvimento técnico, produção e montagem.",
            icone: iconeFly
        },

        {
            titulo: "COLABORADORES",
            texto: "Contamos com profissionais parceiros que compartilham dos mesmos valores de qualidade, responsabilidade e comprometimento.",
            icone: iconeAlvo
        },

        {
            titulo: "PRIMOR",
            texto: " Mantemos altos padrões de execução, assegurando que cada projeto reflita o cuidado presente em todas as etapas do trabalho.",
            icone: iconeLupa
        }

    ];

    return (

        <section className="section-mapabr">

            <div className="container-mapabr">

                <div className="content-text-mapabr">

                    <div className="subtitle-mapabr">

                        FOCO NACIONAL

                        <span></span>

                    </div>

                    <h1>

                        Transformando projetos em experiencias por todo o país.

                    </h1>

                    <p>

                        Atuamos em diferentes regiões do Brasil, conectando projeto, produção e montagem por meio de processos estruturados, comunicação próxima e uma rede de parceiros construída com confiança e compromisso.

                    </p>

                </div>

                <div className="map-area-mapabr">

                    <img
                        src={mapaBr}
                        alt="Mapa do Brasil"
                        className="mapa-mapabr"
                    />

                    <div className="map-info-mapabr">

                    </div>

                </div>

            </div>

            <div className="cards-container-mapabr">

                {cards.map((card, index) => (

                    <div
                        className="card-mapabr"
                        key={index}
                    >

                        <div className="card-title-mapabr">

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

export default SectionMapBr;