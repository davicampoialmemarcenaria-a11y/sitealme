import "./Leipro.scss";

import almadeira from "../../../imgs/almadeira.png";

import { useTranslation } from "react-i18next";


export default function Leipro() {


    const { t } = useTranslation();



    return (

        <section className="lei-projeto">


            <div className="lei-projeto__container">


                <div className="lei-projeto__content">


                    <h2>

                        {t("projectLaw.title")}

                    </h2>



                    <p>


                        {t("projectLaw.text")}


                        <br />
                        <br />


                        {t("projectLaw.item1")}


                        <br />
                        <br />


                        {t("projectLaw.item2")}


                        <br />
                        <br />


                        {t("projectLaw.item3")}


                        <br />
                        <br />


                        {t("projectLaw.final")}


                    </p>


                </div>



                <div className="lei-projeto__image">


                    <img

                        src={almadeira}

                        alt="Madeira Alme Marcenaria"

                    />


                </div>


            </div>


        </section>

    );

}
