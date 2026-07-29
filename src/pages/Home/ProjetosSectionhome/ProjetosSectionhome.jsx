import "./ProjetosSectionHome.scss";

import fotoCasa from "../../../imgs/fotocasahome.png";

import { HiArrowRight } from "react-icons/hi";

import { useNavigate } from "react-router-dom";

import { useTranslation } from "react-i18next";


function ProjetosSectionHome() {

    const navigate = useNavigate();

    const { t } = useTranslation();


    return (

        <section className="projetos-home">


            <img
                src={fotoCasa}
                alt="Projeto"
                className="projetos-home__image"
            />


            <div className="projetos-home__overlay"></div>



            <div className="projetos-home__content">


                <h2>
                    {t("projectsHome.title")}
                </h2>



                <p>
                    {t("projectsHome.description")}
                </p>



                <span>
                    {t("projectsHome.tag")}
                </span>



                <button
                    onClick={() => navigate("/Projetos")}
                >

                    {t("projectsHome.button")}

                    <HiArrowRight />

                </button>


            </div>


        </section>

    );

}


export default ProjetosSectionHome;
