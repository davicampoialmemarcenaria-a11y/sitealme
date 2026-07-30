import "./Marceneiro.scss";

import Navbar from "../../components/Navbar/Navbar";
import fundo from "../../imgs/fundoma.png";
import Footer from "../../components/Footer/Footer";

import { useTranslation } from "react-i18next";


export default function Marceneiro() {


  const { t } = useTranslation();


  return (
    <>


      <section
        className="marceneiro-hero"
        style={{ backgroundImage: `url(${fundo})` }}
      >


        <div className="overlay"></div>


        <Navbar />



        <div className="marceneiro-hero-content">


          <div></div>


          <div className="texto">


            <h1>

              {t("marceneiroHero.title")}

            </h1>



            <p>

              {t("marceneiroHero.description")}

            </p>


          </div>


        </div>





        <div className="formulario-wrapper-marceneiro">


          <div className="formulario">


            <iframe

              src="https://app.pipefy.com/public/form/PPeFD_qA"

              title={t("marceneiro.formTitle")}

              loading="lazy"

            />


          </div>


        </div>



      </section>





      <section className="marceneiro-conteudo">


        <div className="conteudo">


          <div></div>



          <div className="sobre">


            <h2>

              {t("marceneiroSection.title")}

            </h2>



            <p>

              {t("marceneiroSection.text")}

            </p>



          </div>



        </div>


      </section>




      <Footer />


    </>

  );


}
