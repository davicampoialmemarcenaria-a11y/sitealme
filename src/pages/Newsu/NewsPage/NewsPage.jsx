
import "./NewsPage.scss";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import Footer from "../../../components/Footer/Footer";
import { supabase } from "../../../services/supabase";


export default function NewsPage(){

    const { id } = useParams();

    const [noticia, setNoticia] = useState(null);


    useEffect(()=>{

        buscarNoticia();

    },[id]);



    async function buscarNoticia(){

        const { data, error } = await supabase
            .from("news")
            .select(`
                *,
                news_blocks(*)
            `)
            .eq("id", id)
            .single();


        console.log("NOTICIA:", data);
        console.log("ERRO:", error);


        if(error){

            console.log(error);
            return;

        }


        data.news_blocks = data.news_blocks.sort(
            (a,b)=> a.ordem - b.ordem
        );


        setNoticia(data);

    }



    if(!noticia){

        return (

            <main className="news-page-loading">

                Carregando notícia...

            </main>

        );

    }



    return (

        <main className="news-page">


            {/* HERO */}

            <section className="news-page__hero">
                <img

                    src={
                        noticia.capa_url ||
                        "https://placehold.co/1600x900"
                    }

                    alt={noticia.titulo}

                />

            

                       <Navbar /> 
                           
                <div className="news-page__hero-overlay">


                    <h1>

                        {noticia.titulo}

                    </h1>


                </div>


            </section>




            {/* INTRODUÇÃO */}

            <section className="news-page__intro">


                <p>

                    {noticia.descricao}

                </p>


            </section>





            {/* BLOCOS */}

            <section className="news-page__content">


                {
                    noticia.news_blocks?.map((bloco,index)=>(


                        <article
    className={`news-block 
        ${index % 2 !== 0 ? "reverse" : ""}
        ${!bloco.imagem_url ? "no-image" : ""}
    `}
>



                            <div className="news-block__text">


                                {
                                    bloco.titulo &&

                                    <h2>

                                        {bloco.titulo}

                                    </h2>

                                }



                                <p>

                                    {bloco.texto}

                                </p>


                            </div>





                            {
                                bloco.imagem_url &&

                                <div className="news-block__image">


                                    <img

                                        src={bloco.imagem_url}

                                        alt={bloco.titulo}

                                    />


                                </div>

                            }



                        </article>


                    ))
                }


            </section>

<Footer />
        </main>

    );

}

