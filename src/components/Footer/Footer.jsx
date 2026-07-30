import "./Footer.scss";

import logo from "../../imgs/logoamarela.png";

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

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

                    <Link to="/Sobre">

                        {t("footer.aboutButton")}

                        <span>→</span>

                    </Link>

                </div>

                <div className="footer__column">

                    <h4>
                        {t("footer.navigation")}
                    </h4>

                    <Link to="/">
                        {t("menu.home")}
                    </Link>

                    <Link to="/Sobre">
                        {t("menu.about")}
                    </Link>

                    <Link to="/projetos">
                        {t("menu.projects")}
                    </Link>

                    <Link to="/contato">
                        {t("menu.contact")}
                    </Link>

                    <Link to="/login">
                        {t("footer.admin")}
                    </Link>

                </div>

                <div className="footer__column">

                    <h4>
                        {t("footer.information")}
                    </h4>

                    <Link to="/duvidas">
                        {t("menu.faq")}
                    </Link>

                    <Link to="/eua">
                        {t("menu.areas")}
                    </Link>

                    <Link to="/marceneiro">
                        {t("menu.partner")}
                    </Link>

                    <Link to="/newsu">
                        {t("menu.news")}
                    </Link>

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

                    <a
                        href="https://wa.me/5511944956944"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        WhatsApp
                    </a>

                    <a
                        href="https://www.instagram.com/alme.marcenaria/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Instagram
                    </a>

                    <a href="mailto:marketing@almemarcenaria.com.br">
                        E-mail
                    </a>

                    <a
                        href="https://www.tiktok.com/@alme.marcenaria"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        TikTok
                    </a>

                    <a
                        href="https://br.pinterest.com/Alme_Marcenaria/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
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
