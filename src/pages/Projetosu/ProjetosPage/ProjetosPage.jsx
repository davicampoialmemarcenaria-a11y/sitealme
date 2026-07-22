import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Navbar from "../../../components/Navbar/Navbar";
import Footer from "../../../components/Footer/Footer";

import { supabase } from "../../../services/supabase";

import "./ProjetosPage.scss";


export default function ProjetoPage(){

    const { id } = useParams();

    const [projeto,setProjeto] = useState(null);


    useEffect(()=>{

        buscarProjeto();

    },[]);



    async function buscarProjeto(){

        const {data,error}= await supabase
            .from("projects")
            .select("*")
            .eq("id",id)
            .single();


        if(error){

            console.log(error);
            return;

        }


        setProjeto(data);

    }



    if(!projeto){

        return (

            <main>
                Carregando projeto...
            </main>

        );

    }



    return (

        <main className="projeto-page">


            <section className="projeto-page__hero">

                <img
                    src={
                        projeto.imagem_capa ||
                        "https://placehold.co/1600x900"
                    }
                    alt={projeto.titulo}
                />


                <Navbar />


                <div className="projeto-page__overlay">

                    <h1>
                        {projeto.titulo}
                    </h1>

                </div>

            </section>



            <section className="projeto-page__content">


                <h2>
                    {projeto.nome}
                </h2>


                <p>
                    {projeto.descricao}
                </p>


                <div className="projeto-info">


                    <span>
                        Área: {projeto.area}
                    </span>


                    <span>
                        Tempo de produção: {projeto.tempo_producao}
                    </span>


                    <span>
                        Cidade: {projeto.cidade}
                    </span>


                </div>



                <h3>
                    Escopo
                </h3>


                <p>
                    {projeto.escopo}
                </p>


            </section>


            <Footer />


        </main>

    );

}
 