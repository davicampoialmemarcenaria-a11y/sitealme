import "./StatsSection.scss";

import { useTranslation } from "react-i18next";

import logo from "../../../imgs/logoamarela.png";
import planeta from "../../../imgs/planeta.png";
import quadrado from "../../../imgs/quadrado.png";
import atom from "../../../imgs/atom.png";


function StatsSection() {

    const { t } = useTranslation();


    return (

        <section className="stats">

            <div className="stats__container">


                <div className="stats__item">

                    <img
                        src={logo}
                        alt="Logo"
                        className="stats__icon"
                    />

                    <div>

                        <h2>+ 500</h2>

                        <p>
                            {t("stats.projects")}
                        </p>

                    </div>

                </div>



                <div className="stats__divider"></div>



                <div className="stats__item">

                    <img
                        src={planeta}
                        alt="Planeta"
                        className="stats__icon stats__icon--planet"
                    />


                    <div>

                        <h2>2</h2>

                        <p>
                            {t("stats.countries")}
                        </p>

                    </div>

                </div>



                <div className="stats__divider"></div>



                <div className="stats__item">

                    <img
                        src={quadrado}
                        alt="Quadrado"
                        className="stats__icon"
                    />


                    <div>

                        <h2>6</h2>

                        <p>
                            {t("stats.years")}
                        </p>

                    </div>

                </div>



                <div className="stats__divider"></div>



                <div className="stats__item">

                    <img
                        src={atom}
                        alt="Átomo"
                        className="stats__icon"
                    />


                    <div>

                        <p>
                            {t("stats.phrase")}
                        </p>

                    </div>

                </div>


            </div>

        </section>

    );

}


export default StatsSection;
