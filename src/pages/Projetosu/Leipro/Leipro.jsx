import "./Leipro.scss";

import almadeira from "../../../imgs/almadeira.png";

export default function Leipro() {
    return (
        <section className="lei-projeto">

            <div className="lei-projeto__container">

                <div className="lei-projeto__content">

                    <h2>Leis de projeto</h2>

                    <p>
                     O setor de projetos aqui na Alme realiza três tipos de projeto:
                     <br /> 
                     <br /> 

I. Pré projeto - São imagens para definições visuais que passam pela aprovação do cliente. 
<br /> 
<br /> 
II. Projeto de medição - Por meio dele realizamos a coleta de medidas in loco, é um projeto interno que não passa por validação do cliente. 
<br /> 
<br /> 
III. Projeto executivo - Projeto com medidas finas, definições e detalhamentos mais específicos, ele passa pela aprovação do cliente para iniciarmos a fabricação do móvel.  

 <br />
<br />
Com o projeto executivo definido, o marceneiro inicia a fabricação do móvel e sempre certificamos que ele tenha todas as informações alinhadas as expectativas do cliente
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
