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
                            Acompanhamos todas as etapas do início ao fim,
                            garantindo organização, alinhamento e uma execução
                            fluida em cada detalhe do seu projeto.
                        </p>

                    </div>

                    {/* CARD */}

                    <div className="contato__card">

                        <div className="card__texto">

                            <h2>
                                Seu próximo projeto
                                <br />
                                começa com uma conversa
                            </h2>

                            <p>
                                Nossa equipe acompanha todas as etapas,
                                desde o primeiro atendimento até a instalação
                                final, oferecendo um processo transparente,
                                organizado e pensado para entregar exatamente
                                o resultado que você imaginou.
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
                                Fale com um de nossos especialistas
                                e receba um atendimento totalmente
                                personalizado.
                                
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