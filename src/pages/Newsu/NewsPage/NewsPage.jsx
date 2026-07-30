import "./NewsPage.scss";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Navbar from "../../../components/Navbar/Navbar";
import Footer from "../../../components/Footer/Footer";
import { supabase } from "../../../services/supabase";


export default function NewsPage(){


    const { id } = useParams();

    const { i18n, t } = useTranslation();



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

    {t("news.loading")}

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


                   alt={
    i18n.language === "en"
    ? noticia.titulo_en || noticia.titulo
    : noticia.titulo
}

                />



                <Navbar />




                <div className="news-page__hero-overlay">


                    <h1>


                        {

                            i18n.language === "en"

                            ? noticia.titulo_en || noticia.titulo

                            : noticia.titulo

                        }


                    </h1>


                </div>



            </section>








            {/* INTRODUÇÃO */}



            <section className="news-page__intro">


                <p>


                    {

                        i18n.language === "en"

                        ? noticia.descricao_en || noticia.descricao

                        : noticia.descricao

                    }


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

                            key={bloco.id}


                        >




                            <div className="news-block__text">





                                {


                                    bloco.titulo &&


                                    <h2>


                                        {

                                            i18n.language === "en"

                                            ? bloco.titulo_en || bloco.titulo

                                            : bloco.titulo

                                        }


                                    </h2>


                                }






                                {


                                    bloco.autor &&


                                   <span className="news-block__author">

    {t("news.author")} {bloco.autor}

</span>



                                }







                                <p>


                                    {

                                        i18n.language === "en"

                                        ? bloco.texto_en || bloco.texto

                                        : bloco.texto

                                    }


                                </p>




                            </div>








                            {


                                bloco.imagem_url &&



                                <div className="news-block__image">


                                    <img


                                        src={bloco.imagem_url}


                                        alt={
    i18n.language === "en"
    ? bloco.titulo_en || bloco.titulo
    : bloco.titulo
}


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
