import "./BotaoJunto.scss";

import logo from "../../../imgs/logoamarela.png";

import { useTranslation } from "react-i18next";


const BotaoJunto = () => {

    const { t } = useTranslation();


    return (

        <section className="botao-junto">

            <div className="conteudo">

                <div className="lado-esquerdo">

                    <img
                        src={logo}
                        alt="Logo Alme"
                        className="logo"
                    />


                    <div className="textos">

                        <h2>
                            {t("together.title")}
                        </h2>


                        <p>
                            {t("together.description")}
                        </p>

                    </div>

                </div>



                <a
                    href="/projetos"
                    className="btn-projetos"
                >

                    <span>
                        {t("together.button")}
                    </span>


                    <span className="seta">
                        →
                    </span>

                </a>


            </div>

        </section>

    );

};


export default BotaoJunto;
