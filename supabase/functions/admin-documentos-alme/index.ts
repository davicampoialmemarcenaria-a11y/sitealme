import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "GET, POST, PUT, DELETE, OPTIONS"
};

const supabaseUrl =
    Deno.env.get("SUPABASE_URL") ?? "";

const supabaseAnonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const supabaseServiceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const BUCKET =
    "documentos-alme";

const TIPOS_VALIDOS = [
    "imagens",
    "sketchup",
    "pdf",
    "documentos",
    "planilhas",
    "outros"
];

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


/* ============================================================
   RESPONSE
============================================================ */

function jsonResponse(
    body: unknown,
    status = 200
) {

    return new Response(
        JSON.stringify(body),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type":
                    "application/json"
            }
        }
    );

}


/* ============================================================
   ERRO
============================================================ */

function getErrorMessage(
    error: unknown
) {

    if (
        error instanceof Error
    ) {
        return error.message;
    }

    if (
        typeof error === "string"
    ) {
        return error;
    }

    try {

        return JSON.stringify(
            error
        );

    } catch {

        return "Erro desconhecido.";

    }

}


/* ============================================================
   AUTH
============================================================ */

async function verificarUsuario(
    req: Request
) {

    const authorization =
        req.headers.get(
            "Authorization"
        );

    if (
        !authorization ||
        !authorization.startsWith(
            "Bearer "
        )
    ) {

        throw new Error(
            "Usuário não autenticado."
        );

    }

    const token =
        authorization
            .replace(
                "Bearer ",
                ""
            )
            .trim();

    if (!token) {

        throw new Error(
            "Token de autenticação não informado."
        );

    }


    const {
        data: userData,
        error: userError
    } =
        await supabaseAuth
            .auth
            .getUser(
                token
            );


    if (
        userError
    ) {

        console.error(
            "Erro ao validar usuário:",
            userError
        );

        throw new Error(
            `Sessão inválida: ${userError.message}`
        );

    }


    if (
        !userData?.user?.id
    ) {

        throw new Error(
            "Sessão inválida ou expirada."
        );

    }


    const userId =
        userData.user.id;


    /* ========================================================
       PROFILE
    ======================================================== */

    const {
        data: profile,
        error: profileError
    } =
        await supabaseAdmin
            .from(
                "profiles"
            )
            .select(`
                id,
                nome,
                username,
                email,
                pode_ver_todas_obras
            `)
            .eq(
                "id",
                userId
            )
            .maybeSingle();


    if (
        profileError
    ) {

        console.error(
            "Erro ao buscar profile:",
            profileError
        );

        throw new Error(
            `Não foi possível verificar o perfil: ${profileError.message}`
        );

    }


    /* ========================================================
       ROLES
    ======================================================== */

    const {
        data: userRoles,
        error: rolesError
    } =
        await supabaseAdmin
            .from(
                "user_roles"
            )
            .select(`
                role_id,
                roles (
                    id,
                    nome
                )
            `)
            .eq(
                "user_id",
                userId
            );


    if (
        rolesError
    ) {

        console.error(
            "Erro ao buscar roles:",
            rolesError
        );

        throw new Error(
            `Não foi possível verificar as permissões: ${rolesError.message}`
        );

    }


    const roleIds =
        (
            userRoles ?? []
        )
            .map(
                item =>
                    Number(
                        item?.role_id
                    )
            )
            .filter(
                Number.isFinite
            );


    /*
     * ROLE 1 = Administrativo Geral
     * ROLE 3 = Produção
     */

    const ehAdmin =
        roleIds.includes(
            1
        );

    const ehProducao =
        roleIds.includes(
            3
        );


    if (
        !ehAdmin &&
        !ehProducao
    ) {

        throw new Error(
            "Você não tem permissão para acessar os documentos ALME."
        );

    }


    return {

        userId,

        profile:
            profile ?? null,

        ehAdmin,

        ehProducao,

        podeVerTodasObras:
            Boolean(
                profile?.pode_ver_todas_obras
            )

    };

}


/* ============================================================
   OBRAS
============================================================ */

async function listarObrasPermitidas(
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    /*
     * Para este módulo, Administrativo Geral e
     * Produção visualizam todas as obras.
     */

    if (
        !auth.ehAdmin &&
        !auth.ehProducao
    ) {

        throw new Error(
            "Usuário sem permissão para listar obras."
        );

    }


    const {
        data: obras,
        error
    } =
        await supabaseAdmin
            .from(
                "obras"
            )
            .select(`
                id,
                nome,
                rdo_nome,
                marceneiro_nome,
                projetista_nome,
                arquiteto_empresa,
                concluida,
                concluida_at
            `)
            .order(
                "nome",
                {
                    ascending:
                        true
                }
            );


    if (
        error
    ) {

        console.error(
            "Erro ao carregar obras:",
            error
        );

        throw new Error(
            `Não foi possível carregar as obras: ${error.message}`
        );

    }


    return obras ?? [];

}


/* ============================================================
   OBTÉM OBRA
============================================================ */

async function obterObraPermitida(
    obraId: number,
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    if (
        !Number.isInteger(
            obraId
        ) ||
        obraId <= 0
    ) {

        return null;

    }


    const obras =
        await listarObrasPermitidas(
            auth
        );


    const obra =
        obras.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    obraId
                )
        );


    return obra ?? null;

}


/* ============================================================
   VALIDA TIPO
============================================================ */

function validarTipo(
    tipo: string
) {

    const tipoNormalizado =
        String(
            tipo ?? ""
        )
            .trim()
            .toLowerCase();


    if (
        !TIPOS_VALIDOS.includes(
            tipoNormalizado
        )
    ) {

        throw new Error(
            `Tipo de documento inválido. Tipos permitidos: ${TIPOS_VALIDOS.join(", ")}.`
        );

    }


    return tipoNormalizado;

}


/* ============================================================
   EXTENSÃO
============================================================ */

function normalizarExtensao(
    extensao: string
) {

    return String(
        extensao ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /^\./,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            ""
        )
        .slice(
            0,
            20
        );

}


/* ============================================================
   LISTAR DADOS
============================================================ */

async function listarDados(
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    const obras =
        await listarObrasPermitidas(
            auth
        );


    const obrasAtivas =
        obras.filter(
            obra =>
                !Boolean(
                    obra.concluida
                )
        );


    const obrasConcluidas =
        obras.filter(
            obra =>
                Boolean(
                    obra.concluida
                )
        );


    let documentos = [];


    if (
        obras.length > 0
    ) {

        const obraIds =
            obras.map(
                obra =>
                    Number(
                        obra.id
                    )
            );


        const {
            data,
            error
        } =
            await supabaseAdmin
                .from(
                    "documentos_alme"
                )
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
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

            console.error(
                "Erro ao carregar documentos:",
                error
            );

            throw new Error(
                `Não foi possível carregar os documentos ALME: ${error.message}`
            );

        }


        documentos =
            data ?? [];

    }


    const documentosComObra =
        documentos.map(
            documento => {

                const obra =
                    obras.find(
                        item =>
                            Number(
                                item.id
                            ) ===
                            Number(
                                documento.obra_id
                            )
                    );


                return {

                    ...documento,

                    obra_nome:
                        obra?.nome ??
                        "",

                    arquiteto_empresa:
                        obra?.arquiteto_empresa ??
                        "",

                    obra_concluida:
                        Boolean(
                            obra?.concluida
                        )

                };

            }
        );


    return {

        obrasAtivas,

        obrasConcluidas,

        documentos:
            documentosComObra

    };

}


/* ============================================================
   OBTÉM DOCUMENTO
============================================================ */

async function obterDocumentoPermitido(
    id: number,
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        throw new Error(
            "Documento inválido."
        );

    }


    const {
        data: documento,
        error
    } =
        await supabaseAdmin
            .from(
                "documentos_alme"
            )
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
            .eq(
                "id",
                id
            )
            .maybeSingle();


    if (
        error
    ) {

        console.error(
            "Erro ao buscar documento:",
            error
        );

        throw new Error(
            `Não foi possível localizar o documento: ${error.message}`
        );

    }


    if (
        !documento
    ) {

        throw new Error(
            "Documento não encontrado."
        );

    }


    const obra =
        await obterObraPermitida(
            Number(
                documento.obra_id
            ),
            auth
        );


    if (
        !obra
    ) {

        throw new Error(
            "Você não tem acesso à obra vinculada a este documento."
        );

    }


    return {

        documento,

        obra

    };

}


/* ============================================================
   CRIAR URL DE UPLOAD
============================================================ */

async function criarUploadUrl(
    body: any,
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    const obraId =
        Number(
            body?.obra_id
        );


    const tipo =
        validarTipo(
            String(
                body?.tipo ??
                    "outros"
            )
        );


    const extensao =
        normalizarExtensao(
            body?.extensao
        );


    if (
        !Number.isInteger(
            obraId
        ) ||
        obraId <= 0
    ) {

        throw new Error(
            "Obra inválida."
        );

    }


    if (
        !extensao
    ) {

        throw new Error(
            "Extensão do arquivo não informada."
        );

    }


    const obra =
        await obterObraPermitida(
            obraId,
            auth
        );


    if (
        !obra
    ) {

        throw new Error(
            `A obra ${obraId} não foi encontrada ou você não tem acesso a ela.`
        );

    }


    /*
     * Gera um nome único.
     */

    const nomeArquivo =
        `${crypto.randomUUID()}.${extensao}`;


    /*
     * Estrutura:
     *
     * obra_id/tipo/arquivo
     */

    const path =
        `${obraId}/${tipo}/${nomeArquivo}`;


    console.log(
        "CRIANDO SIGNED UPLOAD URL:",
        {
            bucket:
                BUCKET,
            obraId,
            tipo,
            extensao,
            path
        }
    );


    /*
     * Cria a URL temporária
     * usando a Service Role.
     */

    const {
        data,
        error
    } =
        await supabaseAdmin
            .storage
            .from(
                BUCKET
            )
            .createSignedUploadUrl(
                path
            );


    if (
        error
    ) {

        console.error(
            "ERRO CREATE SIGNED UPLOAD URL:",
            error
        );

        throw new Error(
            `Não foi possível criar o upload no Storage: ${error.message}`
        );

    }


    if (
        !data?.token
    ) {

        console.error(
            "CREATE SIGNED UPLOAD URL SEM TOKEN:",
            data
        );

        throw new Error(
            "O Supabase não retornou o token de upload."
        );

    }


    console.log(
        "SIGNED UPLOAD URL CRIADA COM SUCESSO:",
        {
            path,
            hasToken:
                Boolean(
                    data.token
                )
        }
    );


    return {

        path,

        token:
            data.token

    };

}


/* ============================================================
   CRIAR DOCUMENTO
============================================================ */

async function criarDocumento(
    body: any,
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    const obraId =
        Number(
            body?.obra_id
        );


    const nome =
        String(
            body?.nome ??
                ""
        ).trim();


    const nomeArquivo =
        String(
            body?.nome_arquivo ??
                ""
        ).trim();


    const tipo =
        validarTipo(
            String(
                body?.tipo ??
                    "outros"
            )
        );


    const extensao =
        normalizarExtensao(
            body?.extensao
        );


    const mimeType =
        String(
            body?.mime_type ??
                ""
        ).trim() ||
        null;


    const tamanho =
        body?.tamanho == null
            ? null
            : Number(
                body.tamanho
            );


    const storagePath =
        String(
            body?.storage_path ??
                ""
        ).trim();


    if (
        !Number.isInteger(
            obraId
        ) ||
        obraId <= 0
    ) {

        throw new Error(
            "Obra inválida."
        );

    }


    if (
        !nome
    ) {

        throw new Error(
            "O nome do documento é obrigatório."
        );

    }


    if (
        !nomeArquivo
    ) {

        throw new Error(
            "O nome do arquivo é obrigatório."
        );

    }


    if (
        !extensao
    ) {

        throw new Error(
            "A extensão do arquivo é obrigatória."
        );

    }


    if (
        !storagePath
    ) {

        throw new Error(
            "O caminho do arquivo é obrigatório."
        );

    }


    const obra =
        await obterObraPermitida(
            obraId,
            auth
        );


    if (
        !obra
    ) {

        throw new Error(
            `A obra ${obraId} não foi encontrada ou você não tem acesso a ela.`
        );

    }


    /*
     * Proteção para garantir que o arquivo
     * realmente pertence à obra.
     */

    if (
        !storagePath.startsWith(
            `${obraId}/`
        )
    ) {

        throw new Error(
            "Caminho do arquivo inválido para a obra selecionada."
        );

    }


    /*
     * Se o tamanho foi enviado, precisa ser
     * numérico.
     */

    const tamanhoFinal =
        Number.isFinite(
            tamanho
        )
            ? tamanho
            : null;


    console.log(
        "CRIANDO REGISTRO DO DOCUMENTO:",
        {
            obraId,
            nome,
            nomeArquivo,
            tipo,
            extensao,
            mimeType,
            tamanho:
                tamanhoFinal,
            storagePath
        }
    );


    const {
        data,
        error
    } =
        await supabaseAdmin
            .from(
                "documentos_alme"
            )
            .insert({

                obra_id:
                    obraId,

                nome,

                nome_arquivo:
                    nomeArquivo,

                tipo,

                extensao,

                mime_type:
                    mimeType,

                tamanho:
                    tamanhoFinal,

                storage_path:
                    storagePath

            })
            .select(
                "*"
            )
            .single();


    if (
        error
    ) {

        console.error(
            "ERRO AO INSERIR documentos_alme:",
            error
        );


        /*
         * Tenta apagar o arquivo que foi
         * enviado para o Storage antes de
         * o registro ser criado.
         */

        try {

            await supabaseAdmin
                .storage
                .from(
                    BUCKET
                )
                .remove([
                    storagePath
                ]);

            console.log(
                "Arquivo órfão removido do Storage:",
                storagePath
            );

        } catch (
            cleanupError
        ) {

            console.error(
                "Erro ao limpar arquivo órfão:",
                cleanupError
            );

        }


        throw new Error(
            `Não foi possível salvar o documento no banco. ${error.message}`
        );

    }


    console.log(
        "DOCUMENTO SALVO COM SUCESSO:",
        data
    );


    return data;

}


/* ============================================================
   ATUALIZAR DOCUMENTO
============================================================ */

async function atualizarDocumento(
    body: any,
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    const id =
        Number(
            body?.id
        );


    const nome =
        String(
            body?.nome ??
                ""
        ).trim();


    const tipo =
        validarTipo(
            String(
                body?.tipo ??
                    "outros"
            )
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        throw new Error(
            "Documento inválido."
        );

    }


    if (
        !nome
    ) {

        throw new Error(
            "O nome do documento é obrigatório."
        );

    }


    const {
        documento
    } =
        await obterDocumentoPermitido(
            id,
            auth
        );


    const novoStoragePath =
        body?.storage_path
            ? String(
                body.storage_path
            ).trim()
            : "";


    const novoArquivo =
        Boolean(
            novoStoragePath
        );


    const updateData: Record<
        string,
        unknown
    > = {

        nome,

        tipo,

        updated_at:
            new Date().toISOString()

    };


    if (
        novoArquivo
    ) {

        const novoNomeArquivo =
            String(
                body?.nome_arquivo ??
                    ""
            ).trim();


        const novaExtensao =
            normalizarExtensao(
                body?.extensao
            );


        const novoMimeType =
            String(
                body?.mime_type ??
                    ""
            ).trim() ||
            null;


        const novoTamanho =
            body?.tamanho == null
                ? null
                : Number(
                    body.tamanho
                );


        if (
            !novoNomeArquivo
        ) {

            throw new Error(
                "O nome do novo arquivo é obrigatório."
            );

        }


        if (
            !novaExtensao
        ) {

            throw new Error(
                "A extensão do novo arquivo é obrigatória."
            );

        }


        if (
            !novoStoragePath
        ) {

            throw new Error(
                "O caminho do novo arquivo é obrigatório."
            );

        }


        if (
            !novoStoragePath.startsWith(
                `${documento.obra_id}/`
            )
        ) {

            throw new Error(
                "O novo arquivo não pertence à obra do documento."
            );

        }


        updateData.nome_arquivo =
            novoNomeArquivo;


        updateData.extensao =
            novaExtensao;


        updateData.mime_type =
            novoMimeType;


        updateData.tamanho =
            Number.isFinite(
                novoTamanho
            )
                ? novoTamanho
                : null;


        updateData.storage_path =
            novoStoragePath;

    }


    console.log(
        "ATUALIZANDO DOCUMENTO:",
        {
            id,
            updateData
        }
    );


    const {
        data,
        error
    } =
        await supabaseAdmin
            .from(
                "documentos_alme"
            )
            .update(
                updateData
            )
            .eq(
                "id",
                id
            )
            .select(
                "*"
            )
            .single();


    if (
        error
    ) {

        console.error(
            "ERRO AO ATUALIZAR DOCUMENTO:",
            error
        );


        /*
         * Se um novo arquivo já foi enviado
         * mas o update falhou, tentamos apagar
         * esse novo arquivo para não deixá-lo órfão.
         */

        if (
            novoArquivo &&
            novoStoragePath
        ) {

            try {

                await supabaseAdmin
                    .storage
                    .from(
                        BUCKET
                    )
                    .remove([
                        novoStoragePath
                    ]);

            } catch (
                cleanupError
            ) {

                console.error(
                    "Erro ao limpar novo arquivo:",
                    cleanupError
                );

            }

        }


        throw new Error(
            `Não foi possível atualizar o documento: ${error.message}`
        );

    }


    /*
     * Remove arquivo anterior somente
     * depois que o banco foi atualizado.
     */

    if (
        novoArquivo &&
        documento.storage_path &&
        documento.storage_path !==
            data.storage_path
    ) {

        const {
            error:
                removeError
        } =
            await supabaseAdmin
                .storage
                .from(
                    BUCKET
                )
                .remove([
                    documento.storage_path
                ]);


        if (
            removeError
        ) {

            console.error(
                "Erro ao remover arquivo antigo:",
                removeError
            );

        }

    }


    return {

        documento:
            data,

        antigoStoragePath:
            novoArquivo
                ? documento.storage_path
                : null

    };

}


/* ============================================================
   EXCLUIR DOCUMENTO
============================================================ */

async function excluirDocumento(
    body: any,
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    const id =
        Number(
            body?.id
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        throw new Error(
            "Documento inválido."
        );

    }


    const {
        documento
    } =
        await obterDocumentoPermitido(
            id,
            auth
        );


    /*
     * Primeiro removemos o arquivo do Storage.
     */

    if (
        documento.storage_path
    ) {

        const {
            error:
                storageError
        } =
            await supabaseAdmin
                .storage
                .from(
                    BUCKET
                )
                .remove([
                    documento.storage_path
                ]);


        if (
            storageError
        ) {

            console.error(
                "Erro ao excluir arquivo:",
                storageError
            );

            throw new Error(
                `Não foi possível remover o arquivo: ${storageError.message}`
            );

        }

    }


    /*
     * Depois removemos o registro.
     */

    const {
        error
    } =
        await supabaseAdmin
            .from(
                "documentos_alme"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if (
        error
    ) {

        console.error(
            "Erro ao excluir documento:",
            error
        );

        throw new Error(
            `Não foi possível excluir o documento: ${error.message}`
        );

    }


    return true;

}


/* ============================================================
   URL ASSINADA
============================================================ */

async function gerarUrlAssinada(
    body: any,
    auth: Awaited<
        ReturnType<
            typeof verificarUsuario
        >
    >
) {

    const id =
        Number(
            body?.id
        );


    const download =
        Boolean(
            body?.download
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        throw new Error(
            "Documento inválido."
        );

    }


    const {
        documento
    } =
        await obterDocumentoPermitido(
            id,
            auth
        );


    if (
        !documento.storage_path
    ) {

        throw new Error(
            "Este documento não possui arquivo vinculado."
        );

    }


    const {
        data,
        error
    } =
        await supabaseAdmin
            .storage
            .from(
                BUCKET
            )
            .createSignedUrl(
                documento.storage_path,
                60 * 60,
                download
                    ? {
                        download:
                            documento.nome_arquivo
                    }
                    : undefined
            );


    if (
        error
    ) {

        console.error(
            "Erro ao gerar URL:",
            error
        );

        throw new Error(
            `Não foi possível gerar a URL do documento: ${error.message}`
        );

    }


    if (
        !data?.signedUrl
    ) {

        throw new Error(
            "O Supabase não retornou a URL assinada."
        );

    }


    return data.signedUrl;

}


/* ============================================================
   PARSE BODY
============================================================ */

async function lerBody(
    req: Request
) {

    if (
        req.method ===
        "GET"
    ) {

        return {};

    }


    const contentType =
        req.headers.get(
            "content-type"
        ) ?? "";


    /*
     * Nosso frontend envia JSON.
     */

    if (
        contentType
            .toLowerCase()
            .includes(
                "application/json"
            )
    ) {

        try {

            return await req.json();

        } catch {

            throw new Error(
                "Não foi possível interpretar o JSON enviado."
            );

        }

    }


    /*
     * Compatibilidade com alguns clientes
     * que possam mandar text/plain.
     */

    if (
        contentType
            .toLowerCase()
            .includes(
                "text/plain"
            )
    ) {

        const texto =
            await req.text();


        if (!texto) {
            return {};
        }


        try {

            return JSON.parse(
                texto
            );

        } catch {

            throw new Error(
                "O corpo da requisição não contém um JSON válido."
            );

        }

    }


    /*
     * Tentativa genérica de JSON.
     */

    try {

        return await req.json();

    } catch {

        return {};

    }

}


/* ============================================================
   HANDLER
============================================================ */

Deno.serve(
    async (
        req
    ) => {

        /*
         * CORS
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
             * Verifica autenticação
             */

            const auth =
                await verificarUsuario(
                    req
                );


            /*
             * Lê body
             */

            const body =
                await lerBody(
                    req
                );


            /*
             * Descobre a action
             */

            const action =
                String(
                    body?.action ??
                        (
                            req.method ===
                            "GET"
                                ? "list"
                                : ""
                        )
                )
                    .trim()
                    .toLowerCase();


            console.log(
                "===================================="
            );

            console.log(
                "ADMIN-DOCUMENTOS-ALME"
            );

            console.log(
                "ACTION:",
                action
            );

            console.log(
                "USER:",
                auth.userId
            );

            console.log(
                "ROLE IDS:",
                auth.ehAdmin
                    ? [1]
                    : [3]
            );

            console.log(
                "===================================="
            );


            switch (
                action
            ) {


                /* =============================================
                   LIST
                ============================================= */

                case "list": {

                    const dados =
                        await listarDados(
                            auth
                        );


                    return jsonResponse({

                        success:
                            true,

                        ...dados,

                        usuarioAtual:
                            {

                                id:
                                    auth.userId,

                                nome:
                                    auth.profile?.nome ??
                                    "",

                                username:
                                    auth.profile?.username ??
                                    "",

                                email:
                                    auth.profile?.email ??
                                    ""

                            }

                    });

                }


                /* =============================================
                   CREATE UPLOAD URL
                ============================================= */

                case "create_upload_url": {

                    const dados =
                        await criarUploadUrl(
                            body,
                            auth
                        );


                    return jsonResponse({

                        success:
                            true,

                        ...dados

                    });

                }


                /* =============================================
                   CREATE
                ============================================= */

                case "create": {

                    const documento =
                        await criarDocumento(
                            body,
                            auth
                        );


                    return jsonResponse({

                        success:
                            true,

                        documento

                    });

                }


                /* =============================================
                   UPDATE
                ============================================= */

                case "update": {

                    const dados =
                        await atualizarDocumento(
                            body,
                            auth
                        );


                    return jsonResponse({

                        success:
                            true,

                        ...dados

                    });

                }


                /* =============================================
                   DELETE
                ============================================= */

                case "delete": {

                    await excluirDocumento(
                        body,
                        auth
                    );


                    return jsonResponse({

                        success:
                            true

                    });

                }


                /* =============================================
                   SIGNED URL
                ============================================= */

                case "signed_url": {

                    const url =
                        await gerarUrlAssinada(
                            body,
                            auth
                        );


                    return jsonResponse({

                        success:
                            true,

                        url

                    });

                }


                /* =============================================
                   DEFAULT
                ============================================= */

                default:

                    throw new Error(
                        `Ação não reconhecida: "${action}".`
                    );

            }


        } catch (
            error
        ) {

            const mensagem =
                getErrorMessage(
                    error
                );


            console.error(
                "===================================="
            );

            console.error(
                "ERRO ADMIN-DOCUMENTOS-ALME:"
            );

            console.error(
                mensagem
            );

            console.error(
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
                        mensagem

                },
                400
            );

        }

    }
);