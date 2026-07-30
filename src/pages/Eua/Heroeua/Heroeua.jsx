import "./Heroeua.scss";

import Navbar from "../../../components/Navbar/Navbar";

import { useTranslation } from "react-i18next";

function Heroeua() {

    const { t } = useTranslation();

    return (

        <section className="hero-eua">

            <div className="hero-eua__bg"></div>

            <div className="hero-eua__overlay"></div>

            <Navbar />

            <div className="hero-eua__content">

                <h1>
                    {t("usaHero.title1")}
                    <br />
                    {t("usaHero.title2")}
                    <br />
                    {t("usaHero.title3")}
                </h1>

                <div className="hero-eua__line"></div>

                <p>
                    {t("usaHero.description")}
                </p>

            </div>

        </section>

    );

}

export default Heroeua;
