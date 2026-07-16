import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    async function carregarUsuario(usuario) {

        if (!usuario) {
            setUser(null);
            setRole(null);
            return;
        }

        setUser(usuario);

        const { data, error } = await supabase
            .from("user_roles")
            .select(`
                role_id,
                roles(
                    nome
                )
            `)
            .eq("user_id", usuario.id)
            .single();

        if (!error && data) {
            setRole(data.roles.nome);
        } else {
            setRole(null);
        }
    }

    useEffect(() => {

        async function iniciar() {

            const {
                data: { session }
            } = await supabase.auth.getSession();

            await carregarUsuario(session?.user);

            setLoading(false);

        }

        iniciar();

        const {
            data: listener
        } = supabase.auth.onAuthStateChange(async (_, session) => {

            await carregarUsuario(session?.user);

        });

        return () => {

            listener.subscription.unsubscribe();

        };

    }, []);

    async function logout() {

        await supabase.auth.signOut();

        setUser(null);
        setRole(null);

    }

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

export function useAuth() {

    return useContext(AuthContext);

}