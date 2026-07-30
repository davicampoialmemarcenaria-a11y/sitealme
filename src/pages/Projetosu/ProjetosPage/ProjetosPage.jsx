import "./ProjetosPage.scss";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Navbar from "../../../components/Navbar/Navbar";
import Footer from "../../../components/Footer/Footer";

import { supabase } from "../../../services/supabase";


export default function ProjetosPage() {


    const { id } = useParams();


    const { i18n, t } = useTranslation();


    const [projeto, setProjeto] = useState(null);





    useEffect(() => {

        buscarProjeto();

    }, [id]);





    async function buscarProjeto() {


        const { data, error } = await supabase

            .from("projects")

            .select(`
                *,
                project_images(*)
            `)

            .eq("id", id)

            .single();




        if (error) {

            console.log(error);

            return;

        }





        data.project_images = (

            data.project_images || []

        ).sort(

            (a, b) => a.ordem - b.ordem

        );




        setProjeto(data);


    }






    function campoIdioma(campo){


        if(i18n.language === "en"){


            return projeto[`${campo}_en`] || projeto[campo];


        }


        return projeto[campo];


    }






    if (!projeto) {


        return (

            <main className="project-loading">

                <div className="loading-content">

                    <span></span>

                    <p>
                        {t("project.loading")}
                    </p>


                </div>


            </main>

        );


    }







    return (

        <main className="project-page">
            {/* ================= HERO ================= */}

            <section className="project-hero">


                <img

                    src={

                        projeto.imagem_capa ||

                        "https://placehold.co/1800x1000"

                    }

                    alt={projeto.titulo}

                />



                <Navbar />



                <div className="project-hero__overlay">


                    <div className="hero-content">


                        <h1>
                            {projeto.titulo}
                        </h1>



                    </div>


                </div>


            </section>





            {/* ================= INTRO ================= */}


            <section className="project-about">


                <div className="project-about__container">



                    <div className="project-about__text">


                        <span className="section-number">

                            01

                        </span>



                        <span className="section-subtitle">

                            {t("project.about")}

                        </span>



                        <div className="section-divider"></div>




                        <h2>

                            {projeto.nome}

                        </h2>




                        <p>

                            {campoIdioma("texto")}

                        </p>




                    </div>






                    <div className="project-about__image">


                        <img

                            src={

                                projeto.project_images?.[0]?.imagem_url ||

                                projeto.imagem_capa

                            }

                            alt={projeto.nome}

                        />


                    </div>




                </div>


            </section>








            {/* ================= INFO ================= */}


            <section className="project-info">



                <div className="project-info__container">



                    <div className="project-title">


                        <h2>

                            {t("project.information")}

                        </h2>



                    </div>





                    <div className="project-info__grid">





                        <div className="info-card">


                            <small>

                                {t("project.area")}

                            </small>



                            <strong>

                                {campoIdioma("area")}

                            </strong>



                        </div>







                        <div className="info-card">


                            <small>

                                {t("project.time")}

                            </small>



                            <strong>

                                {campoIdioma("tempo_producao")}

                            </strong>



                        </div>







                        <div className="info-card">


                            <small>

                                {t("project.city")}

                            </small>



                            <strong>

                                {projeto.cidade}

                            </strong>



                        </div>







                        <div className="info-card">


                            <small>

                                {t("project.scope")}

                            </small>



                            <strong>

                                {campoIdioma("escopo")}

                            </strong>



                        </div>




                    </div>




                </div>



            </section>
            {/* ================= GALERIA ================= */}


            <section className="project-gallery">


                <div className="gallery-header">


                    <h2>

                        {t("project.gallery")}

                    </h2>




                    <p>

                        {t("project.galleryDescription")}

                    </p>



                </div>





                <div className="project-gallery__grid">


                    {
                        projeto.project_images?.map((imagem, index) => (


                            <figure

                                key={imagem.id}

                                className={`gallery-item pattern-${index % 6}`}

                            >



                                <img

                                    src={imagem.imagem_url}

                                    alt={`${projeto.nome} - ${index + 1}`}

                                    loading="lazy"

                                />





                                <figcaption>



                                    <span>

                                        {String(index + 1).padStart(2, "0")}

                                    </span>





                                    <div className="gallery-caption-line"></div>






                                    <p>

                                        {projeto.nome}

                                    </p>




                                </figcaption>




                            </figure>


                        ))

                    }



                </div>



            </section>








            {/* ================= CTA FINAL ================= */}



            <section className="project-end">


                <div className="project-end__content">



                    <h2>

                        {t("project.endTitle")}

                    </h2>





                    <p>

                        {t("project.endDescription")}

                    </p>




                </div>



            </section>






            <Footer />



        </main>


    );


}
