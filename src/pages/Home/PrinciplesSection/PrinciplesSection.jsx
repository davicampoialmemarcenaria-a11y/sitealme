import "./PrinciplesSection.scss";

import foto from "../../../imgs/fotohomecirculo.png";

import { useTranslation } from "react-i18next";


function PrinciplesSection() {

    const { t } = useTranslation();


    const principles = [
        {
            title: t("principles.item1.title"),
            text: t("principles.item1.text")
        },
        {
            title: t("principles.item2.title"),
            text: t("principles.item2.text")
        },
        {
            title: t("principles.item3.title"),
            text: t("principles.item3.text")
        },
        {
            title: t("principles.item4.title"),
            text: t("principles.item4.text")
        },
        {
            title: t("principles.item5.title"),
            text: t("principles.item5.text")
        }
    ];


    return (
        <section className="principles">

            <div className="principles__container">


                <div className="principles__image">

                    <img src={foto} alt="" />

                </div>



                <div className="principles__content">


                    <span className="principles__subtitle">

                        {t("principles.subtitle")}

                    </span>



                    <div className="principles__list">


                        {principles.map((item, index) => (

                            <div
                                className="principles__item"
                                key={index}
                            >

                                <h3>
                                    {item.title}
                                </h3>


                                <p>
                                    {item.text}
                                </p>


                            </div>

                        ))}


                    </div>


                </div>


            </div>


        </section>
    );
}


export default PrinciplesSection;
