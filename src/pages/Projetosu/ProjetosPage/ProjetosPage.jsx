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

        data.project_images = (data.project_images || []).sort(
            (a, b) => a.ordem - b.ordem
        );

        setProjeto(data);
    }

    if (!projeto) {
        return (
            <main className="project-loading">
                <div className="loading-content">
                    <span></span>
                    <p>Carregando projeto...</p>
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

                        

                        <h1>{projeto.titulo}</h1>

                        

                       

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
                            SOBRE O PROJETO
                        </span>

                        <div className="section-divider"></div>

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

            {/* ================= INFO ================= */}

            <section className="project-info">

                <div className="project-info__container">

                    <div className="project-title">

                        

                        <h2>
                            Informações do Projeto
                        </h2>

                    </div>

                    <div className="project-info__grid">

                        <div className="info-card">

                            <small>Área</small>

                            <strong>
                                {projeto.area}
                            </strong>

                        </div>

                        <div className="info-card">

                            <small>Tempo</small>

                            <strong>
                                {projeto.tempo_producao}
                            </strong>

                        </div>

                        <div className="info-card">

                            <small>Cidade</small>

                            <strong>
                                {projeto.cidade}
                            </strong>

                        </div>

                        <div className="info-card">

                            <small>Escopo</small>

                            <strong>
                                {projeto.escopo}
                            </strong>

                        </div>

                    </div>

                </div>

            </section>

            {/* ================= GALERIA ================= */}

            <section className="project-gallery">

                <div className="gallery-header">

                    

                    <h2>
                        Galeria do Projeto
                    </h2>

                    <p>
                        Cada detalhe foi pensado para criar uma arquitetura
                        atemporal, sofisticada e funcional.
                    </p>

                </div>

                <div className="project-gallery__grid">
                    {projeto.project_images?.map((imagem, index) => (
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
                    ))}
                </div>

            </section>

            {/* ================= CTA FINAL ================= */}

            <section className="project-end">

                <div className="project-end__content">

                    <span>ARQUITETURA • DESIGN • EXPERIÊNCIA</span>

                    <h2>
                        Cada projeto nasce para ser
                        único, elegante e atemporal.
                    </h2>

                    <p>
                        Do conceito aos acabamentos,
                        buscamos transformar espaços em
                        experiências memoráveis,
                        combinando estética,
                        funcionalidade e exclusividade.
                    </p>

                </div>

            </section>

            <Footer />

        </main>
    );
}
