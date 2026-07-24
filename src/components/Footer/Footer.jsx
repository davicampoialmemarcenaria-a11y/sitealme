import "./Footer.scss";

import logo from "../../imgs/logoamarela.png"; // sua logo

function Footer() {
    return (
        <footer className="footer">

            <div className="footer__container">

                <div className="footer__brand">

    <div className="footer__logo">

        <img src={logo} alt="ALME Marcenaria" />

        <div className="footer__logoText">
            <h2>ALME</h2>
            <span>MARCENARIA</span>
        </div>

    </div>

    <p>
        Acompanhamos todas as etapas, do início ao fim,
        garantindo organização, alinhamento e uma execução
        fluida em cada detalhe.
    </p>

    <a href="/Sobre">
        SAIBA MAIS SOBRE NOSSA HISTÓRIA
        <span>→</span>
    </a>

</div>

                <div className="footer__column">

                    <h4>NAVEGAÇÃO</h4>

                    <a href="/">Home</a>
                    <a href="/Sobre">Sobre</a>
                    <a href="/projetos">Projetos</a>
                    <a href="/contato">Contato</a>
                    <a href="/login">Área administrativa</a>
                </div>

                <div className="footer__column">

                    <h4>INFORMAÇÕES</h4>

                   
                    <a href="/duvidas">Dúvidas frequentes</a>
                    <a href="/eua">Regiões em que atendemos</a>
                     <a href="/marceneiro">Seja um homologado</a>
                      <a href="/newsu">ALME News</a>
                </div>

                <div className="footer__column">

                    <h4>CANAIS</h4>

                    <p>Seg - Qui: 07:00 - 18:00</p>

                    <p>Sex: 07:00 - 17:00</p>

                    <p>Sáb - Dom: Fechado</p>

                    <p>
                        Alameda Prof. Lucas Nogueira Garcez,
                        5220, Atibaia - SP, 12947-0
                    </p>

                </div>

                <div className="footer__column">

                    <h4>LINKS</h4>

 <a href="https://wa.me/5511944956944">WhatsApp</a>   
                    <a href="https://www.instagram.com/alme.marcenaria/">Instagram</a>
                    <a href="mailto:marketing@almemarcenaria.com.br">E-mail</a>
                    <a href="https://www.tiktok.com/@alme.marcenaria">TikTok</a>
                    <a href="https://br.pinterest.com/Alme_Marcenaria/">Pinterest</a>

                </div>

            </div>

            <div className="footer__copy">
                © 2018 ALME Marcenaria
            </div>

        </footer>
    );
}

export default Footer;