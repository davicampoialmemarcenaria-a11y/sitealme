import "./Ambiente.scss";

import sala from "../../../imgs/sala.png";

export default function Ambiente() {
    return (
        <section className="ambiente">

            <div className="ambiente__container">

                <div className="ambiente__image">

                    <img
                        src={sala}
                        alt="Ambiente planejado"
                    />

                </div>

                <div className="ambiente__content">

                    <h2>Nossos princípios</h2>

                    <p>
                        Compromisso não é diferencial, é padrão.
                        Na Alme, entregamos o que prometemos,
                        com a qualidade que o seu projeto exige
                        e o cuidado com quem vai viver naquele
                        espaço merece.
                    </p>

                </div>

            </div>

        </section>
    );
}