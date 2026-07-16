import { useState } from "react";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer";

import "./Login.scss";


export default function Login(){


const navigate = useNavigate();


const [email,setEmail] = useState("");
const [senha,setSenha] = useState("");

const [loading,setLoading] = useState(false);



async function entrar(e){

e.preventDefault();


if(!email || !senha){

toast.error(
"Preencha todos os campos."
);

return;

}



try{


setLoading(true);



const {
data,
error

}=await supabase.auth.signInWithPassword({

email,

password:senha

});



if(error){

console.log(error);

toast.error(
error.message
);

return;

}



const user=data.user;



const {data:perfil,error:perfilError}=await supabase

.from("user_roles")

.select(`
role_id,
roles(
nome
)
`)

.eq(
"user_id",
user.id
)

.single();



if(perfilError){

toast.error(
"Usuário sem permissão cadastrada."
);

return;

}




const tipo =
perfil.roles.nome;



toast.success(
"Login realizado."
);



setTimeout(()=>{


switch(tipo){


case "administrativo_geral":

navigate("/admin");

break;



case "comercial":

navigate("/comercial");

break;



case "producao":

navigate("/producao");

break;



case "financeiro":

navigate("/financeiro");

break;



case "homologado":

navigate("/homologados");

break;



case "parceiro":

navigate("/parceiros");

break;



default:

navigate("/");

}


},700);



}

catch(err){


toast.error(
"Erro ao conectar com servidor."
);


}


finally{

setLoading(false);

}


}



return(

<section className="login">


<div className="login__background"></div>



<div className="login__card">


<h1>
LOGIN
</h1>



<form onSubmit={entrar}>


<label>
E-mail:
</label>


<input

type="email"

value={email}

onChange={
e=>setEmail(e.target.value)
}

/>



<label>
Senha:
</label>


<input

type="password"

value={senha}

onChange={
e=>setSenha(e.target.value)
}

/>




<button disabled={loading}>

{
loading
?
"ENTRANDO..."
:
"ENTRAR"
}

</button>



</form>


</div>




<div className="login__title">


<h2>
Administrativo<br/>
Homologados<br/>
Parceiros
</h2>


</div>




</section>

)

}

