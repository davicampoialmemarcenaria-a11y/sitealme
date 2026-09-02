import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =====================================================
   CORS
===================================================== */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "GET, POST, PUT, DELETE, OPTIONS",
};

/* =====================================================
   SUPABASE
===================================================== */

const supabaseUrl =
    Deno.env.get("SUPABASE_URL")!;

const supabaseAnonKey =
    Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseServiceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

const STORAGE_BUCKET =
    "documentos-clientes";

/* =====================================================
   JSON RESPONSE
===================================================== */

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

/* =====================================================
   NORMALIZAR TEXTO
===================================================== */

function normalizarTexto(
    valor: unknown
) {
    return String(
        valor ?? ""
    )
        .trim()
        .toLowerCase();
}

/* =====================================================
   VERIFICAR PERMISSÃO
===================================================== */

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

    /* =================================================
       VALIDAR TOKEN
    ================================================= */

    const {
        data: {
            user
        },
        error
    } =
        await supabaseAuth
            .auth
            .getUser(token);

    if (
        error ||
        !user
    ) {
        throw new Error(
            "Sessão inválida ou expirada."
        );
    }

    /* =================================================
       ROLE
    ================================================= */

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

    /* =================================================
       PROFILE
    ================================================= */

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

    /* =================================================
       PERMISSÃO GLOBAL
    ================================================= */

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
            "Você não possui permissão para acessar os documentos das obras."
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

/* =====================================================
   FILTRAR OBRAS DO USUÁRIO
===================================================== */

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
        (obra) => {

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

/* =====================================================
   VERIFICAR ACESSO À OBRA
===================================================== */

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

/* =====================================================
   BUSCAR OBRA
===================================================== */

async function buscarObra(
    obraId: number
) {
    const {
        data: obra,
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
                concluida
            `)
            .eq(
                "id",
                obraId
            )
            .maybeSingle();

    if (error) {
        throw new Error(
            error.message
        );
    }

    if (!obra) {
        throw new Error(
            "Obra não encontrada."
        );
    }

    return obra;
}

/* =====================================================
   LISTAR OBRAS
===================================================== */

async function listarObras(
    acesso: any
) {
    const {
        data: obras,
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
            .eq(
                "concluida",
                false
            )
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

    let obrasVisiveis =
        obras || [];

    /* =================================================
       FILTRAR ROLE 3
    ================================================= */

    if (
        acesso.roleId === 3 &&
        acesso.podeVerTodasObras !== true
    ) {
        obrasVisiveis =
            filtrarObrasDoUsuario(
                obrasVisiveis,
                acesso.username
            );
    }

    return obrasVisiveis;
}

/* =====================================================
   LISTAR DOCUMENTOS
===================================================== */

async function listarDocumentos(
    acesso: any
) {
    const obras =
        await listarObras(
            acesso
        );

    if (
        obras.length === 0
    ) {
        return [];
    }

    const obraIds =
        obras.map(
            (obra) =>
                obra.id
        );

    const {
        data: documentos,
        error
    } =
        await supabaseAdmin
            .from("documentos_cliente")
            .select(`
                id,
                obra_id,
                nome,
                nome_arquivo,
                tipo,
                extensao,
                mime_type,
                tamanho,
                storage_path,
                created_at,
                updated_at
            `)
            .in(
                "obra_id",
                obraIds
            )
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

    const mapaObras =
        new Map(
            obras.map(
                (obra) => [
                    String(obra.id),
                    obra
                ]
            )
        );

    return (
        documentos || []
    ).map(
        (documento) => ({
            ...documento,
            obra:
                mapaObras.get(
                    String(
                        documento.obra_id
                    )
                ) || null
        })
    );
}

/* =====================================================
   CRIAR URL DE UPLOAD
===================================================== */

async function criarUrlUpload(
    body: any,
    acesso: any
) {
    const obraId =
        Number(
            body?.obra_id
        );

    if (!obraId) {
        throw new Error(
            "A obra é obrigatória."
        );
    }

    const obra =
        await buscarObra(
            obraId
        );

    if (
        obra.concluida === true
    ) {
        throw new Error(
            "Não é possível adicionar documentos a uma obra concluída."
        );
    }

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

    const extensao =
        String(
            body?.extensao ||
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /^\./,
                ""
            );

    if (!extensao) {
        throw new Error(
            "A extensão do arquivo é obrigatória."
        );
    }

    const uuid =
        crypto.randomUUID();

    const pastaTipo =
        String(
            body?.tipo ||
            "outros"
        )
            .trim()
            .toLowerCase();

    const path =
        `${obraId}/${pastaTipo}/${uuid}.${extensao}`;

    const {
        data,
        error
    } =
        await supabaseAdmin
            .storage
            .from(
                STORAGE_BUCKET
            )
            .createSignedUploadUrl(
                path
            );

    if (error) {
        throw new Error(
            error.message
        );
    }

    return {
        path,
        token:
            data?.token
    };
}

/* =====================================================
   CRIAR DOCUMENTO
===================================================== */

async function criarDocumento(
    body: any,
    acesso: any
) {
    const obraId =
        Number(
            body?.obra_id
        );

    if (!obraId) {
        throw new Error(
            "A obra é obrigatória."
        );
    }

    const nome =
        String(
            body?.nome ||
            ""
        ).trim();

    if (!nome) {
        throw new Error(
            "O nome do documento é obrigatório."
        );
    }

    const nomeArquivo =
        String(
            body?.nome_arquivo ||
            ""
        ).trim();

    if (!nomeArquivo) {
        throw new Error(
            "O nome do arquivo é obrigatório."
        );
    }

    const storagePath =
        String(
            body?.storage_path ||
            ""
        ).trim();

    if (!storagePath) {
        throw new Error(
            "O caminho do arquivo é obrigatório."
        );
    }

    const obra =
        await buscarObra(
            obraId
        );

    if (
        obra.concluida === true
    ) {
        throw new Error(
            "Não é possível adicionar documentos a uma obra concluída."
        );
    }

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

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from(
                "documentos_cliente"
            )
            .insert({
                obra_id:
                    obraId,

                nome,

                nome_arquivo:
                    nomeArquivo,

                tipo:
                    String(
                        body?.tipo ||
                        "outros"
                    ).trim(),

                extensao:
                    body?.extensao
                        ? String(
                            body.extensao
                        )
                            .trim()
                            .toLowerCase()
                        : null,

                mime_type:
                    body?.mime_type
                        ? String(
                            body.mime_type
                        ).trim()
                        : null,

                tamanho:
                    body?.tamanho
                        ? Number(
                            body.tamanho
                        )
                        : null,

                storage_path:
                    storagePath
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

/* =====================================================
   EDITAR DOCUMENTO
===================================================== */

async function editarDocumento(
    body: any,
    acesso: any
) {
    const id =
        Number(
            body?.id
        );

    if (!id) {
        throw new Error(
            "ID do documento é obrigatório."
        );
    }

    const {
        data: documento,
        error: documentoError
    } =
        await supabaseAdmin
            .from(
                "documentos_cliente"
            )
            .select(`
                id,
                obra_id,
                storage_path
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();

    if (documentoError) {
        throw new Error(
            documentoError.message
        );
    }

    if (!documento) {
        throw new Error(
            "Documento não encontrado."
        );
    }

    const obra =
        await buscarObra(
            Number(
                documento.obra_id
            )
        );

    if (
        !usuarioPodeAcessarObra(
            obra,
            acesso
        )
    ) {
        throw new Error(
            "Você não possui permissão para editar este documento."
        );
    }

    if (
        obra.concluida === true
    ) {
        throw new Error(
            "Não é possível editar documentos de uma obra concluída."
        );
    }

    const atualizacao: any = {
        updated_at:
            new Date().toISOString()
    };

    if (
        body?.nome !== undefined
    ) {
        const nome =
            String(
                body.nome
            ).trim();

        if (!nome) {
            throw new Error(
                "O nome do documento é obrigatório."
            );
        }

        atualizacao.nome =
            nome;
    }

    if (
        body?.tipo !== undefined
    ) {
        atualizacao.tipo =
            String(
                body.tipo
            ).trim();
    }

    if (
        body?.nome_arquivo !== undefined
    ) {
        atualizacao.nome_arquivo =
            String(
                body.nome_arquivo
            ).trim();
    }

    if (
        body?.extensao !== undefined
    ) {
        atualizacao.extensao =
            String(
                body.extensao
            )
                .trim()
                .toLowerCase();
    }

    if (
        body?.mime_type !== undefined
    ) {
        atualizacao.mime_type =
            body.mime_type
                ? String(
                    body.mime_type
                ).trim()
                : null;
    }

    if (
        body?.tamanho !== undefined
    ) {
        atualizacao.tamanho =
            body.tamanho
                ? Number(
                    body.tamanho
                )
                : null;
    }

    if (
        body?.storage_path
    ) {
        atualizacao.storage_path =
            String(
                body.storage_path
            ).trim();
    }

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from(
                "documentos_cliente"
            )
            .update(
                atualizacao
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

    return {
        documento: data,
        antigoStoragePath:
            documento.storage_path
    };
}

/* =====================================================
   EXCLUIR DOCUMENTO
===================================================== */

async function excluirDocumento(
    body: any,
    acesso: any
) {
    const id =
        Number(
            body?.id
        );

    if (!id) {
        throw new Error(
            "ID do documento é obrigatório."
        );
    }

    const {
        data: documento,
        error: documentoError
    } =
        await supabaseAdmin
            .from(
                "documentos_cliente"
            )
            .select(`
                id,
                obra_id,
                storage_path
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();

    if (documentoError) {
        throw new Error(
            documentoError.message
        );
    }

    if (!documento) {
        throw new Error(
            "Documento não encontrado."
        );
    }

    const obra =
        await buscarObra(
            Number(
                documento.obra_id
            )
        );

    if (
        !usuarioPodeAcessarObra(
            obra,
            acesso
        )
    ) {
        throw new Error(
            "Você não possui permissão para excluir este documento."
        );
    }

    /* =================================================
       EXCLUIR ARQUIVO
    ================================================= */

    if (
        documento.storage_path
    ) {
        const {
            error: storageError
        } =
            await supabaseAdmin
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .remove([
                    documento.storage_path
                ]);

        if (storageError) {
            console.error(
                "Erro ao excluir arquivo:",
                storageError
            );
        }
    }

    /* =================================================
       EXCLUIR REGISTRO
    ================================================= */

    const {
        error
    } =
        await supabaseAdmin
            .from(
                "documentos_cliente"
            )
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
            "Documento excluído com sucesso."
    };
}

/* =====================================================
   URL ASSINADA PARA VISUALIZAÇÃO/DOWNLOAD
===================================================== */

async function criarUrlDocumento(
    body: any,
    acesso: any
) {
    const id =
        Number(
            body?.id
        );

    if (!id) {
        throw new Error(
            "ID do documento é obrigatório."
        );
    }

    const {
        data: documento,
        error
    } =
        await supabaseAdmin
            .from(
                "documentos_cliente"
            )
            .select(`
                id,
                obra_id,
                storage_path
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();

    if (error) {
        throw new Error(
            error.message
        );
    }

    if (!documento) {
        throw new Error(
            "Documento não encontrado."
        );
    }

    const obra =
        await buscarObra(
            Number(
                documento.obra_id
            )
        );

    if (
        !usuarioPodeAcessarObra(
            obra,
            acesso
        )
    ) {
        throw new Error(
            "Você não possui permissão para acessar este documento."
        );
    }

    const {
        data,
        error: signedError
    } =
        await supabaseAdmin
            .storage
            .from(
                STORAGE_BUCKET
            )
            .createSignedUrl(
                documento.storage_path,
                3600
            );

    if (signedError) {
        throw new Error(
            signedError.message
        );
    }

    return {
        url:
            data?.signedUrl
    };
}

/* =====================================================
   HANDLER
===================================================== */

Deno.serve(
    async (
        req
    ) => {

        /* =============================================
           CORS
        ============================================= */

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

            /* =========================================
               PERMISSÃO
            ========================================= */

            const acesso =
                await verificarProducao(
                    req
                );

            /* =========================================
               BODY
            ========================================= */

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

            /* =========================================
               ACTION
            ========================================= */

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
                "ADMIN-DOCUMENTOS"
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

            /* =========================================
               LISTAR
            ========================================= */

            if (
                action ===
                "list"
            ) {
                const obras =
                    await listarObras(
                        acesso
                    );

                const documentos =
                    await listarDocumentos(
                        acesso
                    );

                return jsonResponse({
                    success:
                        true,

                    obras,

                    documentos,

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

            /* =========================================
               CRIAR URL DE UPLOAD
            ========================================= */

            if (
                action ===
                "create_upload_url"
            ) {
                const resultado =
                    await criarUrlUpload(
                        body,
                        acesso
                    );

                return jsonResponse({
                    success:
                        true,
                    ...resultado
                });
            }

            /* =========================================
               CRIAR
            ========================================= */

            if (
                action ===
                "create"
            ) {
                const resultado =
                    await criarDocumento(
                        body,
                        acesso
                    );

                return jsonResponse(
                    {
                        success:
                            true,
                        documento:
                            resultado
                    },
                    201
                );
            }

            /* =========================================
               EDITAR
            ========================================= */

            if (
                action ===
                "update"
            ) {
                const resultado =
                    await editarDocumento(
                        body,
                        acesso
                    );

                return jsonResponse({
                    success:
                        true,
                    ...resultado
                });
            }

            /* =========================================
               EXCLUIR
            ========================================= */

            if (
                action ===
                "delete"
            ) {
                const resultado =
                    await excluirDocumento(
                        body,
                        acesso
                    );

                return jsonResponse(
                    resultado
                );
            }

            /* =========================================
               URL DOCUMENTO
            ========================================= */

            if (
                action ===
                "signed_url"
            ) {
                const resultado =
                    await criarUrlDocumento(
                        body,
                        acesso
                    );

                return jsonResponse({
                    success:
                        true,
                    ...resultado
                });
            }

            /* =========================================
               ACTION DESCONHECIDA
            ========================================= */

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
                "ADMIN-DOCUMENTOS ERROR:",
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