import React from "react";
import "./SectionMapBr.scss";

import mapaBr from "../../../imgs/mapabr.png";
import iconePensa from "../../../imgs/pensa.png";


const SectionMapBr = () => {


    const cards = [

        {
            titulo: "CONFORTO",
            texto: "Acompanhamos todas as etapas, do início ao fim. Acompanhamos todas as etapas, do início ao fim."
        },

        {
            titulo: "CALMARIA",
            texto: "Acompanhamos todas as etapas, do início ao fim. Acompanhamos todas as etapas, do início ao fim."
        },

        {
            titulo: "SOSSEGO",
            texto: "Acompanhamos todas as etapas, do início ao fim. Acompanhamos todas as etapas, do início ao fim."
        },

        {
            titulo: "FORÇA",
            texto: "Acompanhamos todas as etapas, do início ao fim. Acompanhamos todas as etapas, do início ao fim."
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

                        Gestão Completa do Projeto

                    </h1>





                    <p>

                        Compromisso não é diferencial, é padrão.
                        Na Alme, entregamos o que prometemos,
                        com a qualidade que o seu projeto exige
                        e o cuidado com quem vai viver naquele espaço merece.

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





                {

                    cards.map((card,index)=>(



                        <div

                            className="card-mapabr"

                            key={index}

                        >





                            <div className="card-title-mapabr">





                                <img

                                    src={iconePensa}

                                    alt="icone"

                                />






                                <h3>

                                    {card.titulo}

                                </h3>





                            </div>







                            <p>

                                {card.texto}

                            </p>





                        </div>



                    ))


                }





            </div>






        </section>


    );

};



export default SectionMapBr;