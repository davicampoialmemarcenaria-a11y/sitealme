import "./ProjetosPage.scss";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Navbar from "../../../components/Navbar/Navbar";
import Footer from "../../../components/Footer/Footer";

import { supabase } from "../../../services/supabase";

export default function ProjetosPage() {

    const { id } = useParams();

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

        data.project_images =
            (data.project_images || [])
                .sort((a, b) => a.ordem - b.ordem);

        setProjeto(data);

    }

    if (!projeto) {

        return (

            <main className="project-loading">

                Carregando projeto...

            </main>

        );

    }

    return (

        <main className="project-page">

            {/* HERO */}

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

                    <h1>

                        {projeto.titulo}

                    </h1>

                </div>

            </section>

            {/* INTRO */}

            <section className="project-about">

                <div className="project-about__container">

                    <div className="project-about__text">

                        <span>

                            QUEM SOMOS

                        </span>

                        <div className="line"></div>

                        <h2>

                            {projeto.nome}

                        </h2>

                        <p>

                            {projeto.texto}

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

            {/* INFORMAÇÕES */}

            <section className="project-info">

                <div className="project-info__container">

                    <h2>

                        Informações do projeto

                    </h2>

                    <div className="project-info__grid">

                        <div>

                            <span>

                                Área

                            </span>

                            <strong>

                                {projeto.area}

                            </strong>

                        </div>

                        <div>

                            <span>

                                Tempo de produção

                            </span>

                            <strong>

                                {projeto.tempo_producao}

                            </strong>

                        </div>

                        <div>

                            <span>

                                Cidade

                            </span>

                            <strong>

                                {projeto.cidade}

                            </strong>

                        </div>

                        <div>

                            <span>

                                Escopo

                            </span>

                            <strong>

                                {projeto.escopo}

                            </strong>

                        </div>

                    </div>

                </div>

            </section>

            {/* GALERIA */}

            <section className="project-gallery">

                <div className="project-gallery__grid">

                    {

                        projeto.project_images?.map((imagem, index) => (

                            <div

                                key={imagem.id}

                                className={`gallery-item pattern-${index % 6}`}

                            >

                                <img

                                    src={imagem.imagem_url}

                                    alt="Projeto"

                                />

                            </div>

                        ))

                    }

                </div>

            </section>

            <Footer />

        </main>

    );

}