import "./Campo.scss";
import { useState } from "react";

import { supabase } from "../../../services/supabase";

import whatsapp from "../../../imgs/w.png";
import instagram from "../../../imgs/i.png";
import gmail from "../../../imgs/g.png";
import pdf from "../../../imgs/p.png";


const PDF_URL =
"https://ohwnopvsuromemokbypp.supabase.co/storage/v1/object/public/manuais/Como_cuidar_do_seu_movel.pdf";



const perguntas = [

    {
        titulo: "Como eu poderia cuidar melhor dos meus móveis?",
        resposta:
            "Compromisso não é diferencial, é padrão. Na Alme, entregamos o que prometemos, com a qualidade que o seu projeto exige e o cuidado com quem vai viver naquele espaço merece."
    },

    {
        titulo: "Como funciona o processo da Alme?",
        resposta:
            "Nosso processo acompanha o projeto desde o orçamento até a instalação, garantindo acompanhamento em cada etapa e total transparência durante a execução."
    },

    {
        titulo: "Quanto tempo leva um projeto?",
        resposta:
            "O prazo varia conforme o tamanho do projeto, a complexidade dos ambientes e os acabamentos escolhidos. Nossa equipe informa um cronograma detalhado antes do início da produção."
    },

    {
        titulo: "Vocês atendem arquitetos?",
        resposta:
            "Sim. Grande parte dos nossos projetos é desenvolvida em parceria com arquitetos e designers de interiores, oferecendo suporte técnico durante toda a execução."
    },

    {
        titulo: "Vocês fazem projetos completos?",
        resposta:
            "Sim. Desenvolvemos ambientes completos de alto padrão, sempre respeitando o conceito do projeto e o nível de acabamento esperado."
    },

    {
        titulo: "Como solicitar um orçamento?",
        resposta:
            "Entre em contato conosco pelo WhatsApp, envie seu projeto ou briefing e nossa equipe comercial iniciará o processo de orçamento."
    },

    {
        titulo: "Onde vocês atendem?",
        resposta:
            "Atendemos diversas regiões do Brasil e também acompanhamos projetos internacionais, oferecendo gestão completa em todas as etapas."
    },

    {
        titulo: "Quais materiais a Alme utiliza nos móveis?",
        resposta:
            "Trabalhamos com materiais de alto padrão e acabamentos cuidadosamente selecionados para garantir durabilidade, sofisticação e excelente desempenho em cada projeto."
    },

    {
        titulo: "É possível personalizar completamente o projeto?",
        resposta:
            "Sim. Todos os nossos projetos são desenvolvidos de forma personalizada, respeitando o estilo, as necessidades e os detalhes definidos pelo cliente e pelo arquiteto responsável."
    },

    {
        titulo: "A Alme realiza a instalação dos móveis?",
        resposta:
            "Sim. Nossa equipe acompanha todas as etapas, incluindo a instalação, garantindo qualidade, organização e um acabamento impecável na entrega final."
    }

];



function Campo(){


    const [ativo,setAtivo] = useState(0);


    const [modalAberto,setModalAberto] = useState(false);


    const [loading,setLoading] = useState(false);



    const [form,setForm] = useState({

        nome_completo:"",
        numero:"",
        instagram_profissional:"",
        area_de_atuacao:""

    });





    function alterarCampo(e){


        setForm({

            ...form,

            [e.target.name]:e.target.value

        });


    }





    function abrirModal(){


        setModalAberto(true);


    }





    function fecharModal(){


        setModalAberto(false);


    }






    async function cadastrarBaixar(){



        if(

            !form.nome_completo ||
            !form.numero ||
            !form.instagram_profissional ||
            !form.area_de_atuacao

        ){

            alert("Preencha todos os campos.");

            return;

        }



        setLoading(true);



    const { error } = await supabase

    .from("clientes_cad")

    .insert([{

        nome_completo: form.nome_completo,

        numero_whatsapp: form.numero,

        instagram_profissional: form.instagram_profissional,

        area_de_atuacao: form.area_de_atuacao

    }]);





        if(error){


            console.log(error);

            alert("Erro ao cadastrar.");

            setLoading(false);

            return;


        }





        setLoading(false);


        setModalAberto(false);



        setForm({

            nome_completo:"",
            numero:"",
            instagram_profissional:"",
            area_de_atuacao:""

        });




        window.open(PDF_URL,"_blank");



    }

    return (

        <section className="faq">


            <div className="faq__container">



                <div className="faq__top">


                    <span>
                        FOCO INTERNACIONAL
                    </span>



                    <h2>
                        Perguntas frequentes
                    </h2>



                    <p>

                        Compromisso não é diferencial, é padrão. Na Alme,
                        entregamos o que prometemos, com a qualidade que o seu
                        projeto exige e o cuidado com quem vai viver naquele
                        espaço merece.

                    </p>


                </div>






                <div className="faq__content">



                    <div className="faq__accordion">



                        {perguntas.map((item,index)=>(


                            <div

                                key={index}

                                className={
                                    `faq__item ${
                                        ativo === index
                                        ? "active"
                                        : ""
                                    }`
                                }

                            >



                                <button

                                    className="faq__button"

                                    onClick={()=>
                                        setAtivo(
                                            ativo === index
                                            ? -1
                                            : index
                                        )
                                    }

                                >



                                    <div className="faq__left">



                                        <div className="faq__number">


                                            {

                                                (index + 1)

                                                .toString()

                                                .padStart(2,"0")

                                            }


                                        </div>




                                        <h3>

                                            {item.titulo}

                                        </h3>



                                    </div>





                                    <span>


                                        {

                                            ativo === index

                                            ? "−"

                                            : "+"

                                        }


                                    </span>




                                </button>






                                {

                                    ativo === index && (


                                        <div className="faq__answer">


                                            <p>

                                                {item.resposta}

                                            </p>


                                        </div>


                                    )

                                }





                            </div>



                        ))}





                    </div>

                    <aside className="faq__sidebar">



                        <div className="faq__card">



                            <h3>
                                Outra dúvida?
                            </h3>



                            <h4>
                                A gente te ajuda.
                            </h4>



                            <p>

                                Compromisso não é diferencial, é padrão.
                                Na Alme entregamos o que prometemos.

                            </p>





                            <div className="faq__contatos">





                                <a

                                    href="https://wa.me/5511944956944"

                                    target="_blank"

                                    rel="noopener noreferrer"

                                >



                                    <img 
                                        src={whatsapp}
                                        alt="WhatsApp"
                                    />



                                    <div>

                                        <strong>
                                            WhatsApp
                                        </strong>


                                        <span>
                                            11 9657-4365
                                        </span>


                                    </div>



                                </a>







                                <a

                                    href="https://www.instagram.com/alme.marcenaria/"

                                    target="_blank"

                                    rel="noopener noreferrer"

                                >



                                    <img
                                        src={instagram}
                                        alt="Instagram"
                                    />



                                    <div>


                                        <strong>
                                            Instagram
                                        </strong>


                                        <span>
                                            @alme.marcenaria
                                        </span>


                                    </div>



                                </a>








                                <a

                                    href="mailto:marketing@almemarcenaria.com.br"

                                >



                                    <img
                                        src={gmail}
                                        alt="E-mail"
                                    />



                                    <div>


                                        <strong>
                                            E-mail
                                        </strong>


                                        <span>
                                            marketing@almemarcenaria.com.br
                                        </span>


                                    </div>



                                </a>





                            </div>



                        </div>









                        <div className="faq__manual">



                            <div className="faq__manual-icon">


                                <img

                                    src={pdf}

                                    alt="Manual"

                                />


                            </div>





                            <div className="faq__manual-content">



                                <h4>

                                    Ainda tem dúvidas em como cuidar do seu móvel?

                                </h4>




                                <p>

                                    Registre-se e tenha acesso ao nosso manual
                                    de preservação.

                                </p>





                                <button

                                    onClick={abrirModal}

                                >

                                    BAIXE AGORA

                                </button>





                            </div>




                        </div>




                    </aside>



                </div>



 </div>
            {
modalAberto && (

    <div
        className="modal-download-overlay"
        onClick={fecharModal}
    >

        <div
            className="modal-download"
            onClick={(e)=>e.stopPropagation()}
        >


                            <button

                                className="modal-download-close"

                                onClick={fecharModal}

                            >

                                ×

                            </button>





                            <h2>

                                Baixe seu manual gratuito

                            </h2>





                            <p>

                                Preencha seus dados para receber o manual
                                de preservação dos seus móveis.

                            </p>





                            <div className="modal-download-form">





                                <input

                                    type="text"

                                    name="nome_completo"

                                    placeholder="Nome completo"

                                    value={form.nome_completo}

                                    onChange={alterarCampo}

                                />







                                <input

                                    type="text"

                                    name="numero"

                                    placeholder="WhatsApp"

                                    value={form.numero}

                                    onChange={alterarCampo}

                                />








                                <input

                                    type="text"

                                    name="instagram_profissional"

                                    placeholder="Instagram profissional"

                                    value={form.instagram_profissional}

                                    onChange={alterarCampo}

                                />









                                <select

                                    name="area_de_atuacao"

                                    value={form.area_de_atuacao}

                                    onChange={alterarCampo}

                                >


                                    <option value="">

                                        Área de atuação

                                    </option>


                                    <option value="Designer de interiores">

                                        Designer de interiores

                                    </option>



                                    <option value="Arquiteto(a)">

                                        Arquiteto(a)

                                    </option>




                                    <option value="Engenheiro(a)">

                                        Engenheiro(a)

                                    </option>




                                    <option value="Construtor civil">

                                        Construtor civil

                                    </option>




                                    <option value="Outro">

                                        Outro

                                    </option>



                                </select>







                                <button

                                    className="modal-download-submit"

                                    onClick={cadastrarBaixar}

                                    disabled={loading}

                                >


                                    {

                                        loading

                                        ? "CADASTRANDO..."

                                        : "CADASTRAR E BAIXAR"

                                    }



                                </button>






                            </div>






                        </div>



                    </div>

                )
            }




        </section>

    );


}


export default Campo;
