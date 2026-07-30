import "./HeroDuvidas.scss";

import Navbar from "../../../components/Navbar/Navbar";

import { useTranslation } from "react-i18next";

function HeroDuvidas() {

    const { t } = useTranslation();

    return (

        <section className="hero-duvidas">

            <div className="hero-duvidas__bg"></div>

            <div className="hero-duvidas__overlay"></div>

            <Navbar />

            <div className="hero-duvidas__content">

                <h1>

                    {t("faqHero.title1")}

                    <br />

                    {t("faqHero.title2")}

                </h1>

                <p>

                    {t("faqHero.description")}

                </p>

            </div>

        </section>

    );

}

export default HeroDuvidas;
