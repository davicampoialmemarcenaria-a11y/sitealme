import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate,
    useSearchParams
} from "react-router-dom";

import {
    FiArrowLeft,
    FiPlus,
    FiSave,
    FiTrash2,
    FiX,
    FiEdit2,
    FiRefreshCw,
    FiDownload
} from "react-icons/fi";

import { jsPDF } from "jspdf";

import { supabase } from "../../../../services/supabase";

import logoAlme from "../../../../imgs/logoamarela.png";

import "./TabelaOrcamento.scss";


/*
=====================================================
CONSTANTES
=====================================================
*/

const DRAFT_STORAGE_KEY =
    "alme_orcamento_novo_rascunho";

const SESSION_STATE_KEY =
    "alme_orcamento_estado_sessao";

const SESSION_SCROLL_KEY =
    "alme_orcamento_scroll";

const MAX_COMPLEMENTOS = 5;

const VALOR_POR_LED = 50;

const VALOR_POR_METALON = 400;

const MAX_LED = 5;

const MAX_METALON = 30;

const OBSERVACOES_PADRAO = `
Os internos dos móveis são considerados em MDF Branco Tx, exceto quando mencionados na descrição algo diferente. No caso de móveis em que o interno é aparente, como quando contém portas de vidro e portas vazadas, o interno é considerado o mesmo MDF externo.

Todas as ferragens (corrediças e dobradiças) são da marca HÄFELE com sistema de amortecimento, e no caso das gavetas, as corrediças são ocultas. Material em MDF. Caixaria interna de 15mm; Tamponamento de 30mm a 36mm e portas de 18mm. Canto 45° para os itens condizentes.

Quaisquer alterações nos materiais descritos nos itens, como escolhas diferentes de MDF, outras ferragens, alterações em estruturas metálicas, alterações em medidas, podem ocasionar mudança no valor total do projeto.

Atrasos nas liberações de medições podem gerar acréscimo no prazo final de entrega do projeto.
`.trim();

const obterCronogramaObservacoes = valorTotal => {

    const total =
        numberValue(valorTotal);

    if (total <= 50000) {

        return `60 Dias da assinatura
Assinatura em "D0"
Liberação de medição de pé direito - Forro/Piso em "D15"
Liberação de medição da marmoraria - Bancadas em "D30"`;

    }

    if (total <= 130000) {

        return `75 Dias da assinatura
Assinatura em "D0"
Liberação de medição de pé direito - Forro/Piso em "D15"
Liberação de medição da marmoraria - Bancadas em "D40"`;

    }

    return `90 Dias da assinatura
Assinatura em "D0"
Liberação de medição de pé direito - Forro/Piso em "D15"
Liberação de medição da marmoraria - Bancadas em "D50"`;

};

const gerarObservacoesPadrao = valorTotal => {

    return `${OBSERVACOES_PADRAO}

${obterCronogramaObservacoes(valorTotal)}`;

};

/*
=====================================================
HELPERS
=====================================================
*/

const createId = () => {

    if (
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }

    return (
        Date.now().toString() +
        Math.random()
            .toString(36)
            .slice(2)
    );

};


const numberValue = (
    value
) => {

    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {

        return 0;

    }


    let raw =
        String(value)
            .trim();


    if (
        raw.includes(",")
    ) {

        raw =
            raw
                .replace(
                    /\./g,
                    ""
                )
                .replace(
                    ",",
                    "."
                );

    } else {

        raw =
            raw.replace(
                /[^0-9.-]/g,
                ""
            );

    }


    const parsed =
        Number(
            raw
        );


    return Number.isFinite(
        parsed
    )
        ? parsed
        : 0;

};


const money = (
    value
) =>
    new Intl.NumberFormat(
        "pt-BR",
        {
            style:
                "currency",

            currency:
                "BRL"
        }
    ).format(
        numberValue(
            value
        )
    );


const decimal = (
    value,
    digits = 4
) =>
    new Intl.NumberFormat(
        "pt-BR",
        {
            minimumFractionDigits:
                digits,

            maximumFractionDigits:
                digits
        }
    ).format(
        numberValue(
            value
        )
    );

const percentualExibicao = (
    value
) => {

    const percentual =
        numberValue(
            value
        ) * 100;

    return Number.isFinite(
        percentual
    )
        ? percentual
        : 0;

};

const normalizeText = (
    value = ""
) =>
    String(
        value
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[×*]/g,
            "x"
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();


const getColorNumber = (
    value
) => {

    const match =
        String(
            value ?? ""
        ).match(
            /\d+/
        );


    return match
        ? Number(
              match[0]
          )
        : null;

};


/*
=====================================================
NOVO COMPLEMENTO
=====================================================
*/

const novoComplemento = () => ({

    id:
        createId(),

    item_id:
        "",

    item_nome:
        "",

    item_descricao:
        "",

    padrao_medicao:
        "",

    cor_complexidade_id:
        "",

    cor_complexidade_cor:
        "",

    cor_complexidade_nivel:
        "",

    valor_m2:
        0

});


/*
=====================================================
NOVO ITEM
=====================================================
*/

const novoItem = () => ({

    id:
        createId(),

    quantidade:
        1,

    nome_item:
        "",

    altura:
        "",

    largura:
        "",

    profundidade:
        "",

    comprimento:
        "",

    diametro:
        "",

    base_item_id:
        "",

    base_item_nome:
        "",

    base_item_descricao:
        "",

    padrao_medicao:
        "",

    mdf_id:
        "",

    mdf_nome:
        "",

    mdf_cor:
        "",

    cor_complexidade_id:
        "",

    cor_complexidade_cor:
        "",

    cor_complexidade_nivel:
        "",

    valor_m2:
        0,

    possui_complementos:
        false,

    complementos:
        [],

    desconto_adicional:
        0,

    possui_led:
        false,

    quantidade_led:
        0,

    possui_metalon:
        false,

    quantidade_metalon:
        0,

    /*
    =====================================================
    OVER DO ANALISTA
    =====================================================
    */

    over_analista_percentual:
        0.02,

    /*
    =====================================================
    RT DO ARQUITETO
    =====================================================
    */

    rt_arquiteto_percentual:
        0

});



/*
=====================================================
NOVO AMBIENTE
=====================================================
*/

const novoAmbiente = (
    nome = "Ambiente 1"
) => ({

    id:
        createId(),

    nome,

    itens:
        []

});


/*
=====================================================
CÁLCULO DO M²
=====================================================
*/

const calcularM2 = (
    item
) => {

    const padrao =
        normalizeText(
            item.padrao_medicao
        )
            .replace(
                /m²/g,
                ""
            )
            .replace(
                /m2/g,
                ""
            )
            .replace(
                /\(.*?\)/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    const altura =
        numberValue(
            item.altura
        );


    const largura =
        numberValue(
            item.largura
        );


    const profundidade =
        numberValue(
            item.profundidade
        );


    const comprimento =
        numberValue(
            item.comprimento
        );


    const diametro =
        numberValue(
            item.diametro
        );


    if (
        padrao ===
        "altura x largura"
    ) {

        return (
            altura *
            largura
        );

    }


    if (
        padrao ===
        "largura x profundidade"
    ) {

        return (
            largura *
            profundidade
        );

    }


    if (
        padrao ===
        "altura x largura x profundidade"
    ) {

        return (
            altura *
            largura *
            profundidade
        );

    }


    if (
        padrao ===
        "comprimento x largura"
    ) {

        return (
            comprimento *
            largura
        );

    }


    if (
        padrao ===
        "comprimento x largura x altura"
    ) {

        return (
            comprimento *
            largura *
            altura
        );

    }


    if (
        padrao ===
        "largura"
    ) {

        return largura;

    }


    if (
        padrao ===
        "altura"
    ) {

        return altura;

    }


    if (
        padrao ===
        "comprimento"
    ) {

        return comprimento;

    }


    if (
        padrao ===
        "diametro"
    ) {

        return (
            Math.PI *
            Math.pow(
                diametro / 2,
                2
            )
        );

    }


    if (
        padrao ===
        "unidade"
    ) {

        return 1;

    }


    if (
        padrao ===
        "metro linear"
    ) {

        return 1;

    }


    return 0;

};


/*
=====================================================
CAMPO EXTRA DE COMPRIMENTO
=====================================================
*/

const precisaComprimento = (
    padrao
) => {

    const value =
        normalizeText(
            padrao
        );


    return (

        value ===
            "comprimento x largura" ||

        value ===
            "comprimento x largura x altura" ||

        value ===
            "comprimento"

    );

};


/*
=====================================================
CAMPO EXTRA DE DIÂMETRO
=====================================================
*/

const precisaDiametro = (
    padrao
) =>
    normalizeText(
        padrao
    ) ===
    "diametro";


/*
=====================================================
VALOR DO ITEM NA BASE
=====================================================
*/

const getValorBase = (
    registro
) => {

    if (
        !registro
    ) {

        return 0;

    }


    if (
        registro.usar_valor_manual
    ) {

        return numberValue(
            registro.valor_manual
        );

    }


    return numberValue(
        registro.valor_calculado
    );

};


/*
=====================================================
PÁGINA
=====================================================
*/

export default function TabelaOrcamento() {

    const navigate =
        useNavigate();

    const [searchParams, setSearchParams] =
        useSearchParams();

    const urlOrcamentoId =
        searchParams.get("orcamento");

    const urlVersaoId =
        searchParams.get("versao");

    const isEditor =
        searchParams.get("novo") === "1" ||
        Boolean(urlOrcamentoId);

    const [listaOrcamentos, setListaOrcamentos] =
        useState([]);

    const [carregandoLista, setCarregandoLista] =
        useState(false);

    const [erroLista, setErroLista] =
        useState("");

    const [salvando, setSalvando] =
        useState(false);

    const [orcamentoId, setOrcamentoId] =
        useState(urlOrcamentoId || "");

    const [versaoId, setVersaoId] =
        useState(urlVersaoId || "");

    const [versaoAtual, setVersaoAtual] =
        useState(0);

    const [versoesOrcamento, setVersoesOrcamento] =
        useState([]);

const [multiplicador, setMultiplicador] =
    useState(1);

    const [
    valorFinalDesejado,
    setValorFinalDesejado
] = useState("");

const [
    overFinalAplicado,
    setOverFinalAplicado
] = useState(false);
    /*
    =================================================
    DADOS DO ORÇAMENTO
    =================================================
    */

    const [
        orcamento,
        setOrcamento
    ] = useState({

        nome:
            "",

        cliente:
            "",

             arquiteto_empresa:
        "",

        status:
            "rascunho",

        observacoes:
            gerarObservacoesPadrao(0)

    });


    /*
    =================================================
    AMBIENTES
    =================================================
    */

    const [
        ambientes,
        setAmbientes
    ] = useState([
        novoAmbiente()
    ]);


    /*
    =================================================
    ITENS ATIVOS
    =================================================
    */

    const [
        itensBase,
        setItensBase
    ] = useState([]);


    /*
    =================================================
    ITENS INATIVOS / COMPLEMENTOS
    =================================================
    */

    const [
        itensComplementares,
        setItensComplementares
    ] = useState([]);


    /*
    =================================================
    VALORES / COR / COMPLEXIDADE
    =================================================
    */

    const [
        valoresBase,
        setValoresBase
    ] = useState([]);


    /*
    =================================================
    MDF
    =================================================
    */

    const [
        mdfs,
        setMdfs
    ] = useState([]);


    /*
    =================================================
    LOADING
    =================================================
    */

    const [
        carregandoBase,
        setCarregandoBase
    ] = useState(true);


    /*
    =================================================
    ERRO
    =================================================
    */

    const [
        erroBase,
        setErroBase
    ] = useState("");

   /*
=====================================================
USUÁRIOS — ARQUITETOS / PARCEIROS
=====================================================
*/

const [
    arquitetosParceiros,
    setArquitetosParceiros
] = useState([]);

const [
    carregandoArquitetos,
    setCarregandoArquitetos
] = useState(false);

const [
    arquitetoManual,
    setArquitetoManual
] = useState(false);
/*
=====================================================
SCROLL HORIZONTAL DA TABELA
=====================================================
*/

/*
    A tabela possui um scroll próprio por ambiente.
    A barra superior de cada ambiente é sincronizada
    exclusivamente com a tabela daquele mesmo ambiente.
*/

    /*
    =================================================
    RASCUNHO
    =================================================
    */

    const [
        rascunhoCarregado,
        setRascunhoCarregado
    ] = useState(false);


    /*
    =================================================
    CARREGAR BASE
    =================================================
    */

    useEffect(
        () => {

            let ativo =
                true;


            const carregarBase =
                async () => {

                    try {

                        setCarregandoBase(
                            true
                        );

                        setErroBase(
                            ""
                        );


                        const [

                            itensAtivosResult,

                            itensInativosResult,

                            valoresResult,

                            mdfsResult

                        ] =
                            await Promise.all([


                                supabase
                                    .from(
                                        "tabela_preco_itens"
                                    )
                                    .select(
                                        [
                                            "id",
                                            "nome",
                                            "descricao",
                                            "padrao_medicao",
                                            "ativo"
                                        ].join(",")
                                    )
                                    .eq(
                                        "ativo",
                                        true
                                    )
                                    .order(
                                        "nome",
                                        {
                                            ascending:
                                                true
                                        }
                                    ),


                                supabase
                                    .from(
                                        "tabela_preco_itens"
                                    )
                                    .select(
                                        [
                                            "id",
                                            "nome",
                                            "descricao",
                                            "padrao_medicao",
                                            "ativo"
                                        ].join(",")
                                    )
                                    .eq(
                                        "ativo",
                                        false
                                    )
                                    .order(
                                        "nome",
                                        {
                                            ascending:
                                                true
                                        }
                                    ),


                                supabase
                                    .from(
                                        "tabela_preco_valores"
                                    )
                                    .select(
                                        [
                                            "id",
                                            "item_id",
                                            "cor",
                                            "complexidade",
                                            "formula",
                                            "valor_calculado",
                                            "valor_manual",
                                            "usar_valor_manual",
                                            "ativo"
                                        ].join(",")
                                    )
                                    .eq(
                                        "ativo",
                                        true
                                    )
                                    .order(
                                        "item_id",
                                        {
                                            ascending:
                                                true
                                        }
                                    )
                                    .order(
                                        "cor",
                                        {
                                            ascending:
                                                true
                                        }
                                    )
                                    .order(
                                        "complexidade",
                                        {
                                            ascending:
                                                true
                                        }
                                    ),


                                supabase
                                    .from(
                                        "mdfs"
                                    )
                                    .select(
                                        [
                                            "id",
                                            "nome",
                                            "preco_m2",
                                            "fora_preco_mdf",
                                            "cor"
                                        ].join(",")
                                    )
                                    .order(
                                        "nome",
                                        {
                                            ascending:
                                                true
                                        }
                                    )

                            ]);


                        if (
                            itensAtivosResult.error
                        ) {

                            throw (
                                itensAtivosResult.error
                            );

                        }


                        if (
                            itensInativosResult.error
                        ) {

                            throw (
                                itensInativosResult.error
                            );

                        }


                        if (
                            valoresResult.error
                        ) {

                            throw (
                                valoresResult.error
                            );

                        }


                        if (
                            mdfsResult.error
                        ) {

                            throw (
                                mdfsResult.error
                            );

                        }


                        if (
                            !ativo
                        ) {

                            return;

                        }


                        setItensBase(
                            itensAtivosResult.data ||
                            []
                        );


                        setItensComplementares(
                            itensInativosResult.data ||
                            []
                        );


                        setValoresBase(
                            valoresResult.data ||
                            []
                        );


                        setMdfs(
                            mdfsResult.data ||
                            []
                        );


                    } catch (
                        error
                    ) {

                        console.error(
                            "Erro ao carregar base do orçamento:",
                            error
                        );


                        if (
                            ativo
                        ) {

                            setErroBase(
                                error.message ||
                                "Não foi possível carregar a base do orçamento."
                            );

                        }

                    } finally {

                        if (
                            ativo
                        ) {

                            setCarregandoBase(
                                false
                            );

                        }

                    }

                };


            carregarBase();


            return () => {

                ativo =
                    false;

            };

       /*
=====================================================
CARREGAR ARQUITETOS / PARCEIROS
ROLE 6 = PARCEIRO
=====================================================
*/

useEffect(() => {

    let ativo = true;

    const carregarArquitetosParceiros =
        async () => {

            try {

                setCarregandoArquitetos(
                    true
                );

                const {
                    data,
                    error
                } =
                    await supabase.functions.invoke(
                        "admin-users",
                        {
                            body: {
                                action: "list"
                            }
                        }
                    );

                if (error) {
                    throw error;
                }

                if (data?.error) {
                    throw new Error(
                        data.error
                    );
                }

                const usuarios =
                    Array.isArray(
                        data?.users
                    )
                        ? data.users
                        : [];

                const parceiros =
                    usuarios.filter(
                        usuario =>
                            Number(
                                usuario.role_id
                            ) === 6
                    );

                console.log(
                    "ARQUITETOS / PARCEIROS:",
                    parceiros
                );

                if (ativo) {

                    setArquitetosParceiros(
                        parceiros
                    );

                }

            } catch (error) {

                console.error(
                    "Erro ao carregar arquitetos parceiros:",
                    error
                );

                if (ativo) {

                    setArquitetosParceiros(
                        []
                    );

                }

            } finally {

                if (ativo) {

                    setCarregandoArquitetos(
                        false
                    );

                }

            }

        };


    carregarArquitetosParceiros();


    return () => {

        ativo = false;

    };

}, []);

        },
        []
    );
   
/*
=====================================================
CARREGAR ARQUITETOS / PARCEIROS
ROLE 6 = PARCEIRO
=====================================================
*/

useEffect(() => {

    let ativo = true;

    const carregarArquitetosParceiros =
        async () => {

            try {

                setCarregandoArquitetos(
                    true
                );

                const {
                    data,
                    error
                } =
                    await supabase.functions.invoke(
                        "admin-users",
                        {
                            body: {
                                action: "list"
                            }
                        }
                    );

                if (error) {
                    throw error;
                }

                if (data?.error) {
                    throw new Error(
                        data.error
                    );
                }

                const usuarios =
                    Array.isArray(
                        data?.users
                    )
                        ? data.users
                        : [];

                const parceiros =
                    usuarios.filter(
                        usuario =>
                            Number(
                                usuario.role_id
                            ) === 6
                    );

                console.log(
                    "ARQUITETOS / PARCEIROS:",
                    parceiros
                );

                if (ativo) {

                    setArquitetosParceiros(
                        parceiros
                    );

                }

            } catch (error) {

                console.error(
                    "Erro ao carregar arquitetos parceiros:",
                    error
                );

                if (ativo) {

                    setArquitetosParceiros(
                        []
                    );

                }

            } finally {

                if (ativo) {

                    setCarregandoArquitetos(
                        false
                    );

                }

            }

        };


    carregarArquitetosParceiros();


    return () => {

        ativo = false;

    };

}, []);
    /*
=================================================
RECUPERAR ESTADO DA SESSÃO
=================================================
*/

useEffect(
    () => {

        if (!isEditor) {
            setRascunhoCarregado(true);
            return;
        }

        try {

            const salvo =
                sessionStorage.getItem(
                    SESSION_STATE_KEY
                );

            if (!salvo) {
                setRascunhoCarregado(true);
                return;
            }

            const dados =
                JSON.parse(salvo);

            /*
            =================================================
            CONFERE SE O ESTADO É DA MESMA TELA
            =================================================
            */

            const mesmaTela =
                String(
                    dados.orcamentoId || ""
                ) ===
                String(
                    urlOrcamentoId || ""
                ) &&
                String(
                    dados.versaoId || ""
                ) ===
                String(
                    urlVersaoId || ""
                );

            /*
            =================================================
            NOVO ORÇAMENTO
            =================================================
            */

            if (
                !urlOrcamentoId &&
                dados.orcamentoId
            ) {

                setRascunhoCarregado(true);
                return;

            }

            /*
            =================================================
            ORÇAMENTO EXISTENTE
            =================================================
            */

            if (
                urlOrcamentoId &&
                !mesmaTela
            ) {

                setRascunhoCarregado(true);
                return;

            }

            if (
                dados.orcamento
            ) {

                setOrcamento(
                    atual => ({
                        ...atual,
                        ...dados.orcamento
                    })
                );

            }

            if (
                Array.isArray(
                    dados.ambientes
                )
            ) {

                setAmbientes(
                    dados.ambientes.length > 0
                        ? dados.ambientes
                        : [
                            novoAmbiente()
                        ]
                );

            }

            /*
            =================================================
            MULTIPLICADOR
            =================================================
            */

            if (
                [1, 1.1, 1.2, 1.3, 1.5]
                    .includes(
                        Number(
                            dados.multiplicador
                        )
                    )
            ) {

                setMultiplicador(
                    Number(
                        dados.multiplicador
                    )
                );

            }
if (
    dados.valorFinalDesejado !==
    undefined
) {
    setValorFinalDesejado(
        dados.valorFinalDesejado
    );
}

if (
    dados.overFinalAplicado !==
    undefined
) {
    setOverFinalAplicado(
        Boolean(
            dados.overFinalAplicado
        )
    );
}
        } catch (
            error
        ) {

            console.error(
                "Erro ao recuperar estado da sessão:",
                error
            );

        } finally {

            setRascunhoCarregado(
                true
            );

        }

    },
    [
        isEditor,
        urlOrcamentoId,
        urlVersaoId
    ]
);

   /*
=================================================
SALVAR ESTADO DA SESSÃO AUTOMATICAMENTE
=================================================
*/

useEffect(
    () => {

        if (
            !rascunhoCarregado ||
            !isEditor
        ) {

            return;

        }

        try {

            sessionStorage.setItem(
                SESSION_STATE_KEY,
                JSON.stringify({
    orcamentoId:
        orcamentoId || "",

    versaoId:
        versaoId || "",

    orcamento,

    ambientes,

    multiplicador,

    valorFinalDesejado,

    overFinalAplicado,

    atualizadoEm:
        Date.now()
})
            );

            /*
            =================================================
            TAMBÉM MANTÉM O RASCUNHO LOCAL EXISTENTE
            =================================================
            */

            localStorage.setItem(
                DRAFT_STORAGE_KEY,
                JSON.stringify({

                    orcamento,

                    ambientes,

                    multiplicador

                })
            );

        } catch (
            error
        ) {

            console.error(
                "Erro ao salvar estado da sessão:",
                error
            );

        }

    },
    [
        isEditor,
        orcamentoId,
        versaoId,
        orcamento,
        ambientes,
        multiplicador,
        rascunhoCarregado,
        valorFinalDesejado,
overFinalAplicado,
    ]
);

/*
=================================================
SALVAR / RESTAURAR POSIÇÃO DA TELA
=================================================
*/
useEffect(() => {

    if (!isEditor) {
        return;
    }

    const getScrollContainer = () =>
        document.querySelector(
            ".admin__content"
        );

    const salvarScroll = () => {

        try {

            const container =
                getScrollContainer();

            if (!container) {
                return;
            }

            sessionStorage.setItem(
                SESSION_SCROLL_KEY,
                JSON.stringify({
                    orcamentoId:
                        orcamentoId || "",

                    versaoId:
                        versaoId || "",

                    scrollTop:
                        container.scrollTop || 0,

                    atualizadoEm:
                        Date.now()
                })
            );

        } catch (error) {

            console.error(
                "Erro ao salvar posição da tela:",
                error
            );

        }

    };

    const onScroll = () => {
        salvarScroll();
    };

    const onVisibilityChange = () => {

        if (
            document.visibilityState ===
            "hidden"
        ) {
            salvarScroll();
        }

    };

    const container =
        getScrollContainer();

    if (container) {

        container.addEventListener(
            "scroll",
            onScroll,
            {
                passive: true
            }
        );

    }

    window.addEventListener(
        "pagehide",
        salvarScroll
    );

    window.addEventListener(
        "blur",
        salvarScroll
    );

    document.addEventListener(
        "visibilitychange",
        onVisibilityChange
    );

    return () => {

        if (container) {

            container.removeEventListener(
                "scroll",
                onScroll
            );

        }

        window.removeEventListener(
            "pagehide",
            salvarScroll
        );

        window.removeEventListener(
            "blur",
            salvarScroll
        );

        document.removeEventListener(
            "visibilitychange",
            onVisibilityChange
        );

    };

}, [
    isEditor,
    orcamentoId,
    versaoId
]);


/*
=================================================
RESTAURAR POSIÇÃO DA TELA
=================================================
*/
useEffect(() => {

    if (
        !isEditor ||
        !rascunhoCarregado
    ) {
        return;
    }

    let ativo = true;
    let tentativas = 0;

    const MAX_TENTATIVAS = 60;

    const tentarRestaurar = () => {

        if (!ativo) {
            return;
        }

        try {

            const container =
                document.querySelector(
                    ".admin__content"
                );

            if (!container) {

                if (
                    tentativas <
                    MAX_TENTATIVAS
                ) {

                    tentativas++;

                    requestAnimationFrame(
                        tentarRestaurar
                    );

                }

                return;
            }

            const salvo =
                sessionStorage.getItem(
                    SESSION_SCROLL_KEY
                );

            if (!salvo) {
                return;
            }

            const dados =
                JSON.parse(
                    salvo
                );

            const mesmaTela =
                String(
                    dados.orcamentoId || ""
                ) ===
                String(
                    orcamentoId || ""
                ) &&
                String(
                    dados.versaoId || ""
                ) ===
                String(
                    versaoId || ""
                );

            if (!mesmaTela) {
                return;
            }

            const scrollTop =
                Number(
                    dados.scrollTop
                ) || 0;

            if (scrollTop <= 0) {
                return;
            }

            const maxScroll =
                Math.max(
                    0,
                    container.scrollHeight -
                    container.clientHeight
                );

            /*
            O conteúdo ainda está sendo renderizado.
            Espera até existir altura suficiente.
            */
            if (
                maxScroll <
                    scrollTop &&
                tentativas <
                    MAX_TENTATIVAS
            ) {

                tentativas++;

                requestAnimationFrame(
                    tentarRestaurar
                );

                return;
            }

            container.scrollTop =
                Math.min(
                    scrollTop,
                    maxScroll
                );

        } catch (error) {

            console.error(
                "Erro ao restaurar posição da tela:",
                error
            );

        }

    };

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            requestAnimationFrame(
                tentarRestaurar
            );

        });

    });

    return () => {

        ativo = false;

    };

}, [
    isEditor,
    rascunhoCarregado,
    orcamentoId,
    versaoId
]);
/*
=====================================================
SCROLL HORIZONTAL SUPERIOR — POR AMBIENTE
=====================================================
*/

useEffect(() => {

    const atualizarLargurasBarras =
        () => {

            const ambientesElements =
                document.querySelectorAll(
                    ".orcamento-ambiente"
                );

            ambientesElements.forEach(
                ambienteElement => {

                    const tabelaWrapper =
                        ambienteElement.querySelector(
                            ".orcamento-tabela-wrapper"
                        );

                    const barraConteudo =
                        ambienteElement.querySelector(
                            ".orcamento-scroll-superior-conteudo"
                        );

                    if (
                        !tabelaWrapper ||
                        !barraConteudo
                    ) {
                        return;
                    }

                    barraConteudo.style.width =
                        `${tabelaWrapper.scrollWidth}px`;

                }
            );

        };


    const frame =
        requestAnimationFrame(
            atualizarLargurasBarras
        );


    window.addEventListener(
        "resize",
        atualizarLargurasBarras
    );


    return () => {

        cancelAnimationFrame(
            frame
        );

        window.removeEventListener(
            "resize",
            atualizarLargurasBarras
        );

    };

}, [
    ambientes,
    versaoAtual,
    overFinalAplicado
]);


/*
=====================================================
BARRA SUPERIOR → TABELA
=====================================================
*/

function sincronizarScrollSuperiorOrcamento(
    event
) {

    const barra =
        event.currentTarget;

    const ambiente =
        barra.closest(
            ".orcamento-ambiente"
        );

    if (!ambiente) {
        return;
    }

    const tabela =
        ambiente.querySelector(
            ".orcamento-tabela-wrapper"
        );

    if (!tabela) {
        return;
    }

    tabela.scrollLeft =
        barra.scrollLeft;

}


/*
=====================================================
TABELA → BARRA SUPERIOR
=====================================================
*/

function sincronizarScrollTabelaOrcamento(
    event
) {

    const tabela =
        event.currentTarget;

    const ambiente =
        tabela.closest(
            ".orcamento-ambiente"
        );

    if (!ambiente) {
        return;
    }

    const barra =
        ambiente.querySelector(
            ".orcamento-scroll-superior-barra"
        );

    if (!barra) {
        return;
    }

    barra.scrollLeft =
        tabela.scrollLeft;

}
    /*
    =================================================
    NORMALIZAR STATUS
    =================================================
    */

    const statusLabel = value => {

        const map = {
            rascunho: "Rascunho",
            em_analise: "Em análise",
            aprovado: "Aprovado",
            cancelado: "Cancelado"
        };

        return map[value] || value || "Rascunho";
    };

    const statusValue = value => {

        const normalized = normalizeText(value)
            .replace(/ /g, "_");

        if (normalized === "em_analise") return "em_analise";
        if (normalized === "aprovado") return "aprovado";
        if (normalized === "cancelado") return "cancelado";
        return "rascunho";
    };


    /*
    =================================================
    CARREGAR LISTA DE ORÇAMENTOS
    =================================================
    */

    const carregarListaOrcamentos = async () => {

        try {
            setCarregandoLista(true);
            setErroLista("");

            const { data, error } = await supabase
                .from("vw_orcamentos_resumo")
                .select("*")
                .order("updated_at", { ascending: false });

            if (error) throw error;

            setListaOrcamentos(data || []);

        } catch (error) {

            console.error(error);
            setErroLista(
                error.message ||
                "Não foi possível carregar os orçamentos."
            );

        } finally {
            setCarregandoLista(false);
        }
    };


    /*
    =================================================
    CARREGAR ORÇAMENTO / VERSÃO
    =================================================
    */

    const carregarOrcamento = async (
        quoteId,
        requestedVersionId = ""
    ) => {

        try {
            setErroBase("");

            const { data: quote, error: quoteError } =
                await supabase
                    .from("orcamentos")
                    .select("*")
                    .eq("id", quoteId)
                    .single();

            if (quoteError) throw quoteError;

            const { data: allVersions, error: versionsError } =
                await supabase
                    .from("orcamento_versoes")
                    .select("*")
                    .eq("orcamento_id", quoteId)
                    .order("versao", { ascending: false });

            if (versionsError) throw versionsError;

            setVersoesOrcamento(allVersions || []);

            const version = requestedVersionId
                ? (allVersions || []).find(
                    currentVersion =>
                        currentVersion.id === requestedVersionId
                )
                : (allVersions || [])[0];

            if (!version) {
                throw new Error(
                    "Nenhuma versão encontrada para este orçamento."
                );
            }

            const versionIdToLoad = version.id;

            const [
                ambientesResult,
                itensResult,
                complementosResult
            ] = await Promise.all([
                supabase
                    .from("orcamento_versao_ambientes")
                    .select("*")
                    .eq("versao_id", versionIdToLoad)
                    .order("ordem", { ascending: true }),

                supabase
                    .from("orcamento_itens")
                    .select("*")
                    .eq("versao_id", versionIdToLoad)
                    .order("ordem", { ascending: true }),

                supabase
                    .from("orcamento_item_complementos")
                    .select("*")
                    .order("ordem", { ascending: true })
            ]);

            if (ambientesResult.error) throw ambientesResult.error;
            if (itensResult.error) throw itensResult.error;
            if (complementosResult.error) throw complementosResult.error;

            const complementsByItem = {};

            (complementosResult.data || []).forEach(complemento => {
                if (!complementsByItem[complemento.item_id]) {
                    complementsByItem[complemento.item_id] = [];
                }

                complementsByItem[complemento.item_id].push({
                    id: complemento.id,
                    item_id: complemento.base_item_id || "",
                    item_nome: complemento.item_nome || "",
                    item_descricao: complemento.item_descricao || "",
                    padrao_medicao: complemento.padrao_medicao || "",
                    cor_complexidade_id: "",
                    cor_complexidade_cor:
                        complemento.cor_complexidade_cor ?? "",
                    cor_complexidade_nivel:
                        complemento.cor_complexidade_nivel ?? "",
                    valor_m2: complemento.valor_m2 ?? 0
                });
            });

            const itemsByEnvironment = {};

            (itensResult.data || []).forEach(row => {
                if (!itemsByEnvironment[row.ambiente_id]) {
                    itemsByEnvironment[row.ambiente_id] = [];
                }

                itemsByEnvironment[row.ambiente_id].push({
                    id: row.id,
                    quantidade: row.quantidade ?? 1,
                    nome_item: row.nome_item || "",
                    altura: row.altura_cm != null
                        ? Number(row.altura_cm) / 100
                        : "",
                    largura: row.largura_cm != null
                        ? Number(row.largura_cm) / 100
                        : "",
                    profundidade: row.profundidade_cm != null
                        ? Number(row.profundidade_cm) / 100
                        : "",
                    comprimento: row.comprimento_cm != null
                        ? Number(row.comprimento_cm) / 100
                        : "",
                    diametro: row.diametro_cm != null
                        ? Number(row.diametro_cm) / 100
                        : "",
                    base_item_id: row.base_item_id || "",
                    base_item_nome: row.base_item_nome || "",
                    base_item_descricao: row.base_item_descricao || "",
                    padrao_medicao: row.padrao_medicao || "",
                    mdf_id: row.mdf_id || "",
                    mdf_nome: row.mdf_nome || "",
                    mdf_cor: row.mdf_cor ?? "",
                    cor_complexidade_id: "",
                    cor_complexidade_cor:
                        row.cor_complexidade_cor ?? "",
                    cor_complexidade_nivel:
                        row.cor_complexidade_nivel ?? "",
                    valor_m2: row.valor_m2 ?? 0,
                    possui_complementos:
                        Boolean(row.possui_complementos),
                    complementos:
                        complementsByItem[row.id] || [],
                    desconto_adicional:
                        row.desconto_adicional ?? 0,
                    possui_led: Number(row.qtd_led || 0) > 0,
                    quantidade_led: Number(row.qtd_led || 0),
                    possui_metalon:
                        Number(row.qtd_metalon || 0) > 0,
                    quantidade_metalon:
                        Number(row.qtd_metalon || 0),
                    over_analista_percentual:
                        row.over_analista_percentual ?? 0,
                    rt_arquiteto_percentual:
                        row.percentual_rt ?? 0
                });
            });

            setOrcamento({
    nome: quote.nome || "",
    cliente: quote.cliente || "",
    status: quote.status || "rascunho",
    observacoes: quote.observacoes || OBSERVACOES_PADRAO
});

            setAmbientes(
                (ambientesResult.data || []).map(row => ({
                    id: row.id,
                    nome: row.nome || "Ambiente",
                    itens: itemsByEnvironment[row.id] || []
                }))
            );

            if (!ambientesResult.data?.length) {
                setAmbientes([novoAmbiente()]);
            }

           setOrcamentoId(quote.id);
setVersaoId(version.id);
setVersaoAtual(Number(version.versao) || 1);
if (
    Number(version.versao) < 2
) {
    setValorFinalDesejado("");
    setOverFinalAplicado(false);
}

setMultiplicador(
    [1, 1.1, 1.2, 1.3, 1.5].includes(
        Number(version.multiplicador)
    )
        ? Number(version.multiplicador)
        : 1
);

/*
=================================================
RESTAURAR ALTERAÇÕES NÃO SALVAS DA SESSÃO
=================================================
*/

try {

    const salvo =
        sessionStorage.getItem(
            SESSION_STATE_KEY
        );

    if (salvo) {

        const dados =
            JSON.parse(
                salvo
            );

        const mesmaTela =
            String(
                dados.orcamentoId || ""
            ) ===
            String(
                quote.id
            ) &&
            String(
                dados.versaoId || ""
            ) ===
            String(
                version.id
            );

        if (
            mesmaTela &&
            Array.isArray(
                dados.ambientes
            )
        ) {

            setOrcamento(
                dados.orcamento || {
                    nome: quote.nome || "",
                    cliente: quote.cliente || "",
                    cliente: quote.cliente || "",
                    status:
                        quote.status ||
                        "rascunho",
                    observacoes:
                        quote.observacoes ||
                        gerarObservacoesPadrao(0)
                }
            );

            setAmbientes(
                dados.ambientes.length > 0
                    ? dados.ambientes
                    : [novoAmbiente()]
            );

            if (
                [1, 1.1, 1.2, 1.3, 1.5]
                    .includes(
                        Number(
                            dados.multiplicador
                        )
                    )
            ) {

                setMultiplicador(
                    Number(
                        dados.multiplicador
                    )
                ); if (
    dados.valorFinalDesejado !==
    undefined
) {
    setValorFinalDesejado(
        dados.valorFinalDesejado
    );
}

if (
    dados.overFinalAplicado !==
    undefined
) {
    setOverFinalAplicado(
        Boolean(
            dados.overFinalAplicado
        )
    );
}

            }

        }

    }

} catch (
    error
) {

    console.error(
        "Erro ao restaurar alterações da sessão:",
        error
    );

}
setRascunhoCarregado(true);

        } catch (error) {
            console.error("Erro ao carregar orçamento:", error);
            setErroBase(
                error.message ||
                "Não foi possível carregar o orçamento."
            );
        }
    };


    /*
    =================================================
    LISTA / URL
    =================================================
    */

    useEffect(() => {

        if (!isEditor) {
            carregarListaOrcamentos();
        }

    }, [isEditor]);


    useEffect(() => {

        if (!isEditor || !urlOrcamentoId) return;

        carregarOrcamento(
            urlOrcamentoId,
            urlVersaoId || ""
        );

    }, [isEditor, urlOrcamentoId, urlVersaoId]);


   const abrirNovoOrcamento = () => {
    sessionStorage.removeItem(
    SESSION_STATE_KEY
);

sessionStorage.removeItem(
    SESSION_SCROLL_KEY
);

    setOrcamentoId("");
    setVersaoId("");
    setVersaoAtual(0);
    setVersoesOrcamento([]);

    setMultiplicador(1);
    setValorFinalDesejado("");
setOverFinalAplicado(false);

    setOrcamento({
        nome: "",
        cliente: "",
        arquiteto_empresa: "",
        status: "rascunho",
        observacoes: gerarObservacoesPadrao(0)
    });

    setAmbientes([
        novoAmbiente()
    ]);

    setSearchParams({
        novo: "1"
    });

};


    const editarOrcamento = row => {
        setSearchParams({
            orcamento: row.id,
            versao: row.versao_id || ""
        });
    };


    const trocarVersao = event => {

        const selectedVersionId = event.target.value;

        if (!selectedVersionId || !urlOrcamentoId) return;

        setSearchParams({
            orcamento: urlOrcamentoId,
            versao: selectedVersionId
        });
    };


    const excluirOrcamento = async row => {

        const confirmado = window.confirm(
            `Excluir o orçamento "${row.nome}"?\n\nTodas as versões, ambientes, itens e complementos vinculados serão removidos.`
        );

        if (!confirmado) return;

        try {
            setCarregandoLista(true);
            setErroLista("");

            const { error } = await supabase
                .from("orcamentos")
                .delete()
                .eq("id", row.id);

            if (error) throw error;

            await carregarListaOrcamentos();

        } catch (error) {
            console.error(error);
            setErroLista(
                error.message ||
                "Não foi possível excluir o orçamento."
            );
        }
    };


    /*
    =================================================
    ATUALIZAR DADOS DO ORÇAMENTO
    =================================================
    */

    const atualizarCampo =
        (
            campo,
            valor
        ) => {

            setOrcamento(
                atual => ({

                    ...atual,

                    [campo]:
                        valor

                })
            );

        };


    /*
    =================================================
    ADICIONAR AMBIENTE
    =================================================
    */

    const adicionarAmbiente =
        () => {

            setAmbientes(
                atual => [

                    ...atual,

                    novoAmbiente(
                        `Ambiente ${atual.length + 1}`
                    )

                ]
            );

        };


    /*
    =================================================
    REMOVER AMBIENTE
    =================================================
    */

    const removerAmbiente =
        (
            ambienteId
        ) => {

            setAmbientes(
                atual => {

                    if (
                        atual.length <= 1
                    ) {

                        return atual;

                    }


                    return atual.filter(
                        ambiente =>
                            ambiente.id !==
                            ambienteId
                    );

                }
            );

        };


    /*
    =================================================
    RENOMEAR AMBIENTE
    =================================================
    */

    const atualizarAmbiente =
        (
            ambienteId,
            valor
        ) => {

            setAmbientes(
                atual =>
                    atual.map(
                        ambiente =>
                            ambiente.id ===
                            ambienteId

                                ? {

                                    ...ambiente,

                                    nome:
                                        valor

                                }

                                : ambiente
                    )
            );

        };


    /*
    =================================================
    ADICIONAR ITEM
    =================================================
    */

    const adicionarItem =
        (
            ambienteId
        ) => {

            setAmbientes(
                atual =>
                    atual.map(
                        ambiente =>
                            ambiente.id ===
                            ambienteId

                                ? {

                                    ...ambiente,

                                    itens: [

                                        ...ambiente.itens,

                                        novoItem()

                                    ]

                                }

                                : ambiente
                    )
            );

        };


    /*
    =================================================
    REMOVER ITEM
    =================================================
    */

    const removerItem =
        (
            ambienteId,
            itemId
        ) => {

            setAmbientes(
                atual =>
                    atual.map(
                        ambiente =>
                            ambiente.id ===
                            ambienteId

                                ? {

                                    ...ambiente,

                                    itens:
                                        ambiente.itens.filter(
                                            item =>
                                                item.id !==
                                                itemId
                                        )

                                }

                                : ambiente
                    )
            );

        };


    /*
    =================================================
    ATUALIZAR ITEM
    =================================================
    */

    const atualizarItem =
        (
            ambienteId,
            itemId,
            campo,
            valor
        ) => {

            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item =>

                                            item.id ===
                                            itemId

                                                ? {

                                                    ...item,

                                                    [campo]:
                                                        valor

                                                }

                                                : item

                                    )

                            };

                        }
                    )
            );

        };



/*
=================================================
ATUALIZAR QUANTIDADE DE LED / METALON
=================================================
*/

const atualizarQuantidadeExtra =
    (
        ambienteId,
        itemId,
        campo,
        valor,
        maximo
    ) => {

    const quantidade =
        Math.min(
            maximo,
            Math.max(
                0,
                Number(
                    valor
                ) || 0
            )
        );

    setAmbientes(
        atual =>
            atual.map(
                ambiente => {

                    if (
                        ambiente.id !==
                        ambienteId
                    ) {

                        return ambiente;

                    }

                    return {

                        ...ambiente,

                        itens:
                            ambiente.itens.map(
                                item =>

                                    item.id ===
                                    itemId

                                        ? {

                                            ...item,

                                            [campo]:
                                                quantidade

                                        }

                                        : item
                            )

                    };

                }
            )
    );

};


/*
=================================================
ATIVAR / DESATIVAR LED / METALON
=================================================
*/

const alternarExtra =
    (
        ambienteId,
        itemId,
        campoPossui,
        campoQuantidade,
        ativo
    ) => {

    setAmbientes(
        atual =>
            atual.map(
                ambiente => {

                    if (
                        ambiente.id !==
                        ambienteId
                    ) {

                        return ambiente;

                    }

                    return {

                        ...ambiente,

                        itens:
                            ambiente.itens.map(
                                item => {

                                    if (
                                        item.id !==
                                        itemId
                                    ) {

                                        return item;

                                    }

                                    return {

                                        ...item,

                                        [campoPossui]:
                                            ativo,

                                        [campoQuantidade]:
                                            ativo
                                                ? Math.max(
                                                    1,
                                                    Number(
                                                        item[
                                                            campoQuantidade
                                                        ]
                                                    ) || 1
                                                )
                                                : 0

                                    };

                                }
                            )

                    };

                }
            )
    );

};
    /*
    =================================================
    ADICIONAR COMPLEMENTO
    =================================================
    */

    const adicionarComplemento =
        (
            ambienteId,
            itemId
        ) => {

            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            const complementos =
                                                Array.isArray(
                                                    item.complementos
                                                )
                                                    ? item.complementos
                                                    : [];


                                            if (
                                                complementos.length >=
                                                MAX_COMPLEMENTOS
                                            ) {

                                                return item;

                                            }


                                            return {

                                                ...item,

                                                possui_complementos:
                                                    true,

                                                complementos: [

                                                    ...complementos,

                                                    novoComplemento()

                                                ]

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };


    /*
    =================================================
    REMOVER COMPLEMENTO
    =================================================
    */

    const removerComplemento =
        (
            ambienteId,
            itemId,
            complementoId
        ) => {

            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            const complementos =
                                                (
                                                    item.complementos ||
                                                    []
                                                ).filter(
                                                    complemento =>
                                                        complemento.id !==
                                                        complementoId
                                                );


                                            return {

                                                ...item,

                                                complementos

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };


    /*
    =================================================
    ATUALIZAR COMPLEMENTO
    =================================================
    */

    const atualizarComplemento =
        (
            ambienteId,
            itemId,
            complementoId,
            campo,
            valor
        ) => {

            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            return {

                                                ...item,

                                                complementos:
                                                    (
                                                        item.complementos ||
                                                        []
                                                    ).map(
                                                        complemento =>

                                                            complemento.id ===
                                                            complementoId

                                                                ? {

                                                                    ...complemento,

                                                                    [campo]:
                                                                        valor

                                                                }

                                                                : complemento

                                                    )

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };


    /*
    =================================================
    SELECIONAR ITEM BASE
    =================================================
    */

    const selecionarItemBase =
        (
            ambienteId,
            itemId,
            baseId
        ) => {

            const base =
                itensBase.find(
                    item =>
                        item.id ===
                        baseId
                );


            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            return {

                                                ...item,

                                                base_item_id:
                                                    base?.id ||
                                                    "",

                                                base_item_nome:
                                                    base?.nome ||
                                                    "",

                                                base_item_descricao:
                                                    base?.descricao ||
                                                    "",

                                                padrao_medicao:
                                                    base?.padrao_medicao ||
                                                    "",

                                                cor_complexidade_id:
                                                    "",

                                                cor_complexidade_cor:
                                                    "",

                                                cor_complexidade_nivel:
                                                    "",

                                                valor_m2:
                                                    0

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };


    /*
    =================================================
    SELECIONAR MDF
    =================================================
    */

    const selecionarMdf =
        (
            ambienteId,
            itemId,
            mdfId
        ) => {

            const mdf =
                mdfs.find(
                    item =>
                        item.id ===
                        mdfId
                );


            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            const complementos =
                                                (
                                                    item.complementos ||
                                                    []
                                                ).map(
                                                    complemento => ({

                                                        ...complemento,

                                                        cor_complexidade_id:
                                                            "",

                                                        cor_complexidade_cor:
                                                            "",

                                                        cor_complexidade_nivel:
                                                            "",

                                                        valor_m2:
                                                            0

                                                    })
                                                );


                                            return {

                                                ...item,

                                                mdf_id:
                                                    mdf?.id ||
                                                    "",

                                                mdf_nome:
                                                    mdf?.nome ||
                                                    "",

                                                mdf_cor:
                                                    mdf
                                                        ? getColorNumber(
                                                            mdf.cor
                                                        )
                                                        : "",

                                                cor_complexidade_id:
                                                    "",

                                                cor_complexidade_cor:
                                                    "",

                                                cor_complexidade_nivel:
                                                    "",

                                                valor_m2:
                                                    0,

                                                complementos

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };


    /*
    =================================================
    VALORES DISPONÍVEIS DO ITEM PRINCIPAL
    =================================================
    */

    const obterValoresDisponiveis =
        (
            item
        ) => {

            if (
                !item.base_item_id ||
                item.mdf_cor ===
                    ""
            ) {

                return [];

            }


            return valoresBase.filter(
                valor =>

                    valor.item_id ===
                        item.base_item_id &&

                    Number(
                        valor.cor
                    ) ===
                        Number(
                            item.mdf_cor
                        )

            );

        };


    /*
    =================================================
    VALORES DISPONÍVEIS DO COMPLEMENTO
    =================================================
    */

    const obterValoresComplemento =
        (
            item,
            complemento
        ) => {

            if (
                !complemento?.item_id ||
                item.mdf_cor ===
                    ""
            ) {

                return [];

            }


            return valoresBase.filter(
                valor =>

                    valor.item_id ===
                        complemento.item_id &&

                    Number(
                        valor.cor
                    ) ===
                        Number(
                            item.mdf_cor
                        )

            );

        };


    /*
    =================================================
    SELECIONAR ITEM DO COMPLEMENTO
    =================================================
    */

    const selecionarItemComplemento =
        (
            ambienteId,
            itemId,
            complementoId,
            complementoItemId
        ) => {

            const baseComplemento =
                itensComplementares.find(
                    item =>
                        item.id ===
                        complementoItemId
                );


            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            return {

                                                ...item,

                                                complementos:
                                                    (
                                                        item.complementos ||
                                                        []
                                                    ).map(
                                                        complemento => {

                                                            if (
                                                                complemento.id !==
                                                                complementoId
                                                            ) {

                                                                return complemento;

                                                            }


                                                            return {

                                                                ...complemento,

                                                                item_id:
                                                                    baseComplemento?.id ||
                                                                    "",

                                                                item_nome:
                                                                    baseComplemento?.nome ||
                                                                    "",

                                                                item_descricao:
                                                                    baseComplemento?.descricao ||
                                                                    "",

                                                                padrao_medicao:
                                                                    baseComplemento?.padrao_medicao ||
                                                                    "",

                                                                cor_complexidade_id:
                                                                    "",

                                                                cor_complexidade_cor:
                                                                    "",

                                                                cor_complexidade_nivel:
                                                                    "",

                                                                valor_m2:
                                                                    0

                                                            };

                                                        }
                                                    )

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };


    /*
    =================================================
    SELECIONAR COMPLEXIDADE DO COMPLEMENTO
    =================================================
    */

    const selecionarComplexidadeComplemento =
        (
            ambienteId,
            itemId,
            complementoId,
            valorId
        ) => {

            const registro =
                valoresBase.find(
                    valor =>
                        valor.id ===
                        valorId
                );


            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            return {

                                                ...item,

                                                complementos:
                                                    (
                                                        item.complementos ||
                                                        []
                                                    ).map(
                                                        complemento => {

                                                            if (
                                                                complemento.id !==
                                                                complementoId
                                                            ) {

                                                                return complemento;

                                                            }


                                                            if (
                                                                !registro
                                                            ) {

                                                                return {

                                                                    ...complemento,

                                                                    cor_complexidade_id:
                                                                        "",

                                                                    cor_complexidade_cor:
                                                                        "",

                                                                    cor_complexidade_nivel:
                                                                        "",

                                                                    valor_m2:
                                                                        0

                                                                };

                                                            }


                                                            return {

                                                                ...complemento,

                                                                cor_complexidade_id:
                                                                    registro.id,

                                                                cor_complexidade_cor:
                                                                    Number(
                                                                        registro.cor
                                                                    ),

                                                                cor_complexidade_nivel:
                                                                    Number(
                                                                        registro.complexidade
                                                                    ),

                                                                valor_m2:
                                                                    getValorBase(
                                                                        registro
                                                                    )

                                                            };

                                                        }
                                                    )

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };


    /*
    =================================================
    ATIVAR / DESATIVAR COMPLEMENTOS
    =================================================
    */

    const alternarComplementos =
        (
            ambienteId,
            itemId,
            ativo
        ) => {

            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            if (
                                                ativo
                                            ) {

                                                const complementos =
                                                    Array.isArray(
                                                        item.complementos
                                                    ) &&
                                                    item.complementos.length > 0

                                                        ? item.complementos

                                                        : [
                                                            novoComplemento()
                                                        ];


                                                return {

                                                    ...item,

                                                    possui_complementos:
                                                        true,

                                                    complementos

                                                };

                                            }


                                            return {

                                                ...item,

                                                possui_complementos:
                                                    false,

                                                complementos:
                                                    []

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };


    /*
    =================================================
    SELECIONAR COMPLEXIDADE DO ITEM PRINCIPAL
    =================================================
    */

    const selecionarComplexidade =
        (
            ambienteId,
            itemId,
            valorId
        ) => {

            const registro =
                valoresBase.find(
                    valor =>
                        valor.id ===
                        valorId
                );


            setAmbientes(
                atual =>
                    atual.map(
                        ambiente => {

                            if (
                                ambiente.id !==
                                ambienteId
                            ) {

                                return ambiente;

                            }


                            return {

                                ...ambiente,

                                itens:
                                    ambiente.itens.map(
                                        item => {

                                            if (
                                                item.id !==
                                                itemId
                                            ) {

                                                return item;

                                            }


                                            if (
                                                !registro
                                            ) {

                                                return {

                                                    ...item,

                                                    cor_complexidade_id:
                                                        "",

                                                    cor_complexidade_cor:
                                                        "",

                                                    cor_complexidade_nivel:
                                                        "",

                                                    valor_m2:
                                                        0

                                                };

                                            }


                                            return {

                                                ...item,

                                                cor_complexidade_id:
                                                    registro.id,

                                                cor_complexidade_cor:
                                                    Number(
                                                        registro.cor
                                                    ),

                                                cor_complexidade_nivel:
                                                    Number(
                                                        registro.complexidade
                                                    ),

                                                valor_m2:
                                                    getValorBase(
                                                        registro
                                                    )

                                            };

                                        }
                                    )

                            };

                        }
                    )
            );

        };

/*
=================================================
CÁLCULOS
=================================================
*/

const ambientesCalculados =
    useMemo(
        () =>
            ambientes.map(
                ambiente => ({

                    ...ambiente,

                    itens:
                        ambiente.itens.map(
                            item => {

                                /*
                                ==============================
                                M²
                                ==============================
                                */

                                const m2 =
                                    calcularM2(
                                        item
                                    );


                                /*
                                ==============================
                                QUANTIDADE
                                ==============================
                                */

                                const quantidade =
                                    Math.max(
                                        0,
                                        numberValue(
                                            item.quantidade
                                        )
                                    );


                                /*
                                ==============================
                                M² TOTAL
                                ==============================
                                */

                                const m2Total =
                                    m2 *
                                    quantidade;


                                /*
                                ==============================
                                VALOR DO M² DO ITEM PRINCIPAL
                                ==============================
                                */

                                const valorM2 =
                                    numberValue(
                                        item.valor_m2
                                    );


                                /*
                                ==============================
                                SOMA DOS COMPLEMENTOS
                                ==============================
                                */

                                const valorM2Complementos =
                                    (
                                        item.complementos ||
                                        []
                                    ).reduce(
                                        (
                                            total,
                                            complemento
                                        ) =>
                                            total +
                                            numberValue(
                                                complemento.valor_m2
                                            ),
                                        0
                                    );


                                /*
                                ==============================
                                VALOR FINAL DO M²
                                ==============================
                                */

                                const valorFinalM2 =
                                    valorM2 +
                                    valorM2Complementos;


                                /*
                                =====================================================
                                DESCONTO / ADICIONAL
                                =====================================================
                                */

                                const descontoAdicional =
                                    numberValue(
                                        item.desconto_adicional
                                    );


                                /*
                                =====================================================
                                VALOR COM DESCONTO / ADICIONAL
                                =====================================================
                                */

                                const valorComDescontoAdicional =
                                    valorFinalM2 +
                                    descontoAdicional;


                                /*
                                =====================================================
                                VALOR UNITÁRIO
                                =====================================================
                                */

                                const valorUnitario =
                                    m2Total *
                                    valorComDescontoAdicional;


                                /*
                                =====================================================
                                LED
                                =====================================================
                                */

                                const quantidadeLed =
                                    item.possui_led
                                        ? Math.min(
                                            MAX_LED,
                                            Math.max(
                                                0,
                                                numberValue(
                                                    item.quantidade_led
                                                )
                                            )
                                        )
                                        : 0;


                                const valorLed =
                                    quantidadeLed *
                                    VALOR_POR_LED;


                                /*
                                =====================================================
                                METALON
                                =====================================================
                                */

                                const quantidadeMetalon =
                                    item.possui_metalon
                                        ? Math.min(
                                            MAX_METALON,
                                            Math.max(
                                                0,
                                                numberValue(
                                                    item.quantidade_metalon
                                                )
                                            )
                                        )
                                        : 0;


                                const valorMetalon =
                                    quantidadeMetalon *
                                    VALOR_POR_METALON;


                                /*
                                =====================================================
                                VALOR MÍNIMO DA PROPOSTA ALME
                                =====================================================
                                */

                            const valorMinimoPropostaAlmeBase =
    valorUnitario +
    valorLed +
    valorMetalon;

const valorMinimoPropostaAlme =
    valorMinimoPropostaAlmeBase *
    multiplicador;

                                /*
                                =====================================================
                                VALOR PARA MEMORIAL DESCRITIVO
                                =====================================================

                                Valor mínimo da proposta ALME × 0,98
                                */

                                const valorMemorialDescritivo =
                                    valorMinimoPropostaAlme *
                                    0.98;


                                /*
                                =====================================================
                                OVER DO ANALISTA
                                =====================================================
                                */

                                const overAnalistaPercentual =
                                    Math.max(
                                        0,
                                        numberValue(
                                            item.over_analista_percentual
                                        )
                                    );


                                /*
                                =====================================================
                                VALOR COM OVER DO ANALISTA
                                =====================================================

                                Valor mínimo da proposta ALME × 100
                                /
                                (100 - percentual × 100)
                                */

                                const divisorOverAnalista =
                                    100 -
                                    (
                                        overAnalistaPercentual *
                                        100
                                    );


                                const valorComOverAnalista =
                                    divisorOverAnalista > 0
                                        ? (
                                            valorMinimoPropostaAlme *
                                            100
                                        ) /
                                        divisorOverAnalista
                                        : 0;


                                /*
                                =====================================================
                                OVER PARA O ANALISTA
                                =====================================================

                                Valor com over do analista
                                ×
                                percentual
                                */

                                const overAnalista =
                                    valorComOverAnalista *
                                    overAnalistaPercentual;


                                /*
                                =====================================================
                                RT DO ARQUITETO
                                =====================================================
                                */

                                const rtArquitetoPercentual =
                                    Math.max(
                                        0,
                                        numberValue(
                                            item.rt_arquiteto_percentual
                                        )
                                    );


                                /*
                                =====================================================
                                VALOR COM RT
                                =====================================================

                                Valor com over do analista × 100
                                /
                                (100 - percentual RT × 100)
                                */

                                const divisorRt =
                                    100 -
                                    (
                                        rtArquitetoPercentual *
                                        100
                                    );


                                const valorComRt =
                                    divisorRt > 0
                                        ? (
                                            valorComOverAnalista *
                                            100
                                        ) /
                                        divisorRt
                                        : 0;


                                /*
                                =====================================================
                                RT
                                =====================================================

                                Valor com RT
                                ×
                                percentual RT
                                */

                                const rt =
                                    valorComRt *
                                    rtArquitetoPercentual;
/*
=====================================================
VALOR COM RT ARREDONDADO
=====================================================

Arredondamento para a dezena mais próxima.
Exemplo:
1581,63 → 1580,00
*/

const valorComRtArredondado =
    Math.round(
        valorComRt / 10
    ) * 10;

                                return {

                                    ...item,

                                    calculadoM2:
                                        m2,

                                    calculadoM2Total:
                                        m2Total,

                                    calculadoValorM2:
                                        valorM2,

                                    calculadoValorM2Complementos:
                                        valorM2Complementos,

                                    calculadoValorFinalM2:
                                        valorFinalM2,

                                    calculadoValorUnitario:
                                        valorUnitario,

                                    calculadoQuantidadeLed:
                                        quantidadeLed,

                                    calculadoValorLed:
                                        valorLed,

                                    calculadoQuantidadeMetalon:
                                        quantidadeMetalon,

                                    calculadoValorMetalon:
                                        valorMetalon,


calculadoValorMinimoPropostaAlmeBase:
    valorMinimoPropostaAlmeBase,

                                    calculadoValorMinimoPropostaAlme:
                                        valorMinimoPropostaAlme,

                                    /*
                                    =============================================
                                    MEMORIAL
                                    =============================================
                                    */

                                    calculadoValorMemorialDescritivo:
                                        valorMemorialDescritivo,

                                    /*
                                    =============================================
                                    OVER ANALISTA
                                    =============================================
                                    */

                                    calculadoOverAnalistaPercentual:
                                        overAnalistaPercentual,

                                    calculadoValorComOverAnalista:
                                        valorComOverAnalista,

                                    calculadoOverAnalista:
                                        overAnalista,

                                    /*
                                    =============================================
                                    RT
                                    =============================================
                                    */

                                    calculadoRtArquitetoPercentual:
                                        rtArquitetoPercentual,

                                    calculadoValorComRt:
                                        valorComRt,

                                    calculadoRt:
                                        rt,
calculadoValorComRtArredondado:
    valorComRtArredondado,
                                    calculadoDescontoAdicional:
                                        descontoAdicional,

                                    calculadoValorComDescontoAdicional:
                                        valorComDescontoAdicional

                                };

                            }
                        )

                })
            ),
        [
           ambientes,
        multiplicador
        ]
    );



    /*
    =================================================
    TOTAIS
    =================================================
    */

    const totalItens =
        ambientesCalculados.reduce(
            (
                total,
                ambiente
            ) =>
                total +
                ambiente.itens.length,
            0
        );

/*
=================================================
TOTAIS DO PAINEL
=================================================
*/

const totaisColunas = useMemo(() => {

    return ambientesCalculados.reduce(
        (
            totais,
            ambiente
        ) => {

            ambiente.itens.forEach(
                item => {

                    totais.valorUnitario +=
                        numberValue(
                            item.calculadoValorUnitario
                        );

                    totais.valorComDescontoAdicional +=
                        numberValue(
                            item.calculadoValorComDescontoAdicional
                        );

                    totais.valorMinimoPropostaAlme +=
                        numberValue(
                            item.calculadoValorMinimoPropostaAlme
                        );

                    totais.valorMemorialDescritivo +=
                        numberValue(
                            item.calculadoValorMemorialDescritivo
                        );

                    totais.valorComOverAnalista +=
                        numberValue(
                            item.calculadoValorComOverAnalista
                        );

                    totais.overAnalista +=
                        numberValue(
                            item.calculadoOverAnalista
                        );

                    totais.valorComRt +=
                        numberValue(
                            item.calculadoValorComRt
                        );

                    totais.rt +=
                        numberValue(
                            item.calculadoRt
                        );

                    totais.valorComRtArredondado +=
                        numberValue(
                            item.calculadoValorComRtArredondado
                        );

                }
            );

            return totais;

        },
        {
            valorUnitario: 0,
            valorComDescontoAdicional: 0,
            valorMinimoPropostaAlme: 0,
            valorMemorialDescritivo: 0,
            valorComOverAnalista: 0,
            overAnalista: 0,
            valorComRt: 0,
            rt: 0,
            valorComRtArredondado: 0
        }
    );

}, [ambientesCalculados]);



/*
=================================================
NEGOCIAÇÃO DE OVER FINAL
=================================================
*/

/*
=================================================
SOMA DO VALOR QUE JÁ EXISTE ATÉ O RT
=================================================

O Valor Final Desejado deve partir do valor que já
existe com o RT calculado. O Over Final será apenas
o acréscimo necessário para chegar ao valor informado.
=================================================
*/

const valorComRtTotal = useMemo(() => {

    return ambientesCalculados.reduce(
        (total, ambiente) =>
            total +
            ambiente.itens.reduce(
                (subtotal, item) =>
                    subtotal +
                    numberValue(
                        item.calculadoValorComRt
                    ),
                0
            ),
        0
    );

}, [ambientesCalculados]);


const percentualOverFinal = useMemo(() => {

    if (
        Number(versaoAtual) < 2 ||
        !overFinalAplicado
    ) {
        return 0;
    }

    const valorSolicitado =
        numberValue(
            valorFinalDesejado
        );

    if (
        valorSolicitado <= 0 ||
        valorComRtTotal <= 0
    ) {
        return 0;
    }

    /*
    =================================================
    DILUIÇÃO PROPORCIONAL DO OVER FINAL
    =================================================

    O percentual agora é calculado sobre o valor que
    já existe em cada item até o RT.

    Exemplo:

    Valor com RT total = R$ 10.000,00
    Valor final desejado = R$ 12.000,00

    Percentual = 20%

    Cada item recebe exatamente +20% sobre o seu
    próprio Valor com RT.
    =================================================
    */

    return (
        valorSolicitado -
        valorComRtTotal
    ) / valorComRtTotal;

}, [
    versaoAtual,
    overFinalAplicado,
    valorFinalDesejado,
    valorComRtTotal
]);


/*
=================================================
DADOS DO OVER FINAL POR ITEM
=================================================

Este bloco concentra o cálculo para que a coluna
da tabela e os totais utilizem exatamente os
mesmos valores.

Depois do arredondamento individual para dezenas,
a diferença restante é redistribuída em blocos de
R$ 10 para fechar exatamente o Valor Final Desejado
quando o valor solicitado for compatível com esse
arredondamento.
=================================================
*/

const dadosOverFinalPorItem = useMemo(() => {

    const itens = [];

    ambientesCalculados.forEach(
        ambiente => {

            ambiente.itens.forEach(
                item => {

                    const valorMinimo =
                        numberValue(
                            item.calculadoValorMinimoPropostaAlme
                        );

                    const valorComRt =
                        numberValue(
                            item.calculadoValorComRt
                        );

                    const rtPercentual =
                        numberValue(
                            item.calculadoRtArquitetoPercentual
                        );

                    const overNegociado =
                        overFinalAplicado
                            ? valorComRt *
                              percentualOverFinal
                            : 0;

                    const valorMaisOverFinal =
                        valorComRt +
                        overNegociado;

                    const precoFinalTodos =
                        Math.round(
                            valorMaisOverFinal / 10
                        ) * 10;

                    itens.push({

                        chave:
                            `${ambiente.id}::${item.id}`,

                        valorMinimo,

                        valorComRt,

                        rtPercentual,

                        overNegociado,

                        valorMaisOverFinal,

                        precoFinalTodos

                    });

                }
            );

        }
    );

    /*
    =================================================
    RECONCILIAÇÃO DO TOTAL
    =================================================

    O arredondamento individual pode criar uma pequena
    diferença entre a soma dos itens e o valor solicitado.
    Quando isso acontece, ajustamos os preços finais em
    blocos de R$ 10 para que a soma feche exatamente.
    =================================================
    */

    if (
        overFinalAplicado &&
        itens.length > 0
    ) {

        const valorSolicitado =
            numberValue(
                valorFinalDesejado
            );

        const somaArredondada =
            itens.reduce(
                (total, item) =>
                    total +
                    item.precoFinalTodos,
                0
            );

        const diferenca =
            valorSolicitado -
            somaArredondada;

        const diferencaEmDezenas =
            Math.round(
                diferenca / 10
            );

        const diferencaReconstruida =
            diferencaEmDezenas * 10;

        if (
            Math.abs(
                diferenca -
                diferencaReconstruida
            ) < 0.01
        ) {

            const passo =
                diferencaReconstruida > 0
                    ? 10
                    : -10;

            let passosRestantes =
                Math.abs(
                    diferencaEmDezenas
                );

            let indice = 0;

            while (
                passosRestantes > 0 &&
                itens.length > 0
            ) {

                const itemAlvo =
                    itens[
                        indice % itens.length
                    ];

                /*
                Nunca deixamos um item ficar
                com preço final negativo.
                */

                if (
                    passo > 0 ||
                    itemAlvo.precoFinalTodos >= 10
                ) {

                    itemAlvo.precoFinalTodos +=
                        passo;

                    passosRestantes--;

                }

                indice++;

                /*
                Segurança contra loop infinito.
                */

                if (
                    indice >
                    itens.length *
                    (
                        Math.abs(
                            diferencaEmDezenas
                        ) + 1
                    ) *
                    2
                ) {
                    break;
                }

            }

        }

    }

    const resultado = {};

    itens.forEach(
        item => {

            resultado[item.chave] = {

                ...item,

                rtFinal:
                    item.precoFinalTodos *
                    item.rtPercentual

            };

        }
    );

    return resultado;

}, [
    ambientesCalculados,
    overFinalAplicado,
    percentualOverFinal,
    valorFinalDesejado
]);


/*
=================================================
TOTAIS DO OVER FINAL
=================================================
*/

const totaisOverFinal = useMemo(() => {

    const totais = {
        overNegociado: 0,
        valorMaisOverFinal: 0,
        precoFinalTodos: 0,
        rtFinal: 0
    };

    Object.values(
        dadosOverFinalPorItem
    ).forEach(
        item => {

            totais.overNegociado +=
                numberValue(
                    item.overNegociado
                );

            totais.valorMaisOverFinal +=
                numberValue(
                    item.valorMaisOverFinal
                );

            totais.precoFinalTodos +=
                numberValue(
                    item.precoFinalTodos
                );

            totais.rtFinal +=
                numberValue(
                    item.rtFinal
                );

        }
    );

    const valorTotalAdicionado =
        overFinalAplicado
            ? Math.max(
                0,
                numberValue(
                    valorFinalDesejado
                ) -
                numberValue(
                    valorComRtTotal
                )
            )
            : 0;

    const overTotal =
        totais.precoFinalTodos -
        numberValue(
            totaisColunas
                .valorMinimoPropostaAlme
        ) -
        totais.rtFinal;

    return {
        ...totais,
        overTotal,
        valorTotalAdicionado
    };

}, [
    dadosOverFinalPorItem,
    overFinalAplicado,
    valorFinalDesejado,
    valorComRtTotal,
    totaisColunas
]);

/*
=================================================
VALOR BASE PARA O CRONOGRAMA DAS OBSERVAÇÕES
=================================================

Quando o Over Final estiver aplicado:
    usa Soma de todos preço final de todos.

Quando o Over Final não estiver aplicado:
    usa Soma de todos Valor com RT arredondado.
=================================================
*/

const valorBaseCronogramaObservacoes =
    overFinalAplicado &&
    numberValue(
        totaisOverFinal.precoFinalTodos
    ) > 0
        ? numberValue(
            totaisOverFinal.precoFinalTodos
        )
        : numberValue(
            totaisColunas
                .valorComRtArredondado
        );

        /*
=================================================
ATUALIZAR CRONOGRAMA DAS OBSERVAÇÕES
=================================================
*/

useEffect(() => {

    const novoCronograma =
        obterCronogramaObservacoes(
            valorBaseCronogramaObservacoes
        );

    const marcador =
        "Atrasos nas liberações de medições podem gerar acréscimo no prazo final de entrega do projeto.";

    setOrcamento(atual => {

        const textoAtual =
            atual.observacoes || "";

        const posicaoMarcador =
            textoAtual.indexOf(
                marcador
            );

        if (
            posicaoMarcador === -1
        ) {

            return atual;

        }

        const textoFixo =
            textoAtual
                .slice(
                    0,
                    posicaoMarcador +
                    marcador.length
                )
                .trimEnd();

        const novoTexto =
            `${textoFixo}

${novoCronograma}`;

        if (
            textoAtual ===
            novoTexto
        ) {

            return atual;

        }

        return {

            ...atual,

            observacoes:
                novoTexto

        };

    });

}, [
    valorBaseCronogramaObservacoes
]);

    /*
    =================================================
    PDF DO ORÇAMENTO
    =================================================
    */

    const gerarPdfOrcamento = async () => {

        try {

            const itensComDados =
                ambientesCalculados.some(
                    ambiente =>
                        ambiente.itens.some(
                            item =>
                                item.base_item_id
                        )
                );

            if (!itensComDados) {
                window.alert(
                    "Adicione pelo menos um item da base antes de gerar o PDF."
                );
                return;
            }

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "pt",
                format: "a4"
            });

            const pageWidth =
                doc.internal.pageSize.getWidth();

            const pageHeight =
                doc.internal.pageSize.getHeight();

            const margem = 34;
            const larguraUtil =
                pageWidth - (margem * 2);

            const corMarrom = "#4B2108";
            const corMarromEscuro = "#321505";
            const corDourado = "#D48821";
            const corBege = "#F3E5D2";
            const corBegeClaro = "#FAF7F2";
            const corBorda = "#DCC8B2";
            const corTexto = "#2F2118";
            const corCinza = "#766A61";

            const carregarImagemDataUrl = async url => {

                const response =
                    await fetch(url);

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar a logo da ALME."
                    );
                }

                const blob =
                    await response.blob();

                return new Promise(
                    (resolve, reject) => {

                        const reader =
                            new FileReader();

                        reader.onloadend = () =>
                            resolve(
                                reader.result
                            );

                        reader.onerror = reject;

                        reader.readAsDataURL(
                            blob
                        );

                    }
                );

            };

            const criarMarcaDataUrl = async () => {

                try {

                    if (
                        document.fonts &&
                        document.fonts.ready
                    ) {
                        await document.fonts.ready;
                    }

                    const logoDataUrl =
                        await carregarImagemDataUrl(
                            logoAlme
                        );

                    const logo =
                        await new Promise(
                            (resolve, reject) => {

                                const image =
                                    new Image();

                                image.onload = () =>
                                    resolve(image);

                                image.onerror = reject;

                                image.src =
                                    logoDataUrl;

                            }
                        );

                    const canvas =
                        document.createElement(
                            "canvas"
                        );

                    canvas.width = 1100;
                    canvas.height = 190;

                    const context =
                        canvas.getContext("2d");

                    context.clearRect(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    const alturaLogo = 130;
                    const larguraLogo =
                        logo.width > 0
                            ? alturaLogo *
                              (logo.width / logo.height)
                            : 150;

                    context.drawImage(
                        logo,
                        10,
                        25,
                        larguraLogo,
                        alturaLogo
                    );

                    context.fillStyle =
                        corMarrom;

                    context.font =
                        '700 56px "Montserrat", Arial, sans-serif';

                    context.textBaseline =
                        "middle";

                    context.fillText(
                        "ALME MARCENARIA",
                        10 + larguraLogo + 35,
                        95
                    );

                    return canvas.toDataURL(
                        "image/png"
                    );

                } catch (error) {

                    console.error(
                        "Erro ao criar marca do PDF:",
                        error
                    );

                    return null;

                }

            };

            const marcaDataUrl =
                await criarMarcaDataUrl();

            const formatarMedidaCm = value => {

                const cm =
                    numberValue(value) * 100;

                if (cm <= 0) {
                    return "";
                }

                return Number.isInteger(cm)
                    ? String(cm)
                    : new Intl.NumberFormat(
                        "pt-BR",
                        {
                            maximumFractionDigits: 2
                        }
                    ).format(cm);

            };

            const formatarDimensoesPdf = item => {

                const partes = [];

                const altura =
                    formatarMedidaCm(
                        item.altura
                    );

                const largura =
                    formatarMedidaCm(
                        item.largura
                    );

                const profundidade =
                    formatarMedidaCm(
                        item.profundidade
                    );

                if (altura) {
                    partes.push(`A${altura}`);
                }

                if (largura) {
                    partes.push(`L${largura}`);
                }

                if (profundidade) {
                    partes.push(`P${profundidade}`);
                }

                if (
                    partes.length > 0
                ) {
                    return partes.join("x");
                }

                const comprimento =
                    formatarMedidaCm(
                        item.comprimento
                    );

                const diametro =
                    formatarMedidaCm(
                        item.diametro
                    );

                if (comprimento) {
                    return `C${comprimento}`;
                }

                if (diametro) {
                    return `Ø${diametro}`;
                }

                return "-";

            };

            /*
            =================================================
            COLUNA FINANCEIRA DO PDF
            =================================================

            Quando o Over Final foi aplicado e a soma dos
            Preços finais de todos é maior que R$ 1,00,
            o PDF usa exclusivamente o Preço final de todos.

            Caso contrário, usa o Valor com RT arredondado.
            =================================================
            */

            const temPrecoFinalPdf =
                overFinalAplicado &&
                numberValue(
                    totaisOverFinal
                        .precoFinalTodos
                ) > 1;

            const obterPrecoPdf = item => {

                const dadosItem =
                    dadosOverFinalPorItem[
                        `${item._ambienteId}::${item.id}`
                    ];

                if (
                    temPrecoFinalPdf &&
                    dadosItem &&
                    numberValue(
                        dadosItem.precoFinalTodos
                    ) > 0
                ) {
                    return numberValue(
                        dadosItem.precoFinalTodos
                    );
                }

                return numberValue(
                    item.calculadoValorComRtArredondado
                );

            };

            const valorTotalPdf =
                overFinalAplicado &&
                numberValue(
                    valorFinalDesejado
                ) > 0
                    ? numberValue(
                        valorFinalDesejado
                    )
                    : numberValue(
                        totaisColunas
                            .valorComRtArredondado
                    );

            const sanitizarNomeArquivo = value =>
                String(value || "orcamento")
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    )
                    .replace(
                        /[^a-zA-Z0-9_-]+/g,
                        "-"
                    )
                    .replace(
                        /^-+|-+$/g,
                        ""
                    ) || "orcamento";

            let y = 32;

            const desenharMarca = () => {

                if (marcaDataUrl) {

                    doc.addImage(
                        marcaDataUrl,
                        "PNG",
                        margem,
                        22,
                        255,
                        44
                    );

                } else {

                    doc.setTextColor(
                        corMarrom
                    );

                    doc.setFont(
                        "helvetica",
                        "bold"
                    );

                    doc.setFontSize(20);

                    doc.text(
                        "ALME MARCENARIA",
                        margem,
                        52
                    );

                }

                doc.setTextColor(
                    corCinza
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(8);

                doc.text(
                    "ORÇAMENTO",
                    pageWidth - margem,
                    38,
                    {
                        align: "right"
                    }
                );

                doc.setTextColor(
                    corTexto
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(13);

                doc.text(
                    orcamento.nome ||
                        "Orçamento",
                    pageWidth - margem,
                    54,
                    {
                        align: "right"
                    }
                );

                y = 92;

            };

            const desenharRodape = () => {

                const paginaAtual =
                    doc.internal.getCurrentPageInfo()
                        .pageNumber;

                doc.setDrawColor(
                    corBorda
                );

                doc.setLineWidth(0.5);

                doc.line(
                    margem,
                    pageHeight - 28,
                    pageWidth - margem,
                    pageHeight - 28
                );

                doc.setTextColor(
                    corCinza
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(7);

                doc.text(
                    "ALME Marcenaria",
                    margem,
                    pageHeight - 15
                );

                doc.text(
                    `Página ${paginaAtual}`,
                    pageWidth - margem,
                    pageHeight - 15,
                    {
                        align: "right"
                    }
                );

            };

            const garantirEspaco = alturaNecessaria => {

                if (
                    y + alturaNecessaria >
                    pageHeight - 44
                ) {

                    desenharRodape();

                    doc.addPage();

                    desenharMarca();

                    y = 82;

                }

            };

            const desenharCabecalhoTabela = () => {

                const altura = 24;

                const larguraItem =
                    300;

                const larguraValor =
                    larguraUtil -
                    larguraItem;

                const tituloValor =
                    temPrecoFinalPdf
                        ? "Preço final de item"
                        : "Valor final de item";

                const colunas = [
                    {
                        titulo: "Item / Medidas / MDF",
                        x: margem,
                        largura: larguraItem
                    },
                    {
                        titulo: tituloValor,
                        x:
                            margem +
                            larguraItem,
                        largura: larguraValor
                    }
                ];

                doc.setFillColor(
                    corMarrom
                );

                doc.rect(
                    margem,
                    y,
                    larguraUtil,
                    altura,
                    "F"
                );

                doc.setTextColor(
                    255,
                    255,
                    255
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(7);

                colunas.forEach(
                    coluna => {

                        const linhas =
                            doc.splitTextToSize(
                                coluna.titulo,
                                coluna.largura - 8
                            );

                        doc.text(
                            linhas,
                            coluna.x + 4,
                            y + 9
                        );

                    }
                );

                doc.setDrawColor(
                    corMarrom
                );

                doc.setLineWidth(0.6);

                doc.rect(
                    margem,
                    y,
                    larguraUtil,
                    altura
                );

                y += altura;

                return {
                    larguraItem,
                    larguraValor,
                    temPrecoFinalPdf
                };

            };

            const desenharLinhaTabela = (
                item,
                colunas,
                linhaIndex
            ) => {

                const itemNome =
                    item.base_item_nome ||
                    item.nome_item ||
                    "-";

                const dimensoes =
                    formatarDimensoesPdf(
                        item
                    );

                const corMdf =
                    item.mdf_nome ||
                    "-";

                const valorRt =
                    numberValue(
                        item.calculadoValorComRtArredondado
                    );

                const precoFinal =
                    obterPrecoPdf(item);

                const valorFinanceiroPdf =
                    colunas.temPrecoFinalPdf
                        ? precoFinal
                        : valorRt;

                const larguraTextoItem =
                    colunas.larguraItem - 10;

                const linhasItem =
                    doc.splitTextToSize(
                        String(itemNome),
                        larguraTextoItem
                    );

                const linhasDimensoes =
                    doc.splitTextToSize(
                        String(dimensoes),
                        larguraTextoItem
                    );

                const linhasCorMdf =
                    doc.splitTextToSize(
                        String(corMdf),
                        larguraTextoItem
                    );

                const alturaLinhaTexto = 8;
                const espacoParagrafo = 4;
                const espacamentoSuperior = 9;
                const espacamentoInferior = 9;

                const alturaTexto =
                    (
                        linhasItem.length *
                        alturaLinhaTexto
                    ) +
                    espacoParagrafo +
                    (
                        linhasDimensoes.length *
                        alturaLinhaTexto
                    ) +
                    espacoParagrafo +
                    (
                        linhasCorMdf.length *
                        alturaLinhaTexto
                    );

                const alturaLinha = Math.max(
                    50,
                    espacamentoSuperior +
                    alturaTexto +
                    espacamentoInferior
                );

                if (
                    y + alturaLinha >
                    pageHeight - 44
                ) {

                    desenharRodape();

                    doc.addPage();

                    desenharMarca();

                    y = 82;

                    desenharCabecalhoTabela();

                }

                const larguraTotal =
                    colunas.larguraItem +
                    colunas.larguraValor;

                doc.setFillColor(
                    linhaIndex % 2 === 0
                        ? 255
                        : 250,
                    linhaIndex % 2 === 0
                        ? 255
                        : 247,
                    linhaIndex % 2 === 0
                        ? 255
                        : 242
                );

                doc.rect(
                    margem,
                    y,
                    larguraTotal,
                    alturaLinha,
                    "F"
                );

                doc.setDrawColor(
                    corBorda
                );

                doc.setLineWidth(0.45);

                doc.rect(
                    margem,
                    y,
                    larguraTotal,
                    alturaLinha
                );

                const xValor =
                    margem +
                    colunas.larguraItem;

                doc.line(
                    xValor,
                    y,
                    xValor,
                    y + alturaLinha
                );

                let linhaAtual =
                    y +
                    espacamentoSuperior;

                doc.setTextColor(
                    corTexto
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(7.5);

                doc.text(
                    linhasItem,
                    margem + 4,
                    linhaAtual
                );

                linhaAtual +=
                    (
                        linhasItem.length *
                        alturaLinhaTexto
                    ) +
                    espacoParagrafo;

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(7);

                doc.setTextColor(
                    corTexto
                );

                doc.text(
                    linhasDimensoes,
                    margem + 4,
                    linhaAtual
                );

                linhaAtual +=
                    (
                        linhasDimensoes.length *
                        alturaLinhaTexto
                    ) +
                    espacoParagrafo;

                doc.setTextColor(
                    corCinza
                );

                doc.text(
                    linhasCorMdf,
                    margem + 4,
                    linhaAtual
                );

                doc.setTextColor(
                    corMarromEscuro
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(9);

                doc.text(
                    money(valorFinanceiroPdf),
                    margem +
                        larguraTotal -
                        6,
                    y +
                        (alturaLinha / 2) +
                        3,
                    {
                        align: "right"
                    }
                );

                y += alturaLinha;

            };

            desenharMarca();

            doc.setTextColor(
                corTexto
            );

            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.setFontSize(8.5);

            doc.text(
                `Cliente: ${orcamento.cliente || "-"}`,
                margem,
                y
            );

            doc.text(
                `Status: ${statusLabel(orcamento.status)}`,
                pageWidth - margem,
                y,
                {
                    align: "right"
                }
            );

            y += 18;

            if (
                Number(versaoAtual) > 0
            ) {

                doc.setTextColor(
                    corCinza
                );

                doc.setFontSize(7.5);

                doc.text(
                    `Versão V${versaoAtual}`,
                    margem,
                    y
                );

                if (
                    overFinalAplicado &&
                    numberValue(
                        valorFinalDesejado
                    ) > 0
                ) {

                    doc.text(
                        `Valor final desejado: ${money(valorFinalDesejado)}`,
                        pageWidth - margem,
                        y,
                        {
                            align: "right"
                        }
                    );

                }

                y += 20;

            }

            ambientesCalculados.forEach(
                (ambiente, ambienteIndex) => {

                    const itensDoAmbiente =
                        ambiente.itens.filter(
                            item =>
                                item.base_item_id
                        );

                    garantirEspaco(
                        70
                    );

                    doc.setFillColor(
                        corBege
                    );

                    doc.roundedRect(
                        margem,
                        y,
                        larguraUtil,
                        28,
                        5,
                        5,
                        "F"
                    );

                    doc.setTextColor(
                        corMarrom
                    );

                    doc.setFont(
                        "helvetica",
                        "bold"
                    );

                    doc.setFontSize(10);

                    doc.text(
                        `${ambienteIndex + 1}. ${ambiente.nome || "Ambiente"}`,
                        margem + 10,
                        y + 18
                    );

                    y += 36;

                    if (
                        itensDoAmbiente.length === 0
                    ) {

                        doc.setTextColor(
                            corCinza
                        );

                        doc.setFont(
                            "helvetica",
                            "normal"
                        );

                        doc.setFontSize(8);

                        doc.text(
                            "Nenhum item preenchido neste ambiente.",
                            margem + 4,
                            y + 6
                        );

                        y += 24;

                        return;

                    }

                    const colunas =
                        desenharCabecalhoTabela();

                    itensDoAmbiente.forEach(
                        (item, itemIndex) => {

                            const itemPdf = {
                                ...item,
                                _ambienteId:
                                    ambiente.id
                            };

                            desenharLinhaTabela(
                                itemPdf,
                                colunas,
                                itemIndex
                            );

                        }
                    );

                    y += 16;

                }
            );

            const alturaCardFinal = 70;

            garantirEspaco(
                alturaCardFinal + 12
            );

            doc.setFillColor(
                corBege
            );

            doc.setDrawColor(
                corDourado
            );

            doc.setLineWidth(0.9);

            doc.roundedRect(
                margem,
                y,
                larguraUtil,
                alturaCardFinal,
                7,
                7,
                "FD"
            );

            doc.setTextColor(
                corMarrom
            );

            doc.setFont(
                "helvetica",
                "bold"
            );

            doc.setFontSize(9);

            doc.text(
                "VALOR FINAL OBTIDO",
                margem + 14,
                y + 25
            );

            doc.setFontSize(18);

            doc.text(
                money(valorTotalPdf),
                pageWidth - margem - 14,
                y + 31,
                {
                    align: "right"
                }
            );

            doc.setTextColor(
                corCinza
            );

            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.setFontSize(7.5);

            doc.text(
                overFinalAplicado &&
                    numberValue(
                        valorFinalDesejado
                    ) > 0
                    ? "Valor final alcançado após análise do orçamento."
                    : "Valor final alcançado após análise do orçamento.",
                margem + 14,
                y + 48
            );

            y += alturaCardFinal + 16;

            if (
                orcamento.observacoes
            ) {

                garantirEspaco(
                    60
                );

                doc.setTextColor(
                    corMarrom
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(8);

                doc.text(
                    "Observações",
                    margem,
                    y
                );

                y += 12;

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setTextColor(
                    corTexto
                );

                const observacoes =
                    doc.splitTextToSize(
                        String(
                            orcamento.observacoes
                        ),
                        larguraUtil
                    );

                observacoes.forEach(
                    linha => {

                        garantirEspaco(10);

                        doc.text(
                            linha,
                            margem,
                            y
                        );

                        y += 10;

                    }
                );

            }

            const totalPaginas =
                doc.getNumberOfPages();

            for (
                let pagina = 1;
                pagina <= totalPaginas;
                pagina++
            ) {

                doc.setPage(
                    pagina
                );

                desenharRodape();

            }

            const nomeArquivo =
                `orcamento-${sanitizarNomeArquivo(orcamento.nome)}${versaoAtual ? `-v${versaoAtual}` : ""}.pdf`;

            doc.save(
                nomeArquivo
            );

        } catch (error) {

            console.error(
                "Erro ao gerar PDF do orçamento:",
                error
            );

            window.alert(
                error?.message ||
                "Não foi possível gerar o PDF do orçamento."
            );

        }

    };

    /*
    =================================================
    SALVAR ORÇAMENTO / VERSÃO
    =================================================
    */

    const salvarOrcamento = async ({
        criarNovaVersao = false
    } = {}) => {

        if (!orcamento.nome.trim()) {
            window.alert("Informe o nome do orçamento.");
            return;
        }

        const allItems = ambientesCalculados.flatMap(
            ambiente => ambiente.itens
        );

        if (!allItems.length) {
            window.alert("Adicione pelo menos um item ao orçamento.");
            return;
        }

        const itemSemBase = allItems.find(
            item => !item.base_item_id
        );

        if (itemSemBase) {
            window.alert(
                "Todos os itens precisam ter um item da base selecionado."
            );
            return;
        }

        const itemSemMdf = allItems.find(
            item => !item.mdf_id
        );

        if (itemSemMdf) {
            window.alert(
                "Todos os itens precisam ter um MDF selecionado."
            );
            return;
        }

        try {
            setSalvando(true);
            setErroBase("");

            const userResult = await supabase.auth.getUser();
            const userId = userResult.data?.user?.id || null;

            const eraNovoOrcamento = !orcamentoId;
            let quoteId = orcamentoId;

            if (!quoteId) {

                const code =
                    `ORC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

                const { data: createdQuote, error: quoteError } =
                    await supabase
                        .from("orcamentos")
                        .insert({
                            codigo: code,
                            nome: orcamento.nome.trim(),
                            cliente: orcamento.cliente || null,
                            arquiteto_empresa: orcamento.arquiteto_empresa || null,
                            observacoes: orcamento.observacoes || null,
                            status: statusValue(orcamento.status),
                            versao_atual: 1,
                            created_by: userId
                        })
                        .select("*")
                        .single();

                if (quoteError) throw quoteError;

                quoteId = createdQuote.id;
                setOrcamentoId(createdQuote.id);

            } else {

                const { error: quoteUpdateError } =
                    await supabase
                        .from("orcamentos")
                        .update({
                            nome: orcamento.nome.trim(),
                            cliente: orcamento.cliente || null,
                            arquiteto_empresa: orcamento.arquiteto_empresa || null,
                            observacoes: orcamento.observacoes || null,
                            status: statusValue(orcamento.status)
                        })
                        .eq("id", quoteId);

                if (quoteUpdateError) throw quoteUpdateError;
            }

            const { data: versions, error: versionsError } =
                await supabase
                    .from("orcamento_versoes")
                    .select("id, versao")
                    .eq("orcamento_id", quoteId)
                    .order("versao", { ascending: false });

            if (versionsError) throw versionsError;

            const versoesExistentes = versions || [];
            const versaoSelecionada =
                versoesExistentes.find(
                    version => version.id === versaoId
                ) || versoesExistentes[0] || null;

            const deveCriarNovaVersao =
                eraNovoOrcamento ||
                criarNovaVersao ||
                !versaoSelecionada;

            let versaoNumero;
            let versaoIdParaSalvar = "";

            if (deveCriarNovaVersao) {
                versaoNumero = versoesExistentes.length
                    ? Math.max(
                        ...versoesExistentes.map(
                            version => Number(version.versao) || 0
                        )
                    ) + 1
                    : 1;
            } else {
                versaoNumero = Number(
                    versaoSelecionada.versao
                ) || 1;

                versaoIdParaSalvar = versaoSelecionada.id;
            }

            const valorMinimoTotal = ambientesCalculados.reduce(
                (total, ambiente) =>
                    total + ambiente.itens.reduce(
                        (subtotal, item) =>
                            subtotal + numberValue(
                                item.calculadoValorMinimoPropostaAlme
                            ),
                        0
                    ),
                0
            );

            const valorMemorialTotal = ambientesCalculados.reduce(
                (total, ambiente) =>
                    total + ambiente.itens.reduce(
                        (subtotal, item) =>
                            subtotal + numberValue(
                                item.calculadoValorMemorialDescritivo
                            ),
                        0
                    ),
                0
            );

            const valorRtTotal = ambientesCalculados.reduce(
                (total, ambiente) =>
                    total + ambiente.itens.reduce(
                        (subtotal, item) =>
                            subtotal + numberValue(
                                item.calculadoRt
                            ),
                        0
                    ),
                0
            );

            const precoFinalTotal = ambientesCalculados.reduce(
                (total, ambiente) =>
                    total + ambiente.itens.reduce(
                        (subtotal, item) =>
                            subtotal + numberValue(
                                item.calculadoValorComRtArredondado
                            ),
                        0
                    ),
                0
            );

            const overTotal = ambientesCalculados.reduce(
                (total, ambiente) =>
                    total + ambiente.itens.reduce(
                        (subtotal, item) =>
                            subtotal + numberValue(
                                item.calculadoOverAnalista
                            ),
                        0
                    ),
                0
            );

            const valorMinimoBaseTotal = ambientesCalculados.reduce(
                (total, ambiente) =>
                    total + ambiente.itens.reduce(
                        (subtotal, item) =>
                            subtotal + numberValue(
                                item.calculadoValorUnitario
                            ),
                        0
                    ),
                0
            );

            const dadosVersao = {
                orcamento_id: quoteId,
                versao: versaoNumero,
                multiplicador:  Number(multiplicador),
                multiplicador_auto: Number(multiplicador),
                multiplicador_manual: false,
                valor_minimo_total_base:
                    valorMinimoBaseTotal,
                valor_minimo_total:
                    valorMinimoTotal,
                valor_memorial_total:
                    valorMemorialTotal,
                valor_rt_total:
                    valorRtTotal,
                preco_final_total:
                    precoFinalTotal,
                over_total:
                    overTotal,
                created_by: userId
            };

            let savedVersion;

            if (deveCriarNovaVersao) {

                const { data: createdVersion, error: versionError } =
                    await supabase
                        .from("orcamento_versoes")
                        .insert(dadosVersao)
                        .select("*")
                        .single();

                if (versionError) throw versionError;

                savedVersion = createdVersion;

            } else {

                const { data: existingItemRows, error: existingItemsError } =
                    await supabase
                        .from("orcamento_itens")
                        .select("id")
                        .eq("versao_id", versaoIdParaSalvar);

                if (existingItemsError) throw existingItemsError;

                const existingItemIds =
                    (existingItemRows || []).map(item => item.id);

                if (existingItemIds.length) {
                    const { error: deleteComplementosError } =
                        await supabase
                            .from("orcamento_item_complementos")
                            .delete()
                            .in("item_id", existingItemIds);

                    if (deleteComplementosError) {
                        throw deleteComplementosError;
                    }
                }

                const { error: deleteItemsError } =
                    await supabase
                        .from("orcamento_itens")
                        .delete()
                        .eq("versao_id", versaoIdParaSalvar);

                if (deleteItemsError) throw deleteItemsError;

                const { error: deleteEnvironmentsError } =
                    await supabase
                        .from("orcamento_versao_ambientes")
                        .delete()
                        .eq("versao_id", versaoIdParaSalvar);

                if (deleteEnvironmentsError) {
                    throw deleteEnvironmentsError;
                }

                const { data: updatedVersion, error: versionError } =
                    await supabase
                        .from("orcamento_versoes")
                        .update({
                            multiplicador:
                                dadosVersao.multiplicador,
                            multiplicador_auto:
                                dadosVersao.multiplicador_auto,
                            multiplicador_manual:
                                dadosVersao.multiplicador_manual,
                            valor_minimo_total_base:
                                dadosVersao.valor_minimo_total_base,
                            valor_minimo_total:
                                dadosVersao.valor_minimo_total,
                            valor_memorial_total:
                                dadosVersao.valor_memorial_total,
                            valor_rt_total:
                                dadosVersao.valor_rt_total,
                            preco_final_total:
                                dadosVersao.preco_final_total,
                            over_total:
                                dadosVersao.over_total
                        })
                        .eq("id", versaoIdParaSalvar)
                        .select("*")
                        .single();

                if (versionError) throw versionError;

                savedVersion = updatedVersion;
            }

            for (
                let ambienteIndex = 0;
                ambienteIndex < ambientesCalculados.length;
                ambienteIndex += 1
            ) {

                const ambiente = ambientesCalculados[ambienteIndex];

                const { data: savedEnvironment, error: environmentError } =
                    await supabase
                        .from("orcamento_versao_ambientes")
                        .insert({
                            versao_id: savedVersion.id,
                            nome: ambiente.nome?.trim() ||
                                `Ambiente ${ambienteIndex + 1}`,
                            ordem: ambienteIndex
                        })
                        .select("*")
                        .single();

                if (environmentError) throw environmentError;

                for (
                    let itemIndex = 0;
                    itemIndex < ambiente.itens.length;
                    itemIndex += 1
                ) {

                    const item = ambiente.itens[itemIndex];

                    const { data: savedItem, error: itemError } =
                        await supabase
                            .from("orcamento_itens")
                            .insert({
                                versao_id: savedVersion.id,
                                ambiente_id: savedEnvironment.id,
                                ordem: itemIndex,
                                quantidade: Math.max(
                                    0.001,
                                    numberValue(item.quantidade)
                                ),
                                nome_item: item.nome_item || "",
                                base_item_id:
                                    item.base_item_id || null,
                                base_item_nome:
                                    item.base_item_nome || null,
                                base_item_descricao:
                                    item.base_item_descricao || null,
                                padrao_medicao:
                                    item.padrao_medicao || null,
                                altura_cm:
                                    item.altura === "" || item.altura == null
                                        ? null
                                        : numberValue(item.altura) * 100,
                                largura_cm:
                                    item.largura === "" || item.largura == null
                                        ? null
                                        : numberValue(item.largura) * 100,
                                profundidade_cm:
                                    item.profundidade === "" || item.profundidade == null
                                        ? null
                                        : numberValue(item.profundidade) * 100,
                                comprimento_cm:
                                    item.comprimento === "" || item.comprimento == null
                                        ? null
                                        : numberValue(item.comprimento) * 100,
                                diametro_cm:
                                    item.diametro === "" || item.diametro == null
                                        ? null
                                        : numberValue(item.diametro) * 100,
                                mdf_id:
                                    item.mdf_id || null,
                                mdf_nome:
                                    item.mdf_nome || null,
                                mdf_cor:
                                    item.mdf_cor === ""
                                        ? null
                                        : numberValue(item.mdf_cor),
                                cor_complexidade_cor:
                                    item.cor_complexidade_cor === ""
                                        ? null
                                        : numberValue(item.cor_complexidade_cor),
                                cor_complexidade_nivel:
                                    item.cor_complexidade_nivel === ""
                                        ? null
                                        : numberValue(item.cor_complexidade_nivel),
                                m2:
                                    numberValue(item.calculadoM2),
                                m2_total:
                                    numberValue(item.calculadoM2Total),
                                valor_m2:
                                    numberValue(item.calculadoValorM2),
                                valor_final_m2:
                                    numberValue(item.calculadoValorFinalM2),
                                valor_unitario:
                                    numberValue(item.calculadoValorUnitario),
                                possui_complementos:
                                    Boolean(item.possui_complementos),
                                desconto_adicional:
                                    numberValue(item.calculadoDescontoAdicional),
                                qtd_led:
                                    Math.min(
                                        MAX_LED,
                                        Math.max(
                                            0,
                                            Math.round(
                                                numberValue(item.calculadoQuantidadeLed)
                                            )
                                        )
                                    ),
                                qtd_metalon:
                                    Math.min(
                                        MAX_METALON,
                                        Math.max(
                                            0,
                                            Math.round(
                                                numberValue(item.calculadoQuantidadeMetalon)
                                            )
                                        )
                                    ),
                                valor_com_desconto_adicional:
                                    numberValue(item.calculadoValorComDescontoAdicional),
                                valor_minimo_sem_multiplicador:
                                    numberValue(item.calculadoValorUnitario),
                                valor_minimo_proposta:
                                    numberValue(item.calculadoValorMinimoPropostaAlme),
                                valor_memorial_descritivo:
                                    numberValue(item.calculadoValorMemorialDescritivo),
                                over_analista_percentual:
                                    numberValue(item.calculadoOverAnalistaPercentual),
                                valor_item_com_over_analista:
                                    numberValue(item.calculadoValorComOverAnalista),
                                over_analista:
                                    numberValue(item.calculadoOverAnalista),
                                percentual_rt:
                                    numberValue(item.calculadoRtArquitetoPercentual),
                                valor_mais_rt:
                                    numberValue(item.calculadoValorComRt),
                                rt:
                                    numberValue(item.calculadoRt),
                                preco_final:
                                    numberValue(item.calculadoValorComRtArredondado),
                                rt_final_arquiteto:
                                    numberValue(item.calculadoValorComRtArredondado)
                            })
                            .select("*")
                            .single();

                    if (itemError) throw itemError;

                    const complementos = Array.isArray(item.complementos)
                        ? item.complementos
                        : [];

                    for (
                        let complementoIndex = 0;
                        complementoIndex < complementos.length;
                        complementoIndex += 1
                    ) {

                        const complemento = complementos[complementoIndex];

                        if (!complemento.item_id) continue;

                        const { error: complementoError } =
                            await supabase
                                .from("orcamento_item_complementos")
                                .insert({
                                    item_id: savedItem.id,
                                    ordem: complementoIndex + 1,
                                    base_item_id:
                                        complemento.item_id || null,
                                    item_nome:
                                        complemento.item_nome || null,
                                    item_descricao:
                                        complemento.item_descricao || null,
                                    padrao_medicao:
                                        complemento.padrao_medicao || null,
                                    cor_complexidade_cor:
                                        complemento.cor_complexidade_cor === ""
                                            ? null
                                            : numberValue(complemento.cor_complexidade_cor),
                                    cor_complexidade_nivel:
                                        complemento.cor_complexidade_nivel === ""
                                            ? null
                                            : numberValue(complemento.cor_complexidade_nivel),
                                    valor_m2:
                                        numberValue(complemento.valor_m2)
                                });

                        if (complementoError) throw complementoError;
                    }
                }
            }

            if (deveCriarNovaVersao) {
                const { error: quoteVersionError } =
                    await supabase
                        .from("orcamentos")
                        .update({
                            versao_atual: versaoNumero
                        })
                        .eq("id", quoteId);

                if (quoteVersionError) throw quoteVersionError;
            }

            setVersaoId(savedVersion.id);
            setVersaoAtual(versaoNumero);

            localStorage.removeItem(DRAFT_STORAGE_KEY);
            sessionStorage.removeItem(
    SESSION_STATE_KEY
);

sessionStorage.removeItem(
    SESSION_SCROLL_KEY
);
            sessionStorage.removeItem(
    SESSION_STATE_KEY
);

sessionStorage.removeItem(
    SESSION_SCROLL_KEY
);

            setSearchParams({
                orcamento: quoteId,
                versao: savedVersion.id
            });

            const mensagem = deveCriarNovaVersao
                ? `Nova versão V${versaoNumero} criada com sucesso.`
                : `Versão V${versaoNumero} atualizada com sucesso.`;

            window.alert(mensagem);

        } catch (error) {

            console.error("Erro ao salvar orçamento:", error);

            setErroBase(
                error.message ||
                "Não foi possível salvar o orçamento."
            );

            window.alert(
                error.message ||
                "Não foi possível salvar o orçamento."
            );

        } finally {
            setSalvando(false);
        }
    };


    /*
    =================================================
    EXCLUIR VERSÃO
    =================================================
    */

    const excluirVersao = async () => {

        if (!orcamentoId || !versaoId) return;

        if (versoesOrcamento.length <= 1) {
            window.alert(
                "Este orçamento possui apenas uma versão. Para removê-la, exclua o orçamento inteiro pela lista."
            );
            return;
        }

        const versaoSelecionada = versoesOrcamento.find(
            version => version.id === versaoId
        );

        if (!versaoSelecionada) return;

        const confirmado = window.confirm(
            `Excluir a versão V${versaoSelecionada.versao}?\n\nTodos os ambientes, itens e complementos desta versão serão removidos.\n\nEsta ação não pode ser desfeita.`
        );

        if (!confirmado) return;

        try {
            setSalvando(true);
            setErroBase("");

            const { data: itemRows, error: itemRowsError } =
                await supabase
                    .from("orcamento_itens")
                    .select("id")
                    .eq("versao_id", versaoId);

            if (itemRowsError) throw itemRowsError;

            const itemIds =
                (itemRows || []).map(item => item.id);

            if (itemIds.length) {
                const { error: complementosError } =
                    await supabase
                        .from("orcamento_item_complementos")
                        .delete()
                        .in("item_id", itemIds);

                if (complementosError) throw complementosError;
            }

            const { error: itensError } =
                await supabase
                    .from("orcamento_itens")
                    .delete()
                    .eq("versao_id", versaoId);

            if (itensError) throw itensError;

            const { error: ambientesError } =
                await supabase
                    .from("orcamento_versao_ambientes")
                    .delete()
                    .eq("versao_id", versaoId);

            if (ambientesError) throw ambientesError;

            const { error: versaoError } =
                await supabase
                    .from("orcamento_versoes")
                    .delete()
                    .eq("id", versaoId);

            if (versaoError) throw versaoError;

            const { data: remainingVersions, error: remainingError } =
                await supabase
                    .from("orcamento_versoes")
                    .select("id, versao")
                    .eq("orcamento_id", orcamentoId)
                    .order("versao", { ascending: false });

            if (remainingError) throw remainingError;

            const remaining = remainingVersions || [];

            if (!remaining.length) {
                throw new Error(
                    "O orçamento ficou sem versões. Exclua o orçamento inteiro pela lista."
                );
            }

            const { data: quoteData, error: quoteDataError } =
                await supabase
                    .from("orcamentos")
                    .select("versao_atual")
                    .eq("id", orcamentoId)
                    .single();

            if (quoteDataError) throw quoteDataError;

            const versaoExcluidaEraAtual =
                Number(quoteData.versao_atual) ===
                Number(versaoSelecionada.versao);

            const proximaVersaoAtual = versaoExcluidaEraAtual
                ? Number(remaining[0].versao)
                : Number(quoteData.versao_atual);

            if (versaoExcluidaEraAtual) {
                const { error: updateQuoteError } =
                    await supabase
                        .from("orcamentos")
                        .update({
                            versao_atual: proximaVersaoAtual
                        })
                        .eq("id", orcamentoId);

                if (updateQuoteError) throw updateQuoteError;
            }

            const versaoDestino =
                remaining.find(
                    version =>
                        Number(version.versao) ===
                        proximaVersaoAtual
                ) || remaining[0];

            setVersoesOrcamento(remaining);
            setVersaoId(versaoDestino.id);
            setVersaoAtual(Number(versaoDestino.versao) || 1);

            setSearchParams({
                orcamento: orcamentoId,
                versao: versaoDestino.id
            });

            window.alert(
                `Versão V${versaoSelecionada.versao} excluída com sucesso.`
            );

        } catch (error) {

            console.error("Erro ao excluir versão:", error);

            setErroBase(
                error.message ||
                "Não foi possível excluir a versão."
            );

            window.alert(
                error.message ||
                "Não foi possível excluir a versão."
            );

        } finally {
            setSalvando(false);
        }
    };


    /*
    =================================================
    RENDER
    =================================================
    */

    if (!isEditor) {

        const totalOrcamentos = listaOrcamentos.length;
        const totalRascunhos = listaOrcamentos.filter(
            item => item.status === "rascunho"
        ).length;
        const totalAnalise = listaOrcamentos.filter(
            item => item.status === "em_analise"
        ).length;
        const totalAprovados = listaOrcamentos.filter(
            item => item.status === "aprovado"
        ).length;
        const totalCancelados = listaOrcamentos.filter(
            item => item.status === "cancelado"
        ).length;

        return (
            <div className="tabela-orcamento-page tabela-orcamento-lista-page">

                <div className="tabela-orcamento-lista-topo">
                    <div>
                        <span className="tabela-orcamento-kicker">
                            COMERCIAL
                        </span>
                        <h1>Orçamentos</h1>
                        <p>
                            Gestão de orçamentos, versões e valores comerciais.
                        </p>
                    </div>

                    <div className="tabela-orcamento-lista-acoes">
                        <button
                            type="button"
                            className="orcamento-lista-refresh"
                            onClick={carregarListaOrcamentos}
                            disabled={carregandoLista}
                        >
                            <FiRefreshCw />
                            {carregandoLista ? "Atualizando..." : "Atualizar"}
                        </button>

                        <button
                            type="button"
                            className="orcamento-salvar"
                            onClick={abrirNovoOrcamento}
                        >
                            <FiPlus />
                            Novo orçamento
                        </button>
                    </div>
                </div>

                <div className="orcamento-lista-resumo-grid">
                    <div className="orcamento-lista-resumo-card">
                        <span>Total</span>
                        <strong>{totalOrcamentos}</strong>
                    </div>
                    <div className="orcamento-lista-resumo-card">
                        <span>Rascunhos</span>
                        <strong>{totalRascunhos}</strong>
                    </div>
                    <div className="orcamento-lista-resumo-card">
                        <span>Em análise</span>
                        <strong>{totalAnalise}</strong>
                    </div>
                    <div className="orcamento-lista-resumo-card">
                        <span>Aprovados</span>
                        <strong>{totalAprovados}</strong>
                    </div>
                    <div className="orcamento-lista-resumo-card">
                        <span>Cancelados</span>
                        <strong>{totalCancelados}</strong>
                    </div>
                </div>

                {erroLista && (
                    <div className="orcamento-erro-base">
                        {erroLista}
                    </div>
                )}

                <section className="orcamento-lista-card">
                    <div className="orcamento-lista-card-header">
                        <div>
                            <span>GESTÃO</span>
                            <h2>Orçamentos cadastrados</h2>
                        </div>
                    </div>

                    {carregandoLista && listaOrcamentos.length === 0 ? (
                        <div className="orcamento-lista-loading">
                            Carregando orçamentos...
                        </div>
                    ) : listaOrcamentos.length === 0 ? (
                        <div className="orcamento-lista-vazia">
                            <strong>Nenhum orçamento cadastrado</strong>
                            <span>
                                Crie o primeiro orçamento para começar.
                            </span>
                            <button
                                type="button"
                                className="orcamento-salvar"
                                onClick={abrirNovoOrcamento}
                            >
                                <FiPlus />
                                Criar orçamento
                            </button>
                        </div>
                    ) : (
                        <div className="orcamento-lista-table-wrapper">
                            <table className="orcamento-lista-table">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Orçamento</th>
                                        <th>Cliente</th>
                                        <th>Versão</th>
                                        <th>Valor mínimo</th>
                                        <th>Preço final</th>
                                        <th>Status</th>
                                        <th>Atualizado</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {listaOrcamentos.map(row => (
                                        <tr key={row.id}>
                                            <td>
                                                <strong>{row.codigo}</strong>
                                            </td>
                                            <td>{row.nome}</td>
                                            <td>{row.cliente || "—"}</td>
                                            <td>
                                                <span className="orcamento-lista-versao">
                                                    V{row.versao_atual || 1}
                                                </span>
                                            </td>
                                            <td>
                                                {money(row.valor_minimo_total)}
                                            </td>
                                            <td className="orcamento-lista-preco-final">
                                                {money(row.preco_final_total)}
                                            </td>
                                            <td>
                                                <span className={`orcamento-lista-status orcamento-lista-status-${row.status}`}>
                                                    {statusLabel(row.status)}
                                                </span>
                                            </td>
                                            <td>
                                                {row.updated_at
                                                    ? new Date(row.updated_at).toLocaleString(
                                                        "pt-BR",
                                                        {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        }
                                                    )
                                                    : "—"}
                                            </td>
                                            <td>
                                                <div className="orcamento-lista-acoes-linha">
                                                    <button
                                                        type="button"
                                                        className="orcamento-lista-editar"
                                                        onClick={() => editarOrcamento(row)}
                                                        title="Editar orçamento"
                                                    >
                                                        <FiEdit2 />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="orcamento-lista-excluir"
                                                        onClick={() => excluirOrcamento(row)}
                                                        title="Excluir orçamento"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        );
    }

    return (

        <div className="tabela-orcamento-page">


            {/* =================================================
                TOPO
            ================================================= */}

            <div className="tabela-orcamento-topo">

                <button
                    type="button"
                    className="orcamento-voltar"
                    onClick={
                        () =>
                            navigate(
                                "/admin/comercial/tabela-orcamento"
                            )
                    }
                >

                    <FiArrowLeft />

                    <span>
                        Orçamentos
                    </span>

                </button>


                <div className="tabela-orcamento-topo-acoes">

                    {orcamentoId && (
                        <button
                            type="button"
                            className="orcamento-nova-versao"
                            onClick={
                                () =>
                                    salvarOrcamento({
                                        criarNovaVersao: true
                                    })
                            }
                            disabled={salvando}
                        >

                            <FiPlus />

                            <span>
                                Nova versão
                            </span>

                        </button>
                    )}

                    <button
                        type="button"
                        className="orcamento-nova-versao"
                        onClick={
                            gerarPdfOrcamento
                        }
                        disabled={
                            carregandoBase ||
                            !ambientesCalculados.some(
                                ambiente =>
                                    ambiente.itens.some(
                                        item =>
                                            item.base_item_id
                                    )
                            )
                        }
                    >

                        <FiDownload />

                        <span>
                            Baixar PDF
                        </span>

                    </button>


                    <button
                        type="button"
                        className="orcamento-salvar"
                        onClick={
                            () =>
                                salvarOrcamento()
                        }
                        disabled={salvando}
                    >

                        <FiSave />

                        <span>
                            {salvando
                                ? "Salvando..."
                                : orcamentoId
                                    ? `Salvar V${versaoAtual || ""}`
                                    : "Salvar orçamento"}
                        </span>

                    </button>

                </div>

            </div>


            {/* =================================================
                DADOS DO ORÇAMENTO
            ================================================= */}

            <section className="orcamento-dados-card">

                <div className="orcamento-dados-titulo">

                    <span>
                        COMERCIAL
                    </span>

                    <div className="orcamento-titulo-linha">
                        <h1>
                            {orcamentoId
                                ? `Orçamento ${orcamento.nome || ""}`
                                : "Novo orçamento"}
                        </h1>

                        {orcamentoId && versoesOrcamento.length > 0 && (
                            <div className="orcamento-versao-selector">
                                <label htmlFor="orcamento-versao">
                                    Versão
                                </label>
                                <select
                                    id="orcamento-versao"
                                    value={versaoId}
                                    onChange={trocarVersao}
                                    disabled={salvando}
                                >
                                    {versoesOrcamento.map(version => (
                                        <option
                                            key={version.id}
                                            value={version.id}
                                        >
                                            V{version.versao}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    className="orcamento-versao-excluir"
                                    onClick={excluirVersao}
                                    disabled={
                                        salvando ||
                                        versoesOrcamento.length <= 1
                                    }
                                    title={
                                        versoesOrcamento.length <= 1
                                            ? "O orçamento precisa manter pelo menos uma versão."
                                            : `Excluir V${versaoAtual || ""}`
                                    }
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        )}
                    </div>

                </div>


                <div className="orcamento-form-grid">


                    <div className="orcamento-field">

                        <label>
                            Nome do orçamento
                        </label>

                        <input
                            type="text"
                            placeholder="Ex: ESTRADA TOCANTINS, 595, JARDIM ESTANCIA BRASIL, ATIBAIA - RMV JOICE BRITO"
                            value={
                                orcamento.nome
                            }
                            onChange={
                                event =>
                                    atualizarCampo(
                                        "nome",
                                        event.target.value
                                    )
                            }
                        />

                    </div>


                    <div className="orcamento-field">

                        <label>
                            Cliente
                        </label>

                        <input
                            type="text"
                            placeholder="Nome do cliente"
                            value={
                                orcamento.cliente
                            }
                            onChange={
                                event =>
                                    atualizarCampo(
                                        "cliente",
                                        event.target.value
                                    )
                            }
                        />

                    </div>
                    <div className="orcamento-field">

    <label>
        Arquiteto / Empresa
    </label>

    <select
        value={
            arquitetoManual
                ? "__manual__"
                : orcamento.arquiteto_empresa
        }
        onChange={
            event => {

                const valor =
                    event.target.value;

                /*
                =========================================
                OUTRO / NÃO CADASTRADO
                =========================================
                */

                if (
                    valor === "__manual__"
                ) {

                    setArquitetoManual(
                        true
                    );

                    atualizarCampo(
                        "arquiteto_empresa",
                        ""
                    );

                    return;

                }

                /*
                =========================================
                PARCEIRO CADASTRADO
                =========================================
                */

                setArquitetoManual(
                    false
                );

                atualizarCampo(
                    "arquiteto_empresa",
                    valor
                );

            }
        }
        disabled={
            carregandoArquitetos
        }
    >

        <option value="">
            {
                carregandoArquitetos
                    ? "Carregando parceiros..."
                    : "Selecione o arquiteto / empresa"
            }
        </option>


        {
            arquitetosParceiros.map(
                usuario => {

                    const nomeExibicao =
                        usuario.nome ||
                        usuario.username ||
                        usuario.email ||
                        "Usuário";

                    return (

                        <option
                            key={
                                usuario.id
                            }
                            value={
                                nomeExibicao
                            }
                        >
                            {nomeExibicao}
                        </option>

                    );

                }
            )
        }


        <option value="__manual__">
            Outro / não cadastrado
        </option>

    </select>


    {
        arquitetoManual && (

            <input
                type="text"
                placeholder="Digite o nome do arquiteto ou empresa"
                value={
                    orcamento.arquiteto_empresa
                }
                onChange={
                    event =>
                        atualizarCampo(
                            "arquiteto_empresa",
                            event.target.value
                        )
                }
                autoFocus
            />

        )
    }

</div>


                    <div className="orcamento-field">

                        <label>
                            Status
                        </label>

                        <select
                            value={
                                orcamento.status
                            }
                            onChange={
                                event =>
                                    atualizarCampo(
                                        "status",
                                        event.target.value
                                    )
                            }
                        >

                            <option value="rascunho">
                                Rascunho
                            </option>

                            <option value="em_analise">
                                Em análise
                            </option>

                            <option value="aprovado">
                                Aprovado
                            </option>

                            <option value="cancelado">
                                Cancelado
                            </option>

                        </select>

                    </div>


                    <div className="orcamento-field orcamento-field-full">

                        <label>
                            Observações
                        </label>

                        <textarea
                            rows="4"
                            value={
                                orcamento.observacoes
                            }
                            onChange={
                                event =>
                                    atualizarCampo(
                                        "observacoes",
                                        event.target.value
                                    )
                            }
                        />

                    </div>

                </div>

            </section>


            {/* =================================================
                AMBIENTES
            ================================================= */}

            <section className="orcamento-tabela-card">

                <div className="orcamento-tabela-header">

                    <div>

                        <span>
                            AMBIENTES DO ORÇAMENTO
                        </span>

                        <h2>
                            Itens separados por ambiente
                        </h2>

                    </div>


                    <button
                        type="button"
                        className="orcamento-salvar orcamento-adicionar-item"
                        onClick={
                            adicionarAmbiente
                        }
                    >

                        <FiPlus />

                        <span>
                            Adicionar ambiente
                        </span>

                    </button>

                </div>


                {
                    erroBase && (

                        <div className="orcamento-erro-base">
                            {
                                erroBase
                            }
                        </div>

                    )
                }


                {
                    ambientesCalculados.map(
                        (
                            ambiente,
                            ambienteIndex
                        ) => (

                            <div
                                className="orcamento-ambiente"
                                key={
                                    ambiente.id
                                }
                            >


                                {/* =================================================
                                    HEADER DO AMBIENTE
                                ================================================= */}

                                <div className="orcamento-ambiente-header">

                                    <div className="orcamento-ambiente-identidade">

                                        <span>
                                            AMBIENTE{" "}
                                            {
                                                ambienteIndex +
                                                1
                                            }
                                        </span>

                                        <input
                                            type="text"
                                            value={
                                                ambiente.nome
                                            }
                                            onChange={
                                                event =>
                                                    atualizarAmbiente(
                                                        ambiente.id,
                                                        event.target.value
                                                    )
                                            }
                                            placeholder="Nome do ambiente"
                                        />

                                    </div>


                                    <div className="orcamento-ambiente-acoes">

                                        <span className="orcamento-contador-itens">

                                            {
                                                ambiente.itens.length
                                            }

                                            {" "}

                                            {
                                                ambiente.itens.length ===
                                                1
                                                    ? "item"
                                                    : "itens"
                                            }

                                        </span>


                                        <button
                                            type="button"
                                            className="orcamento-excluir-ambiente"
                                            title="Remover ambiente"
                                            disabled={
                                                ambientesCalculados.length <=
                                                1
                                            }
                                            onClick={
                                                () =>
                                                    removerAmbiente(
                                                        ambiente.id
                                                    )
                                            }
                                        >

                                            <FiTrash2 />

                                            <span>
                                                Remover ambiente
                                            </span>

                                        </button>

                                    </div>

                                </div>


{/* =================================================
    BARRA HORIZONTAL SUPERIOR
================================================= */}

<div
    className="orcamento-scroll-superior"
>

    <div
        className="orcamento-scroll-superior-barra"
        onScroll={
            sincronizarScrollSuperiorOrcamento
        }
    >

        <div
            className="orcamento-scroll-superior-conteudo"
        />

    </div>

</div>


{/* =================================================
    TABELA
================================================= */}

<div
    className="orcamento-tabela-wrapper"
    onScroll={
        sincronizarScrollTabelaOrcamento
    }
>

    <table className="orcamento-tabela">

                                        <thead>

                                            <tr>

                                                <th>
                                                    #
                                                </th>

                                                <th>
                                                    Quantidade
                                                </th>

                                                <th>
                                                    Nome do item
                                                </th>

                                                <th>
                                                    Altura
                                                </th>

                                                <th>
                                                    Largura
                                                </th>

                                                <th>
                                                    Profundidade
                                                </th>

                                                <th>
                                                    Item da base
                                                </th>

                                                <th>
                                                    Cor de MDF
                                                </th>

                                                <th>
                                                    Padrão de medição
                                                </th>

                                                <th>
                                                    Cor
                                                </th>

                                                <th>
                                                    Cor complexidade
                                                </th>

                                                <th>
                                                    M²
                                                </th>

                                                <th>
                                                    M² total
                                                </th>

                                                <th>
                                                    Valor do m²
                                                </th>

                                                <th>
                                                    Valor final do m²
                                                </th>

                                                <th>
                                                    Valor unitário
                                                </th>

                                                <th>
                                                    Desconto ou adicional
                                                </th>

                                              <th>
    Valor com desconto ou adicional
</th>

<th>
    Valor mínimo da proposta ALME
</th>

<th>
    Valor para memorial descritivo
</th>

<th>
    Valor de over do analista (%)
</th>

<th>
    Valor com over do analista
</th>

<th>
    Over para o analista
</th>

<th>
    % de RT para o arquiteto
</th>

<th>
    Valor com RT
</th>

<th>
    RT
</th>

<th>
    Valor com RT arredondado
</th>

{Number(versaoAtual) >= 2 && (
    <>
        <th className="orcamento-coluna-over-final">
            Valor + Over final
        </th>

        <th className="orcamento-coluna-preco-final">
            Preço final de todos
        </th>

        <th className="orcamento-coluna-rt-final">
            RT final
        </th>
    </>
)}

<th className="orcamento-coluna-acao">
    Ação
</th>

 </tr>

                                        </thead>


                                        <tbody>


                                            {
                                                ambiente.itens.length ===
                                                0 && (

                                                    <tr className="orcamento-tabela-vazia">

                                                        <td colSpan={
    Number(versaoAtual) >= 2
        ? 31
        : 28
}>

                                                            Nenhum item adicionado neste ambiente.

                                                        </td>

                                                    </tr>

                                                )
                                            }


                                            {
                                                ambiente.itens.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => {

                                                        const valores =
                                                            obterValoresDisponiveis(
                                                                item
                                                            );


                                                        const complementos =
                                                            item.complementos ||
                                                            [];


                                                        const dadosOverFinalItem =
                                                            dadosOverFinalPorItem[
                                                                `${ambiente.id}::${item.id}`
                                                            ];


                                                        return (

                                                            <React.Fragment
                                                                key={
                                                                    item.id
                                                                }
                                                            >


                                                                {/* =================================================
                                                                    LINHA PRINCIPAL
                                                                ================================================= */}

                                                                <tr
                                                                    className={
                                                                        index % 2 ===
                                                                        0
                                                                            ? "orcamento-item-linha zebra-par"
                                                                            : "orcamento-item-linha zebra-impar"
                                                                    }
                                                                >

                                                                    <td>

                                                                        <strong>
                                                                            {
                                                                                index +
                                                                                1
                                                                            }
                                                                        </strong>

                                                                    </td>


                                                                    <td>

                                                                        <input
                                                                            className="orcamento-tabela-input input-number"
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                item.quantidade
                                                                            }
                                                                            onChange={
                                                                                event =>
                                                                                    atualizarItem(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        "quantidade",
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <input
                                                                            className="orcamento-tabela-input"
                                                                            type="text"
                                                                            value={
                                                                                item.nome_item
                                                                            }
                                                                            placeholder="Nome do item"
                                                                            onChange={
                                                                                event =>
                                                                                    atualizarItem(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        "nome_item",
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <input
                                                                            className="orcamento-tabela-input input-number"
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                item.altura
                                                                            }
                                                                            placeholder="0,00"
                                                                            onChange={
                                                                                event =>
                                                                                    atualizarItem(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        "altura",
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <input
                                                                            className="orcamento-tabela-input input-number"
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                item.largura
                                                                            }
                                                                            placeholder="0,00"
                                                                            onChange={
                                                                                event =>
                                                                                    atualizarItem(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        "largura",
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <input
                                                                            className="orcamento-tabela-input input-number"
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                item.profundidade
                                                                            }
                                                                            placeholder="0,00"
                                                                            onChange={
                                                                                event =>
                                                                                    atualizarItem(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        "profundidade",
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <select
                                                                            className="orcamento-tabela-select"
                                                                            value={
                                                                                item.base_item_id
                                                                            }
                                                                            onChange={
                                                                                event =>
                                                                                    selecionarItemBase(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        >

                                                                            <option value="">
                                                                                Selecione
                                                                            </option>


                                                                            {
                                                                                itensBase.map(
                                                                                    base => (

                                                                                        <option
                                                                                            key={
                                                                                                base.id
                                                                                            }
                                                                                            value={
                                                                                                base.id
                                                                                            }
                                                                                        >

                                                                                            {
                                                                                                base.nome
                                                                                            }

                                                                                        </option>

                                                                                    )
                                                                                )
                                                                            }

                                                                        </select>

                                                                    </td>


                                                                    <td>

                                                                        <select
                                                                            className="orcamento-tabela-select"
                                                                            value={
                                                                                item.mdf_id
                                                                            }
                                                                            onChange={
                                                                                event =>
                                                                                    selecionarMdf(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        >

                                                                            <option value="">
                                                                                Selecione
                                                                            </option>


                                                                            {
                                                                                mdfs.map(
                                                                                    mdf => (

                                                                                        <option
                                                                                            key={
                                                                                                mdf.id
                                                                                            }
                                                                                            value={
                                                                                                mdf.id
                                                                                            }
                                                                                        >

                                                                                            {
                                                                                                mdf.nome
                                                                                            }

                                                                                        </option>

                                                                                    )
                                                                                )
                                                                            }

                                                                        </select>

                                                                    </td>


                                                                    <td>

                                                                        <input
                                                                            className="orcamento-tabela-input orcamento-readonly"
                                                                            type="text"
                                                                            value={
                                                                                item.padrao_medicao
                                                                            }
                                                                            placeholder="Da base"
                                                                            readOnly
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <div className="orcamento-valor-bloqueado">

                                                                            {
                                                                                item.mdf_cor !==
                                                                                ""
                                                                                    ? `Cor ${item.mdf_cor}`
                                                                                    : "—"
                                                                            }

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        <select
                                                                            className="orcamento-tabela-select"
                                                                            value={
                                                                                item.cor_complexidade_id
                                                                            }
                                                                            disabled={
                                                                                !item.base_item_id ||
                                                                                item.mdf_cor ===
                                                                                ""
                                                                            }
                                                                            onChange={
                                                                                event =>
                                                                                    selecionarComplexidade(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        >

                                                                            <option value="">
                                                                                Selecione
                                                                            </option>


                                                                            {
                                                                                valores.map(
                                                                                    valor => (

                                                                                        <option
                                                                                            key={
                                                                                                valor.id
                                                                                            }
                                                                                            value={
                                                                                                valor.id
                                                                                            }
                                                                                        >

                                                                                            Cor{" "}
                                                                                            {
                                                                                                valor.cor
                                                                                            }

                                                                                            {" • "}

                                                                                            Complexidade{" "}
                                                                                            {
                                                                                                valor.complexidade
                                                                                            }

                                                                                        </option>

                                                                                    )
                                                                                )
                                                                            }

                                                                        </select>


                                                                        {
                                                                            item.base_item_id &&
                                                                            item.mdf_cor !==
                                                                                "" &&
                                                                            valores.length ===
                                                                                0 && (

                                                                                <small className="orcamento-sem-complexidade">

                                                                                    Nenhuma combinação cadastrada para este item e esta cor.

                                                                                </small>

                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        <div className="orcamento-resultado">

                                                                            {
                                                                                decimal(
                                                                                    item.calculadoM2,
                                                                                    4
                                                                                )
                                                                            }

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        <div className="orcamento-resultado orcamento-resultado-destaque">

                                                                            {
                                                                                decimal(
                                                                                    item.calculadoM2Total,
                                                                                    4
                                                                                )
                                                                            }

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        <div className="orcamento-resultado orcamento-resultado-dinheiro">

                                                                            {
                                                                                money(
                                                                                    item.calculadoValorM2
                                                                                )
                                                                            }

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        <div className="orcamento-resultado orcamento-resultado-final-m2">

                                                                            {
                                                                                money(
                                                                                    item.calculadoValorFinalM2
                                                                                )
                                                                            }

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        <div className="orcamento-resultado orcamento-resultado-unitario">

                                                                            {
                                                                                money(
                                                                                    item.calculadoValorUnitario
                                                                                )
                                                                            }

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        <input
                                                                            className="orcamento-tabela-input orcamento-input-ajuste input-number"
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={
                                                                                item.desconto_adicional
                                                                            }
                                                                            placeholder="0,00"
                                                                            onChange={
                                                                                event =>
                                                                                    atualizarItem(
                                                                                        ambiente.id,
                                                                                        item.id,
                                                                                        "desconto_adicional",
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <div className="orcamento-resultado orcamento-resultado-total">

                                                                            {
                                                                                money(
                                                                                    item.calculadoValorComDescontoAdicional
                                                                                )
                                                                            }

                                                                        </div>

                                                                    </td>
<td>

    <div className="orcamento-resultado orcamento-resultado-proposta-alme">

        {
            money(
                item.calculadoValorMinimoPropostaAlme
            )
        }

    </div>

</td>
{/* =================================================
    VALOR PARA MEMORIAL DESCRITIVO
================================================= */}

<td>

    <div className="orcamento-resultado orcamento-resultado-memorial">

        {
            money(
                item.calculadoValorMemorialDescritivo
            )
        }

    </div>

</td>


{/* =================================================
    OVER DO ANALISTA %
================================================= */}

<td>

    <div className="orcamento-percentual-wrapper">

        <input
            className="orcamento-tabela-input input-number orcamento-input-percentual"
            type="number"
            min="0"
            max="99"
            step="0.01"
            value={
                percentualExibicao(
                    item.over_analista_percentual
                )
            }
            onChange={
                event =>
                    atualizarItem(
                        ambiente.id,
                        item.id,
                        "over_analista_percentual",
                        Math.min(
                            0.99,
                            Math.max(
                                0,
                                numberValue(
                                    event.target.value
                                ) / 100
                            )
                        )
                    )
            }
            placeholder="2,00"
        />

        <span>
            %
        </span>

    </div>

</td>


{/* =================================================
    VALOR COM OVER DO ANALISTA
================================================= */}

<td>

    <div className="orcamento-resultado orcamento-resultado-over">

        {
            money(
                item.calculadoValorComOverAnalista
            )
        }

    </div>

</td>


{/* =================================================
    OVER PARA O ANALISTA
================================================= */}

<td>

    <div className="orcamento-resultado orcamento-resultado-over-valor">

        {
            money(
                item.calculadoOverAnalista
            )
        }

    </div>

</td>


{/* =================================================
    RT %
================================================= */}

<td>

    <div className="orcamento-percentual-wrapper">

        <input
            className="orcamento-tabela-input input-number orcamento-input-percentual"
            type="number"
            min="0"
            max="99"
            step="0.01"
            value={
                percentualExibicao(
                    item.rt_arquiteto_percentual
                )
            }
            onChange={
                event =>
                    atualizarItem(
                        ambiente.id,
                        item.id,
                        "rt_arquiteto_percentual",
                        Math.min(
                            0.99,
                            Math.max(
                                0,
                                numberValue(
                                    event.target.value
                                ) / 100
                            )
                        )
                    )
            }
            placeholder="0,00"
        />

        <span>
            %
        </span>

    </div>

</td>


{/* =================================================
    VALOR COM RT
================================================= */}

<td>

    <div className="orcamento-resultado orcamento-resultado-rt">

        {
            money(
                item.calculadoValorComRt
            )
        }

    </div>

</td>


{/* =================================================
    RT
================================================= */}

<td>

    <div className="orcamento-resultado orcamento-resultado-rt-valor">

        {
            money(
                item.calculadoRt
            )
        }

    </div>

</td>
    <td>
    <div className="orcamento-resultado orcamento-resultado-rt-arredondado">
        {
            money(
                item.calculadoValorComRtArredondado
            )
        }
    </div>
</td>

{Number(versaoAtual) >= 2 && (

    <>

        <td className="orcamento-coluna-over-final">
     <div className="orcamento-resultado orcamento-resultado-over-final">
                 {
                     money(
                         dadosOverFinalItem
                             ? dadosOverFinalItem.valorMaisOverFinal
                             : numberValue(
                                 item.calculadoValorComRt
                             )
                     )
                 }
             </div>
         </td>

         <td className="orcamento-coluna-preco-final">
     <div className="orcamento-resultado orcamento-resultado-preco-final">
                 {
                     money(
                         dadosOverFinalItem
                             ? dadosOverFinalItem.precoFinalTodos
                             : 0
                     )
                 }
             </div>
         </td>

        <td className="orcamento-coluna-rt-final">
     <div className="orcamento-resultado orcamento-resultado-rt-final">
                 {
                     money(
                         dadosOverFinalItem
                             ? dadosOverFinalItem.rtFinal
                             : 0
                     )
                 }
             </div>
         </td>

    </>

)}

<td className="orcamento-coluna-acao">
    <button
        type="button"
        className="orcamento-excluir-item"
        title="Remover item"
        onClick={
            () =>
                removerItem(
                    ambiente.id,
                    item.id
                )
        }
    >
        <FiTrash2 />
    </button>
</td>
                                                                </tr>


                                                                {/* =================================================
                                                                    CAMPOS EXTRAS DE MEDIÇÃO
                                                                ================================================= */}

                                                                {
                                                                    (
                                                                        precisaComprimento(
                                                                            item.padrao_medicao
                                                                        ) ||
                                                                        precisaDiametro(
                                                                            item.padrao_medicao
                                                                        )
                                                                    ) && (

                                                                        <tr className="orcamento-detalhes-linha">

                                                                            <td colSpan={
                                                                                Number(versaoAtual) >= 2
                                                                                    ? 31
                                                                                    : 28
                                                                            }>

                                                                                <div className="orcamento-detalhes">


                                                                                    {
                                                                                        precisaComprimento(
                                                                                            item.padrao_medicao
                                                                                        ) && (

                                                                                            <div className="orcamento-detalhe-campo">

                                                                                                <label>
                                                                                                    Comprimento
                                                                                                </label>

                                                                                                <input
                                                                                                    type="number"
                                                                                                    min="0"
                                                                                                    step="0.01"
                                                                                                    value={
                                                                                                        item.comprimento
                                                                                                    }
                                                                                                    placeholder="0,00 m"
                                                                                                    onChange={
                                                                                                        event =>
                                                                                                            atualizarItem(
                                                                                                                ambiente.id,
                                                                                                                item.id,
                                                                                                                "comprimento",
                                                                                                                event.target.value
                                                                                                            )
                                                                                                    }
                                                                                                />

                                                                                            </div>

                                                                                        )
                                                                                    }


                                                                                    {
                                                                                        precisaDiametro(
                                                                                            item.padrao_medicao
                                                                                        ) && (

                                                                                            <div className="orcamento-detalhe-campo">

                                                                                                <label>
                                                                                                    Diâmetro
                                                                                                </label>

                                                                                                <input
                                                                                                    type="number"
                                                                                                    min="0"
                                                                                                    step="0.01"
                                                                                                    value={
                                                                                                        item.diametro
                                                                                                    }
                                                                                                    placeholder="0,00 m"
                                                                                                    onChange={
                                                                                                        event =>
                                                                                                            atualizarItem(
                                                                                                                ambiente.id,
                                                                                                                item.id,
                                                                                                                "diametro",
                                                                                                                event.target.value
                                                                                                            )
                                                                                                    }
                                                                                                />

                                                                                            </div>

                                                                                        )
                                                                                    }


                                                                                    <div className="orcamento-detalhe-info">

                                                                                        <span>
                                                                                            Padrão de medição
                                                                                        </span>

                                                                                        <strong>
                                                                                            {
                                                                                                item.padrao_medicao ||
                                                                                                "—"
                                                                                            }
                                                                                        </strong>

                                                                                    </div>

                                                                                </div>

                                                                            </td>

                                                                        </tr>

                                                                    )
                                                                }

{/* =================================================
    LED / METALON
================================================= */}

<tr className="orcamento-extras-linha">

    <td colSpan={
    Number(versaoAtual) >= 2
        ? 31
        : 28
}>

        <div className="orcamento-extras">

            {/* LED */}

            <div className="orcamento-extra-bloco">

                <label className="orcamento-checkbox-label">

                    <input
                        type="checkbox"
                        checked={
                            Boolean(
                                item.possui_led
                            )
                        }
                        onChange={
                            event =>
                                alternarExtra(
                                    ambiente.id,
                                    item.id,
                                    "possui_led",
                                    "quantidade_led",
                                    event.target.checked
                                )
                        }
                    />

                    <span>
                        Esse item vai LED?
                    </span>

                </label>


                {
                    item.possui_led && (

                        <div className="orcamento-extra-campo">

                            <label>
                                Quantidade de LED
                            </label>

                            <input
                                className="orcamento-tabela-input input-number"
                                type="number"
                                min="1"
                                max={
                                    MAX_LED
                                }
                                step="1"
                                value={
                                    item.quantidade_led || ""
                                }
                                onChange={
                                    event =>
                                        atualizarQuantidadeExtra(
                                            ambiente.id,
                                            item.id,
                                            "quantidade_led",
                                            event.target.value,
                                            MAX_LED
                                        )
                                }
                            />

                            <small>
                                1 a {MAX_LED} unidades • {money(VALOR_POR_LED)} por unidade
                            </small>

                        </div>

                    )
                }


                {
                    item.possui_led && (

                        <div className="orcamento-extra-valor">

                            <span>
                                Adicional LED
                            </span>

                            <strong>
                                {
                                    money(
                                        item.calculadoValorLed
                                    )
                                }
                            </strong>

                        </div>

                    )
                }

            </div>


            {/* METALON */}

            <div className="orcamento-extra-bloco">

                <label className="orcamento-checkbox-label">

                    <input
                        type="checkbox"
                        checked={
                            Boolean(
                                item.possui_metalon
                            )
                        }
                        onChange={
                            event =>
                                alternarExtra(
                                    ambiente.id,
                                    item.id,
                                    "possui_metalon",
                                    "quantidade_metalon",
                                    event.target.checked
                                )
                        }
                    />

                    <span>
                        Esse item vai metalon?
                    </span>

                </label>


                {
                    item.possui_metalon && (

                        <div className="orcamento-extra-campo">

                            <label>
                                Quantidade de metalon
                            </label>

                            <input
                                className="orcamento-tabela-input input-number"
                                type="number"
                                min="1"
                                max={
                                    MAX_METALON
                                }
                                step="1"
                                value={
                                    item.quantidade_metalon || ""
                                }
                                onChange={
                                    event =>
                                        atualizarQuantidadeExtra(
                                            ambiente.id,
                                            item.id,
                                            "quantidade_metalon",
                                            event.target.value,
                                            MAX_METALON
                                        )
                                }
                            />

                            <small>
                                1 a {MAX_METALON} unidades • {money(VALOR_POR_METALON)} por unidade
                            </small>

                        </div>

                    )
                }


                {
                    item.possui_metalon && (

                        <div className="orcamento-extra-valor">

                            <span>
                                Adicional metalon
                            </span>

                            <strong>
                                {
                                    money(
                                        item.calculadoValorMetalon
                                    )
                                }
                            </strong>

                        </div>

                    )
                }

            </div>


            {/* RESUMO */}

            <div className="orcamento-extra-resumo">

                <span>
                    Valor Final com RT
                </span>

                <strong>
                    {
                        money(
                           item.calculadoValorComRtArredondado
                        )
                    }
                </strong>

            </div>

        </div>

    </td>

</tr>
                                                                {/* =================================================
                                                                    COMPLEMENTOS
                                                                ================================================= */}

                                                                <tr className="orcamento-complementos-toggle-row">

                                                                    <td colSpan="19">

                                                                        <div className="orcamento-complementos-toggle">

                                                                            <label className="orcamento-checkbox-label">

                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={
                                                                                        Boolean(
                                                                                            item.possui_complementos
                                                                                        )
                                                                                    }
                                                                                    onChange={
                                                                                        event =>
                                                                                            alternarComplementos(
                                                                                                ambiente.id,
                                                                                                item.id,
                                                                                                event.target.checked
                                                                                            )
                                                                                    }
                                                                                />

                                                                                <span>
                                                                                    Esse item possui complementos?
                                                                                </span>

                                                                            </label>


                                                                            {
                                                                                item.possui_complementos && (

                                                                                    <span className="orcamento-complementos-contador">

                                                                                        {
                                                                                            complementos.length
                                                                                        }

                                                                                        {" / "}

                                                                                        {
                                                                                            MAX_COMPLEMENTOS
                                                                                        }

                                                                                    </span>

                                                                                )
                                                                            }

                                                                        </div>


                                                                        {
                                                                            item.possui_complementos && (

                                                                                <div className="orcamento-complementos-area">

                                                                                    <div className="orcamento-complementos-header">

                                                                                        <div>

                                                                                            <span>
                                                                                                COMPLEMENTOS
                                                                                            </span>

                                                                                            <strong>
                                                                                                Itens complementares
                                                                                            </strong>

                                                                                        </div>


                                                                                        {
                                                                                            complementos.length <
                                                                                            MAX_COMPLEMENTOS && (

                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="orcamento-adicionar-complemento"
                                                                                                    onClick={
                                                                                                        () =>
                                                                                                            adicionarComplemento(
                                                                                                                ambiente.id,
                                                                                                                item.id
                                                                                                            )
                                                                                                    }
                                                                                                >

                                                                                                    <FiPlus />

                                                                                                    Adicionar complemento

                                                                                                </button>

                                                                                            )
                                                                                        }

                                                                                    </div>


                                                                                    {
                                                                                        complementos.length ===
                                                                                        0 && (

                                                                                            <div className="orcamento-complementos-vazio">

                                                                                                Nenhum complemento adicionado.

                                                                                            </div>

                                                                                        )
                                                                                    }


                                                                                    <div className="orcamento-complementos-lista">

                                                                                        {
                                                                                            complementos.map(
                                                                                                (
                                                                                                    complemento,
                                                                                                    complementoIndex
                                                                                                ) => {

                                                                                                    const valoresComplemento =
                                                                                                        obterValoresComplemento(
                                                                                                            item,
                                                                                                            complemento
                                                                                                        );


                                                                                                    return (

                                                                                                        <div
                                                                                                            className="orcamento-complemento-card"
                                                                                                            key={
                                                                                                                complemento.id
                                                                                                            }
                                                                                                        >

                                                                                                            <div className="orcamento-complemento-card-header">

                                                                                                                <div>

                                                                                                                    <span>
                                                                                                                        COMPLEMENTO{" "}
                                                                                                                        {
                                                                                                                            complementoIndex +
                                                                                                                            1
                                                                                                                        }
                                                                                                                    </span>

                                                                                                                    <strong>
                                                                                                                        {
                                                                                                                            complemento.item_nome ||
                                                                                                                            "Novo complemento"
                                                                                                                        }
                                                                                                                    </strong>

                                                                                                                </div>


                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    className="orcamento-remover-complemento"
                                                                                                                    title="Remover complemento"
                                                                                                                    onClick={
                                                                                                                        () =>
                                                                                                                            removerComplemento(
                                                                                                                                ambiente.id,
                                                                                                                                item.id,
                                                                                                                                complemento.id
                                                                                                                            )
                                                                                                                    }
                                                                                                                >

                                                                                                                    <FiX />

                                                                                                                </button>

                                                                                                            </div>


                                                                                                            <div className="orcamento-complemento-grid">


                                                                                                                <div className="orcamento-complemento-field">

                                                                                                                    <label>
                                                                                                                        Descrição do complemento
                                                                                                                    </label>

                                                                                                                    <select
                                                                                                                        value={
                                                                                                                            complemento.item_id
                                                                                                                        }
                                                                                                                        onChange={
                                                                                                                            event =>
                                                                                                                                selecionarItemComplemento(
                                                                                                                                    ambiente.id,
                                                                                                                                    item.id,
                                                                                                                                    complemento.id,
                                                                                                                                    event.target.value
                                                                                                                                )
                                                                                                                        }
                                                                                                                    >

                                                                                                                        <option value="">
                                                                                                                            Selecione
                                                                                                                        </option>


                                                                                                                        {
                                                                                                                            itensComplementares.map(
                                                                                                                                complementoBase => (

                                                                                                                                    <option
                                                                                                                                        key={
                                                                                                                                            complementoBase.id
                                                                                                                                        }
                                                                                                                                        value={
                                                                                                                                            complementoBase.id
                                                                                                                                        }
                                                                                                                                    >

                                                                                                                                        {
                                                                                                                                            complementoBase.nome
                                                                                                                                        }

                                                                                                                                    </option>

                                                                                                                                )
                                                                                                                            )
                                                                                                                        }

                                                                                                                    </select>

                                                                                                                </div>


                                                                                                                <div className="orcamento-complemento-field">

                                                                                                                    <label>
                                                                                                                        Padrão de medição
                                                                                                                    </label>

                                                                                                                    <input
                                                                                                                        type="text"
                                                                                                                        value={
                                                                                                                            complemento.padrao_medicao
                                                                                                                        }
                                                                                                                        placeholder="Da tabela de itens"
                                                                                                                        readOnly
                                                                                                                    />

                                                                                                                </div>


                                                                                                                <div className="orcamento-complemento-field">

                                                                                                                    <label>
                                                                                                                        Descrição
                                                                                                                    </label>

                                                                                                                    <input
                                                                                                                        type="text"
                                                                                                                        value={
                                                                                                                            complemento.item_descricao
                                                                                                                        }
                                                                                                                        placeholder="Da tabela de itens"
                                                                                                                        readOnly
                                                                                                                    />

                                                                                                                </div>


                                                                                                                <div className="orcamento-complemento-field">

                                                                                                                    <label>
                                                                                                                        Cor complexidade
                                                                                                                    </label>

                                                                                                                    <select
                                                                                                                        value={
                                                                                                                            complemento.cor_complexidade_id
                                                                                                                        }
                                                                                                                        disabled={
                                                                                                                            !complemento.item_id ||
                                                                                                                            item.mdf_cor ===
                                                                                                                            ""
                                                                                                                        }
                                                                                                                        onChange={
                                                                                                                            event =>
                                                                                                                                selecionarComplexidadeComplemento(
                                                                                                                                    ambiente.id,
                                                                                                                                    item.id,
                                                                                                                                    complemento.id,
                                                                                                                                    event.target.value
                                                                                                                                )
                                                                                                                        }
                                                                                                                    >

                                                                                                                        <option value="">
                                                                                                                            Selecione
                                                                                                                        </option>


                                                                                                                        {
                                                                                                                            valoresComplemento.map(
                                                                                                                                valor => (

                                                                                                                                    <option
                                                                                                                                        key={
                                                                                                                                            valor.id
                                                                                                                                        }
                                                                                                                                        value={
                                                                                                                                            valor.id
                                                                                                                                        }
                                                                                                                                    >

                                                                                                                                        Cor{" "}
                                                                                                                                        {
                                                                                                                                            valor.cor
                                                                                                                                        }

                                                                                                                                        {" • "}

                                                                                                                                        Complexidade{" "}
                                                                                                                                        {
                                                                                                                                            valor.complexidade
                                                                                                                                        }

                                                                                                                                    </option>

                                                                                                                                )
                                                                                                                            )
                                                                                                                        }

                                                                                                                    </select>


                                                                                                                    {
                                                                                                                        complemento.item_id &&
                                                                                                                        item.mdf_cor !==
                                                                                                                            "" &&
                                                                                                                        valoresComplemento.length ===
                                                                                                                            0 && (

                                                                                                                            <small className="orcamento-sem-complexidade complemento">

                                                                                                                                Nenhuma combinação cadastrada para este complemento e esta cor.

                                                                                                                            </small>

                                                                                                                        )
                                                                                                                    }

                                                                                                                </div>


                                                                                                                <div className="orcamento-complemento-field">

                                                                                                                    <label>
                                                                                                                        Valor m² do complemento
                                                                                                                    </label>

                                                                                                                    <div className="orcamento-complemento-valor">

                                                                                                                        {
                                                                                                                            money(
                                                                                                                                complemento.valor_m2
                                                                                                                            )
                                                                                                                        }

                                                                                                                    </div>

                                                                                                                </div>

                                                                                                            </div>

                                                                                                        </div>

                                                                                                    );

                                                                                                }
                                                                                            )
                                                                                        }

                                                                                    </div>

                                                                                </div>

                                                                            )
                                                                        }

                                                                    </td>

                                                                </tr>

                                                            </React.Fragment>

                                                        );

                                                    }
                                                )
                                            }

                                        </tbody>

                                    </table>

                                </div>


                                {/* =================================================
                                    RODAPÉ
                                ================================================= */}

                                <div className="orcamento-tabela-footer">

                                    <button
                                        type="button"
                                        className="orcamento-adicionar-item-secundario"
                                        onClick={
                                            () =>
                                                adicionarItem(
                                                    ambiente.id
                                                )
                                        }
                                        disabled={
                                            carregandoBase
                                        }
                                    >

                                        <FiPlus />

                                        Adicionar item neste ambiente

                                    </button>

                                </div>

                            </div>

                        )
                    )
                }


                <div className="orcamento-ambientes-footer">

                    <button
                        type="button"
                        className="orcamento-adicionar-item-secundario"
                        onClick={
                            adicionarAmbiente
                        }
                    >

                        <FiPlus />

                        Adicionar outro ambiente

                    </button>


                    <div className="orcamento-contador-itens">

                        {
                            ambientesCalculados.length
                        }

                        {" "}

                        {
                            ambientesCalculados.length ===
                            1
                                ? "ambiente"
                                : "ambientes"
                        }

                        {" • "}

                        {
                            totalItens
                        }

                        {" "}

                        {
                            totalItens ===
                            1
                                ? "item"
                                : "itens"
                        }

                    </div>

                </div>


                {/* =================================================
    MULTIPLICADOR DO ORÇAMENTO
================================================= */}

<section className="orcamento-multiplicador-painel">

    <div className="orcamento-multiplicador-conteudo">

        <div className="orcamento-multiplicador-texto">

            <span>
                MULTIPLICADOR
            </span>

            <strong>
                Ajuste comercial do orçamento
            </strong>

            <small>
                Aplica o multiplicador sobre o valor mínimo
                da proposta ALME de cada item e recalcula
                os valores comerciais seguintes.
            </small>

        </div>


        <div className="orcamento-multiplicador-campo">

            <label htmlFor="orcamento-multiplicador">
                Multiplicador
            </label>

            <select
                id="orcamento-multiplicador"
                value={multiplicador}
                onChange={
                    event =>
                        setMultiplicador(
                            Number(event.target.value)
                        )
                }
            >

                <option value="1">
                    1
                </option>

                <option value="1.1">
                    1.1
                </option>

                <option value="1.2">
                    1.2
                </option>

                <option value="1.3">
                    1.3
                </option>

                <option value="1.5">
                    1.5
                </option>

            </select>

        </div>

    </div>

</section>
{/* =================================================
    PAINEL DE TOTAIS
================================================= */}

<section className="orcamento-totais-painel">

    <div className="orcamento-totais-header">

        <div>

            <span>
                RESUMO FINANCEIRO
            </span>

            <h3>
                Totais do orçamento
            </h3>

        </div>

        <div className="orcamento-totais-itens">

            {
                ambientesCalculados.length
            }

            {" "}

            {
                ambientesCalculados.length === 1
                    ? "ambiente"
                    : "ambientes"
            }

            {" • "}

            {
                totalItens
            }

            {" "}

            {
                totalItens === 1
                    ? "item"
                    : "itens"
            }

        </div>

    </div>


    <div className="orcamento-totais-grid">

        {/* VALOR UNITÁRIO */}

        <div className="orcamento-total-card">

            <span>
                Valor unitário
            </span>

            <strong>
                {
                    money(
                        totaisColunas.valorUnitario
                    )
                }
            </strong>

        </div>


        {/* VALOR COM DESCONTO / ADICIONAL */}

        <div className="orcamento-total-card">

            <span>
                Valor com desconto ou adicional
            </span>

            <strong>
                {
                    money(
                        totaisColunas.valorComDescontoAdicional
                    )
                }
            </strong>

        </div>


        {/* VALOR MÍNIMO ALME */}

        <div className="orcamento-total-card destaque">

            <span>
                Valor mínimo da proposta ALME
            </span>

            <strong>
                {
                    money(
                        totaisColunas.valorMinimoPropostaAlme
                    )
                }
            </strong>

        </div>


        {/* MEMORIAL DESCRITIVO */}

        <div className="orcamento-total-card">

            <span>
                Valor para memorial descritivo
            </span>

            <strong>
                {
                    money(
                        totaisColunas.valorMemorialDescritivo
                    )
                }
            </strong>

        </div>


        {/* VALOR COM OVER */}

        <div className="orcamento-total-card">

            <span>
                Valor com over do analista
            </span>

            <strong>
                {
                    money(
                        totaisColunas.valorComOverAnalista
                    )
                }
            </strong>

        </div>


        {/* OVER ANALISTA */}

        <div className="orcamento-total-card">

            <span>
                Over para o analista
            </span>

            <strong>
                {
                    money(
                        totaisColunas.overAnalista
                    )
                }
            </strong>

        </div>


        {/* VALOR COM RT */}

        <div className="orcamento-total-card">

            <span>
                Valor com RT
            </span>

            <strong>
                {
                    money(
                        totaisColunas.valorComRt
                    )
                }
            </strong>

        </div>


        {/* RT */}

        <div className="orcamento-total-card">

            <span>
                RT
            </span>

            <strong>
                {
                    money(
                        totaisColunas.rt
                    )
                }
            </strong>

        </div>


        {/* VALOR COM RT ARREDONDADO */}

        <div className="orcamento-total-card destaque-final">

            <span>
                Valor com RT arredondado
            </span>

            <strong>
                {
                    money(
                        totaisColunas.valorComRtArredondado
                    )
                }
            </strong>

        </div>
{/* ================================================
    OVER TOTAL
================================================ */}

{Number(versaoAtual) >= 2 && (

    <div className="orcamento-total-card destaque">

        <span>
            Over total
        </span>

        <strong>
            {
                money(
                    totaisOverFinal.overTotal
                )
            }
        </strong>

    </div>

)}


{/* ================================================
    PREÇO FINAL DE TODOS
================================================ */}

{Number(versaoAtual) >= 2 && (

    <div className="orcamento-total-card destaque-final">

        <span>
            Soma de todos preço final de todos
        </span>

        <strong>
            {
                money(
                    totaisOverFinal.precoFinalTodos
                )
            }
        </strong>

    </div>

)}


{/* ================================================
    RT FINAL
================================================ */}

{Number(versaoAtual) >= 2 && (

    <div className="orcamento-total-card">

        <span>
            Soma de todos RT final
        </span>

        <strong>
            {
                money(
                    totaisOverFinal.rtFinal
                )
            }
        </strong>

    </div>

)}


{/* ================================================
    PERCENTUAL OVER FINAL
================================================ */}

{Number(versaoAtual) >= 2 && (

    <div className="orcamento-total-card">

        <span>
            % a acrescentar no over final pelos itens
        </span>

        <strong>
            {
                percentualExibicao(
                    percentualOverFinal
                ).toFixed(2)
            }%
        </strong>

    </div>

)}


{/* ================================================
    VALOR TOTAL ADICIONADO
================================================ */}

{Number(versaoAtual) >= 2 && (

    <div className="orcamento-total-card">

        <span>
            Valor total adicionado até chegar no valor solicitado
        </span>

        <strong>
            {
                money(
                    totaisOverFinal
                        .valorTotalAdicionado
                )
            }
        </strong>

    </div>

)}
    </div>
{Number(versaoAtual) >= 2 && (

    <section className="orcamento-over-final-painel">

        <div className="orcamento-over-final-conteudo">

            <div className="orcamento-over-final-texto">

                <span>
                    NEGOCIAÇÃO
                </span>

                <strong>
                    Valor final desejado
                </strong>

                <small>
                    Informe o valor final desejado para
                    distribuir o acréscimo proporcionalmente
                    entre os itens desta versão.
                </small>

            </div>


            <div className="orcamento-over-final-campo">

                <label htmlFor="orcamento-valor-final-desejado">
                    Valor final desejado
                </label>

                <div className="orcamento-over-final-controle">

                    <input
                        id="orcamento-valor-final-desejado"
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorFinalDesejado}
                        onChange={
                            event =>
                                setValorFinalDesejado(
                                    event.target.value
                                )
                        }
                        placeholder="0,00"
                    />

                    <button
                        type="button"
                        className="orcamento-over-final-ok"
                        onClick={() => {

                            const valor =
                                numberValue(
                                    valorFinalDesejado
                                );

                            const minimo =
                                numberValue(
                                    totaisColunas
                                        .valorMinimoPropostaAlme
                                );

                            if (
                                valor <= 0
                            ) {
                                window.alert(
                                    "Informe o valor final desejado."
                                );
                                return;
                            }

                            if (
                                minimo <= 0
                            ) {
                                window.alert(
                                    "O valor mínimo da proposta ALME precisa ser maior que zero."
                                );
                                return;
                            }

                            const valorComRtAtual =
                                numberValue(
                                    valorComRtTotal
                                );

                            if (
                                valor <
                                valorComRtAtual
                            ) {
                                window.alert(
                                    "O valor final desejado não pode ser menor que a soma dos valores com RT atuais."
                                );
                                return;
                            }

                            if (
                                Math.abs(
                                    valor % 10
                                ) > 0.001
                            ) {
                                window.alert(
                                    "Para fechar exatamente a soma dos itens, o valor final desejado deve ser múltiplo de R$ 10,00."
                                );
                                return;
                            }

                            setOverFinalAplicado(
                                true
                            );

                        }}
                    >
                        OK
                    </button>

                </div>

            </div>

        </div>

        {overFinalAplicado && (

            <div className="orcamento-over-final-resumo">

                <span>
                    Over final aplicado
                </span>

                <strong>
                    {
                        percentualExibicao(
                            percentualOverFinal
                        ).toFixed(2)
                    }%
                </strong>

            </div>

        )}

    </section>

)}
</section>
            </section>

        </div>

    );

}