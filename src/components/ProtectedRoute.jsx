import {
    Navigate,
    useLocation
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";


export default function ProtectedRoute({
    children,
    allowedRoles = []
}) {

    const {
        user,
        role,
        loading
    } = useAuth();

    const location = useLocation();


    /*
    =====================================================
    CARREGANDO AUTENTICAÇÃO
    =====================================================
    */

    if (loading) {

        return (

            <div
                style={{
                    width: "100%",
                    height: "100svh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px"
                }}
            >

                Carregando...

            </div>
        );
    }


    /*
    =====================================================
    USUÁRIO NÃO AUTENTICADO
    =====================================================
    */

    if (!user) {

        return (

            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname
                }}
            />

        );
    }


    /*
    =====================================================
    VERIFICAR PERMISSÃO
    =====================================================
    */

    const autorizado =
        allowedRoles.length === 0 ||
        allowedRoles.includes(role);


    /*
    =====================================================
    SEM PERMISSÃO
    =====================================================
    */

    if (!autorizado) {

        console.warn(
            "Acesso negado:",
            {
                caminho:
                    location.pathname,

                role,

                allowedRoles
            }
        );


        return (

            <Navigate
                to="/"
                replace
            />

        );
    }


    /*
    =====================================================
    ACESSO LIBERADO
    =====================================================
    */

    return children;
}