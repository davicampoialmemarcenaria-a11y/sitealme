import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./Login.scss";

export default function Login() {

    const navigate = useNavigate();

    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);

    async function entrar(e) {

        e.preventDefault();

        if (!usuario || !senha) {
            toast.error(
                "Preencha todos os campos."
            );
            return;
        }

        try {

            setLoading(true);

            // =================================================
            // 1. BUSCA O E-MAIL ATRAVÉS DO NOME DE USUÁRIO
            // =================================================

            const {
                data: emailEncontrado,
                error: usernameError
            } = await supabase.rpc(
                "get_email_by_username",
                {
                    p_username: usuario.trim()
                }
            );

            if (usernameError) {

                console.error(usernameError);

                toast.error(
                    "Erro ao verificar o usuário."
                );

                return;
            }

            if (!emailEncontrado) {

                toast.error(
                    "Usuário ou senha incorretos."
                );

                return;
            }


            // =================================================
            // 2. LOGIN NO SUPABASE AUTH
            // =================================================

            const {
                data,
                error
            } = await supabase.auth.signInWithPassword({
                email: emailEncontrado,
                password: senha
            });


            if (error) {

                console.error(error);

                toast.error(
                    "Usuário ou senha incorretos."
                );

                return;
            }


            // =================================================
            // 3. USUÁRIO AUTENTICADO
            // =================================================

            const user = data.user;


            // =================================================
            // 4. BUSCA O TIPO DE USUÁRIO
            // =================================================

            const {
                data: perfil,
                error: perfilError
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


            if (perfilError) {

                console.log(perfilError);

                toast.error(
                    "Usuário sem permissão cadastrada."
                );

                return;
            }


            const tipo = perfil.roles.nome;


            // =================================================
            // 5. LOGIN REALIZADO
            // =================================================

            toast.success(
                "Login realizado."
            );


            setTimeout(() => {

                switch (tipo) {

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

            }, 700);


        } catch (err) {

            console.error(err);

            toast.error(
                "Erro ao conectar com o servidor."
            );

        } finally {

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

                        <label htmlFor="usuario">
                            Usuário
                        </label>


                        <input
                            id="usuario"
                            type="text"
                            autoComplete="username"
                            value={usuario}
                            onChange={
                                e => setUsuario(e.target.value)
                            }
                            placeholder="Digite seu usuário"
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
                                e => setSenha(e.target.value)
                            }
                            placeholder="Digite sua senha"
                        />


                        <button
                            type="submit"
                            disabled={loading}
                        >

                            {
                                loading
                                    ? "ENTRANDO..."
                                    : "ENTRAR"
                            }

                        </button>

                    </form>

                </div>


                <div className="login__title">

                    <h2>
                        Administrativo
                        <br />
                        Homologados
                        <br />
                        Parceiros
                    </h2>

                </div>

            </section>


            <Footer />

        </>
    );
}