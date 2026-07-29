import "./Footer.scss";

import logo from "../../imgs/logoamarela.png";

import { useTranslation } from "react-i18next";


function Footer() {

    const { t } = useTranslation();


    return (
        <footer className="footer">


            <div className="footer__container">


                <div className="footer__brand">


                    <div className="footer__logo">


                        <img 
                            src={logo} 
                            alt="ALME Marcenaria" 
                        />


                        <div className="footer__logoText">

                            <h2>ALME</h2>

                            <span>MARCENARIA</span>

                        </div>


                    </div>



                    <p>
                        {t("footer.description")}
                    </p>



                    <a href="/Sobre">

                        {t("footer.aboutButton")}

                        <span>→</span>

                    </a>


                </div>





                <div className="footer__column">


                    <h4>
                        {t("footer.navigation")}
                    </h4>


                    <a href="/">
                        {t("menu.home")}
                    </a>


                    <a href="/Sobre">
                        {t("menu.about")}
                    </a>


                    <a href="/projetos">
                        {t("menu.projects")}
                    </a>


                    <a href="/contato">
                        {t("menu.contact")}
                    </a>


                    <a href="/login">
                        {t("footer.admin")}
                    </a>


                </div>





                <div className="footer__column">


                    <h4>
                        {t("footer.information")}
                    </h4>



                    <a href="/duvidas">
                        {t("menu.faq")}
                    </a>


                    <a href="/eua">
                        {t("menu.areas")}
                    </a>


                    <a href="/marceneiro">
                        {t("menu.partner")}
                    </a>


                    <a href="/newsu">
                        {t("menu.news")}
                    </a>


                </div>





                <div className="footer__column">


                    <h4>
                        {t("footer.channels")}
                    </h4>



                    <p>
                        {t("footer.hours1")}
                    </p>


                    <p>
                        {t("footer.hours2")}
                    </p>


                    <p>
                        {t("footer.hours3")}
                    </p>



                    <p>
                        {t("footer.address")}
                    </p>


                </div>





                <div className="footer__column">


                    <h4>
                        {t("footer.links")}
                    </h4>



                    <a href="https://wa.me/5511944956944">
                        WhatsApp
                    </a>


                    <a href="https://www.instagram.com/alme.marcenaria/">
                        Instagram
                    </a>


                    <a href="mailto:marketing@almemarcenaria.com.br">
                        E-mail
                    </a>


                    <a href="https://www.tiktok.com/@alme.marcenaria">
                        TikTok
                    </a>


                    <a href="https://br.pinterest.com/Alme_Marcenaria/">
                        Pinterest
                    </a>


                </div>


            </div>





            <div className="footer__copy">

                {t("footer.copy")}

            </div>


        </footer>
    );
}


export default Footer;
