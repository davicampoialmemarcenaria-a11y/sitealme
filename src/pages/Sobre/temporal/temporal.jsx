import { useState } from "react";
import { useTranslation } from "react-i18next";

import "./Temporal.scss";

// Imagens
import foto2020 from "../../../imgs/2020.jpg";
import foto2022 from "../../../imgs/2022.jpg";
import foto2024 from "../../../imgs/2024.jpg";
import foto2025 from "../../../imgs/2025.jpg";
import fotoHoje from "../../../imgs/hoje.jpg";


const timeline = [
  {
    year: "2020",
    image: foto2020,
    key: "2020"
  },
  {
    year: "2022",
    image: foto2022,
    key: "2022"
  },
  {
    year: "2024",
    image: foto2024,
    key: "2024"
  },
  {
    year: "2025",
    image: foto2025,
    key: "2025"
  },
  {
    year: "2026",
    image: fotoHoje,
    key: "2026"
  }
];


function Temporal() {

  const [active, setActive] = useState(0);

  const { t } = useTranslation();


  return (

    <section className="temporal">


      <div className="temporal__container">


        {/* ESQUERDA */}

        <div className="temporal__left">


          <span className="temporal__tag">
            {t("timeline.tag")}
          </span>



          <h2>

            {t("timeline.title1")}
            <br />
            {t("timeline.title2")}
            <br />
            {t("timeline.title3")}

          </h2>



          <p>
            {t("timeline.description1")}
          </p>


          <p>
            {t("timeline.description2")}
          </p>


        </div>



        {/* DIREITA */}

        <div className="temporal__right">


          {/* TIMELINE */}

          <div className="temporal__timeline">


            {timeline.map((item, index) => (


              <div
                className="temporal__item"
                key={item.year}
              >


                <div

                  className="temporal__marker"

                  onMouseEnter={() => setActive(index)}

                  onClick={() => setActive(index)}

                >


                  <div

                    className={`temporal__circle ${
                      active === index ? "active" : ""
                    }`}

                  />


                </div>



                <span

                  className={`temporal__year ${
                    active === index ? "active" : ""
                  }`}

                >

                  {item.year}

                </span>


              </div>


            ))}


          </div>



          {/* CARD */}


          <div
            className="temporal__card"
            key={active}
          >


            <div className="temporal__cardArrow"></div>



            <img

              src={timeline[active].image}

              alt={timeline[active].year}

            />



            <div className="temporal__cardContent">


              <p>

                {t(
                  `timeline.years.${timeline[active].key}`
                )}

              </p>


            </div>


          </div>



        </div>


      </div>


    </section>


  );

}


export default Temporal;
