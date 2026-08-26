import React from "react";
import "./SectionMapEua.scss";

import { useTranslation } from "react-i18next";

import mapaEua from "../../../imgs/mapaeua.png";

import iconeMundo from "../../../imgs/mundo.png";
import iconeCursor from "../../../imgs/cursor.png";
import iconeMala from "../../../imgs/mala.png";
import iconeMarca from "../../../imgs/marca.png";

const SectionMapEua = () => {

    const { t } = useTranslation();

    const cards = [

        {
            titulo: t("international.card1.title"),
            texto: t("international.card1.text"),
            icone: iconeMundo
        },

        {
            titulo: t("international.card2.title"),
            texto: t("international.card2.text"),
            icone: iconeCursor
        },

        {
            titulo: t("international.card3.title"),
            texto: t("international.card3.text"),
            icone: iconeMala
        },

        {
            titulo: t("international.card4.title"),
            texto: t("international.card4.text"),
            icone: iconeMarca
        }

    ];

    return (

        <section className="section-mapaeua">

            <div className="container-mapaeua">

                <div className="content-text-mapaeua">

                    <div className="subtitle-mapaeua">

                        {t("international.subtitle")}

                        <span></span>

                    </div>

                    <h1>
                        {t("international.title")}
                    </h1>

                    <p>
                        {t("international.description")}
                    </p>

                </div>

                <div className="map-area-mapaeua">

                    <img
                        src={mapaEua}
                        alt="Mapa dos Estados Unidos"
                        className="mapa-mapaeua"
                    />

                    <div className="map-info-mapaeua"></div>

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

            {/* BOTÃO FINAL */}

            <div className="button-container-mapaeua">

                <a
                    href="https://almewoodworks.com/"
                    className="button-mapaeua"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t("international.button")}
                </a>

            </div>

        </section>

    );

};

export default SectionMapEua;
