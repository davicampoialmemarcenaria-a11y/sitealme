import "./Leipro.scss";

import almadeira from "../../../imgs/almadeira.png";

export default function Leipro() {
    return (
        <section className="lei-projeto">

            <div className="lei-projeto__container">

                <div className="lei-projeto__content">

                    <h2>Leis de projeto</h2>

                    <p>
                        Compromisso não é diferencial, é padrão. Na Alme,
                        entregamos o que prometemos, com a qualidade que o seu
                        projeto exige e o cuidado com quem vai viver naquele
                        espaço merece.
                    </p>

                    <p>
                        Compromisso não é diferencial, é padrão. Na Alme,
                        entregamos o que prometemos, com a qualidade que o seu
                        projeto exige e o cuidado com quem vai viver naquele
                        espaço merece.
                    </p>

                </div>

                <div className="lei-projeto__image">

                    <img
                        src={almadeira}
                        alt="Madeira Alme Marcenaria"
                    />

                </div>

            </div>

        </section>
    );
}
