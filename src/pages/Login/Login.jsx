import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Login.scss";


export default function Login() {


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

            } = await supabase.auth.signInWithPassword({

                email,

                password:senha

            });



            if(error){

                toast.error(
                    "E-mail ou senha incorretos."
                );

                return;

            }



            const user = data.user;



            /*
            BUSCA O TIPO DE USUÁRIO
            */

            const {

                data:perfil,

                error:perfilError

            } = await supabase

                .from("user_roles")

                .select(`

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

                console.log(perfilError);

                toast.error(
                    "Usuário sem permissão cadastrada."
                );

                return;

            }



            const tipo = perfil.roles.nome;



            toast.success(
                "Login realizado."
            );



            setTimeout(()=>{


                switch(tipo){



                    case "administrativo_geral":

                    case "comercial":

                    case "producao":

                    case "financeiro":


                        navigate("/admin");

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


            console.error(err);


            toast.error(
                "Erro ao conectar com o servidor."
            );


        }


        finally{


            setLoading(false);


        }


    }




    return (

        <>

        <section className="login">


            <Navbar />


            <div className="login__background"></div>




            <div className="login__card">


                <h1>
                    LOGIN
                </h1>




                <form onSubmit={entrar}>


                    <label htmlFor="email">
                        E-mail
                    </label>



                    <input

                        id="email"

                        type="email"

                        autoComplete="email"

                        value={email}

                        onChange={
                            e=>setEmail(e.target.value)
                        }

                    />




                    <label htmlFor="senha">

                        Senha

                    </label>




                    <input

                        id="senha"

                        type="password"

                        autoComplete="current-password"

                        value={senha}

                        onChange={
                            e=>setSenha(e.target.value)
                        }

                    />




                    <button

                        type="submit"

                        disabled={loading}

                    >

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

                    Administrativo

                    <br/>

                    Homologados

                    <br/>

                    Parceiros

                </h2>



            </div>



        </section>



        <Footer />

        </>

    );

}