import "./ExperienceSection.scss";

import { useTranslation } from "react-i18next";

import vaso from "../../../imgs/vaso.png";


const items = [
    {
        key: "experience.item1"
    },
    {
        key: "experience.item2"
    },
    {
        key: "experience.item3"
    },
    {
        key: "experience.item4"
    }
];


function ExperienceSection() {

    const { t } = useTranslation();


    return (

        <section className="experience">

            <div className="experience__content">


                <div className="experience__left">

                    <h2>

                        {t("experience.title")}

                        <br />

                        {t("experience.title2")}

                    </h2>


                    <span>

                        {t("experience.subtitle")}

                    </span>

                </div>



                <div className="experience__right">


                    {items.map((item) => (

                        <div
                            key={item.key}
                            className="experience__item"
                        >

                            <h3>

                                {t(`${item.key}.title`)}

                            </h3>


                            <p>

                                {t(`${item.key}.text`)}

                            </p>


                        </div>

                    ))}


                </div>


            </div>


            <img

                src={vaso}

                alt="Móvel decorativo"

                className="experience__image"

            />


        </section>

    );

}


export default ExperienceSection;
