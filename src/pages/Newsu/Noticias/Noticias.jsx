import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/supabase";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import "swiper/css";
import "swiper/css/navigation";

import "./Noticias.scss";


export default function Noticias() {


    const navigate = useNavigate();


    const [news, setNews] = useState([]);

    const [loading, setLoading] = useState(true);



    useEffect(() => {

        buscarNoticias();

    }, []);



    async function buscarNoticias() {


        setLoading(true);


        const { data, error } = await supabase

            .from("news")

            .select("*")

            .eq("status", "publicado")

            .order("created_at", {

                ascending: false

            });



        if (error) {

            console.log(error);

            setLoading(false);

            return;

        }



        setNews(data || []);

        setLoading(false);


    }




    function abrirNoticia(id) {
    navigate(`/news/${id}`);
}




    function handleCardKey(event, id) {


        if(event.key === "Enter") {

            abrirNoticia(id);

        }


    }





    if (loading) {


        return (

            <section className="noticias">

                <div className="noticias__container">

                    <p>

                        Carregando notícias...

                    </p>

                </div>

            </section>

        );


    }





    return (


        <section className="noticias">


            <div className="noticias__container">



                <div className="noticias__header">


                    <div className="noticias__titulo">


                        <span>

                            FOCO INTERNACIONAL

                        </span>


                        <div className="linha"></div>


                    </div>




                    <div className="noticias__arrows">


                        <button className="prev-news">

                            <FiChevronLeft />

                        </button>



                        <button className="next-news">

                            <FiChevronRight />

                        </button>


                    </div>


                </div>






                <Swiper


                    modules={[Navigation, Autoplay]}



                    navigation={{


                        prevEl: ".prev-news",

                        nextEl: ".next-news"


                    }}



                    autoplay={{


                        delay:5000,

                        disableOnInteraction:false


                    }}



                    loop={true}



                    spaceBetween={18}



                    breakpoints={{


                        0: {

                            slidesPerView:1

                        },


                        768: {

                            slidesPerView:2

                        },


                        1200: {

                            slidesPerView:3

                        }


                    }}



                >





                    {

                        news.map((item)=>(



                            <SwiperSlide key={item.id}>


                                <article


                                    className="news-card"



                                    onClick={() => abrirNoticia(item.id)}



                                    onKeyDown={(e)=>handleCardKey(e,item.id)}



                                    role="button"



                                    tabIndex="0"



                                >





                                    <div className="news-card__image">


                                        <img


                                            src={

                                                item.capa_url ||

                                                "https://placehold.co/900x700"

                                            }



                                            alt={

                                                item.titulo ||

                                                "Notícia"

                                            }



                                        />


                                    </div>







                                    <div className="news-card__content">



                                        <h3>


                                            {

                                                item.titulo ||

                                                "Sem título"

                                            }


                                        </h3>





                                        <p>


                                            {

                                                item.descricao ||

                                                "Confira esta notícia."

                                            }


                                        </p>






                                        <div className="news-card__footer">



                                            <span>


                                                Autor:

                                                {" "}


                                                {

                                                    item.autor ||

                                                    "ALME"

                                                }



                                            </span>




                                        </div>




                                    </div>





                                </article>





                            </SwiperSlide>



                        ))


                    }





                </Swiper>





            </div>




        </section>



    );


}