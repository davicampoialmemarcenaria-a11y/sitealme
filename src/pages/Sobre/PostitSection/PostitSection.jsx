import "./PostitSection.scss";

const PostitSection = () => {
  return (
    <section className="postit-section">
      <div className="postit-section__container">
        {/* Conteúdo */}
        <div className="postit-section__content">
          <h2 className="postit-section__title">
            Quem somos?
          </h2>

          <p>
           A Alme Marcenaria nasceu em 2020 da iniciativa de dois amigos de infância, com o propósito de oferecer uma solução mais segura, organizada e confiável para a execução de projetos de marcenaria. Desde o início, nosso compromisso foi transformar desafios em processos bem conduzidos, garantindo tranquilidade para clientes e parceiros. 
          </p>

          <p>
            Acompanhamos todas as etapas do projeto e contamos com uma rede de marceneiros homologados, selecionados para assegurar qualidade, eficiência e consistência em cada entrega. Com atuação nacional e internacional, atendemos principalmente arquitetos que buscam um parceiro comprometido com a excelência em cada detalhe.
          </p>

          <p>
            Nossa forma de trabalhar é guiada por cinco valores fundamentais: excelência na experiência, pensamento de longo prazo, compromisso com a palavra, crescimento aos que nos acompanham e qualidade no que desempenhamos. São princípios que orientam nossas decisões e relações todos os dias.
          </p>
       <p>Mais do que entregar marcenaria, buscamos construir confiança. Queremos que cada cliente se sinta acolhido, seguro e amparado durante toda a jornada, sabendo que seu projeto está em boas mãos.</p>
         
        </div>

        {/* Card */}
        <div className="postit-section__aside">
          <div className="postit-card">
            <span className="postit-card__quote">“</span>

            <p>
              Projetos de marcenaria não são apenas entregas técnicas. São espaços onde famílias viverão, empresas crescerão e histórias serão construídas. Não acreditamos que excelência seja a ausência de falhas. Acreditamos que excelência é a forma como uma empresa assume suas responsabilidades, enfrenta os desafios e evolui continuamente. Cada projeto nos desafia a ser melhores do que fomos no anterior. Essa busca constante por evolução faz parte da nossa cultura e explica por que tantos clientes voltam a confiar na Alme para novos projetos.
            </p>

            <p>
              Afinal, nossa maior conquista não é apenas entregar uma obra concluída, mas construir relações de confiança que permanecem muito depois da entrega.
            </p>

            <div className="postit-card__line"></div>
          </div>

          <button className="postit-btn">
            <span>SEJA UM HOMOLOGADO</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default PostitSection;