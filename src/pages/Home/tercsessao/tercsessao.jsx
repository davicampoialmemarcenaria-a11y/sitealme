import "./TercSessao.scss";

import clips from "../../../imgs/clips.png";
import globo from "../../../imgs/globo.png";
import furo from "../../../imgs/furo.png";
import luz from "../../../imgs/luz.png";
import raio from "../../../imgs/raio.png";
import bolas from "../../../imgs/bolas.png";

import seta from "../../../imgs/seta.png";
import curva from "../../../imgs/curva.png";

function ProcessSection() {
    return (
        <section className="process">

            <div className="process__container">

                <div className="process__flow">

                    {/* Linha superior */}
                    <div className="process__row">

                        <div className="process__card">
                            <img src={clips} alt="" />
                            <h3>1° ASSINATURA DE CONTRATO</h3>
                            <p>Após a assinatura do contrato nosso processo de produção se inicia.</p>
                        </div>

                        <div className="process__arrow">
                            <img src={seta} alt="" />
                        </div>

                        <div className="process__card">
                            <img src={globo} alt="" />
                            <h3>2° REUNIÃO DE ONBOARDING</h3>
                            <p>Nesta etapa, você realizará uma reunião com nossa equipe para conhecer melhor os processos da empresa e, ao mesmo tempo, nos apresentar seu projeto, suas necessidades e o que deseja alcançar.</p>
                        </div>

                        <div className="process__arrow">
                            <img src={seta} alt="" />
                        </div>

                        <div className="process__card">
                            <img src={furo} alt="" />
                            <h3>3° ALINHAMENTO DE PROJETO</h3>
                            <p>Período em que conversamos sobre detalhes e aspectos que não irão impactar o valor final do projeto.</p>
                        </div>

                    </div>


{/* Seta mobile */}
<div className="process__mobile-arrow">
    <img src={seta} alt="" />
</div>


                    {/* Linha inferior */}
                    <div className="process__row process__row--bottom">

                        <div className="process__card">
                            <img src={luz} alt="" />
                            <h3>4° PRODUÇÃO</h3>
                            <p>O RDO será responsável por realizar as medições necessárias para que, após o recebimento dos materiais, possamos iniciar a pré-montagem do projeto.</p>
                        </div>

                        <div className="process__arrow process__arrow--left">
                            <img src={seta} alt="" />
                        </div>

                        <div className="process__card">
                            <img src={raio} alt="" />
                            <h3>5° INSTALAÇÃO</h3>
                            <p>Realizamos a entrega dos materiais no endereço do projeto para dar início às instalações. O RDO acompanhará a equipe durante essa etapa e enviará relatórios semanais com fotos do andamento da obra e o cronograma atualizado.</p>
                        </div>

                        <div className="process__arrow process__arrow--left">
                            <img src={seta} alt="" />
                        </div>

                        <div className="process__card">
                            <img src={bolas} alt="" />
                            <h3>6° RELATÓRIO FINAL DE ENTREGA</h3>
                            <p>Ele representa a conclusão da entrega, mas nossa equipe continuará à disposição para oferecer assistência técnica quando necessário. Caso não haja solicitações, realizaremos uma visita de vistoria em até 30 dias após a entrega final.</p>
                        </div>

                    </div>

                </div>

                <div className="process__text">

                    <h2>
                       Marcenaria não é apenas entrega. 
                        <br />
                        
                    </h2>

                    <span>Trabalhamos com processos</span>

                </div>

            </div>

        </section>
    );
}

export default ProcessSection;