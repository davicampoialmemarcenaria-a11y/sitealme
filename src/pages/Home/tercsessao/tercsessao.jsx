import "./TercSessao.scss";

import clips from "../../../imgs/clips.png";
import globo from "../../../imgs/globo.png";
import furo from "../../../imgs/furo.png";
import luz from "../../../imgs/luz.png";
import raio from "../../../imgs/raio.png";
import bolas from "../../../imgs/bolas.png";

import seta from "../../../imgs/seta.png";

import { useTranslation } from "react-i18next";


function ProcessSection() {

    const { t } = useTranslation();

    return (
        <section className="process">

            <div className="process__container">

                <div className="process__flow">


                    <div className="process__row">


                        <div className="process__card">

                            <img src={clips} alt="" />

                            <h3>
                                {t("process.step1.title")}
                            </h3>

                            <p>
                                {t("process.step1.text")}
                            </p>

                        </div>


                        <div className="process__arrow">
                            <img src={seta} alt="" />
                        </div>


                        <div className="process__card">

                            <img src={globo} alt="" />

                            <h3>
                                {t("process.step2.title")}
                            </h3>

                            <p>
                                {t("process.step2.text")}
                            </p>

                        </div>


                        <div className="process__arrow">
                            <img src={seta} alt="" />
                        </div>


                        <div className="process__card">

                            <img src={furo} alt="" />

                            <h3>
                                {t("process.step3.title")}
                            </h3>

                            <p>
                                {t("process.step3.text")}
                            </p>

                        </div>


                    </div>



                    <div className="process__mobile-arrow">

                        <img src={seta} alt="" />

                    </div>




                    <div className="process__row process__row--bottom">


                        <div className="process__card">

                            <img src={luz} alt="" />

                            <h3>
                                {t("process.step4.title")}
                            </h3>

                            <p>
                                {t("process.step4.text")}
                            </p>

                        </div>



                        <div className="process__arrow process__arrow--left">

                            <img src={seta} alt="" />

                        </div>



                        <div className="process__card">

                            <img src={raio} alt="" />

                            <h3>
                                {t("process.step5.title")}
                            </h3>

                            <p>
                                {t("process.step5.text")}
                            </p>

                        </div>



                        <div className="process__arrow process__arrow--left">

                            <img src={seta} alt="" />

                        </div>



                        <div className="process__card">

                            <img src={bolas} alt="" />

                            <h3>
                                {t("process.step6.title")}
                            </h3>

                            <p>
                                {t("process.step6.text")}
                            </p>

                        </div>


                    </div>


                </div>



                <div className="process__text">

                    <h2>
                        {t("process.title")}
                        <br />
                    </h2>


                    <span>
                        {t("process.subtitle")}
                    </span>


                </div>


            </div>


        </section>
    );

}

export default ProcessSection;
