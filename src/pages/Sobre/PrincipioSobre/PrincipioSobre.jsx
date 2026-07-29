import "./PrincipioSobre.scss";

import user from "../../../imgs/user.png";
import estrela from "../../../imgs/estrela.png";
import vital from "../../../imgs/vital.png";
import barras from "../../../imgs/barras.png";

import { useTranslation } from "react-i18next";


const principios = [
  {
    key: "excellence",
    icon: user,
  },
  {
    key: "commitment",
    icon: estrela,
  },
  {
    key: "evolution",
    icon: vital,
  },
  {
    key: "perennity",
    icon: barras,
  },
];


export default function PrincipioSobre() {

  const { t } = useTranslation();


  return (

    <section className="principioSobre">


      <div className="topo">


        <div className="quemSomos">

          <div className="linha"></div>

          <span>
            {t("principles.tag")}
          </span>

          <div className="linha"></div>

        </div>



        <h2>
          {t("principles.title")}
        </h2>


      </div>



      <div className="cards">


        {principios.map((item) => (

          <div
            className="principio-card"
            key={item.key}
          >


            <div className="titulo">


              <img
                src={item.icon}
                alt={t(`principles.${item.key}.title`)}
              />


              <h3>
                {t(`principles.${item.key}.title`)}
              </h3>


            </div>


            <p>
              {t(`principles.${item.key}.text`)}
            </p>


          </div>

        ))}


      </div>


    </section>

  );

}
