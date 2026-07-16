import React from "react";
import "./SectionMapEua.scss";

import mapaEua from "../../../imgs/mapaeua.png";
import iconePensa from "../../../imgs/pensa.png";


const SectionMapEua = () => {

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
        <section className="section-mapaeua">


            <div className="container-mapaeua">


                <div className="content-text-mapaeua">


                    <div className="subtitle-mapaeua">

                        FOCO INTERNACIONAL

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



                {
                    cards.map((card,index)=>(


                        <div 
                            className="card-mapaeua" 
                            key={index}
                        >



                            <div className="card-title-mapaeua">



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


export default SectionMapEua;