import "./HeroSobre.scss";
import Navbar from "../../../components/Navbar/Navbar";
import { useTranslation } from "react-i18next";

function HeroSobre() {

    const { t } = useTranslation();

    return (
        <section className="hero-sobre">

            <div className="hero-sobre__bg"></div>

            <div className="hero-sobre__overlay"></div>

            <Navbar />

            <div className="hero__content">

                <h1>
                    {t("aboutHero.title")}
                </h1>

                <p>
                    {t("aboutHero.description")}
                </p>

            </div>

        </section>
    );
}

export default HeroSobre;
