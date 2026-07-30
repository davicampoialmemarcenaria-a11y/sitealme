import "./Campo.scss";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../../../services/supabase";

import whatsapp from "../../../imgs/w.png";
import instagram from "../../../imgs/i.png";
import gmail from "../../../imgs/g.png";
import pdf from "../../../imgs/p.png";


const PDF_URL =
"https://ohwnopvsuromemokbypp.supabase.co/storage/v1/object/public/manuais/Como_cuidar_do_seu_movel.pdf";



function Campo(){

const { t } = useTranslation();



const perguntas = [

{
titulo: t("faq.questions.0.title"),
resposta: t("faq.questions.0.answer")
},


{
titulo: t("faq.questions.1.title"),

resposta: (
<>
<p>{t("faq.questions.1.answer1")}</p>

<p>{t("faq.questions.1.answer2")}</p>

<p>{t("faq.questions.1.answer3")}</p>

<p>{t("faq.questions.1.answer4")}</p>
</>
)

},


{
titulo: t("faq.questions.2.title"),

resposta: (
<>
<p>{t("faq.questions.2.answer1")}</p>

<p>{t("faq.questions.2.answer2")}</p>
</>
)

},


{
titulo: t("faq.questions.3.title"),
resposta: t("faq.questions.3.answer")
},


{
titulo: t("faq.questions.4.title"),

resposta: (
<>
<p>{t("faq.questions.4.answer1")}</p>

<p>{t("faq.questions.4.answer2")}</p>
</>
)

},


{
titulo: t("faq.questions.5.title"),
resposta: t("faq.questions.5.answer")
},


{
titulo: t("faq.questions.6.title"),

resposta: (
<>
<p>{t("faq.questions.6.answer1")}</p>

<p>{t("faq.questions.6.answer2")}</p>
</>
)

},


{
titulo: t("faq.questions.7.title"),
resposta: t("faq.questions.7.answer")
},


{
titulo: t("faq.questions.8.title"),

resposta: (
<>
<p>{t("faq.questions.8.answer1")}</p>

<p>{t("faq.questions.8.answer2")}</p>
</>
)

},


{
titulo: t("faq.questions.9.title"),

resposta: (
<>
<p>{t("faq.questions.9.answer1")}</p>

<p>{t("faq.questions.9.answer2")}</p>
</>
)

}


];



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

        [e.target.name]: e.target.value

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

        alert(t("faq.alert.fill"));

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

        alert(t("faq.alert.error"));

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
{t("faq.tag")}
</span>



<h2>
{t("faq.title")}
</h2>



<p>
{t("faq.description")}
</p>



</div>





<div className="faq__content">



<div className="faq__accordion">


{
perguntas.map((item,index)=>(


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


{item.resposta}


</div>


)


}




</div>


))


}



</div>
                    <aside className="faq__sidebar">


                        <div className="faq__card">


                            <h3>
                                {t("faq.sidebar.title")}
                            </h3>


                            <h4>
                                {t("faq.sidebar.subtitle")}
                            </h4>


                            <p>
                                {t("faq.sidebar.description")}
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
                                    {t("faq.manual.title")}
                                </h4>


                                <p>
                                    {t("faq.manual.description")}
                                </p>


                                <button
                                    onClick={abrirModal}
                                >

                                    {t("faq.manual.button")}

                                </button>


                            </div>


                        </div>



                    </aside>


                </div>

            </div>





            {modalAberto && (

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
                            {t("faq.modal.title")}
                        </h2>



                        <p>
                            {t("faq.modal.description")}
                        </p>




                        <div className="modal-download-form">



                            <input
                                type="text"
                                name="nome_completo"
                                placeholder={t("faq.modal.name")}
                                value={form.nome_completo}
                                onChange={alterarCampo}
                            />



                            <input
                                type="text"
                                name="numero"
                                placeholder={t("faq.modal.whatsapp")}
                                value={form.numero}
                                onChange={alterarCampo}
                            />



                            <input
                                type="text"
                                name="instagram_profissional"
                                placeholder={t("faq.modal.instagram")}
                                value={form.instagram_profissional}
                                onChange={alterarCampo}
                            />



                            <select
                                name="area_de_atuacao"
                                value={form.area_de_atuacao}
                                onChange={alterarCampo}
                            >

                                <option value="">
                                    {t("faq.modal.area")}
                                </option>


                                <option value="Designer de interiores">
                                    {t("faq.modal.designer")}
                                </option>


                                <option value="Arquiteto(a)">
                                    {t("faq.modal.architect")}
                                </option>


                                <option value="Engenheiro(a)">
                                    {t("faq.modal.engineer")}
                                </option>


                                <option value="Construtor civil">
                                    {t("faq.modal.builder")}
                                </option>


                                <option value="Outro">
                                    {t("faq.modal.other")}
                                </option>


                            </select>





                            <button
                                className="modal-download-submit"
                                onClick={cadastrarBaixar}
                                disabled={loading}
                            >

                                {
                                    loading
                                    ? t("faq.modal.loading")
                                    : t("faq.modal.submit")
                                }

                            </button>



                        </div>


                    </div>


                </div>

            )}



        </section>

    );

}


export default Campo;
