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

Usado para validar o usuário autenticado.

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

Usado somente dentro da Edge Function.

A SERVICE ROLE KEY nunca vai para o React.

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

                "Content-Type":
                    "application/json",
            },
        }
    );
}


/*
=====================================================
NORMALIZAR TEXTO
=====================================================

Usado para comparar usernames sem diferença
entre maiúsculas/minúsculas ou espaços.

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
VERIFICAR PERMISSÃO
=====================================================

Permitidos:

ROLE 1
Administrativo Geral

ROLE 3
Produção

Além disso:

ROLE 3 + pode_ver_todas_obras = true

→ pode visualizar todas as obras.

=====================================================
*/

async function verificarProducao(
    req: Request
) {

    /*
    =================================================
    BUSCAR AUTHORIZATION
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
    EXTRAIR TOKEN
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
    EXTRAIR ROLE
    =================================================
    */

    const roleNome =
        Array.isArray(
            userRole?.roles
        )
            ? userRole?.roles?.[0]?.nome
            : userRole?.roles?.nome;


    /*
    =================================================
    ROLE ID
    =================================================
    */

    const roleId =
        Number(
            userRole?.role_id
        );


    /*
    =================================================
    BUSCAR PROFILE
    =================================================

    Aqui buscamos os dados reais do usuário.

    IMPORTANTE:
    A permissão de visualizar todas as obras
    vem da tabela profiles.

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

    ROLE 1:
    sempre pode ver tudo.

    ROLE 3:
    somente pode ver tudo quando
    pode_ver_todas_obras = true.

    =================================================
    */

    const podeVerTodasObras =
        roleId === 1 ||
        profile?.pode_ver_todas_obras === true;


    /*
    =================================================
    VERIFICAR ACESSO À FUNÇÃO
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
        "USUÁRIO:",
        user.email
    );

    console.log(
        "USER ID:",
        user.id
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
        "PODE VER TODAS AS OBRAS:",
        podeVerTodasObras
    );

    console.log(
        "===================================="
    );


    /*
    =================================================
    RETORNO
    =================================================
    */

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
    RDO
    =================================================
    */

    const rdo_nome =
        String(
            body?.rdo_nome ??
            body?.rdo ??
            ""
        ).trim();


    /*
    =================================================
    MARCENEIRO
    =================================================
    */

    const marceneiro_nome =
        String(
            body?.marceneiro_nome ??
            body?.marceneiro ??
            ""
        ).trim();


    /*
    =================================================
    PROJETISTA
    =================================================
    */

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

        dias_finalizacao_esperado =
            null;

    }
    else {

        dias_finalizacao_esperado =
            Number(
                dias_finalizacao_esperado
            );
    }


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

        dias_finalizacao_esperado

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
FILTRAR OBRAS DO USUÁRIO
=====================================================

A Produção normal só visualiza obras em que
o próprio username esteja relacionado em:

- rdo_nome
- marceneiro_nome
- projetista_nome

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


    /*
    =================================================
    SEM USERNAME
    =================================================
    */

    if (!usernameNormalizado) {

        return [];
    }


    /*
    =================================================
    FILTRAR
    =================================================
    */

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
LISTAR USUÁRIOS RESPONSÁVEIS
=====================================================

Retorna todos os usuários que possuem username.

Também retorna:

- role_id
- role_nome

Usado para os selects de:

- RDO
- Marceneiro
- Projetista

=====================================================
*/

async function listarUsuariosResponsaveis() {

    /*
    =================================================
    BUSCAR PROFILES
    =================================================
    */

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


    /*
    =================================================
    ARRAY
    =================================================
    */

    const usuarios: any[] = [];


    /*
    =================================================
    BUSCAR ROLE DE CADA USUÁRIO
    =================================================
    */

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


    /*
    =================================================
    SOMENTE USUÁRIOS COM USERNAME
    =================================================
    */

    const usuariosValidos =
        usuarios.filter(
            usuario =>
                Boolean(
                    usuario.username
                )
        );


    /*
    =================================================
    RDO
    ROLE 3
    =================================================
    */

    const usuariosRdo =
        usuariosValidos.filter(
            usuario =>
                Number(
                    usuario.role_id
                ) === 3
        );


    /*
    =================================================
    PROJETISTAS
    ROLE 3
    =================================================
    */

    const usuariosProjetistas =
        usuariosValidos.filter(
            usuario =>
                Number(
                    usuario.role_id
                ) === 3
        );


    /*
    =================================================
    MARCENEIROS
    ROLE 5
    =================================================
    */

    const usuariosMarceneiros =
        usuariosValidos.filter(
            usuario =>
                Number(
                    usuario.role_id
                ) === 5
        );


    /*
    =================================================
    LOG
    =================================================
    */

    console.log(
        "===================================="
    );

    console.log(
        "USUÁRIOS RESPONSÁVEIS:",
        usuariosValidos
    );

    console.log(
        "RDO:",
        usuariosRdo
    );

    console.log(
        "MARCENEIROS:",
        usuariosMarceneiros
    );

    console.log(
        "PROJETISTAS:",
        usuariosProjetistas
    );

    console.log(
        "===================================="
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
                    obra.dias_finalizacao_esperado

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

                updated_at:
                    new Date().toISOString()

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
EXCLUIR OBRA
=====================================================
*/

async function excluirObra(
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
        =================================================
        CORS
        =================================================
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
            =================================================
            VERIFICAR ACESSO
            =================================================
            */

            const acesso =
                await verificarProducao(
                    req
                );


            /*
            =================================================
            LER BODY
            =================================================
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
            =================================================
            ACTION
            =================================================
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
                "METHOD:",
                req.method
            );

            console.log(
                "ACTION:",
                action
            );

            console.log(
                "ROLE ID:",
                acesso.roleId
            );

            console.log(
                "USERNAME:",
                acesso.username
            );

            console.log(
                "PODE VER TODAS:",
                acesso.podeVerTodasObras
            );

            console.log(
                "===================================="
            );


            /*
            =================================================
            LISTAR
            =================================================
            */

            if (
                action ===
                "list"
            ) {

                /*
                =============================================
                BUSCAR TODAS AS OBRAS
                =============================================
                */

                const todasAsObras =
                    await listarTodasAsObras();


                /*
                =============================================
                APLICAR REGRA DE VISUALIZAÇÃO
                =============================================
                */

                let obras: any[] = [];


                /*
                =============================================
                ADMINISTRATIVO GERAL
                ROLE 1
                → VÊ TUDO
                =============================================
                */

                if (
                    acesso.roleId === 1
                ) {

                    obras =
                        todasAsObras;
                }


                /*
                =============================================
                PRODUÇÃO COM PERMISSÃO ESPECIAL
                ROLE 3
                pode_ver_todas_obras = true
                → VÊ TUDO
                =============================================
                */

                else if (
                    acesso.roleId === 3 &&
                    acesso.podeVerTodasObras === true
                ) {

                    obras =
                        todasAsObras;
                }


                /*
                =============================================
                PRODUÇÃO NORMAL
                ROLE 3
                pode_ver_todas_obras = false
                → VÊ SOMENTE AS SUAS OBRAS
                =============================================
                */

                else if (
                    acesso.roleId === 3
                ) {

                    obras =
                        filtrarObrasDoUsuario(
                            todasAsObras,
                            acesso.username
                        );
                }


                /*
                =============================================
                BUSCAR USUÁRIOS
                =============================================
                */

                const dadosUsuarios =
                    await listarUsuariosResponsaveis();


                /*
                =============================================
                RETORNO
                =============================================
                */

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
            =================================================
            CRIAR
            =================================================
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
            =================================================
            EDITAR
            =================================================
            */

            if (
                action ===
                "update"
            ) {

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
            =================================================
            EXCLUIR
            =================================================
            */

            if (
                action ===
                "delete"
            ) {

                const resultado =
                    await excluirObra(
                        body
                    );


                return jsonResponse(
                    resultado
                );
            }


            /*
            =================================================
            ACTION DESCONHECIDA
            =================================================
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