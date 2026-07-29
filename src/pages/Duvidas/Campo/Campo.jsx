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
        titulo: "Como funciona a garantia Alme?",
        resposta:
            "Na Alme, fornecemos garantia de 5 anos para a estrutura dos móveis, contados a partir da data de conclusão da instalação, e 1 ano para as ferragens, incluindo dobradiças, corrediças, pistões, sistemas deslizantes e demais componentes metálicos ou mecânicos. Todas essas informações estão descritas em nosso contrato, que é assinado após a aprovação do orçamento e formalização da contratação."
    },

    {
        titulo: "Qual a diferença entre MDF e MDP?",
        resposta:
             (
    <>
      <p>
        MDF (Medium Density Fiberboard) e MDP (Medium Density Particleboard)
        são materiais derivados da madeira, com composições e aplicações
        distintas dentro da fabricação de móveis.
      </p>

      <p>
        O MDF é produzido a partir de fibras de madeira compactadas com
        resinas, formando uma chapa mais uniforme, indicada para peças que
        exigem usinagens, detalhes e acabamentos diferenciados.
      </p>

      <p>
        O MDP é produzido a partir de partículas de madeira compactadas em
        camadas com resinas, sendo aplicado principalmente em componentes
        estruturais e de montagem dos móveis.
      </p>

      <p>
        A escolha entre MDF e MDP não está relacionada à superioridade de um
        material, mas sim à aplicação, ao processo de fabricação e às
        necessidades específicas de cada projeto. A definição do material é
        realizada conforme as características e necessidades de cada projeto.
      </p>
    </>
  ),
    },

    {
        titulo: "Como funciona o processo da Alme?",
        resposta:    (
    <>
           <p> A Alme foi estruturada com uma base sólida de processos bem definidos e replicáveis, permitindo que nossas entregas mantenham os mesmos padrões de qualidade e excelência do início ao fim de cada etapa.
Todas as informações são registradas em nossos sistemas, garantindo maior rastreabilidade dos processos e facilitando análises sempre que necessário. Dessa forma, o time possui acesso às informações de maneira ágil e organizada, contribuindo para uma execução mais eficiente em todas as etapas do projeto.</p>

<p>Todas as informações são registradas em nossos sistemas, garantindo maior rastreabilidade dos processos e facilitando análises sempre que necessário. Dessa forma, o time possui acesso às informações de maneira ágil e organizada, contribuindo para uma execução mais eficiente em todas as etapas do projeto.</p>
</>),
    },

    {
        titulo: "A Alme faz instalação?",
        resposta:
            "Sim, a Alme trabalha com instalação em todos os seus projetos nacionais. As instalações são acompanhadas pelo RDO alocado ao projeto, que realiza todo o acompanhamento da obra, formalizando documentos e assegurando o cumprimento dos padrões de qualidade do projeto."
    },

    {
        titulo: "Como funcionam os cronogramas?",
        resposta:
            ( <>
            
            <p>Os cronogramas são formalizados por e-mail todas as sextas-feiras, com o objetivo de garantir transparência no processo e assegurar uma gestão de prazos clara e eficiente.</p>

            <p>Encaminhados aos profissionais responsáveis pelo projeto e/ou aos clientes, os cronogramas contemplam todas as etapas da obra, incluindo as datas previstas para aquisição de materiais, produção, início e conclusão da instalação, bem como eventuais fatores que possam impactar o andamento do projeto. Dessa forma, todas as partes envolvidas permanecem informadas sobre o progresso da obra e sobre quaisquer atualizações relevantes ao longo de sua execução.</p>
            
            
            
            </>),
    },

    {
        titulo: "Qual tipo de ferragem utilizamos?",
        resposta:
            "Como padrão para ferragens, utilizamos corrediças e dobradiças da Hafele, priorizando o uso de corrediças ocultas devido ao seu melhor desempenho, acabamento e funcionalidade. Para os demais componentes de ferragens, também adotamos produtos da Rometal, garantindo qualidade, durabilidade e confiabilidade em nossos projetos."
    },

    {
        titulo: "Como solicitar e qual o prazo para um orçamento?",
        resposta:
            (<>
            <p>Entre em contato com o time comercial pelo WhatsApp. Em até 48 horas úteis, seu orçamento será enviado.</p> <p>
Além disso, quanto mais informações forem fornecidas ao time comercial no momento da solicitação, mais assertivo será o orçamento. Caso seja necessário, nosso time poderá solicitar informações complementares para aumentar a precisão do orçamento.
</p>
            
            
            
            
            </>),
    },

    {
        titulo: "Como funciona a aprovação do projeto antes da fabricação?",
        resposta:
            "Após a assinatura do contrato, iniciamos a etapa de desenvolvimento e alinhamento do projeto. Durante esse processo, os projetos são apresentados ao cliente e ao profissional responsável para análise e aprovação. Além disso, realizamos visitas técnicas à obra para conferir e validar todas as medidas. Esses processos foram desenhados buscando cercar ao máximo as possíveis intercorrências para que possamos iniciar a produção de forma mais assertiva possível."
    },

    {
        titulo: "Como funciona o acompanhamento de projeto após a entrega?",
        resposta:
            (<>
            <p>A visita de vistoria é agendada no momento da finalização da instalação, uma vez que, após o início do uso e com a acomodação dos itens armazenados dentro dos armários, podem ser necessários alguns ajustes.</p><p>
Mesmo após essa etapa, a Alme disponibiliza um canal de assistência técnica que permanece disponível. Assim, sempre que houver alguma necessidade, o cliente pode realizar a solicitação, enviando fotos e informações sobre o ocorrido. O chamado é direcionado diretamente ao nosso sistema, permitindo a análise e o direcionamento de uma equipe para solucionar a demanda.
</p>
            
            
            
            </>),
    },

    {
        titulo: "A Alme trabalha com laca e lâmina de madeira natural?",
        resposta:
           (<>
           <p>Sim. A Alme possui flexibilidade em relação aos materiais utilizados, incluindo acabamentos em laca e lâmina de madeira natural. Cada projeto é analisado individualmente, considerando os aspectos técnicos, a viabilidade de execução e a mão de obra especializada necessária para cada tipo de material, buscando sempre a melhor solução para cada cliente.</p><p>
Além da marcenaria, quando previsto no projeto, também podemos incluir no orçamento e entregar outros elementos complementares, como vidraçaria, serralheria, tapeçaria e soluções de LED e iluminação. A inclusão desses itens é avaliada caso a caso, de acordo com a complexidade e as características de cada projeto.
</p>
           
           
           
           
           
           </>),
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
                        ESCLARECENDO DÚVIDAS
                    </span>



                    <h2>
                        Perguntas frequentes
                    </h2>



                    <p>

                     Tem alguma dúvida? Confira as perguntas recorrentes e encontre a resposta que procura.

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

                                Cada projeto possui características próprias e teremos prazer em orientar a melhor solução para sua necessidade.
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
