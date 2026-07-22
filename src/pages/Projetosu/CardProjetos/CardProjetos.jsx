import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../services/supabase";


import "./CardProjetos.scss";


export default function CardProjetos(){


    const [projetos,setProjetos] = useState([]);

    const navigate = useNavigate();



    useEffect(()=>{

        buscarProjetos();

    },[]);



    async function buscarProjetos(){


        const {data,error} = await supabase

            .from("projects")

            .select("*")

            .order("created_at",{
                ascending:false
            });



        if(error){

            console.log(error);

            return;

        }


        setProjetos(data || []);

    }




    return(

        <section className="cards-projetos">


            {
                projetos.map(projeto=>(


                    <article

                        className="card-projeto"

                        key={projeto.id}

                        onClick={()=>navigate(`/projeto/${projeto.id}`)}

                    >


                        <div className="card-projeto__image">


                            <img

                                src={
                                    projeto.imagem_capa ||
                                    "https://placehold.co/600x900"
                                }

                                alt={projeto.titulo}

                            />


                        </div>



                        <div className="card-projeto__overlay">


                            <div className="card-projeto__content">


                                <h2>

                                    {projeto.titulo}

                                </h2>



                                <div className="card-projeto__extra">


                                    <strong>

                                        {projeto.nome}

                                    </strong>



                                    <p>

                                        {projeto.descricao}

                                    </p>


                                </div>


                            </div>


                        </div>



                    </article>


                ))
            }


        </section>

    );

}