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

                    <h2>Como criamos nossos projetos?</h2>

                    <p>
                            Nossa equipe de projetistas utiliza o PROMOB, que é um software específico de marcenaria para o  
desenvolvimento dos projetos e o PROMOB CUT, um software específico para quantificação de  
materiais e planos de corte. 
                    </p>

                </div>

            </div>

        </section>
    );
}