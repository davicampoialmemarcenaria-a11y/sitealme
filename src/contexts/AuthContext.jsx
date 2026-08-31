import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { supabase } from "../services/supabase";


const AuthContext = createContext({});


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [role, setRole] = useState(null);

    const [loading, setLoading] = useState(true);


    /*
    =====================================================
    CARREGAR USUÁRIO + ROLE
    =====================================================
    */

    async function carregarUsuario(usuario) {

        /*
        =================================================
        SEM USUÁRIO
        =================================================
        */

        if (!usuario) {

            setUser(null);

            setRole(null);

            return;
        }


        /*
        =================================================
        DEFINIR USUÁRIO
        =================================================
        */

        setUser(usuario);


        /*
        =================================================
        BUSCAR ROLE DO USUÁRIO
        =================================================
        */

        const {
            data,
            error
        } = await supabase

            .from("user_roles")

            .select(`
                role_id,
                roles (
                    id,
                    nome
                )
            `)

            .eq(
                "user_id",
                usuario.id
            )

            .single();


        /*
        =================================================
        ERRO
        =================================================
        */

        if (error || !data) {

            console.error(
                "===================================="
            );

            console.error(
                "AUTH - ERRO AO CARREGAR ROLE:",
                error
            );

            console.error(
                "===================================="
            );

            setRole(null);

            return;
        }


        /*
        =================================================
        PEGAR NOME DA ROLE
        =================================================
        */

        const nomeRole =
            Array.isArray(data.roles)
                ? data.roles?.[0]?.nome
                : data.roles?.nome;


        /*
        =================================================
        LOG
        =================================================
        */

        console.log(
            "===================================="
        );

        console.log(
            "AUTH - USUÁRIO:",
            usuario.email
        );

        console.log(
            "AUTH - ROLE ID:",
            data.role_id
        );

        console.log(
            "AUTH - ROLE:",
            nomeRole
        );

        console.log(
            "===================================="
        );


        /*
        =================================================
        IMPORTANTE
        =================================================

        O valor permanece exatamente como está no banco.

        Exemplos:

        Administrativo Geral
        comercial
        producao
        financeiro
        =================================================
        */

        setRole(
            nomeRole || null
        );
    }


    /*
    =====================================================
    INICIALIZAÇÃO
    =====================================================
    */

    useEffect(() => {

        let ativo = true;


        async function iniciar() {

            try {

                setLoading(true);


                const {
                    data: {
                        session
                    }
                } =
                    await supabase.auth.getSession();


                if (!ativo) {
                    return;
                }


                await carregarUsuario(
                    session?.user || null
                );

            }

            catch (error) {

                console.error(
                    "Erro ao iniciar autenticação:",
                    error
                );


                if (ativo) {

                    setUser(null);

                    setRole(null);
                }

            }

            finally {

                if (ativo) {

                    setLoading(false);
                }
            }
        }


        iniciar();


        /*
        =================================================
        LISTENER DO SUPABASE
        =================================================
        */

        const {
            data: listener
        } =
            supabase.auth.onAuthStateChange(
                async (_event, session) => {

                    if (!ativo) {
                        return;
                    }


                    setLoading(true);


                    await carregarUsuario(
                        session?.user || null
                    );


                    if (ativo) {

                        setLoading(false);
                    }
                }
            );


        /*
        =================================================
        CLEANUP
        =================================================
        */

        return () => {

            ativo = false;

            listener.subscription.unsubscribe();
        };

    }, []);


    /*
    =====================================================
    LOGOUT
    =====================================================
    */

    async function logout() {

        try {

            await supabase.auth.signOut();

        }

        catch (error) {

            console.error(
                "Erro ao fazer logout:",
                error
            );

        }

        finally {

            setUser(null);

            setRole(null);

            setLoading(false);
        }
    }


    /*
    =====================================================
    PROVIDER
    =====================================================
    */

    return (

        <AuthContext.Provider
            value={{
                user,
                role,
                loading,
                logout
            }}
        >

            {children}

        </AuthContext.Provider>
    );
}


/*
=====================================================
HOOK
=====================================================
*/

export function useAuth() {

    return useContext(
        AuthContext
    );
}