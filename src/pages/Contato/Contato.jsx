import "./Contato.scss";

import fundo from "../../imgs/herocont.png";
import logo from "../../imgs/passarobranco.png";
import whats from "../../imgs/whats.png";
import Navbar from "../../components/Navbar/navbar";
import Footer from "../../components/Footer/Footer";

export default function Contato() {

    const abrirWhatsapp = () => {
        window.open(
            "https://wa.me/5511944956944",
            "_blank"
        );
    };

    return (
        <>

            

               <section
    className="contato"
    style={{ backgroundImage: `url(${fundo})` }}
>

    <Navbar />

    <div className="contato__overlay"></div>

                <div className="contato__container">

                    {/* ESQUERDA */}

                    <div className="contato__left">

                        <h1>
                            Seu próximo
                            <br />
                            projeto começa
                            <br />
                            com uma conversa
                        </h1>

                        <div className="linha"></div>

                        <p>
                            Durante nossos processos, sempre buscamos manter nossos clientes cientes do desenvolvimento do seu projeto, sempre atualizando fotos e enviando relatórios de andamento da obra.
                        </p>

                    </div>

                    {/* CARD */}

                    <div className="contato__card">

                        <div className="card__texto">

                            <h2>
                                Faça seu orçamento conosco ou envie já seu projeto
                                
                            </h2>

                            <p>
                                Entre em contato e seja encaminhado para um atendimento pensado e feito para você com melhores opções e valores para o seu projeto. 
                            </p>

                        </div>

                        <div className="card__divider"></div>

                        <div className="card__acao">

                            <img
                                src={logo}
                                alt="Logo ALME"
                                className="logo"
                            />

                            <span>
                                Fale com um de nossos profissionais e receba um atendimento personalizado. 
                                
                            </span>
                            

                            <button onClick={abrirWhatsapp}>

                                <img
                                    src={whats}
                                    alt="WhatsApp"
                                />

                                INICIAR CONVERSA

                            </button>

                        </div>

                    </div>

                </div>
                
            </section>
<Footer />  
        </>
    );

}