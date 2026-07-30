import React from "react";
import "./SectionMapBr.scss";

import { useTranslation } from "react-i18next";

import mapaBr from "../../../imgs/mapabr.png";

import iconeGlobo from "../../../imgs/globog.png";
import iconeFly from "../../../imgs/fly.png";
import iconeAlvo from "../../../imgs/alvo.png";
import iconeLupa from "../../../imgs/lupa.png";

const SectionMapBr = () => {

    const { t } = useTranslation();

    const cards = [

        {
            titulo: t("national.card1.title"),
            texto: t("national.card1.text"),
            icone: iconeGlobo
        },

        {
            titulo: t("national.card2.title"),
            texto: t("national.card2.text"),
            icone: iconeFly
        },

        {
            titulo: t("national.card3.title"),
            texto: t("national.card3.text"),
            icone: iconeAlvo
        },

        {
            titulo: t("national.card4.title"),
            texto: t("national.card4.text"),
            icone: iconeLupa
        }

    ];

    return (

        <section className="section-mapabr">

            <div className="container-mapabr">

                <div className="content-text-mapabr">

                    <div className="subtitle-mapabr">

                        {t("national.subtitle")}

                        <span></span>

                    </div>

                    <h1>

                        {t("national.title")}

                    </h1>

                    <p>

                        {t("national.description")}

                    </p>

                </div>

                <div className="map-area-mapabr">

                    <img
                        src={mapaBr}
                        alt="Mapa do Brasil"
                        className="mapa-mapabr"
                    />

                    <div className="map-info-mapabr"></div>

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
