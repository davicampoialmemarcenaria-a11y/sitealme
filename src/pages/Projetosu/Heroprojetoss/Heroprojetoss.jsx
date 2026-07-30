import "./Heroprojetoss.scss";
import Navbar from "../../../components/Navbar/Navbar";
import { useTranslation } from "react-i18next";


function Heroprojetoss() {


    const { t } = useTranslation();



    return (

        <section className="hero-projetoss">


            <div className="hero-projetoss__bg"></div>


            <div className="hero-projetoss__overlay"></div>


            <Navbar />



            <div className="hero-projetoss__content">


                <h1>

                    {t("projectsHero.title1")}

                    <br />

                    {t("projectsHero.title2")}

                </h1>



                <p>

                    {t("projectsHero.description")}

                </p>



            </div>


        </section>

    );

}


export default Heroprojetoss;
