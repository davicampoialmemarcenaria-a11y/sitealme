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
        title: "Excelência na Experiência",
        text: "Devemos sempre manter o respeito e cordialidade, e no final das contas, entender que a experiência valeu a pena. o cronograma com responsabilidade e planejamento, assegurando que cada etapa seja cumprida dentro do prazo estabelecido."},
    {
        title: "Pensamento de longo prazo",
        text: "O pensamento de longo prazo guia nossas decisões, fazendo com que o hoje seja construído não apenas pensando no presente, mas no futuro que queremos alcançar. Projetos com alto padrão de execução, refletindo cuidado, atenção aos detalhes e consistência em cada projeto."
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