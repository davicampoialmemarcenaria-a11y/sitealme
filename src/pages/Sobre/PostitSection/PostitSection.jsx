import "./PostitSection.scss";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


const PostitSection = () => {

  const navigate = useNavigate();

  const { t } = useTranslation();


  return (

    <section className="postit-section">

      <div className="postit-section__container">


        {/* Conteúdo */}

        <div className="postit-section__content">


          <h2 className="postit-section__title">
            {t("aboutSection.title")}
          </h2>


          <p>
            {t("aboutSection.text1")}
          </p>


          <p>
            {t("aboutSection.text2")}
          </p>


          <p>
            {t("aboutSection.text3")}
          </p>


          <p>
            {t("aboutSection.text4")}
          </p>


        </div>



        {/* Card */}

        <div className="postit-section__aside">

          <div className="postit-card">


            <span className="postit-card__quote">
              “
            </span>


            <p>
              {t("aboutSection.quote1")}
            </p>


            <p>
              {t("aboutSection.quote2")}
            </p>


            <p>
              {t("aboutSection.author")}
            </p>


            <div className="postit-card__line"></div>


          </div>



          <button
            className="postit-btn"
            onClick={() => navigate("/marceneiro")}
          >

            <span>
              {t("aboutSection.button")}
            </span>

            <span>
              →
            </span>

          </button>


        </div>


      </div>


    </section>

  );

};


export default PostitSection;
