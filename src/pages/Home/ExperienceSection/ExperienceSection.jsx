import "./ExperienceSection.scss";
import vaso from "../../../imgs/vaso.png";

const items = [
    {
        title: "CONFORTO",
        text: "Ambientes que abraçam quem vive neles."
    },
    {
        title: "CALMARIA",
        text: "Projetos que acolhem, inspiram e trazem serenidade."
    },
    {
        title: "SOSSEGO",
        text: "Design essencial para momentos de tranquilidade."
    },
    {
        title: "FORÇA",
        text: "Resistência e beleza em cada detalhe."
    }
];

function ExperienceSection() {
    return (
        <section className="experience">

            <div className="experience__content">

                <div className="experience__left">
                    <h2>
                        Não projetamos
                        <br />
                        apenas espaços.
                    </h2>

                    <span>
                        Projetamos experiências
                    </span>
                </div>

                <div className="experience__right">

                    {items.map((item) => (
                        <div
                            key={item.title}
                            className="experience__item"
                        >
                            <h3>{item.title}</h3>
                            <p>{item.text}</p>
                        </div>
                    ))}

                </div>

            </div>

            <img
                src={vaso}
                alt="Móvel decorativo"
                className="experience__image"
            />

        </section>
    );
}

export default ExperienceSection;