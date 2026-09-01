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
CLIENTE NORMAL
=====================================================
*/

const supabaseAuth = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/*
=====================================================
CLIENTE ADMIN
=====================================================
*/

const supabaseAdmin = createClient(
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
ERRO
=====================================================
*/

function mensagemErro(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Erro interno.";
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
CONVERTER ID
=====================================================
*/

function validarId(
  valor: unknown,
  nome: string
) {
  const numero = Number(
    valor
  );

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    throw new Error(
      `${nome} inválido.`
    );
  }

  return numero;
}

/*
=====================================================
VERIFICAR ACESSO
=====================================================
*/

async function verificarAcesso(
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
  ================================================
  VALIDAR TOKEN
  ================================================
  */

  const {
    data: {
      user,
    },
    error,
  } =
    await supabaseAuth.auth.getUser(
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
  ================================================
  BUSCAR ROLE
  ================================================
  */

  const {
    data: userRole,
    error: roleError,
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
      .limit(1)
      .maybeSingle();

  if (roleError) {
    console.error(
      "Erro ao buscar role:",
      roleError
    );

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
  ================================================
  BUSCAR PROFILE
  ================================================
  */

  const {
    data: profile,
    error: profileError,
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
      "Não foi possível carregar o perfil."
    );
  }

  /*
  ================================================
  PERMISSÃO ESPECIAL
  ================================================
  */

  const podeVerTodasObras =
    roleId === 1 ||
    (
      roleId === 3 &&
      profile?.pode_ver_todas_obras === true
    );

  /*
  ================================================
  SOMENTE ADMIN OU PRODUÇÃO
  ================================================
  */

  if (
    roleId !== 1 &&
    roleId !== 3
  ) {
    throw new Error(
      "Você não possui permissão para acessar os cronogramas."
    );
  }

  console.log(
    "===================================="
  );

  console.log(
    "ADMIN-CRONOGRAMAS"
  );

  console.log(
    "USER:",
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
      profile?.username ||
      "",
    nome:
      profile?.nome ||
      "",
    email:
      profile?.email ||
      user.email ||
      "",
    podeVerTodasObras,
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

  if (
    !usernameNormalizado
  ) {
    return [];
  }

  return obras.filter(
    (
      obra
    ) => {
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
        rdo ===
          usernameNormalizado ||
        marceneiro ===
          usernameNormalizado ||
        projetista ===
          usernameNormalizado
      );
    }
  );
}

/*
=====================================================
LISTAR OBRAS VISÍVEIS
=====================================================
*/

async function listarObrasVisiveis(
  acesso: any
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("obras")
      .select(`
        id,
        nome,
        marceneiro_nome,
        rdo_nome,
        projetista_nome,
        concluida
      `)
      .order(
        "nome",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw new Error(
      error.message
    );
  }

  const todas =
    data || [];

  if (
    acesso.roleId === 1 ||
    acesso.podeVerTodasObras === true
  ) {
    return todas;
  }

  return filtrarObrasDoUsuario(
    todas,
    acesso.username
  );
}

/*
=====================================================
BUSCAR USUÁRIO MARCENEIRO - ROLE 5
=====================================================
*/

async function buscarMarceneiroResponsavel(
  obra: any
) {
  const valorObra =
    String(
      obra?.marceneiro_nome ??
      ""
    ).trim();

  /*
  ================================================
  SE A OBRA NÃO POSSUI MARCENEIRO
  ================================================
  */

  if (!valorObra) {
    return {
      id: null,
      nome: "",
      username: "",
      email: "",
      role_id: 5,
    };
  }

  /*
  ================================================
  PEGAR USERS COM ROLE 5
  ================================================
  */

  const {
    data: roleUsers,
    error: roleUsersError,
  } =
    await supabaseAdmin
      .from("user_roles")
      .select(`
        user_id,
        role_id
      `)
      .eq(
        "role_id",
        5
      );

  if (roleUsersError) {
    console.error(
      "Erro ao buscar usuários role 5:",
      roleUsersError
    );

    /*
    Não impede o cronograma de abrir.
    Usamos o valor gravado na obra.
    */

    return {
      id: null,
      nome:
        valorObra,
      username:
        valorObra,
      email: "",
      role_id: 5,
    };
  }

  const userIds =
    (roleUsers || [])
      .map(
        item =>
          item.user_id
      )
      .filter(Boolean);

  if (
    userIds.length === 0
  ) {
    return {
      id: null,
      nome:
        valorObra,
      username:
        valorObra,
      email: "",
      role_id: 5,
    };
  }

  /*
  ================================================
  BUSCAR PROFILES
  ================================================
  */

  const {
    data: profiles,
    error: profilesError,
  } =
    await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        nome,
        username,
        email
      `)
      .in(
        "id",
        userIds
      );

  if (profilesError) {
    console.error(
      "Erro ao buscar profiles dos marceneiros:",
      profilesError
    );

    return {
      id: null,
      nome:
        valorObra,
      username:
        valorObra,
      email: "",
      role_id: 5,
    };
  }

  /*
  ================================================
  ENCONTRAR O MARCENEIRO
  ================================================
  
  A obra pode estar salvando:
  - username
  - nome
  - email
  - eventualmente id
  ================================================
  */

  const valorNormalizado =
    normalizarTexto(
      valorObra
    );

  const marceneiro =
    (profiles || []).find(
      profile => {
        const id =
          normalizarTexto(
            profile.id
          );

        const nome =
          normalizarTexto(
            profile.nome
          );

        const username =
          normalizarTexto(
            profile.username
          );

        const email =
          normalizarTexto(
            profile.email
          );

        return (
          id ===
            valorNormalizado ||
          nome ===
            valorNormalizado ||
          username ===
            valorNormalizado ||
          email ===
            valorNormalizado
        );
      }
    );

  /*
  ================================================
  ENCONTRADO
  ================================================
  */

  if (marceneiro) {
    return {
      id:
        marceneiro.id,

      nome:
        marceneiro.nome ||
        "",

      username:
        marceneiro.username ||
        "",

      email:
        marceneiro.email ||
        "",

      role_id:
        5,
    };
  }

  /*
  ================================================
  NÃO ENCONTRADO
  ================================================
  
  Mantém o valor salvo em obras.
  ================================================
  */

  return {
    id: null,
    nome:
      valorObra,
    username:
      valorObra,
    email: "",
    role_id:
      5,
  };
}

/*
=====================================================
BUSCAR OBRA COMPLETA
=====================================================
*/

async function buscarObra(
  id: any
) {
  const obraId =
    validarId(
      id,
      "Obra"
    );

  const {
    data,
    error,
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
        obraId
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (!data) {
    throw new Error(
      "Obra não encontrada."
    );
  }

  /*
  ================================================
  MARCENEIRO ROLE 5
  ================================================
  */

  const marceneiro =
    await buscarMarceneiroResponsavel(
      data
    );

  /*
  ================================================
  RETORNO ENRIQUECIDO
  ================================================
  */

  return {
    ...data,

    marceneiro_nome:
      marceneiro.nome ||
      data.marceneiro_nome ||
      "",

    marceneiro_username:
      marceneiro.username ||
      "",

    marceneiro_email:
      marceneiro.email ||
      "",

    marceneiro_id:
      marceneiro.id ||
      null,

    marceneiro:
      marceneiro,
  };
}

/*
=====================================================
VERIFICAR ACESSO À OBRA
=====================================================
*/

async function usuarioPodeAcessarObra(
  obra: any,
  acesso: any
) {
  if (
    acesso.roleId === 1 ||
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
LINHAS BASE
=====================================================
*/

function linhasBase() {
  return [
    {
      id:
        crypto.randomUUID(),
      item:
        "REUNIÃO DE ONBOARDING",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "normal",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "MEDIÇÃO - PISO/FORRO",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "azul",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "APROVAÇÃO DO PROJETO PELA ARQUITETA",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "normal",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "APROVAÇÃO DO PROJETO PELO CLIENTE FINAL",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "amarela",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "COMPRA DE MATERIAL",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "azul",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "RECEBIMENTO DO MATERIAL",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "azul",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "INÍCIO DE PRODUÇÃO",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "azul",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "FIM DA PRODUÇÃO",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "azul",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "CONFERÊNCIA PRÉ-FRETE",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "amarela",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "FRETE",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "azul",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "INÍCIO DE INSTALAÇÃO",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "azul",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "FINALIZAÇÃO DA INSTALAÇÃO",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "azul",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "MEDIÇÃO - BANCADAS ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "COMPRA DE MATERIAL ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "RECEBIMENTO DO MATERIAL ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "INÍCIO DE PRODUÇÃO ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "FIM DA PRODUÇÃO ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "CONFERÊNCIA PRÉ-FRETE ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "FRETE ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "INÍCIO DE INSTALAÇÃO ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },

    {
      id:
        crypto.randomUUID(),
      item:
        "FINALIZAÇÃO DA INSTALAÇÃO ETAPA 2",
      data_prevista:
        "",
      data_realizada:
        "",
      observacoes:
        "",
      tipo:
        "laranja",
    },
  ];
}

/*
=====================================================
VALIDAR LINHAS
=====================================================
*/

function validarLinhas(
  linhas: any
) {
  if (
    !Array.isArray(linhas)
  ) {
    throw new Error(
      "As linhas do cronograma são inválidas."
    );
  }

  if (
    linhas.length > 500
  ) {
    throw new Error(
      "O cronograma não pode possuir mais de 500 linhas."
    );
  }

  return linhas.map(
    (
      linha,
      index
    ) => {
      const item =
        String(
          linha?.item ??
          ""
        ).trim();

      if (!item) {
        throw new Error(
          `A linha ${index + 1} precisa possuir um item.`
        );
      }

      const tiposValidos = [
        "normal",
        "azul",
        "amarela",
        "laranja",
      ];

      const tipo =
        tiposValidos.includes(
          linha?.tipo
        )
          ? linha.tipo
          : "normal";

      return {
        id:
          linha?.id ||
          crypto.randomUUID(),

        item,

        data_prevista:
          linha?.data_prevista ||
          "",

        data_realizada:
          linha?.data_realizada ||
          "",

        observacoes:
          String(
            linha?.observacoes ??
            ""
          ),

        tipo,
      };
    }
  );
}

/*
=====================================================
LISTAR CRONOGRAMAS
=====================================================
*/

async function listarCronogramas(
  acesso: any
) {
  const obrasVisiveis =
    await listarObrasVisiveis(
      acesso
    );

  const obraIds =
    obrasVisiveis.map(
      obra =>
        obra.id
    );

  if (
    obraIds.length === 0
  ) {
    return {
      cronogramas: [],
      obrasDisponiveis:
        [],
    };
  }

  /*
  ================================================
  CRONOGRAMAS
  ================================================
  */

  const {
    data: cronogramasData,
    error: cronogramasError,
  } =
    await supabaseAdmin
      .from("cronogramas")
      .select(`
        id,
        obra_id,
        created_at,
        updated_at
      `)
      .in(
        "obra_id",
        obraIds
      )
      .order(
        "updated_at",
        {
          ascending:
            false,
        }
      );

  if (
    cronogramasError
  ) {
    throw new Error(
      cronogramasError.message
    );
  }

  const cronogramas =
    cronogramasData ||
    [];

  const cronogramaIds =
    cronogramas.map(
      item =>
        item.id
    );

  /*
  ================================================
  VERSÕES
  ================================================
  */

  let versoes: any[] =
    [];

  if (
    cronogramaIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "cronograma_versoes"
        )
        .select(`
          id,
          cronograma_id,
          numero,
          sharepoint_id,
          data_finalizacao_contrato,
          created_at
        `)
        .in(
          "cronograma_id",
          cronogramaIds
        )
        .order(
          "numero",
          {
            ascending:
              false,
          }
        );

    if (error) {
      throw new Error(
        error.message
      );
    }

    versoes =
      data || [];
  }

  /*
  ================================================
  MAPAS
  ================================================
  */

  const obraMap =
    new Map(
      obrasVisiveis.map(
        obra => [
          String(
            obra.id
          ),
          obra,
        ]
      )
    );

  const versoesMap =
    new Map<
      number,
      any[]
    >();

  for (
    const versao of versoes
  ) {
    if (
      !versoesMap.has(
        versao.cronograma_id
      )
    ) {
      versoesMap.set(
        versao.cronograma_id,
        []
      );
    }

    versoesMap
      .get(
        versao.cronograma_id
      )!
      .push(
        versao
      );
  }

  /*
  ================================================
  RESULTADO
  ================================================
  */

  const resultado =
    await Promise.all(
      cronogramas.map(
        async (
          cronograma
        ) => {
          const obra =
            obraMap.get(
              String(
                cronograma.obra_id
              )
            );

          const obraComMarceneiro =
            obra
              ? await buscarMarceneiroResponsavel(
                  obra
                )
              : null;

          const obraFinal =
            obra
              ? {
                  ...obra,

                  marceneiro_nome:
                    obraComMarceneiro?.nome ||
                    obra.marceneiro_nome ||
                    "",

                  marceneiro_username:
                    obraComMarceneiro?.username ||
                    "",

                  marceneiro_email:
                    obraComMarceneiro?.email ||
                    "",

                  marceneiro_id:
                    obraComMarceneiro?.id ||
                    null,

                  marceneiro:
                    obraComMarceneiro,
                }
              : obra;

          return {
            id:
              cronograma.id,

            obra_id:
              cronograma.obra_id,

            obra:
              obraFinal,

            created_at:
              cronograma.created_at,

            updated_at:
              cronograma.updated_at,

            versoes:
              versoesMap.get(
                cronograma.id
              ) || [],
          };
        }
      )
    );

  /*
  ================================================
  OBRAS SEM CRONOGRAMA
  ================================================
  */

  const obrasComCronograma =
    new Set(
      cronogramas.map(
        item =>
          String(
            item.obra_id
          )
      )
    );

  const obrasDisponiveis =
    obrasVisiveis.filter(
      obra =>
        !obrasComCronograma.has(
          String(
            obra.id
          )
        )
    );

  return {
    cronogramas:
      resultado,

    obrasDisponiveis,
  };
}

/*
=====================================================
CRIAR CRONOGRAMA
=====================================================
*/

async function criarCronograma(
  body: any,
  acesso: any
) {
  const obraId =
    validarId(
      body?.obra_id ??
        body?.obraId,
      "Obra"
    );

  /*
  ================================================
  BUSCAR OBRA
  ================================================
  */

  const obra =
    await buscarObra(
      obraId
    );

  /*
  ================================================
  VERIFICAR ACESSO
  ================================================
  */

  const podeAcessar =
    await usuarioPodeAcessarObra(
      obra,
      acesso
    );

  if (!podeAcessar) {
    throw new Error(
      "Você não possui permissão para criar um cronograma para esta obra."
    );
  }

  /*
  ================================================
  VERIFICAR SE JÁ EXISTE
  ================================================
  */

  const {
    data: existente,
    error: existenteError,
  } =
    await supabaseAdmin
      .from("cronogramas")
      .select(
        "id"
      )
      .eq(
        "obra_id",
        obraId
      )
      .maybeSingle();

  if (
    existenteError
  ) {
    throw new Error(
      existenteError.message
    );
  }

  if (existente) {
    throw new Error(
      "Esta obra já possui um cronograma cadastrado."
    );
  }

  /*
  ================================================
  CRIAR CRONOGRAMA PAI
  ================================================
  */

  const agora =
    new Date().toISOString();

  const {
    data: cronograma,
    error: cronogramaError,
  } =
    await supabaseAdmin
      .from("cronogramas")
      .insert({
        obra_id:
          obraId,

        created_at:
          agora,

        updated_at:
          agora,
      })
      .select()
      .single();

  if (
    cronogramaError
  ) {
    console.error(
      "Erro ao criar cronograma:",
      cronogramaError
    );

    throw new Error(
      cronogramaError.message
    );
  }

  /*
  ================================================
  CRIAR VERSÃO 1
  ================================================
  */

  const {
    data: versao,
    error: versaoError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .insert({
        cronograma_id:
          cronograma.id,

        numero:
          1,

        sharepoint_id:
          null,

        data_finalizacao_contrato:
          null,

        linhas:
          linhasBase(),
      })
      .select()
      .single();

  if (
    versaoError
  ) {
    console.error(
      "Erro ao criar versão inicial:",
      versaoError
    );

    /*
    Tenta apagar o pai
    */

    await supabaseAdmin
      .from(
        "cronogramas"
      )
      .delete()
      .eq(
        "id",
        cronograma.id
      );

    throw new Error(
      versaoError.message
    );
  }

  return {
    cronograma: {
      ...cronograma,
      obra,
    },

    versao: {
      ...versao,

      updated_at:
        agora,
    },

    obra,
  };
}

/*
=====================================================
BUSCAR CRONOGRAMA + VERSÃO
=====================================================
*/

async function buscarCronograma(
  cronogramaIdInput: any,
  versaoIdInput: any,
  acesso: any
) {
  const cronogramaId =
    validarId(
      cronogramaIdInput,
      "Cronograma"
    );

  /*
  ================================================
  BUSCAR CRONOGRAMA
  ================================================
  */

  const {
    data: cronograma,
    error: cronogramaError,
  } =
    await supabaseAdmin
      .from("cronogramas")
      .select(`
        id,
        obra_id,
        created_at,
        updated_at
      `)
      .eq(
        "id",
        cronogramaId
      )
      .maybeSingle();

  if (
    cronogramaError
  ) {
    throw new Error(
      cronogramaError.message
    );
  }

  if (!cronograma) {
    throw new Error(
      "Cronograma não encontrado."
    );
  }

  /*
  ================================================
  BUSCAR OBRA
  ================================================
  */

  const obra =
    await buscarObra(
      cronograma.obra_id
    );

  /*
  ================================================
  VALIDAR ACESSO
  ================================================
  */

  const podeAcessar =
    await usuarioPodeAcessarObra(
      obra,
      acesso
    );

  if (!podeAcessar) {
    throw new Error(
      "Você não possui permissão para acessar este cronograma."
    );
  }

  /*
  ================================================
  BUSCAR VERSÃO
  ================================================
  */

  let versao:
    | any
    | null =
    null;

  if (
    versaoIdInput
  ) {
    const versaoId =
      validarId(
        versaoIdInput,
        "Versão"
      );

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "cronograma_versoes"
        )
        .select(`
          id,
          cronograma_id,
          numero,
          sharepoint_id,
          data_finalizacao_contrato,
          linhas,
          created_at
        `)
        .eq(
          "id",
          versaoId
        )
        .eq(
          "cronograma_id",
          cronogramaId
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        error.message
      );
    }

    versao =
      data;
  } else {
    /*
    Se não foi passada versão,
    pega a mais recente.
    */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "cronograma_versoes"
        )
        .select(`
          id,
          cronograma_id,
          numero,
          sharepoint_id,
          data_finalizacao_contrato,
          linhas,
          created_at
        `)
        .eq(
          "cronograma_id",
          cronogramaId
        )
        .order(
          "numero",
          {
            ascending:
              false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      throw new Error(
        error.message
      );
    }

    versao =
      data;
  }

  if (!versao) {
    throw new Error(
      "Versão do cronograma não encontrada."
    );
  }

  /*
  ================================================
  ATUALIZADO EM
  ================================================
  
  O timestamp é controlado no pai.
  ================================================
  */

  const atualizadoEm =
    cronograma.updated_at ||
    versao.created_at ||
    null;

  const versaoFinal = {
    ...versao,

    updated_at:
      atualizadoEm,
  };

  /*
  ================================================
  CRONOGRAMA FINAL
  ================================================
  */

  const cronogramaFinal = {
    ...cronograma,

    obra,
  };

  return {
    cronograma:
      cronogramaFinal,

    obra,

    versao:
      versaoFinal,
  };
}

/*
=====================================================
SALVAR VERSÃO EXISTENTE
=====================================================
*/

async function salvarVersaoExistente(
  body: any,
  acesso: any
) {
  const cronogramaId =
    validarId(
      body?.cronograma_id ??
        body?.cronogramaId,
      "Cronograma"
    );

  const versaoId =
    validarId(
      body?.versao_id ??
        body?.versaoId,
      "Versão"
    );

  /*
  ================================================
  VALIDAR ACESSO + EXISTÊNCIA
  ================================================
  */

  const atual =
    await buscarCronograma(
      cronogramaId,
      versaoId,
      acesso
    );

  /*
  ================================================
  VALIDAR LINHAS
  ================================================
  */

  const linhas =
    validarLinhas(
      body?.linhas
    );

  /*
  ================================================
  DADOS EDITÁVEIS
  ================================================
  */

  const sharepointId =
    String(
      body?.sharepoint_id ??
        ""
    ).trim();

  const dataFinalizacaoContrato =
    body?.data_finalizacao_contrato ||
    null;

  /*
  ================================================
  ATUALIZAR VERSÃO
  ================================================
  */

  const {
    data: versaoAtualizada,
    error: versaoError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .update({
        sharepoint_id:
          sharepointId ||
          null,

        data_finalizacao_contrato:
          dataFinalizacaoContrato,

        linhas:
          linhas,
      })
      .eq(
        "id",
        versaoId
      )
      .eq(
        "cronograma_id",
        cronogramaId
      )
      .select()
      .single();

  if (
    versaoError
  ) {
    console.error(
      "ERRO AO SALVAR VERSÃO:",
      versaoError
    );

    throw new Error(
      `Erro ao salvar a versão: ${versaoError.message}`
    );
  }

  /*
  ================================================
  ATUALIZAR DATA DO CRONOGRAMA
  ================================================
  */

  const agora =
    new Date().toISOString();

  const {
    data: cronogramaAtualizado,
    error: cronogramaError,
  } =
    await supabaseAdmin
      .from(
        "cronogramas"
      )
      .update({
        updated_at:
          agora,
      })
      .eq(
        "id",
        cronogramaId
      )
      .select()
      .single();

  if (
    cronogramaError
  ) {
    console.error(
      "ERRO AO ATUALIZAR CRONOGRAMA:",
      cronogramaError
    );

    throw new Error(
      `Erro ao atualizar data do cronograma: ${cronogramaError.message}`
    );
  }

  /*
  ================================================
  RETORNO
  ================================================
  */

  return {
    success:
      true,

    message:
      "Cronograma salvo com sucesso.",

    versao: {
      ...versaoAtualizada,

      updated_at:
        agora,
    },

    cronograma: {
      ...cronogramaAtualizado,

      obra:
        atual.obra,
    },

    obra:
      atual.obra,
  };
}

/*
=====================================================
CRIAR NOVA VERSÃO
=====================================================
*/

async function criarNovaVersao(
  body: any,
  acesso: any
) {
  const cronogramaId =
    validarId(
      body?.cronograma_id ??
        body?.cronogramaId,
      "Cronograma"
    );

  const origemVersaoId =
    body?.origem_versao_id ??
    body?.origemVersaoId ??
    body?.versao_id ??
    body?.versaoId;

  /*
  ================================================
  BUSCAR ORIGEM
  ================================================
  */

  const atual =
    await buscarCronograma(
      cronogramaId,
      origemVersaoId
        ? validarId(
            origemVersaoId,
            "Versão"
          )
        : null,
      acesso
    );

  const versaoOrigem =
    atual.versao;

  /*
  ================================================
  PEGAR MAIOR NÚMERO
  ================================================
  */

  const {
    data: ultima,
    error: ultimaError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .select(
        "numero"
      )
      .eq(
        "cronograma_id",
        cronogramaId
      )
      .order(
        "numero",
        {
          ascending:
            false,
        }
      )
      .limit(1)
      .maybeSingle();

  if (
    ultimaError
  ) {
    throw new Error(
      ultimaError.message
    );
  }

  const proximoNumero =
    Number(
      ultima?.numero ||
        0
    ) + 1;

  /*
  ================================================
  COPIAR LINHAS
  ================================================
  */

  const linhasOriginais =
    validarLinhas(
      versaoOrigem?.linhas ||
        []
    );

  const novasLinhas =
    linhasOriginais.map(
      linha => ({
        ...linha,

        id:
          crypto.randomUUID(),
      })
    );

  /*
  ================================================
  CRIAR NOVA VERSÃO
  ================================================
  */

  const {
    data: versao,
    error: versaoError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .insert({
        cronograma_id:
          cronogramaId,

        numero:
          proximoNumero,

        sharepoint_id:
          versaoOrigem?.sharepoint_id ||
          null,

        data_finalizacao_contrato:
          versaoOrigem?.data_finalizacao_contrato ||
          null,

        linhas:
          novasLinhas,
      })
      .select()
      .single();

  if (
    versaoError
  ) {
    console.error(
      "ERRO AO CRIAR NOVA VERSÃO:",
      versaoError
    );

    throw new Error(
      `Erro ao criar nova versão: ${versaoError.message}`
    );
  }

  /*
  ================================================
  ATUALIZAR PAI
  ================================================
  */

  const agora =
    new Date().toISOString();

  const {
    data: cronogramaAtualizado,
    error: cronogramaError,
  } =
    await supabaseAdmin
      .from(
        "cronogramas"
      )
      .update({
        updated_at:
          agora,
      })
      .eq(
        "id",
        cronogramaId
      )
      .select()
      .single();

  if (
    cronogramaError
  ) {
    throw new Error(
      `Erro ao atualizar cronograma: ${cronogramaError.message}`
    );
  }

  /*
  ================================================
  RETORNO
  ================================================
  */

  return {
    success:
      true,

    message:
      `Versão ${proximoNumero} criada com sucesso.`,

    versao: {
      ...versao,

      updated_at:
        agora,
    },

    cronograma: {
      ...cronogramaAtualizado,

      obra:
        atual.obra,
    },

    obra:
      atual.obra,
  };
}

/*
=====================================================
EXCLUIR VERSÃO
=====================================================
*/

async function excluirVersao(
  body: any,
  acesso: any
) {
  const versaoId =
    validarId(
      body?.versao_id ??
        body?.versaoId,
      "Versão"
    );

  /*
  ================================================
  BUSCAR VERSÃO
  ================================================
  */

  const {
    data: versao,
    error: versaoError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .select(`
        id,
        cronograma_id,
        numero
      `)
      .eq(
        "id",
        versaoId
      )
      .maybeSingle();

  if (
    versaoError
  ) {
    throw new Error(
      versaoError.message
    );
  }

  if (!versao) {
    throw new Error(
      "Versão não encontrada."
    );
  }

  /*
  ================================================
  VALIDAR ACESSO
  ================================================
  */

  await buscarCronograma(
    versao.cronograma_id,
    versao.id,
    acesso
  );

  /*
  ================================================
  CONTAR VERSÕES
  ================================================
  */

  const {
    count,
    error: countError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .select(
        "id",
        {
          count:
            "exact",
          head:
            true,
        }
      )
      .eq(
        "cronograma_id",
        versao.cronograma_id
      );

  if (
    countError
  ) {
    throw new Error(
      countError.message
    );
  }

  if (
    Number(
      count || 0
    ) <= 1
  ) {
    throw new Error(
      "O cronograma precisa possuir pelo menos uma versão."
    );
  }

  /*
  ================================================
  EXCLUIR
  ================================================
  */

  const {
    error: deleteError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .delete()
      .eq(
        "id",
        versaoId
      );

  if (
    deleteError
  ) {
    throw new Error(
      deleteError.message
    );
  }

  /*
  ================================================
  PEGAR ÚLTIMA VERSÃO
  ================================================
  */

  const {
    data: ultima,
    error: ultimaError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .select(
        "created_at"
      )
      .eq(
        "cronograma_id",
        versao.cronograma_id
      )
      .order(
        "numero",
        {
          ascending:
            false,
        }
      )
      .limit(1)
      .maybeSingle();

  if (
    ultimaError
  ) {
    throw new Error(
      ultimaError.message
    );
  }

  const novaData =
    ultima?.created_at ||
    new Date().toISOString();

  /*
  ================================================
  ATUALIZAR PAI
  ================================================
  */

  const {
    error: updateError,
  } =
    await supabaseAdmin
      .from(
        "cronogramas"
      )
      .update({
        updated_at:
          novaData,
      })
      .eq(
        "id",
        versao.cronograma_id
      );

  if (
    updateError
  ) {
    throw new Error(
      updateError.message
    );
  }

  return {
    success:
      true,

    message:
      "Versão excluída com sucesso.",
  };
}

/*
=====================================================
EXCLUIR CRONOGRAMA INTEIRO
=====================================================
*/

async function excluirCronograma(
  body: any,
  acesso: any
) {
  const cronogramaId =
    validarId(
      body?.cronograma_id ??
        body?.cronogramaId,
      "Cronograma"
    );

  /*
  ================================================
  VALIDAR ACESSO
  ================================================
  */

  await buscarCronograma(
    cronogramaId,
    null,
    acesso
  );

  /*
  ================================================
  EXCLUIR VERSÕES
  ================================================
  */

  const {
    error: deleteVersoesError,
  } =
    await supabaseAdmin
      .from(
        "cronograma_versoes"
      )
      .delete()
      .eq(
        "cronograma_id",
        cronogramaId
      );

  if (
    deleteVersoesError
  ) {
    throw new Error(
      deleteVersoesError.message
    );
  }

  /*
  ================================================
  EXCLUIR CRONOGRAMA
  ================================================
  */

  const {
    error: deleteCronogramaError,
  } =
    await supabaseAdmin
      .from(
        "cronogramas"
      )
      .delete()
      .eq(
        "id",
        cronogramaId
      );

  if (
    deleteCronogramaError
  ) {
    throw new Error(
      deleteCronogramaError.message
    );
  }

  return {
    success:
      true,

    message:
      "Cronograma excluído com sucesso.",
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
    ===============================================
    CORS
    ===============================================
    */

    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        }
      );
    }

    try {
      /*
      =============================================
      ACESSO
      =============================================
      */

      const acesso =
        await verificarAcesso(
          req
        );

      /*
      =============================================
      BODY
      =============================================
      */

      let body: any =
        {};

      if (
        req.method !==
        "GET"
      ) {
        try {
          body =
            await req.json();
        } catch (
          error
        ) {
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
      =============================================
      ACTION
      =============================================
      */

      const action =
        body?.action ||
        (
          req.method ===
          "GET"
            ? "list"
            : ""
        );

      console.log(
        "===================================="
      );

      console.log(
        "ADMIN-CRONOGRAMAS"
      );

      console.log(
        "ACTION:",
        action
      );

      console.log(
        "BODY:",
        JSON.stringify(
          body
        )
      );

      console.log(
        "===================================="
      );

      /*
      =============================================
      LIST
      =============================================
      */

      if (
        action ===
        "list"
      ) {
        const resultado =
          await listarCronogramas(
            acesso
          );

        return jsonResponse({
          success:
            true,

          ...resultado,
        });
      }

      /*
      =============================================
      CREATE
      =============================================
      */

      if (
        action ===
        "create"
      ) {
        const resultado =
          await criarCronograma(
            body,
            acesso
          );

        return jsonResponse(
          {
            success:
              true,

            ...resultado,
          },
          201
        );
      }

      /*
      =============================================
      GET VERSION
      =============================================
      
      Compatibilidade com:
      
      action: "get_version"
      
      usado pelo Cronograma.jsx
      =============================================
      */

      if (
        action ===
          "get_version" ||
        action ===
          "get"
      ) {
        const resultado =
          await buscarCronograma(
            body?.cronograma_id ??
              body?.cronogramaId,

            body?.versao_id ??
              body?.versaoId,

            acesso
          );

        return jsonResponse({
          success:
            true,

          ...resultado,
        });
      }

      /*
      =============================================
      SAVE VERSION
      =============================================
      
      Edita a versão existente.
      
      NÃO cria outra versão.
      =============================================
      */

      if (
        action ===
          "save_version" ||
        action ===
          "save"
      ) {
        const resultado =
          await salvarVersaoExistente(
            body,
            acesso
          );

        return jsonResponse({
          success:
            true,

          ...resultado,
        });
      }

      /*
      =============================================
      CREATE VERSION
      =============================================
      */

      if (
        action ===
        "create_version"
      ) {
        const resultado =
          await criarNovaVersao(
            body,
            acesso
          );

        return jsonResponse(
          {
            success:
              true,

            ...resultado,
          },
          201
        );
      }

      /*
      =============================================
      DELETE VERSION
      =============================================
      */

      if (
        action ===
        "delete_version"
      ) {
        const resultado =
          await excluirVersao(
            body,
            acesso
          );

        return jsonResponse(
          resultado
        );
      }

      /*
      =============================================
      DELETE CRONOGRAMA
      =============================================
      */

      if (
        action ===
        "delete"
      ) {
        const resultado =
          await excluirCronograma(
            body,
            acesso
          );

        return jsonResponse(
          resultado
        );
      }

      /*
      =============================================
      AÇÃO NÃO RECONHECIDA
      =============================================
      */

      return jsonResponse(
        {
          success:
            false,

          error:
            `Ação "${action}" não reconhecida.`,
        },
        400
      );
    } catch (
      error
    ) {
      console.error(
        "===================================="
      );

      console.error(
        "ADMIN-CRONOGRAMAS ERROR:"
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
            mensagemErro(
              error
            ),
        },
        400
      );
    }
  }
);