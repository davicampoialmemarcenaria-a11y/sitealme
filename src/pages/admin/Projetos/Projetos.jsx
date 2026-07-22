import { useEffect, useState } from "react";
import { supabase } from "../../../services/supabase";
import toast from "react-hot-toast";

import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiImage
} from "react-icons/fi";

import "./Projetos.scss";


export default function Projetos(){

    const [projetos,setProjetos] = useState([]);

    const [loading,setLoading] = useState(true);

    const [modal,setModal] = useState(false);

    const [editando,setEditando] = useState(null);

    const [modalExcluir,setModalExcluir] = useState(false);

    const [idExcluir,setIdExcluir] = useState(null);

    const [uploading,setUploading] = useState(false);



    const formularioInicial = {

        nome:"",

        titulo:"",

        descricao:"",

        imagem_capa:"",

        imagem_file:null,

        area:"",

        tempo_producao:"",

        cidade:"",

        escopo:""

    };


    const [form,setForm] = useState(formularioInicial);



    useEffect(()=>{

        buscarProjetos();

    },[]);



    async function buscarProjetos(){


        setLoading(true);


        const {data,error}=await supabase

            .from("projects")

            .select("*")

            .order("created_at",{
                ascending:false
            });



        if(error){

            console.log(error);

            toast.error(
                "Erro ao carregar projetos."
            );

            setLoading(false);

            return;

        }


        setProjetos(data || []);

        setLoading(false);

    }




    async function uploadImagem(file){


        if(!file) return null;


        try{


            setUploading(true);


            const extensao =
                file.name.split(".").pop();



            const nome =
                `${Date.now()}-${Math.random()}.${extensao}`;



            const {error}=await supabase

                .storage

                .from("projects")

                .upload(nome,file);



            if(error)
                throw error;



            const {data}=supabase

                .storage

                .from("projects")

                .getPublicUrl(nome);



            return data.publicUrl;



        }catch(err){


            console.log(err);

            toast.error(
                "Erro ao enviar imagem."
            );


            return null;


        }finally{


            setUploading(false);


        }


    }




    function abrirModal(){


        setEditando(null);

        setForm(formularioInicial);

        setModal(true);


    }




    function editarProjeto(item){


        setEditando(item.id);


        setForm({

            nome:item.nome || "",

            titulo:item.titulo || "",

            descricao:item.descricao || "",

            imagem_capa:item.imagem_capa || "",

            imagem_file:null,

            area:item.area || "",

            tempo_producao:item.tempo_producao || "",

            cidade:item.cidade || "",

            escopo:item.escopo || ""

        });


        setModal(true);


    }




    function alterarCampo(campo,valor){


        setForm({

            ...form,

            [campo]:valor

        });


    }





    function alterarImagem(e){


        const arquivo=e.target.files[0];


        if(!arquivo)
            return;



        setForm({

            ...form,

            imagem_file:arquivo,

            imagem_capa:
                URL.createObjectURL(arquivo)

        });


    }






    async function salvar(e){


        e.preventDefault();


        try{


            const {data:userData}=await supabase.auth.getUser();


            const user=userData.user;


            if(!user){

                toast.error(
                    "Usuário não autenticado."
                );

                return;

            }




            let imagemFinal=form.imagem_capa;



            if(form.imagem_file){

                imagemFinal =
                    await uploadImagem(
                        form.imagem_file
                    );

            }





            const dados={


                nome:form.nome,

                titulo:form.titulo,

                descricao:form.descricao,

                imagem_capa:imagemFinal,

                area:form.area,

                tempo_producao:
                    form.tempo_producao,

                cidade:form.cidade,

                escopo:form.escopo


            };





            if(editando){


                const {error}=await supabase

                    .from("projects")

                    .update(dados)

                    .eq("id",editando);



                if(error)
                    throw error;



                toast.success(
                    "Projeto atualizado."
                );



            }else{


                const {error}=await supabase

                    .from("projects")

                    .insert({

                        ...dados,

                        autor_id:user.id

                    });



                if(error)
                    throw error;



                toast.success(
                    "Projeto criado."
                );


            }




            setModal(false);

            buscarProjetos();



        }catch(err){


            console.log(err);

            toast.error(
                err.message ||
                "Erro ao salvar projeto."
            );


        }


    }






    function confirmarExcluir(id){

        setIdExcluir(id);

        setModalExcluir(true);

    }






    async function excluirProjeto(){


        const {error}=await supabase

            .from("projects")

            .delete()

            .eq("id",idExcluir);



        if(error){

            toast.error(
                "Erro ao excluir."
            );

            return;

        }



        toast.success(
            "Projeto removido."
        );


        setModalExcluir(false);

        setIdExcluir(null);


        buscarProjetos();


    }







return (

<section className="projects-admin">



<div className="projects-admin__top">


<div>

<span>
Painel Administrativo
</span>


<h1>
Gerenciamento de projetos
</h1>


<p>
Cadastre e gerencie os projetos realizados.
</p>


</div>



<button
className="btn-add"
onClick={abrirModal}
>

<FiPlus/>

Novo projeto

</button>


</div>






{
loading ?

<div>
Carregando...
</div>


:

<div className="projects-grid">


{

projetos.map(item=>(


<article
className="project-card"
key={item.id}
>


<div className="project-card__image">


<img

src={
item.imagem_capa ||
"https://placehold.co/700x500"
}

/>


</div>



<div className="project-card__content">


<h3>
{item.titulo}
</h3>


<p>
{item.descricao}
</p>



<div className="project-card__footer">


<button
onClick={()=>
editarProjeto(item)
}
>

<FiEdit2/>

Editar

</button>



<button

className="danger"

onClick={()=>
confirmarExcluir(item.id)
}

>

<FiTrash2/>

Excluir

</button>


</div>


</div>


</article>


))

}


</div>


}







{
modal && (

<div className="project-modal">


<div className="project-modal__content">


<header>


<h2>

{
editando ?
"Editar projeto":
"Novo projeto"
}

</h2>



<button
type="button"
onClick={()=>setModal(false)}
>

X

</button>


</header>




<form onSubmit={salvar}>


<label>
Nome
</label>

<input

value={form.nome}

onChange={e=>
alterarCampo(
"nome",
e.target.value
)
}

/>



<label>
Título
</label>

<input

value={form.titulo}

onChange={e=>
alterarCampo(
"titulo",
e.target.value
)
}

/>




<label>
Descrição
</label>

<textarea

value={form.descricao}

onChange={e=>
alterarCampo(
"descricao",
e.target.value
)
}

/>





<label className="upload">

<FiImage/>

Selecionar capa


<input

hidden

type="file"

accept="image/*"

onChange={alterarImagem}

/>


</label>





{
form.imagem_capa && (

<div className="preview">


<img

src={form.imagem_capa}

/>


<button

type="button"

onClick={()=>
setForm({
...form,
imagem_capa:"",
imagem_file:null
})
}

>

X

</button>


</div>

)

}





<label>
Área
</label>

<input

value={form.area}

onChange={e=>
alterarCampo(
"area",
e.target.value
)
}

/>




<label>
Tempo de produção
</label>

<input

value={form.tempo_producao}

onChange={e=>
alterarCampo(
"tempo_producao",
e.target.value
)
}

/>




<label>
Cidade
</label>

<input

value={form.cidade}

onChange={e=>
alterarCampo(
"cidade",
e.target.value
)
}

/>




<label>
Escopo
</label>

<textarea

value={form.escopo}

onChange={e=>
alterarCampo(
"escopo",
e.target.value
)
}

/>




<div className="actions">


<button
type="button"
onClick={()=>setModal(false)}
>
Cancelar
</button>



<button
disabled={uploading}
>
Salvar
</button>


</div>



</form>


</div>


</div>

)

}








{
modalExcluir && (

<div className="confirm-modal">


<div>


<h2>
Excluir projeto?
</h2>


<p>
Essa ação não poderá ser desfeita.
</p>


<button
onClick={()=>setModalExcluir(false)}
>
Cancelar
</button>


<button
onClick={excluirProjeto}
>
Excluir
</button>


</div>


</div>

)

}




</section>


);


}