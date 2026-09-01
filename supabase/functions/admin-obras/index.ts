import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
=====================================================
CORS
=====================================================
*/

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "GET, POST, PUT, DELETE, OPTIONS",
};


/*
=====================================================
VARIÁVEIS SUPABASE
=====================================================
*/

const supabaseUrl =
    Deno.env.get("SUPABASE_URL")!;

const supabaseAnonKey =
    Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseServiceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;


/*
=====================================================
CLIENTE NORMAL
=====================================================
*/

const supabaseAuth =
    createClient(
        supabaseUrl,
        supabaseAnonKey
    );


/*
=====================================================
CLIENTE ADMIN
=====================================================
*/

const supabaseAdmin =
    createClient(
        supabaseUrl,
        supabaseServiceRoleKey
    );


/*
=====================================================
RESPOSTA JSON
=====================================================
*/

function jsonResponse(
    data: unknown,
    status = 200
) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        }
    );
}


/*
=====================================================
NORMALIZAR TEXTO
=====================================================
*/

function normalizarTexto(
    valor: unknown
) {
    return String(
        valor ?? ""
    )
        .trim()
        .toLowerCase();
}


/*
=====================================================
NORMALIZAR BOOLEAN
=====================================================
*/

function normalizarBoolean(
    valor: unknown
) {
    return (
        valor === true ||
        valor === "true" ||
        valor === 1 ||
        valor === "1"
    );
}


/*
=====================================================
VERIFICAR PERMISSÃO
=====================================================
*/

async function verificarProducao(
    req: Request
) {

    /*
    =================================================
    AUTHORIZATION
    =================================================
    */

    const authHeader =
        req.headers.get(
            "Authorization"
        );

    if (!authHeader) {
        throw new Error(
            "Usuário não autenticado."
        );
    }


    /*
    =================================================
    TOKEN
    =================================================
    */

    const token =
        authHeader
            .replace(
                /^Bearer\s+/i,
                ""
            )
            .trim();

    if (!token) {
        throw new Error(
            "Token de autenticação não encontrado."
        );
    }


    /*
    =================================================
    VALIDAR TOKEN
    =================================================
    */

    const {
        data: {
            user
        },
        error
    } =
        await supabaseAuth
            .auth
            .getUser(
                token
            );

    if (
        error ||
        !user
    ) {

        console.error(
            "Erro ao validar usuário:",
            error
        );

        throw new Error(
            "Sessão inválida ou expirada."
        );
    }


    /*
    =================================================
    BUSCAR ROLE
    =================================================
    */

    const {
        data: userRole,
        error: roleError
    } =
        await supabaseAdmin
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
                user.id
            )
            .maybeSingle();

    if (roleError) {

        console.error(
            "Erro ao verificar role:",
            roleError
        );

        throw new Error(
            "Não foi possível verificar a permissão."
        );
    }


    /*
    =================================================
    ROLE
    =================================================
    */

    const roleNome =
        Array.isArray(
            userRole?.roles
        )
            ? userRole?.roles?.[0]?.nome
            : userRole?.roles?.nome;

    const roleId =
        Number(
            userRole?.role_id
        );


    /*
    =================================================
    BUSCAR PROFILE
    =================================================
    */

    const {
        data: profile,
        error: profileError
    } =
        await supabaseAdmin
            .from("profiles")
            .select(`
                id,
                nome,
                username,
                email,
                pode_ver_todas_obras
            `)
            .eq(
                "id",
                user.id
            )
            .maybeSingle();

    if (profileError) {

        console.error(
            "Erro ao buscar profile:",
            profileError
        );

        throw new Error(
            "Não foi possível carregar o perfil do usuário."
        );
    }


    /*
    =================================================
    PERMISSÃO ESPECIAL
    =================================================

    ROLE 1
    → sempre pode ver tudo.

    ROLE 3 + pode_ver_todas_obras = true
    → pode ver tudo.

    ROLE 3 normal
    → somente relacionadas ao username.

    =================================================
    */

    const podeVerTodasObras =
        roleId === 1 ||
        (
            roleId === 3 &&
            profile?.pode_ver_todas_obras === true
        );


    /*
    =================================================
    ACESSO À FUNÇÃO
    =================================================
    */

    if (
        roleId !== 1 &&
        roleId !== 3
    ) {

        throw new Error(
            "Você não possui permissão para acessar as obras."
        );
    }


    /*
    =================================================
    LOG
    =================================================
    */

    console.log(
        "===================================="
    );

    console.log(
        "ADMIN-OBRAS"
    );

    console.log(
        "USER ID:",
        user.id
    );

    console.log(
        "EMAIL:",
        user.email
    );

    console.log(
        "USERNAME:",
        profile?.username
    );

    console.log(
        "NOME:",
        profile?.nome
    );

    console.log(
        "ROLE ID:",
        roleId
    );

    console.log(
        "ROLE:",
        roleNome
    );

    console.log(
        "PODE VER TODAS:",
        podeVerTodasObras
    );

    console.log(
        "===================================="
    );


    return {

        user,

        roleId,

        roleNome,

        username:
            profile?.username || "",

        nome:
            profile?.nome || "",

        email:
            profile?.email ||
            user.email ||
            "",

        podeVerTodasObras

    };
}


/*
=====================================================
NORMALIZAR OBRA
=====================================================
*/

function normalizarObra(
    body: any
) {

    const nome =
        String(
            body?.nome ??
            ""
        ).trim();

    const endereco =
        String(
            body?.endereco ??
            ""
        ).trim();

    const cliente_nome =
        String(
            body?.cliente_nome ??
            body?.cliente ??
            ""
        ).trim();

    const arquiteto_empresa =
        String(
            body?.arquiteto_empresa ??
            body?.arquiteto ??
            body?.empresa ??
            ""
        ).trim();

    const data_inicio_esperada =
        body?.data_inicio_esperada ||
        null;


    /*
    =================================================
    VALOR
    =================================================
    */

    let valor =
        body?.valor;

    if (
        valor === "" ||
        valor === undefined ||
        valor === null
    ) {
        valor = null;
    }
    else {
        valor =
            Number(
                valor
            );
    }


    /*
    =================================================
    RESPONSÁVEIS
    =================================================
    */

    const rdo_nome =
        String(
            body?.rdo_nome ??
            body?.rdo ??
            ""
        ).trim();

    const marceneiro_nome =
        String(
            body?.marceneiro_nome ??
            body?.marceneiro ??
            ""
        ).trim();

    const projetista_nome =
        String(
            body?.projetista_nome ??
            body?.projetista ??
            ""
        ).trim();


    /*
    =================================================
    DIAS
    =================================================
    */

    let dias_finalizacao_esperado =
        body?.dias_finalizacao_esperado;

    if (
        dias_finalizacao_esperado === "" ||
        dias_finalizacao_esperado === undefined ||
        dias_finalizacao_esperado === null
    ) {
        dias_finalizacao_esperado = null;
    }
    else {
        dias_finalizacao_esperado =
            Number(
                dias_finalizacao_esperado
            );
    }


    /*
    =================================================
    CONCLUÍDA
    =================================================
    */

    const concluida =
        normalizarBoolean(
            body?.concluida
        );


    return {

        nome,

        endereco,

        cliente_nome,

        arquiteto_empresa,

        data_inicio_esperada,

        valor,

        rdo_nome,

        marceneiro_nome,

        projetista_nome,

        dias_finalizacao_esperado,

        concluida

    };
}


/*
=====================================================
VALIDAR OBRA
=====================================================
*/

function validarObra(
    obra: any
) {

    if (!obra.nome) {

        throw new Error(
            "O nome da obra é obrigatório."
        );
    }


    if (
        obra.valor !== null &&
        (
            Number.isNaN(
                obra.valor
            ) ||
            obra.valor < 0
        )
    ) {

        throw new Error(
            "O valor da obra é inválido."
        );
    }


    if (
        obra.dias_finalizacao_esperado !== null &&
        (
            Number.isNaN(
                obra.dias_finalizacao_esperado
            ) ||
            obra.dias_finalizacao_esperado < 0 ||
            !Number.isInteger(
                obra.dias_finalizacao_esperado
            )
        )
    ) {

        throw new Error(
            "O número de dias esperado é inválido."
        );
    }
}


/*
=====================================================
LISTAR TODAS AS OBRAS
=====================================================
*/

async function listarTodasAsObras() {

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("obras")
            .select(`
                id,
                nome,
                endereco,
                cliente_nome,
                arquiteto_empresa,
                data_inicio_esperada,
                valor,
                rdo_nome,
                marceneiro_nome,
                projetista_nome,
                dias_finalizacao_esperado,
                concluida,
                concluida_at,
                created_at,
                updated_at
            `)
            .order(
                "data_inicio_esperada",
                {
                    ascending: true,
                    nullsFirst: false
                }
            );

    if (error) {

        console.error(
            "Erro ao listar obras:",
            error
        );

        throw new Error(
            error.message
        );
    }

    return data || [];
}


/*
=====================================================
LISTAR OBRAS CONCLUÍDAS
=====================================================
*/

async function listarObrasConcluidas() {

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("obras")
            .select(`
                id,
                nome,
                endereco,
                cliente_nome,
                arquiteto_empresa,
                data_inicio_esperada,
                valor,
                rdo_nome,
                marceneiro_nome,
                projetista_nome,
                dias_finalizacao_esperado,
                concluida,
                concluida_at,
                created_at,
                updated_at
            `)
            .eq(
                "concluida",
                true
            )
            .order(
                "concluida_at",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );

    if (error) {

        console.error(
            "Erro ao listar obras concluídas:",
            error
        );

        throw new Error(
            error.message
        );
    }

    return data || [];
}


/*
=====================================================
FILTRAR OBRAS DO USUÁRIO
=====================================================
*/

function filtrarObrasDoUsuario(
    obras: any[],
    username: string
) {

    const usernameNormalizado =
        normalizarTexto(
            username
        );

    if (!usernameNormalizado) {
        return [];
    }


    return obras.filter(
        obra => {

            const rdo =
                normalizarTexto(
                    obra.rdo_nome
                );

            const marceneiro =
                normalizarTexto(
                    obra.marceneiro_nome
                );

            const projetista =
                normalizarTexto(
                    obra.projetista_nome
                );


            return (
                rdo === usernameNormalizado ||
                marceneiro === usernameNormalizado ||
                projetista === usernameNormalizado
            );
        }
    );
}


/*
=====================================================
VERIFICAR ACESSO À OBRA
=====================================================
*/

function usuarioPodeAcessarObra(
    obra: any,
    acesso: any,
    exigirNaoConcluida = false
) {

    /*
    =================================================
    SE EXIGIR OBRA ABERTA
    =================================================
    */

    if (
        exigirNaoConcluida &&
        obra.concluida === true
    ) {
        return false;
    }


    /*
    =================================================
    ADMINISTRATIVO GERAL
    =================================================
    */

    if (
        acesso.roleId === 1
    ) {
        return true;
    }


    /*
    =================================================
    PRODUÇÃO COM ACESSO GLOBAL
    =================================================
    */

    if (
        acesso.roleId === 3 &&
        acesso.podeVerTodasObras === true
    ) {
        return true;
    }


    /*
    =================================================
    PRODUÇÃO NORMAL
    =================================================
    */

    if (
        acesso.roleId === 3
    ) {

        return (
            filtrarObrasDoUsuario(
                [obra],
                acesso.username
            ).length > 0
        );
    }


    return false;
}


/*
=====================================================
BUSCAR OBRA POR ID
=====================================================
*/

async function buscarObraPorId(
    id: any
) {

    if (!id) {
        throw new Error(
            "ID da obra é obrigatório."
        );
    }


    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("obras")
            .select(`
                id,
                nome,
                endereco,
                cliente_nome,
                arquiteto_empresa,
                data_inicio_esperada,
                valor,
                rdo_nome,
                marceneiro_nome,
                projetista_nome,
                dias_finalizacao_esperado,
                concluida,
                concluida_at,
                created_at,
                updated_at
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();

    if (error) {

        console.error(
            "Erro ao buscar obra:",
            error
        );

        throw new Error(
            error.message
        );
    }


    if (!data) {

        throw new Error(
            "Obra não encontrada."
        );
    }


    return data;
}


/*
=====================================================
LISTAR USUÁRIOS RESPONSÁVEIS
=====================================================
*/

async function listarUsuariosResponsaveis() {

    const {
        data: profiles,
        error: profilesError
    } =
        await supabaseAdmin
            .from("profiles")
            .select(`
                id,
                nome,
                username
            `)
            .order(
                "username",
                {
                    ascending: true
                }
            );

    if (profilesError) {

        console.error(
            "ERRO AO BUSCAR PROFILES:",
            profilesError
        );

        throw new Error(
            profilesError.message
        );
    }


    const usuarios: any[] = [];


    for (
        const profile
        of profiles || []
    ) {

        const {
            data: userRole,
            error: userRoleError
        } =
            await supabaseAdmin
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
                    profile.id
                )
                .maybeSingle();


        if (userRoleError) {

            console.error(
                "ERRO AO BUSCAR ROLE:",
                profile.id,
                userRoleError
            );

            continue;
        }


        const role =
            Array.isArray(
                userRole?.roles
            )
                ? userRole?.roles?.[0]
                : userRole?.roles;


        usuarios.push({

            id:
                profile.id,

            nome:
                profile.nome || "",

            username:
                profile.username || "",

            role_id:
                userRole?.role_id ?? null,

            role_nome:
                role?.nome || ""

        });
    }


    const usuariosValidos =
        usuarios.filter(
            usuario =>
                Boolean(
                    usuario.username
                )
        );


    const usuariosRdo =
        usuariosValidos.filter(
            usuario =>
                Number(
                    usuario.role_id
                ) === 3
        );


    const usuariosProjetistas =
        usuariosValidos.filter(
            usuario =>
                Number(
                    usuario.role_id
                ) === 3
        );


    const usuariosMarceneiros =
        usuariosValidos.filter(
            usuario =>
                Number(
                    usuario.role_id
                ) === 5
        );


    return {

        usuarios:
            usuariosValidos,

        usuariosRdo,

        usuariosMarceneiros,

        usuariosProjetistas

    };
}


/*
=====================================================
CRIAR OBRA
=====================================================
*/

async function criarObra(
    body: any
) {

    const obra =
        normalizarObra(
            body
        );


    validarObra(
        obra
    );


    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("obras")
            .insert({

                nome:
                    obra.nome,

                endereco:
                    obra.endereco ||
                    null,

                cliente_nome:
                    obra.cliente_nome ||
                    null,

                arquiteto_empresa:
                    obra.arquiteto_empresa ||
                    null,

                data_inicio_esperada:
                    obra.data_inicio_esperada,

                valor:
                    obra.valor,

                rdo_nome:
                    obra.rdo_nome ||
                    null,

                marceneiro_nome:
                    obra.marceneiro_nome ||
                    null,

                projetista_nome:
                    obra.projetista_nome ||
                    null,

                dias_finalizacao_esperado:
                    obra.dias_finalizacao_esperado,

                concluida:
                    false,

                concluida_at:
                    null

            })
            .select()
            .single();


    if (error) {

        console.error(
            "Erro ao criar obra:",
            error
        );

        throw new Error(
            error.message
        );
    }


    return data;
}


/*
=====================================================
EDITAR OBRA
=====================================================
*/

async function editarObra(
    body: any
) {

    const id =
        body?.id ??
        body?.obra_id;


    if (!id) {

        throw new Error(
            "ID da obra é obrigatório."
        );
    }


    const obra =
        normalizarObra(
            body
        );


    validarObra(
        obra
    );


    const obraAtual =
        await buscarObraPorId(
            id
        );


    const agora =
        new Date().toISOString();


    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("obras")
            .update({

                nome:
                    obra.nome,

                endereco:
                    obra.endereco ||
                    null,

                cliente_nome:
                    obra.cliente_nome ||
                    null,

                arquiteto_empresa:
                    obra.arquiteto_empresa ||
                    null,

                data_inicio_esperada:
                    obra.data_inicio_esperada,

                valor:
                    obra.valor,

                rdo_nome:
                    obra.rdo_nome ||
                    null,

                marceneiro_nome:
                    obra.marceneiro_nome ||
                    null,

                projetista_nome:
                    obra.projetista_nome ||
                    null,

                dias_finalizacao_esperado:
                    obra.dias_finalizacao_esperado,

                concluida:
                    obraAtual.concluida,

                concluida_at:
                    obraAtual.concluida_at,

                updated_at:
                    agora

            })
            .eq(
                "id",
                id
            )
            .select()
            .single();


    if (error) {

        console.error(
            "Erro ao editar obra:",
            error
        );

        throw new Error(
            error.message
        );
    }


    return data;
}


/*
=====================================================
CONCLUIR OBRA
=====================================================
*/

async function concluirObra(
    body: any,
    acesso: any
) {

    const id =
        body?.id ??
        body?.obra_id;


    if (!id) {

        throw new Error(
            "ID da obra é obrigatório."
        );
    }


    const obra =
        await buscarObraPorId(
            id
        );


    if (
        !usuarioPodeAcessarObra(
            obra,
            acesso,
            true
        )
    ) {

        throw new Error(
            "Você não possui permissão para concluir esta obra."
        );
    }


    if (
        obra.concluida === true
    ) {

        throw new Error(
            "Esta obra já está concluída."
        );
    }


    const agora =
        new Date().toISOString();


    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("obras")
            .update({

                concluida:
                    true,

                concluida_at:
                    agora,

                updated_at:
                    agora

            })
            .eq(
                "id",
                id
            )
            .eq(
                "concluida",
                false
            )
            .select()
            .single();


    if (error) {

        console.error(
            "Erro ao concluir obra:",
            error
        );

        throw new Error(
            error.message
        );
    }


    return data;
}


/*
=====================================================
DESCONCLUIR OBRA
=====================================================
*/

async function desconcluirObra(
    body: any,
    acesso: any
) {

    const id =
        body?.id ??
        body?.obra_id;


    if (!id) {

        throw new Error(
            "ID da obra é obrigatório."
        );
    }


    console.log(
        "===================================="
    );

    console.log(
        "DESCONCLUINDO OBRA:",
        id
    );


    const obra =
        await buscarObraPorId(
            id
        );


    /*
    =================================================
    VERIFICAR ACESSO
    =================================================
    */

    if (
        !usuarioPodeAcessarObra(
            obra,
            acesso,
            false
        )
    ) {

        throw new Error(
            "Você não possui permissão para desconcluir esta obra."
        );
    }


    /*
    =================================================
    VERIFICAR STATUS
    =================================================
    */

    if (
        obra.concluida !== true
    ) {

        throw new Error(
            "Esta obra já está em andamento."
        );
    }


    /*
    =================================================
    ALTERAR
    =================================================
    */

    const agora =
        new Date().toISOString();


    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("obras")
            .update({

                concluida:
                    false,

                concluida_at:
                    null,

                updated_at:
                    agora

            })
            .eq(
                "id",
                id
            )
            .eq(
                "concluida",
                true
            )
            .select()
            .single();


    if (error) {

        console.error(
            "ERRO AO DESCONCLUIR OBRA:",
            error
        );

        throw new Error(
            error.message
        );
    }


    console.log(
        "OBRA DESCONCLUÍDA COM SUCESSO:",
        data
    );


    return data;
}


/*
=====================================================
EXCLUIR OBRA
=====================================================
*/

async function excluirObra(
    body: any,
    acesso: any
) {

    const id =
        body?.id ??
        body?.obra_id;


    if (!id) {

        throw new Error(
            "ID da obra é obrigatório."
        );
    }


    const obra =
        await buscarObraPorId(
            id
        );


    if (
        !usuarioPodeAcessarObra(
            obra,
            acesso,
            false
        )
    ) {

        throw new Error(
            "Você não possui permissão para excluir esta obra."
        );
    }


    const {
        error
    } =
        await supabaseAdmin
            .from("obras")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Erro ao excluir obra:",
            error
        );

        throw new Error(
            error.message
        );
    }


    return {

        success:
            true,

        message:
            "Obra excluída com sucesso."

    };
}


/*
=====================================================
HANDLER
=====================================================
*/

Deno.serve(
    async (
        req
    ) => {

        /*
        =============================================
        CORS
        =============================================
        */

        if (
            req.method ===
            "OPTIONS"
        ) {

            return new Response(
                "ok",
                {
                    headers:
                        corsHeaders
                }
            );
        }


        try {

            /*
            =========================================
            VERIFICAR ACESSO
            =========================================
            */

            const acesso =
                await verificarProducao(
                    req
                );


            /*
            =========================================
            LER BODY
            =========================================
            */

            let body: any = {};


            if (
                req.method !==
                "GET"
            ) {

                try {

                    body =
                        await req.json();

                }
                catch (error) {

                    console.error(
                        "Erro ao ler JSON:",
                        error
                    );

                    throw new Error(
                        "Corpo da requisição inválido."
                    );
                }
            }


            /*
            =========================================
            ACTION
            =========================================
            */

            const action =
                body?.action ||
                (
                    req.method === "GET"
                        ? "list"
                        : req.method === "POST"
                            ? "create"
                            : req.method === "PUT"
                                ? "update"
                                : req.method === "DELETE"
                                    ? "delete"
                                    : ""
                );


            /*
            =========================================
            LOG
            =========================================
            */

            console.log(
                "===================================="
            );

            console.log(
                "ADMIN-OBRAS REQUEST"
            );

            console.log(
                "METHOD:",
                req.method
            );

            console.log(
                "ACTION:",
                action
            );

            console.log(
                "USER ID:",
                acesso.user.id
            );

            console.log(
                "USERNAME:",
                acesso.username
            );

            console.log(
                "ROLE:",
                acesso.roleId
            );

            console.log(
                "PODE VER TODAS:",
                acesso.podeVerTodasObras
            );

            console.log(
                "BODY:",
                JSON.stringify(body)
            );

            console.log(
                "===================================="
            );


            /*
            =========================================
            LISTAR ATIVAS
            =========================================
            */

            if (
                action ===
                "list"
            ) {

                const todasAsObras =
                    await listarTodasAsObras();


                const obrasAtivas =
                    todasAsObras.filter(
                        obra =>
                            obra.concluida !== true
                    );


                let obras: any[] = [];


                /*
                =====================================
                ADMINISTRATIVO GERAL
                =====================================
                */

                if (
                    acesso.roleId === 1
                ) {

                    obras =
                        obrasAtivas;
                }


                /*
                =====================================
                PRODUÇÃO GLOBAL
                =====================================
                */

                else if (
                    acesso.roleId === 3 &&
                    acesso.podeVerTodasObras === true
                ) {

                    obras =
                        obrasAtivas;
                }


                /*
                =====================================
                PRODUÇÃO NORMAL
                =====================================
                */

                else if (
                    acesso.roleId === 3
                ) {

                    obras =
                        filtrarObrasDoUsuario(
                            obrasAtivas,
                            acesso.username
                        );
                }


                const dadosUsuarios =
                    await listarUsuariosResponsaveis();


                return jsonResponse({

                    success:
                        true,

                    obras,

                    usuarios:
                        dadosUsuarios.usuarios,

                    usuariosRdo:
                        dadosUsuarios.usuariosRdo,

                    usuariosMarceneiros:
                        dadosUsuarios.usuariosMarceneiros,

                    usuariosProjetistas:
                        dadosUsuarios.usuariosProjetistas,

                    usuarioAtual: {

                        id:
                            acesso.user.id,

                        nome:
                            acesso.nome,

                        username:
                            acesso.username,

                        email:
                            acesso.email,

                        role_id:
                            acesso.roleId,

                        role:
                            acesso.roleNome,

                        pode_ver_todas_obras:
                            acesso.podeVerTodasObras

                    }

                });
            }


            /*
            =========================================
            LISTAR CONCLUÍDAS
            =========================================
            */

            if (
                action ===
                "list_concluidas"
            ) {

                const concluidas =
                    await listarObrasConcluidas();


                const dadosUsuarios =
                    await listarUsuariosResponsaveis();


                return jsonResponse({

                    success:
                        true,

                    obras:
                        concluidas,

                    usuarios:
                        dadosUsuarios.usuarios,

                    usuariosRdo:
                        dadosUsuarios.usuariosRdo,

                    usuariosMarceneiros:
                        dadosUsuarios.usuariosMarceneiros,

                    usuariosProjetistas:
                        dadosUsuarios.usuariosProjetistas,

                    usuarioAtual: {

                        id:
                            acesso.user.id,

                        nome:
                            acesso.nome,

                        username:
                            acesso.username,

                        email:
                            acesso.email,

                        role_id:
                            acesso.roleId,

                        role:
                            acesso.roleNome,

                        pode_ver_todas_obras:
                            acesso.podeVerTodasObras

                    }

                });
            }


            /*
            =========================================
            CRIAR
            =========================================
            */

            if (
                action ===
                "create"
            ) {

                const obra =
                    await criarObra(
                        body
                    );


                return jsonResponse(
                    {
                        success:
                            true,

                        obra
                    },
                    201
                );
            }


            /*
            =========================================
            CONCLUIR
            =========================================
            */

            if (
                action ===
                "complete"
            ) {

                const obra =
                    await concluirObra(
                        body,
                        acesso
                    );


                return jsonResponse({

                    success:
                        true,

                    obra

                });
            }


            /*
            =========================================
            DESCONCLUIR
            =========================================
            */

            if (
                action ===
                "uncomplete"
            ) {

                const obra =
                    await desconcluirObra(
                        body,
                        acesso
                    );


                return jsonResponse({

                    success:
                        true,

                    obra

                });
            }


            /*
            =========================================
            EDITAR
            =========================================
            */

            if (
                action ===
                "update"
            ) {

                const id =
                    body?.id ??
                    body?.obra_id;


                if (!id) {

                    throw new Error(
                        "ID da obra é obrigatório."
                    );
                }


                const obraAtual =
                    await buscarObraPorId(
                        id
                    );


                if (
                    !usuarioPodeAcessarObra(
                        obraAtual,
                        acesso,
                        false
                    )
                ) {

                    throw new Error(
                        "Você não possui permissão para editar esta obra."
                    );
                }


                const obra =
                    await editarObra(
                        body
                    );


                return jsonResponse({

                    success:
                        true,

                    obra

                });
            }


            /*
            =========================================
            EXCLUIR
            =========================================
            */

            if (
                action ===
                "delete"
            ) {

                const resultado =
                    await excluirObra(
                        body,
                        acesso
                    );


                return jsonResponse(
                    resultado
                );
            }


            /*
            =========================================
            ACTION DESCONHECIDA
            =========================================
            */

            return jsonResponse(
                {

                    success:
                        false,

                    error:
                        `Ação "${action}" não reconhecida.`

                },
                400
            );

        }
        catch (
            error
        ) {

            console.error(
                "===================================="
            );

            console.error(
                "ADMIN-OBRAS ERROR:",
                error
            );

            console.error(
                "===================================="
            );


            return jsonResponse(

                {

                    success:
                        false,

                    error:

                        error instanceof Error

                            ? error.message

                            : "Erro interno."

                },

                400

            );
        }
    }
);