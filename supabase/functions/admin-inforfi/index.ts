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
SUPABASE
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
CLIENTES
=====================================================
*/

const supabaseAuth =
    createClient(
        supabaseUrl,
        supabaseAnonKey
    );


const supabaseAdmin =
    createClient(
        supabaseUrl,
        supabaseServiceRoleKey
    );


/*
=====================================================
JSON RESPONSE
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
NORMALIZAR VALOR
=====================================================
*/

function normalizarValor(
    valor: unknown
) {

    if (

        valor === "" ||

        valor === null ||

        valor === undefined

    ) {

        return null;

    }


    const numero =
        Number(valor);


    if (
        Number.isNaN(numero)
    ) {

        throw new Error(
            "Um dos valores financeiros é inválido."
        );

    }


    if (
        numero < 0
    ) {

        throw new Error(
            "Os valores financeiros não podem ser negativos."
        );

    }


    return numero;

}


/*
=====================================================
VERIFICAR PERMISSÃO
=====================================================
*/

async function verificarProducao(
    req: Request
) {

    const authHeader =
        req.headers.get(
            "Authorization"
        );


    if (!authHeader) {

        throw new Error(
            "Usuário não autenticado."
        );

    }


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

        throw new Error(
            "Sessão inválida ou expirada."
        );

    }


    /*
    =================================================
    ROLE
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

        throw new Error(
            "Não foi possível verificar a permissão."
        );

    }


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
    PROFILE
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

        throw new Error(
            "Não foi possível carregar o perfil do usuário."
        );

    }


    /*
    =================================================
    PERMISSÃO GLOBAL
    =================================================
    */

    const podeVerTodasObras =

        roleId === 1 ||

        (

            roleId === 3 &&

            profile?.pode_ver_todas_obras === true

        );


    if (

        roleId !== 1 &&

        roleId !== 3

    ) {

        throw new Error(
            "Você não possui permissão para acessar as informações financeiras."
        );

    }


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

    acesso: any

) {

    if (

        acesso.roleId === 1

    ) {

        return true;

    }


    if (

        acesso.roleId === 3 &&

        acesso.podeVerTodasObras === true

    ) {

        return true;

    }


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
BUSCAR OBRAS
=====================================================
*/

async function listarObras() {

    const {

        data,

        error

    } =

        await supabaseAdmin
            .from("obras")
            .select(`
                id,
                nome,
                rdo_nome,
                marceneiro_nome,
                projetista_nome,
                concluida,
                concluida_at
            `)
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (error) {

        throw new Error(
            error.message
        );

    }


    return data || [];

}


/*
=====================================================
BUSCAR INFORMAÇÕES FINANCEIRAS
=====================================================
*/

async function listarInformacoesFinanceiras() {

    const {

        data,

        error

    } =

        await supabaseAdmin
            .from("informacoes_financeiras_obras")
            .select(`
                id,
                obra_id,
                teto_custo,
                meta_custo,
                valor_contrato,
                comissao_bonificacao_taxa,
                valor_destinado_producao,
                expectativa_ganho_marceneiro,
                outros,
                created_at,
                updated_at
            `);


    if (error) {

        throw new Error(
            error.message
        );

    }


    return data || [];

}


/*
=====================================================
LISTAR TUDO
=====================================================
*/

async function listarDados(
    acesso: any
) {

    const obras =
        await listarObras();


    let obrasVisiveis =

        obras;


    /*
    =================================================
    FILTRAGEM
    =================================================
    */

    if (

        acesso.roleId === 3 &&

        acesso.podeVerTodasObras !== true

    ) {

        obrasVisiveis =

            filtrarObrasDoUsuario(

                obras,

                acesso.username

            );

    }


    const informacoes =

        await listarInformacoesFinanceiras();


    /*
    =================================================
    MAPEAR INFORMAÇÕES
    =================================================
    */

    const mapa =
        new Map();


    for (

        const info

        of informacoes

    ) {

        mapa.set(

            String(
                info.obra_id
            ),

            info

        );

    }


    /*
    =================================================
    ADICIONAR FINANCEIRO À OBRA
    =================================================
    */

    const obrasFormatadas =

        obrasVisiveis.map(

            obra => ({

                ...obra,

                informacaoFinanceira:

                    mapa.get(
                        String(obra.id)
                    ) ||

                    null

            })

        );


    /*
    =================================================
    SEPARAR ATIVAS E CONCLUÍDAS
    =================================================
    */

    const obrasAtivas =

        obrasFormatadas.filter(

            obra =>
                obra.concluida !== true

        );


    const obrasConcluidas =

        obrasFormatadas.filter(

            obra =>
                obra.concluida === true

        );


    return {

        obrasAtivas,

        obrasConcluidas

    };

}


/*
=====================================================
CRIAR INFORMAÇÃO FINANCEIRA
=====================================================
*/

async function criarInformacao(

    body: any,

    acesso: any

) {

    const obraId =
        body?.obra_id;


    if (!obraId) {

        throw new Error(
            "A obra é obrigatória."
        );

    }


    /*
    =================================================
    BUSCAR OBRA
    =================================================
    */

    const {

        data: obra,

        error: obraError

    } =

        await supabaseAdmin
            .from("obras")
            .select(`
                id,
                nome,
                rdo_nome,
                marceneiro_nome,
                projetista_nome,
                concluida
            `)
            .eq(
                "id",
                obraId
            )
            .maybeSingle();


    if (obraError) {

        throw new Error(
            obraError.message
        );

    }


    if (!obra) {

        throw new Error(
            "Obra não encontrada."
        );

    }


    /*
    =================================================
    VERIFICAR ACESSO
    =================================================
    */

    if (

        !usuarioPodeAcessarObra(
            obra,
            acesso
        )

    ) {

        throw new Error(
            "Você não possui permissão para acessar esta obra."
        );

    }


    /*
    =================================================
    NÃO PERMITIR CONCLUÍDA
    =================================================
    */

    if (
        obra.concluida === true
    ) {

        throw new Error(
            "Não é possível criar informações financeiras para uma obra concluída."
        );

    }


    /*
    =================================================
    VERIFICAR DUPLICIDADE
    =================================================
    */

    const {

        data: existente

    } =

        await supabaseAdmin
            .from("informacoes_financeiras_obras")
            .select("id")
            .eq(
                "obra_id",
                obraId
            )
            .maybeSingle();


    if (existente) {

        throw new Error(
            "Esta obra já possui informações financeiras cadastradas."
        );

    }


    /*
    =================================================
    VALORES
    =================================================
    */

    const valores = {

        teto_custo:
            normalizarValor(
                body?.teto_custo
            ),

        meta_custo:
            normalizarValor(
                body?.meta_custo
            ),

        valor_contrato:
            normalizarValor(
                body?.valor_contrato
            ),

        comissao_bonificacao_taxa:
            normalizarValor(
                body?.comissao_bonificacao_taxa
            ),

        valor_destinado_producao:
            normalizarValor(
                body?.valor_destinado_producao
            ),

        expectativa_ganho_marceneiro:
            normalizarValor(
                body?.expectativa_ganho_marceneiro
            ),

        outros:
            normalizarValor(
                body?.outros
            )

    };


    /*
    =================================================
    INSERIR
    =================================================
    */

    const {

        data,

        error

    } =

        await supabaseAdmin
            .from("informacoes_financeiras_obras")
            .insert({

                obra_id:
                    obraId,

                ...valores

            })
            .select()
            .single();


    if (error) {

        throw new Error(
            error.message
        );

    }


    return data;

}


/*
=====================================================
EDITAR INFORMAÇÃO FINANCEIRA
=====================================================
*/

async function editarInformacao(

    body: any,

    acesso: any

) {

    const id =
        body?.id;


    if (!id) {

        throw new Error(
            "ID da informação financeira é obrigatório."
        );

    }


    const {

        data: informacao,

        error: informacaoError

    } =

        await supabaseAdmin
            .from("informacoes_financeiras_obras")
            .select(`
                id,
                obra_id
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();


    if (informacaoError) {

        throw new Error(
            informacaoError.message
        );

    }


    if (!informacao) {

        throw new Error(
            "Informação financeira não encontrada."
        );

    }


    const {

        data: obra,

        error: obraError

    } =

        await supabaseAdmin
            .from("obras")
            .select(`
                id,
                concluida,
                rdo_nome,
                marceneiro_nome,
                projetista_nome
            `)
            .eq(
                "id",
                informacao.obra_id
            )
            .maybeSingle();


    if (obraError) {

        throw new Error(
            obraError.message
        );

    }


    if (!obra) {

        throw new Error(
            "Obra vinculada não encontrada."
        );

    }


    if (

        !usuarioPodeAcessarObra(
            obra,
            acesso
        )

    ) {

        throw new Error(
            "Você não possui permissão para editar esta informação financeira."
        );

    }


    if (
        obra.concluida === true
    ) {

        throw new Error(
            "Não é possível editar informações financeiras de uma obra concluída."
        );

    }


    const valores = {

        teto_custo:
            normalizarValor(
                body?.teto_custo
            ),

        meta_custo:
            normalizarValor(
                body?.meta_custo
            ),

        valor_contrato:
            normalizarValor(
                body?.valor_contrato
            ),

        comissao_bonificacao_taxa:
            normalizarValor(
                body?.comissao_bonificacao_taxa
            ),

        valor_destinado_producao:
            normalizarValor(
                body?.valor_destinado_producao
            ),

        expectativa_ganho_marceneiro:
            normalizarValor(
                body?.expectativa_ganho_marceneiro
            ),

        outros:
            normalizarValor(
                body?.outros
            ),

        updated_at:
            new Date().toISOString()

    };


    const {

        data,

        error

    } =

        await supabaseAdmin
            .from("informacoes_financeiras_obras")
            .update(
                valores
            )
            .eq(
                "id",
                id
            )
            .select()
            .single();


    if (error) {

        throw new Error(
            error.message
        );

    }


    return data;

}


/*
=====================================================
EXCLUIR INFORMAÇÃO FINANCEIRA
=====================================================
*/

async function excluirInformacao(

    body: any,

    acesso: any

) {

    const id =
        body?.id;


    if (!id) {

        throw new Error(
            "ID da informação financeira é obrigatório."
        );

    }


    const {

        data: informacao,

        error: informacaoError

    } =

        await supabaseAdmin
            .from("informacoes_financeiras_obras")
            .select(`
                id,
                obra_id
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();


    if (informacaoError) {

        throw new Error(
            informacaoError.message
        );

    }


    if (!informacao) {

        throw new Error(
            "Informação financeira não encontrada."
        );

    }


    const {

        data: obra,

        error: obraError

    } =

        await supabaseAdmin
            .from("obras")
            .select(`
                id,
                concluida,
                rdo_nome,
                marceneiro_nome,
                projetista_nome
            `)
            .eq(
                "id",
                informacao.obra_id
            )
            .maybeSingle();


    if (obraError) {

        throw new Error(
            obraError.message
        );

    }


    if (!obra) {

        throw new Error(
            "Obra vinculada não encontrada."
        );

    }


    if (

        !usuarioPodeAcessarObra(
            obra,
            acesso
        )

    ) {

        throw new Error(
            "Você não possui permissão para excluir esta informação financeira."
        );

    }


    const {

        error

    } =

        await supabaseAdmin
            .from("informacoes_financeiras_obras")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        throw new Error(
            error.message
        );

    }


    return {

        success:
            true,

        message:
            "Informação financeira excluída com sucesso."

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
            PERMISSÃO
            =========================================
            */

            const acesso =

                await verificarProducao(
                    req
                );


            /*
            =========================================
            BODY
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

                catch {

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


            console.log(
                "===================================="
            );

            console.log(
                "ADMIN-INFORFI"
            );

            console.log(
                "ACTION:",
                action
            );

            console.log(
                "USER:",
                acesso.username
            );

            console.log(
                "ROLE:",
                acesso.roleId
            );

            console.log(
                "===================================="
            );


            /*
            =========================================
            LISTAR
            =========================================
            */

            if (

                action ===
                "list"

            ) {

                const resultado =

                    await listarDados(
                        acesso
                    );


                return jsonResponse({

                    success:
                        true,

                    ...resultado,

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

                const resultado =

                    await criarInformacao(

                        body,

                        acesso

                    );


                return jsonResponse({

                    success:
                        true,

                    informacao:
                        resultado

                }, 201);

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

                const resultado =

                    await editarInformacao(

                        body,

                        acesso

                    );


                return jsonResponse({

                    success:
                        true,

                    informacao:
                        resultado

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

                    await excluirInformacao(

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

        catch (error) {

            console.error(
                "ADMIN-INFORFI ERROR:",
                error
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