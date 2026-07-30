import "./Formanewsu.scss";
import forma from "../../../imgs/forma.png";
import { useTranslation } from "react-i18next";


export default function Formanewsu() {


    const { t } = useTranslation();


    return (
        <section className="formanewsu">


            <div className="formanewsu__container">


                <div className="formanewsu__text">


                    <h2>

                        {t("newsSection.title")}

                    </h2>



                    <h3>

                        {t("newsSection.subtitle")}

                    </h3>



                    <div className="linha"></div>



                    <p>

                        {t("newsSection.description")}

                    </p>


                </div>




                <div className="formanewsu__img">


                    <img 
                        src={forma} 
                        alt={t("newsSection.imageAlt")}
                    />


                </div>


            </div>


        </section>
    );

}
