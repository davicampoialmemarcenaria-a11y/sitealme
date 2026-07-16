import "./StatsSection.scss";

import logo from "../../../imgs/logoamarela.png";
import planeta from "../../../imgs/planeta.png";
import quadrado from "../../../imgs/quadrado.png";
import atom from "../../../imgs/atom.png";

function StatsSection() {

    return (

        <section className="stats">

            <div className="stats__container">

                <div className="stats__item">

                    <img src={logo} alt="Logo" className="stats__icon" />

                    <div>

                        <h2>+ 500</h2>

                        <p>Projetos concluídos</p>

                    </div>

                </div>

                <div className="stats__divider"></div>

                <div className="stats__item">
<img
    src={planeta}
    alt="Planeta"
    className="stats__icon stats__icon--planet"
/>
                    

                    <div>

                        <h2>2</h2>

                        <p>Países alcançados</p>

                    </div>

                </div>

                <div className="stats__divider"></div>

                <div className="stats__item">

                    <img src={quadrado} alt="Quadrado" className="stats__icon" />

                    <div>

                        <h2>6</h2>

                        <p>Anos criando experiências</p>

                    </div>

                </div>

                <div className="stats__divider"></div>

                <div className="stats__item">

                    <img src={atom} alt="Átomo" className="stats__icon" />

                    <div>

                        <p>Cada projeto inicia uma nova história.</p>

                    </div>

                </div>

            </div>

        </section>

    );

}

export default StatsSection;