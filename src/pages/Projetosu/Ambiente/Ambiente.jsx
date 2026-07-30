import "./Ambiente.scss";

import sala from "../../../imgs/sala.png";

import { useTranslation } from "react-i18next";


export default function Ambiente() {

    const { t } = useTranslation();


    return (
        <section className="ambiente">

            <div className="ambiente__container">

                <div className="ambiente__image">

                    <img
                        src={sala}
                        alt="Ambiente planejado"
                    />

                </div>


                <div className="ambiente__content">

                    <h2>
                        {t("environment.title")}
                    </h2>


                    <p>
                        {t("environment.text")}
                    </p>


                </div>

            </div>

        </section>
    );
}
