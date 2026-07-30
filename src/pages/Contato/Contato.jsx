import "./Contato.scss";

import fundo from "../../imgs/herocont.png";
import logo from "../../imgs/passarobranco.png";
import whats from "../../imgs/whats.png";

import Navbar from "../../components/Navbar/navbar";
import Footer from "../../components/Footer/Footer";

import { useTranslation } from "react-i18next";

export default function Contato() {

    const { t } = useTranslation();

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
                            {t("contact.title1")}
                            <br />
                            {t("contact.title2")}
                            <br />
                            {t("contact.title3")}
                        </h1>

                        <div className="linha"></div>

                        <p>
                            {t("contact.description")}
                        </p>

                    </div>

                    {/* CARD */}

                    <div className="contato__card">

                        <div className="card__texto">

                            <h2>
                                {t("contact.cardTitle")}
                            </h2>

                            <p>
                                {t("contact.cardDescription")}
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
                                {t("contact.cardInfo")}
                            </span>

                            <button onClick={abrirWhatsapp}>

                                <img
                                    src={whats}
                                    alt="WhatsApp"
                                />

                                {t("contact.button")}

                            </button>

                        </div>

                    </div>

                </div>

            </section>

            <Footer />

        </>
    );

}
