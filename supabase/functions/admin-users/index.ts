import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "GET, POST, PUT, DELETE, OPTIONS",
};

const supabaseUrl =
    Deno.env.get("SUPABASE_URL")!;

const supabaseAnonKey =
    Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseServiceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;


/**
 * =====================================================
 * CLIENTE NORMAL
 * Usado para identificar o usuário da requisição
 * =====================================================
 */
const supabaseAuth = createClient(
    supabaseUrl,
    supabaseAnonKey
);


/**
 * =====================================================
 * CLIENTE ADMIN
 * Service Role somente dentro da Edge Function
 * =====================================================
 */
const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRoleKey
);


/**
 * =====================================================
 * RESPOSTA JSON
 * =====================================================
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


/**
 * =====================================================
 * VERIFICAR ADMINISTRADOR
 * =====================================================
 */
async function verificarAdministrador(
    req: Request
) {
    const authHeader =
        req.headers.get("Authorization");

    if (!authHeader) {
        throw new Error(
            "Usuário não autenticado."
        );
    }

    const token =
        authHeader
            .replace(/^Bearer\s+/i, "")
            .trim();

    if (!token) {
        throw new Error(
            "Token de autenticação não encontrado."
        );
    }

    const {
        data: {
            user
        },
        error
    } =
        await supabaseAuth.auth.getUser(
            token
        );

    if (error || !user) {
        console.error(
            "Erro ao validar usuário:",
            error
        );

        throw new Error(
            "Sessão inválida ou expirada."
        );
    }


    /**
     * =================================================
     * BUSCAR ROLE
     * =================================================
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
            "Não foi possível verificar as permissões."
        );
    }

    const roleNome =
        Array.isArray(userRole?.roles)
            ? userRole?.roles?.[0]?.nome
            : userRole?.roles?.nome;

  if (
    roleNome !==
    "Administrativo Geral"
) {
    throw new Error(
        "Apenas administradores podem gerenciar usuários."
    );
}
    return user;
}


/**
 * =====================================================
 * NORMALIZAR BODY
 * =====================================================
 */
function normalizarBody(
    body: any
) {

    /**
     * Aceita diferentes formatos enviados pelo frontend.
     */

    if (
        body &&
        typeof body === "object"
    ) {

        if (
            body.data &&
            typeof body.data === "object"
        ) {
            return {
                ...body.data,
                action:
                    body.action ??
                    body.data.action
            };
        }

        if (
            body.user &&
            typeof body.user === "object"
        ) {
            return {
                ...body.user,
                action:
                    body.action ??
                    body.user.action
            };
        }
    }

    return body || {};
}


/**
 * =====================================================
 * LISTAR ROLES
 * =====================================================
 */
async function listarRoles() {

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("roles")
            .select(
                "id, nome"
            )
            .order(
                "nome",
                {
                    ascending: true
                }
            );

    if (error) {
        console.error(
            "Erro ao listar perfis:",
            error
        );

        throw new Error(
            error.message
        );
    }

    return data || [];
}


/**
 * =====================================================
 * LISTAR USUÁRIOS
 * =====================================================
 */
async function listarUsuarios() {

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("profiles")
            .select(`
                id,
                nome,
                username,
                email,
                created_at,
                user_roles (
                    role_id,
                    roles (
                        id,
                        nome
                    )
                )
            `)
            .order(
                "nome",
                {
                    ascending: true
                }
            );

    if (error) {
        console.error(
            "Erro ao listar usuários:",
            error
        );

        throw new Error(
            error.message
        );
    }


    const usuarios =
        (data || []).map(
            (usuario: any) => {

                const userRole =
                    Array.isArray(
                        usuario.user_roles
                    )
                        ? usuario.user_roles[0]
                        : usuario.user_roles;

                const role =
                    Array.isArray(
                        userRole?.roles
                    )
                        ? userRole?.roles?.[0]
                        : userRole?.roles;

                return {
                    id:
                        usuario.id,

                    nome:
                        usuario.nome || "",

                    username:
                        usuario.username || "",

                    email:
                        usuario.email || "",

                    created_at:
                        usuario.created_at,

                    role_id:
                        userRole?.role_id || null,

                    role:
                        role?.nome || null,

                    role_name:
                        role?.nome || null,
                };
            }
        );

    return usuarios;
}


/**
 * =====================================================
 * LISTAR DADOS DA TELA
 *
 * Pode ser chamado por:
 *
 * GET
 *
 * ou
 *
 * POST { action: "list" }
 * =====================================================
 */
async function listarDados() {

    const usuarios =
        await listarUsuarios();

    const roles =
        await listarRoles();

    return {
        success: true,

        usuarios,

        users:
            usuarios,

        roles
    };
}


/**
 * =====================================================
 * CRIAR USUÁRIO
 * =====================================================
 */
async function criarUsuario(
    body: any
) {

    console.log(
        "========== DEBUG CREATE =========="
    );

    console.log(
        "METHOD:",
        "POST"
    );

    console.log(
        "BODY:",
        JSON.stringify(body)
    );

    console.log(
        "NOME:",
        body?.nome
    );

    console.log(
        "USERNAME:",
        body?.username
    );

    console.log(
        "EMAIL:",
        body?.email
    );

    console.log(
        "PASSWORD:",
        body?.password
            ? "TEM SENHA"
            : "SEM SENHA"
    );

    console.log(
        "ROLE_ID:",
        body?.role_id
    );

    console.log(
        "=================================="
    );


    /**
     * =================================================
     * NORMALIZAR DADOS
     * =================================================
     */

    const nome =
        String(
            body?.nome ??
            body?.name ??
            body?.fullName ??
            body?.full_name ??
            ""
        ).trim();


    const email =
        String(
            body?.email ??
            body?.e_mail ??
            ""
        )
            .trim()
            .toLowerCase();


    /**
     * =================================================
     * USERNAME
     *
     * Não obrigatório.
     * =================================================
     */

    let username =
        String(
            body?.username ??
            body?.user_name ??
            body?.usuario ??
            ""
        ).trim();


    /**
     * =================================================
     * SENHA
     * =================================================
     */

    const password =
        String(
            body?.password ??
            body?.senha ??
            body?.pass ??
            ""
        );


    /**
     * =================================================
     * PERFIL / ROLE
     * =================================================
     */

    const roleIdRaw =
        body?.role_id ??
        body?.roleId ??
        body?.perfil_id ??
        body?.perfilId ??
        body?.perfil ??
        body?.role ??
        null;

    let role_id:
        number | null;


    if (
        roleIdRaw === null ||
        roleIdRaw === undefined ||
        roleIdRaw === ""
    ) {

        role_id = null;

    } else {

        role_id =
            Number(roleIdRaw);
    }


    /**
     * =================================================
     * LOG DE DIAGNÓSTICO
     * =================================================
     */

    console.log(
        "========================================"
    );

    console.log(
        "CRIAR USUÁRIO - DADOS RECEBIDOS"
    );

    console.log(
        "Body original:",
        JSON.stringify(body)
    );

    console.log(
        "Nome:",
        nome
    );

    console.log(
        "Username recebido:",
        username
    );

    console.log(
        "Email:",
        email
    );

    console.log(
        "Senha recebida:",
        password
            ? "SIM"
            : "NÃO"
    );

    console.log(
        "Role recebida:",
        roleIdRaw
    );

    console.log(
        "Role convertida:",
        role_id
    );

    console.log(
        "========================================"
    );


    /**
     * =================================================
     * VALIDAR NOME
     * =================================================
     */

    if (!nome) {
        throw new Error(
            "O nome do usuário é obrigatório."
        );
    }


    /**
     * =================================================
     * VALIDAR EMAIL
     * =================================================
     */

    if (!email) {
        throw new Error(
            "O e-mail do usuário é obrigatório."
        );
    }

    if (
        !email.includes("@")
    ) {
        throw new Error(
            "O e-mail informado é inválido."
        );
    }


    /**
     * =================================================
     * VALIDAR SENHA
     * =================================================
     */

    if (!password) {
        throw new Error(
            "A senha do usuário é obrigatória."
        );
    }

    if (
        password.length < 6
    ) {
        throw new Error(
            "A senha deve possuir pelo menos 6 caracteres."
        );
    }


    /**
     * =================================================
     * GERAR USERNAME AUTOMATICAMENTE
     * =================================================
     */

    if (!username) {

        username =
            email
                .split("@")[0]
                .trim();
    }


    if (!username) {

        username =
            nome
                .toLowerCase()
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )
                .replace(
                    /[^a-z0-9]+/g,
                    "_"
                )
                .replace(
                    /^_+|_+$/g,
                    ""
                );
    }


    if (!username) {
        throw new Error(
            "Não foi possível gerar o username."
        );
    }


    /**
     * =================================================
     * VALIDAR ROLE
     * =================================================
     */

    if (
        role_id === null ||
        !Number.isInteger(role_id)
    ) {

        throw new Error(
            "Selecione um perfil de acesso."
        );
    }


    /**
     * =================================================
     * BUSCAR ROLE
     * =================================================
     */

    const {
        data: role,
        error: roleError
    } =
        await supabaseAdmin
            .from("roles")
            .select(
                "id, nome"
            )
            .eq(
                "id",
                role_id
            )
            .maybeSingle();


    if (roleError) {

        console.error(
            "Erro ao buscar perfil:",
            roleError
        );

        throw new Error(
            "Erro ao verificar o perfil: " +
            roleError.message
        );
    }


    if (!role) {
        throw new Error(
            "O perfil selecionado é inválido."
        );
    }


    /**
     * =================================================
     * VERIFICAR EMAIL EXISTENTE
     * =================================================
     */

    const {
        data: profileExistente,
        error: profileBuscaError
    } =
        await supabaseAdmin
            .from("profiles")
            .select(
                "id"
            )
            .eq(
                "email",
                email
            )
            .maybeSingle();


    if (profileBuscaError) {

        console.error(
            "Erro ao verificar e-mail:",
            profileBuscaError
        );

        throw new Error(
            profileBuscaError.message
        );
    }


    if (profileExistente) {

        throw new Error(
            "Já existe um usuário com este e-mail."
        );
    }


    /**
     * =================================================
     * VERIFICAR USERNAME EXISTENTE
     * =================================================
     */

    const {
        data: usernameExistente,
        error: usernameBuscaError
    } =
        await supabaseAdmin
            .from("profiles")
            .select(
                "id"
            )
            .eq(
                "username",
                username
            )
            .maybeSingle();


    if (usernameBuscaError) {

        console.error(
            "Erro ao verificar username:",
            usernameBuscaError
        );

        throw new Error(
            usernameBuscaError.message
        );
    }


    if (usernameExistente) {

        const usernameBase =
            username;

        let contador =
            2;

        let novoUsername =
            `${usernameBase}${contador}`;


        while (true) {

            const {
                data: existente,
                error: buscaError
            } =
                await supabaseAdmin
                    .from("profiles")
                    .select(
                        "id"
                    )
                    .eq(
                        "username",
                        novoUsername
                    )
                    .maybeSingle();


            if (buscaError) {

                console.error(
                    "Erro ao verificar username alternativo:",
                    buscaError
                );

                throw new Error(
                    buscaError.message
                );
            }


            if (!existente) {

                username =
                    novoUsername;

                break;
            }


            contador++;

            novoUsername =
                `${usernameBase}${contador}`;
        }
    }


    /**
     * =================================================
     * CRIAR USUÁRIO NO AUTH
     * =================================================
     */

    console.log(
        "Criando usuário no Supabase Auth..."
    );


    const {
        data: authData,
        error: authError
    } =
        await supabaseAdmin.auth.admin.createUser({

            email,

            password,

            email_confirm:
                true,

            user_metadata: {
                nome,
                username
            }
        });


    if (authError) {

        console.error(
            "Erro ao criar usuário no Auth:",
            authError
        );

        throw new Error(
            authError.message
        );
    }


    const user =
        authData.user;


    if (!user) {

        throw new Error(
            "O usuário não foi criado no Auth."
        );
    }


    /**
     * =================================================
     * CRIAR PROFILE
     * =================================================
     */

    console.log(
        "Criando profile:",
        user.id
    );


    const {
        error: profileError
    } =
        await supabaseAdmin
            .from("profiles")
            .insert({

                id:
                    user.id,

                nome,

                username,

                email
            });


    if (profileError) {

        console.error(
            "Erro ao criar profile:",
            profileError
        );


        /**
         * ROLLBACK AUTH
         */

        await supabaseAdmin
            .auth
            .admin
            .deleteUser(
                user.id
            );


        throw new Error(
            profileError.message
        );
    }


    /**
     * =================================================
     * ATRIBUIR ROLE
     * =================================================
     */

    console.log(
        "Atribuindo role:",
        role_id
    );


    const {
        error: userRoleError
    } =
        await supabaseAdmin
            .from("user_roles")
            .insert({

                user_id:
                    user.id,

                role_id
            });


    if (userRoleError) {

        console.error(
            "Erro ao criar user_role:",
            userRoleError
        );


        /**
         * ROLLBACK PROFILE
         */

        await supabaseAdmin
            .from("profiles")
            .delete()
            .eq(
                "id",
                user.id
            );


        /**
         * ROLLBACK AUTH
         */

        await supabaseAdmin
            .auth
            .admin
            .deleteUser(
                user.id
            );


        throw new Error(
            userRoleError.message
        );
    }


    /**
     * =================================================
     * SUCESSO
     * =================================================
     */

    console.log(
        "Usuário criado com sucesso:",
        user.id
    );


    return {

        id:
            user.id,

        nome,

        username,

        email,

        role_id,

        role:
            role.nome
    };
}


/**
 * =====================================================
 * EDITAR USUÁRIO
 * =====================================================
 */
async function editarUsuario(
    body: any
) {

    const id =
        body?.id ??
        body?.user_id ??
        body?.userId;


    const nome =
        body?.nome !== undefined
            ? String(
                body.nome
            ).trim()
            : undefined;


    const username =
        body?.username !== undefined
            ? String(
                body.username
            ).trim()
            : undefined;


    const email =
        body?.email !== undefined
            ? String(
                body.email
            )
                .trim()
                .toLowerCase()
            : undefined;


    const roleIdRaw =
        body?.role_id ??
        body?.roleId ??
        body?.perfil_id ??
        body?.perfilId;


    const role_id =
        roleIdRaw === null ||
        roleIdRaw === undefined ||
        roleIdRaw === ""
            ? null
            : Number(roleIdRaw);


    if (!id) {
        throw new Error(
            "ID do usuário é obrigatório."
        );
    }


    /**
     * =================================================
     * VALIDAR ROLE
     * =================================================
     */

    if (
        role_id !== null &&
        !Number.isInteger(role_id)
    ) {

        throw new Error(
            "Perfil de acesso inválido."
        );
    }


    if (
        role_id !== null
    ) {

        const {
            data: role,
            error: roleError
        } =
            await supabaseAdmin
                .from("roles")
                .select(
                    "id"
                )
                .eq(
                    "id",
                    role_id
                )
                .maybeSingle();


        if (
            roleError ||
            !role
        ) {

            throw new Error(
                "O perfil selecionado é inválido."
            );
        }
    }


    /**
     * =================================================
     * ATUALIZAR AUTH
     * =================================================
     */

    const authUpdates: any = {};


    if (email) {

        authUpdates.email =
            email;
    }


    const metadata: any = {};


    if (
        nome !== undefined
    ) {

        metadata.nome =
            nome;
    }


    if (
        username !== undefined
    ) {

        metadata.username =
            username;
    }


    if (
        Object.keys(metadata).length > 0
    ) {

        authUpdates.user_metadata =
            metadata;
    }


    if (
        Object.keys(authUpdates).length > 0
    ) {

        const {
            error
        } =
            await supabaseAdmin
                .auth
                .admin
                .updateUserById(
                    id,
                    authUpdates
                );


        if (error) {

            throw new Error(
                error.message
            );
        }
    }


    /**
     * =================================================
     * ATUALIZAR PROFILE
     * =================================================
     */

    const profileUpdates: any = {};


    if (
        nome !== undefined
    ) {

        profileUpdates.nome =
            nome;
    }


    if (
        username !== undefined
    ) {

        profileUpdates.username =
            username;
    }


    if (
        email !== undefined
    ) {

        profileUpdates.email =
            email;
    }


    if (
        Object.keys(profileUpdates).length > 0
    ) {

        const {
            error
        } =
            await supabaseAdmin
                .from("profiles")
                .update(
                    profileUpdates
                )
                .eq(
                    "id",
                    id
                );


        if (error) {

            throw new Error(
                error.message
            );
        }
    }


    /**
     * =================================================
     * ATUALIZAR ROLE
     * =================================================
     */

    if (
        roleIdRaw !== undefined
    ) {

        if (
            role_id === null
        ) {

            const {
                error
            } =
                await supabaseAdmin
                    .from("user_roles")
                    .delete()
                    .eq(
                        "user_id",
                        id
                    );


            if (error) {

                throw new Error(
                    error.message
                );
            }

        } else {

            const {
                error
            } =
                await supabaseAdmin
                    .from("user_roles")
                    .upsert(

                        {
                            user_id:
                                id,

                            role_id
                        },

                        {
                            onConflict:
                                "user_id"
                        }
                    );


            if (error) {

                throw new Error(
                    error.message
                );
            }
        }
    }


    return {

        success:
            true,

        message:
            "Usuário atualizado com sucesso."
    };
}


/**
 * =====================================================
 * ALTERAR SENHA
 * =====================================================
 */
async function alterarSenha(
    body: any
) {

    const id =
        body?.id ??
        body?.user_id ??
        body?.userId;


    const password =
        String(
            body?.password ??
            body?.senha ??
            ""
        );


    if (!id) {

        throw new Error(
            "ID do usuário é obrigatório."
        );
    }


    if (!password) {

        throw new Error(
            "A nova senha é obrigatória."
        );
    }


    if (
        password.length < 6
    ) {

        throw new Error(
            "A senha deve possuir pelo menos 6 caracteres."
        );
    }


    const {
        error
    } =
        await supabaseAdmin
            .auth
            .admin
            .updateUserById(
                id,
                {
                    password
                }
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
            "Senha alterada com sucesso."
    };
}


/**
 * =====================================================
 * EXCLUIR USUÁRIO
 * =====================================================
 */
async function excluirUsuario(
    body: any,
    administrador: any
) {

    const id =
        body?.id ??
        body?.user_id ??
        body?.userId;


    if (!id) {

        throw new Error(
            "ID do usuário é obrigatório."
        );
    }


    /**
     * =================================================
     * IMPEDIR EXCLUSÃO DA PRÓPRIA CONTA
     * =================================================
     */

    if (
        id === administrador.id
    ) {

        throw new Error(
            "Você não pode excluir o próprio usuário."
        );
    }


    /**
     * =================================================
     * EXCLUIR USER_ROLES
     * =================================================
     */

    const {
        error: roleError
    } =
        await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq(
                "user_id",
                id
            );


    if (roleError) {

        console.error(
            "Erro ao excluir user_roles:",
            roleError
        );

        throw new Error(
            roleError.message
        );
    }


    /**
     * =================================================
     * EXCLUIR PROFILE
     * =================================================
     */

    const {
        error: profileError
    } =
        await supabaseAdmin
            .from("profiles")
            .delete()
            .eq(
                "id",
                id
            );


    if (profileError) {

        throw new Error(
            profileError.message
        );
    }


    /**
     * =================================================
     * EXCLUIR AUTH
     * =================================================
     */

    const {
        error: authError
    } =
        await supabaseAdmin
            .auth
            .admin
            .deleteUser(
                id
            );


    if (authError) {

        throw new Error(
            authError.message
        );
    }


    return {

        success:
            true,

        message:
            "Usuário excluído com sucesso."
    };
}


/**
 * =====================================================
 * HANDLER PRINCIPAL
 * =====================================================
 */
Deno.serve(
    async (req) => {

        /**
         * =============================================
         * CORS
         * =============================================
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

            /**
             * =========================================
             * VERIFICAR ADMIN
             * =========================================
             */

            const administrador =
                await verificarAdministrador(
                    req
                );


            /**
             * =========================================
             * LER BODY
             * =========================================
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
                catch (parseError) {

                    console.error(
                        "Erro ao interpretar JSON:",
                        parseError
                    );

                    throw new Error(
                        "O corpo da requisição não contém um JSON válido."
                    );
                }
            }


            /**
             * =========================================
             * NORMALIZAR BODY
             * =========================================
             */

            body =
                normalizarBody(
                    body
                );


            /**
             * =========================================
             * LOG DA REQUISIÇÃO
             * =========================================
             */

            console.log(
                "========================================"
            );

            console.log(
                "ADMIN-USERS REQUEST"
            );

            console.log(
                "Método:",
                req.method
            );

            console.log(
                "Action:",
                body?.action
            );

            console.log(
                "Body:",
                JSON.stringify(
                    {
                        ...body,

                        password:
                            body?.password
                                ? "***"
                                : undefined,

                        senha:
                            body?.senha
                                ? "***"
                                : undefined
                    }
                )
            );

            console.log(
                "========================================"
            );


            /**
             * =========================================
             * GET
             *
             * LISTAR
             * =========================================
             */

            if (
                req.method ===
                "GET"
            ) {

                const dados =
                    await listarDados();

                return jsonResponse(
                    dados
                );
            }


            /**
             * =========================================
             * POST
             * =========================================
             */

            if (
                req.method ===
                "POST"
            ) {

                /**
                 * -----------------------------------------
                 * POST + action=list
                 *
                 * ISSO É O QUE ESTAVA FALTANDO.
                 * -----------------------------------------
                 */

                if (
                    body?.action ===
                    "list"
                ) {

                    console.log(
                        "POST LIST → carregando usuários e roles"
                    );

                    const dados =
                        await listarDados();

                    return jsonResponse(
                        dados
                    );
                }


                /**
                 * -----------------------------------------
                 * POST NORMAL
                 *
                 * CRIAR USUÁRIO
                 * -----------------------------------------
                 */

                const usuario =
                    await criarUsuario(
                        body
                    );


                return jsonResponse(
                    {
                        success:
                            true,

                        usuario,

                        user:
                            usuario
                    },
                    201
                );
            }


            /**
             * =========================================
             * PUT
             * =========================================
             */

            if (
                req.method ===
                "PUT"
            ) {

                /**
                 * -----------------------------------------
                 * ALTERAR SENHA
                 * -----------------------------------------
                 */

                if (
                    body.action ===
                    "password"
                ) {

                    const resultado =
                        await alterarSenha(
                            body
                        );

                    return jsonResponse(
                        resultado
                    );
                }


                /**
                 * -----------------------------------------
                 * EDITAR USUÁRIO
                 * -----------------------------------------
                 */

                const resultado =
                    await editarUsuario(
                        body
                    );


                return jsonResponse(
                    resultado
                );
            }


            /**
             * =========================================
             * DELETE
             * =========================================
             */

            if (
                req.method ===
                "DELETE"
            ) {

                const resultado =
                    await excluirUsuario(
                        body,
                        administrador
                    );


                return jsonResponse(
                    resultado
                );
            }


            /**
             * =========================================
             * MÉTODO NÃO PERMITIDO
             * =========================================
             */

            return jsonResponse(
                {
                    success:
                        false,

                    error:
                        "Método não permitido."
                },
                405
            );

        }
        catch (error) {

            console.error(
                "========================================"
            );

            console.error(
                "ADMIN-USERS ERROR:",
                error
            );

            console.error(
                "========================================"
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