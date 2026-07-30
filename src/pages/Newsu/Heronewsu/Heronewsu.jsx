import "./Heronewsu.scss";
import Navbar from "../../../components/Navbar/Navbar";
import { useTranslation } from "react-i18next";


function Heronewsu() {


    const { t } = useTranslation();


    return (
        <section className="hero-duvidas">


            <div className="hero-news__bg"></div>

            <div className="hero-duvidas__overlay"></div>


            <Navbar />


            <div className="hero-duvidas__content">


                <h1>

                    {t("newsHero.title")}

                </h1>



                <p>

                    {t("newsHero.description")}

                </p>


            </div>


        </section>
    );

}

export default Heronewsu;
