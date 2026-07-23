import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/supabase";

import "./CardProjetos.scss";

export default function CardProjetos() {

    const [projetos, setProjetos] = useState([]);
    const [current, setCurrent] = useState(0);

    const navigate = useNavigate();


    useEffect(() => {
        buscarProjetos();
    }, []);


    async function buscarProjetos(){

        const {data,error} = await supabase
        .from("projects")
        .select("*")
        .order("created_at",{
            ascending:false
        });


        if(error){
            console.log(error);
            return;
        }


        setProjetos(data || []);

    }



    const maxIndex = Math.max(projetos.length - 3,0);



    function nextSlide(){

        setCurrent(prev =>
            Math.min(prev + 1,maxIndex)
        );

    }



    function prevSlide(){

        setCurrent(prev =>
            Math.max(prev - 1,0)
        );

    }




return (

<section className="cards-projetos">


<div className="text__top">

<span>
FOCO INTERNACIONAL
</span>

<h2>
Perguntas frequentes
</h2>

</div>



<button
className="carousel-btn prev"
onClick={prevSlide}
disabled={current===0}
>

&#10094;

</button>





<div className="carousel">


<div
className="carousel-track"

style={{
transform:
window.innerWidth > 768
?
`translateX(calc(-${current} * (320px + 35px)))`
:
"none"
}}

>


{
projetos.map((projeto)=>(


<article

className="card-projeto"

key={projeto.id}

onClick={()=>
navigate(`/projetos/${projeto.id}`)
}

>


<div className="card-projeto__image">


<img

src={
projeto.imagem_capa ||
"https://placehold.co/600x900"
}

alt={projeto.titulo}

/>


</div>




<div className="card-projeto__overlay">


<div className="card-projeto__content">


<h2>
{projeto.titulo}
</h2>




<div className="card-projeto__extra">


<strong>
{projeto.nome}
</strong>


<p>
{projeto.descricao}
</p>


</div>



</div>


</div>



</article>


))
}



</div>


</div>





<button

className="carousel-btn next"

onClick={nextSlide}

disabled={current>=maxIndex}

>

&#10095;

</button>



</section>

);


}
