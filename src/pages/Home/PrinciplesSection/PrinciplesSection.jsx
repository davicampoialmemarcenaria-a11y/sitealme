import "./PrinciplesSection.scss";

import foto from "../../../imgs/fotohomecirculo.png"; 

const principles = [
    {
        title: "Qualidade no que desempenhamos",
        text: "Entendemos que cada ação realizada, por mais básica que pareça, precisa receber o máximo de empenho e qualidade que podemos entregar"
    },
    {
        title: "Compromisso com a palavra",
        text: "Compromisso com a palavra é honrar o que falamos em qualquer situação. Mesmo quando algo foge do nosso controle, devemos reconhecer o impacto e buscar compensar, fazendo o possível para cumprir o que foi prometido utilizando materiais de alta qualidade, escolhidos para valorizar a estética, a durabilidade e o resultado final do projeto."
    },
    {
        title: "Crescimento aos que nos acompanham",
        text: "Acreditamos que uma empresa próspera e perene é aquela onde todos crescem juntos. Nosso desenvolvimento deve gerar valor para o time, clientes, fornecedores, parceiros e todos que fazem parte da nossa jornada."
    },
    {
        title: "Excelência na experiência",
        text: "Devemos sempre manter o respeito, a cordialidade e entender que cada interação deve transmitir excelência. Agindo com prudência, comprometimento e empenho em cada projeto, transformamos a experiência de nossos clientes em um padrão de qualidade e confiança."},
    {
        title: "Pensamento de longo prazo",
        text: "O pensamento de longo prazo guia nossas decisões, fazendo com que, o hoje, seja construído não apenas pensando no presente, mas no futuro que iremos alcançar."
    }
];

function PrinciplesSection() {
    return (
        <section className="principles">

            <div className="principles__container">

                <div className="principles__image">

                    <img src={foto} alt="" />

                </div>

                <div className="principles__content">
                    
                    <span className="principles__subtitle">
                        Nossos princípios
                    </span>

                    <div className="principles__list">

                        {principles.map((item, index) => (

                            <div
                                className="principles__item"
                                key={index}
                            >

                                <h3>{item.title}</h3>

                                <p>{item.text}</p>

                            </div>

                        ))}

                    </div>

                </div>

            </div>

        </section>
    );
}

export default PrinciplesSection;