import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FiSearch,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiImage,
    FiDollarSign,
    FiX,
    FiSave,
    FiRefreshCw
} from "react-icons/fi";

import {
    supabase
} from "../../../../services/supabase";

import "./TabelaPreco.scss";


/*
=====================================================
CONFIGURAÇÕES
=====================================================
*/

const GRUPOS = [
    "LED",
    "Maior Volume",
    "Menor Volume",
    "Painel Liso",
    "Painel Ripado",
    "Pisos",
    "Tapeçaria",
    "Vidraçaria"
];

const CORES = [1, 2, 3, 4, 5, 6];

const COMPLEXIDADES = [1, 2, 3, 4];

const CHAVE_RASCUNHO =
    "alme_tabela_preco_rascunho";


/*
=====================================================
CRIAR CÉLULAS VAZIAS
=====================================================
*/

function criarCelulasVazias() {

    const resultado = {};

    CORES.forEach(cor => {

        COMPLEXIDADES.forEach(complexidade => {

            const chave =
                `cor${cor}_complexidade${complexidade}`;

            resultado[chave] = {

                id: null,

                cor,

                complexidade,

                formula: "",

                valor_calculado: null,

                valor_manual: null,

                usar_valor_manual: false,

                ativo: true

            };

        });

    });

    return resultado;

}


/*
=====================================================
CHAVE DA CÉLULA
=====================================================
*/

function chaveCelula(
    cor,
    complexidade
) {

    return `cor${cor}_complexidade${complexidade}`;

}


/*
=====================================================
CONVERTER PARA NÚMERO
=====================================================
*/

function numero(
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return 0;

    }

    const texto =
        String(valor)
            .trim()
            .replace(",", ".");

    const n =
        Number(texto);

    return Number.isFinite(n)
        ? n
        : 0;

}


/*
=====================================================
FORMATAR MOEDA
=====================================================
*/

function formatarMoeda(
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return "—";

    }

    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    ).format(
        numero(valor)
    );

}


/*
=====================================================
TOKENIZAÇÃO DE FÓRMULAS
=====================================================

Aceita:

*
×
/
÷

Também aceita decimal:

1.2
1,2
=====================================================
*/

function tokenizarFormula(
    formula
) {

    const tokens = [];

    const texto =
        String(formula || "")
            .toUpperCase()
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/,/g, ".")
            .replace(/\s+/g, "");

    let i = 0;

    while (
        i < texto.length
    ) {

        const restante =
            texto.slice(i);


        /*
        =============================================
        NÚMERO
        =============================================
        */

        const numeroMatch =
            restante.match(
                /^(?:\d+(?:\.\d*)?|\.\d+)/
            );


        if (numeroMatch) {

            tokens.push({

                tipo: "numero",

                valor:
                    Number(
                        numeroMatch[0]
                    )

            });


            i +=
                numeroMatch[0].length;


            continue;

        }


        /*
        =============================================
        IDENTIFICADOR
        =============================================
        */

        const identificadorMatch =
            restante.match(
                /^([A-Z_][A-Z0-9_]*)/
            );


        if (
            identificadorMatch
        ) {

            tokens.push({

                tipo: "identificador",

                valor:
                    identificadorMatch[1]

            });


            i +=
                identificadorMatch[1].length;


            continue;

        }


        /*
        =============================================
        OPERADORES
        =============================================
        */

        if (
            "+-*/()".includes(
                texto[i]
            )
        ) {

            tokens.push({

                tipo:
                    texto[i],

                valor:
                    texto[i]

            });


            i++;


            continue;

        }


        throw new Error(
            `Caractere inválido na fórmula: ${texto[i]}`
        );

    }


    return tokens;

}


/*
=====================================================
PARSER
=====================================================
*/

function calcularFormula(
    formula,
    contexto
) {

    if (
        !formula ||
        !String(formula).trim()
    ) {

        return null;

    }


    const tokens =
        tokenizarFormula(
            formula
        );


    let posicao = 0;


    function atual() {

        return tokens[posicao];

    }


    function consumir(
        tipo
    ) {

        const token =
            atual();


        if (
            !token ||
            token.tipo !== tipo
        ) {

            throw new Error(
                "Fórmula inválida."
            );

        }


        posicao++;


        return token;

    }


    /*
    =============================================
    EXPRESSÃO
    =============================================
    */

    function expressao() {

        let valor =
            termo();


        while (
            atual() &&
            (
                atual().tipo === "+" ||
                atual().tipo === "-"
            )
        ) {

            const operador =
                consumir(
                    atual().tipo
                );


            const proximo =
                termo();


            if (
                operador.tipo === "+"
            ) {

                valor +=
                    proximo;

            } else {

                valor -=
                    proximo;

            }

        }


        return valor;

    }


    /*
    =============================================
    TERMO
    =============================================
    */

    function termo() {

        let valor =
            fator();


        while (
            atual() &&
            (
                atual().tipo === "*" ||
                atual().tipo === "/"
            )
        ) {

            const operador =
                consumir(
                    atual().tipo
                );


            const proximo =
                fator();


            if (
                operador.tipo === "*"
            ) {

                valor *=
                    proximo;

            } else {

                if (
                    proximo === 0
                ) {

                    throw new Error(
                        "Divisão por zero."
                    );

                }


                valor /=
                    proximo;

            }

        }


        return valor;

    }


    /*
    =============================================
    FATOR
    =============================================
    */

    function fator() {

        const token =
            atual();


        if (!token) {

            throw new Error(
                "Fórmula incompleta."
            );

        }


        /*
        -----------------------------------------
        NÚMERO NEGATIVO
        -----------------------------------------
        */

        if (
            token.tipo === "-"
        ) {

            consumir("-");


            return -fator();

        }


        /*
        -----------------------------------------
        NÚMERO
        -----------------------------------------
        */

        if (
            token.tipo === "numero"
        ) {

            consumir(
                "numero"
            );


            return token.valor;

        }


        /*
        -----------------------------------------
        REFERÊNCIA
        -----------------------------------------
        */

        if (
            token.tipo === "identificador"
        ) {

            consumir(
                "identificador"
            );


            const valor =
                contexto[
                    token.valor
                ];


            if (
                valor === undefined ||
                valor === null ||
                !Number.isFinite(
                    Number(valor)
                )
            ) {

                throw new Error(
                    `Referência não encontrada: ${token.valor}`
                );

            }


            return Number(
                valor
            );

        }


        /*
        -----------------------------------------
        PARÊNTESES
        -----------------------------------------
        */

        if (
            token.tipo === "("
        ) {

            consumir("(");


            const valor =
                expressao();


            consumir(")");


            return valor;

        }


        throw new Error(
            "Fórmula inválida."
        );

    }


    const resultado =
        expressao();


    if (
        posicao <
        tokens.length
    ) {

        throw new Error(
            "Fórmula inválida."
        );

    }


    if (
        !Number.isFinite(
            resultado
        )
    ) {

        throw new Error(
            "Resultado inválido."
        );

    }


    return Number(
        resultado.toFixed(2)
    );

}


/*
=====================================================
COMPONENTE
=====================================================
*/

export default function TabelaPreco() {

    const [itens, setItens] =
        useState([]);

    const [grupos, setGrupos] =
        useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);


    /*
    =================================================
    POPUP
    =================================================
    */

    const [popup, setPopup] =
        useState(null);

    const [popupProcessando, setPopupProcessando] =
        useState(false);


    /*
    =================================================
    FILTROS
    =================================================
    */

    const [busca, setBusca] =
        useState("");

    const [grupoFiltro, setGrupoFiltro] =
        useState("");

    const [statusFiltro, setStatusFiltro] =
        useState("ativos");


    /*
    =================================================
    MODAL
    =================================================
    */

    const [modalAberto, setModalAberto] =
        useState(false);

    const [itemSelecionado, setItemSelecionado] =
        useState(null);


    /*
    =================================================
    FORMULÁRIO
    =================================================
    */

    const [nome, setNome] =
        useState("");

    const [descricao, setDescricao] =
        useState("");

    const [padraoMedicao, setPadraoMedicao] =
        useState("");

    const [grupoId, setGrupoId] =
        useState("");

    const [precoBase, setPrecoBase] =
        useState("");

    const [imagemUrl, setImagemUrl] =
        useState("");

    const [imagemArquivo, setImagemArquivo] =
        useState(null);


    /*
    NOVO:
    controla se a imagem existente foi removida.
    */

    const [imagemRemovida, setImagemRemovida] =
        useState(false);


    const [celulas, setCelulas] =
        useState(
            criarCelulasVazias()
        );


    /*
    =================================================
    ABRIR POPUP
    =================================================
    */

    function abrirPopup({
        tipo = "info",
        titulo = "Aviso",
        mensagem = "",
        textoConfirmar = "Entendi",
        textoCancelar = "Cancelar",
        mostrarCancelar = false,
        onConfirmar = null
    } = {}) {

        setPopup({

            tipo,

            titulo,

            mensagem,

            textoConfirmar,

            textoCancelar,

            mostrarCancelar,

            onConfirmar

        });

    }


    /*
    =================================================
    FECHAR POPUP
    =================================================
    */

    function fecharPopup() {

        if (
            popupProcessando
        ) {

            return;

        }


        setPopup(
            null
        );

    }


    /*
    =================================================
    CONFIRMAR POPUP
    =================================================
    */

    async function confirmarPopup() {

        if (
            popupProcessando
        ) {

            return;

        }


        if (
            !popup?.onConfirmar
        ) {

            setPopup(
                null
            );

            return;

        }


        setPopupProcessando(
            true
        );


        try {

            const resultado =
                await popup.onConfirmar();


            setPopup(
                null
            );


            if (
                resultado
            ) {

                setTimeout(
                    () => {

                        abrirPopup(
                            resultado
                        );

                    },
                    100
                );

            }

        } catch (error) {

            console.error(
                error
            );


            setPopup(
                null
            );


            setTimeout(
                () => {

                    abrirPopup({

                        tipo:
                            "erro",

                        titulo:
                            "Não foi possível concluir",

                        mensagem:
                            error?.message ||
                            "Ocorreu um erro ao executar a operação.",

                        textoConfirmar:
                            "Fechar"

                    });

                },
                100
            );

        } finally {

            setPopupProcessando(
                false
            );

        }

    }


    /*
    =================================================
    CARREGAR GRUPOS
    =================================================
    */

    async function carregarGrupos() {

        const {
            data,
            error
        } = await supabase
            .from(
                "tabela_preco_grupos"
            )
            .select("*")
            .eq(
                "ativo",
                true
            )
            .order(
                "ordem"
            );


        if (error) {

            console.error(
                error
            );


            abrirPopup({

                tipo:
                    "erro",

                titulo:
                    "Erro ao carregar grupos",

                mensagem:
                    "Não foi possível carregar os grupos da tabela de preços.",

                textoConfirmar:
                    "Fechar"

            });


            return;

        }


        setGrupos(
            data || []
        );

    }


    /*
    =================================================
    CARREGAR ITENS
    =================================================
    */

    async function carregarItens() {

        setCarregando(
            true
        );


        const {
            data,
            error
        } = await supabase
            .from(
                "tabela_preco_itens"
            )
            .select(`
                *,
                grupo:tabela_preco_grupos(
                    id,
                    nome
                ),
                valores:tabela_preco_valores(
                    id,
                    cor,
                    complexidade,
                    formula,
                    valor_calculado,
                    valor_manual,
                    usar_valor_manual,
                    ativo
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
                error
            );


            abrirPopup({

                tipo:
                    "erro",

                titulo:
                    "Erro ao carregar tabela",

                mensagem:
                    "Não foi possível carregar a tabela de preços.",

                textoConfirmar:
                    "Fechar"

            });


            setCarregando(
                false
            );


            return;

        }


        setItens(
            data || []
        );


        setCarregando(
            false
        );

    }


    /*
    =================================================
    SALVAR RASCUNHO
    =================================================
    */

    function salvarRascunho() {

        if (!modalAberto) {

            return;

        }


        try {

            const rascunho = {

                modalAberto: true,

                itemSelecionado:
                    itemSelecionado
                        ? {
                            id:
                                itemSelecionado.id,

                            ativo:
                                itemSelecionado.ativo
                        }
                        : null,

                nome,

                descricao,

                padraoMedicao,

                grupoId,

                precoBase,

                imagemUrl,

                /*
                NOVO:
                salva também a intenção de remover
                */

                imagemRemovida,

                celulas

            };


            sessionStorage.setItem(
                CHAVE_RASCUNHO,
                JSON.stringify(
                    rascunho
                )
            );

        } catch (error) {

            console.error(
                "Erro ao salvar rascunho:",
                error
            );

        }

    }


    /*
    =================================================
    LIMPAR RASCUNHO
    =================================================
    */

    function limparRascunho() {

        try {

            sessionStorage.removeItem(
                CHAVE_RASCUNHO
            );

        } catch (error) {

            console.error(
                "Erro ao limpar rascunho:",
                error
            );

        }

    }


    /*
    =================================================
    INICIALIZAÇÃO
    =================================================
    */

    useEffect(() => {

        carregarGrupos();

        carregarItens();

    }, []);


    /*
    =================================================
    RECUPERAR RASCUNHO
    =================================================
    */

    useEffect(() => {

        try {

            const dados =
                sessionStorage.getItem(
                    CHAVE_RASCUNHO
                );


            if (!dados) {

                return;

            }


            const rascunho =
                JSON.parse(
                    dados
                );


            if (
                !rascunho ||
                !rascunho.modalAberto
            ) {

                return;

            }


            setItemSelecionado(
                rascunho.itemSelecionado ||
                null
            );


            setNome(
                rascunho.nome ||
                ""
            );


            setDescricao(
                rascunho.descricao ||
                ""
            );


            setPadraoMedicao(
                rascunho.padraoMedicao ||
                ""
            );


            setGrupoId(
                rascunho.grupoId ||
                ""
            );


            setPrecoBase(
                rascunho.precoBase ??
                ""
            );


            setImagemUrl(
                rascunho.imagemUrl ||
                ""
            );


            /*
            NOVO:
            restaura o estado de remoção da imagem.
            Compatibilidade com rascunhos antigos:
            se não existir, será false.
            */

            setImagemRemovida(
                Boolean(
                    rascunho.imagemRemovida
                )
            );


            setImagemArquivo(
                null
            );


            if (
                rascunho.celulas &&
                typeof rascunho.celulas === "object"
            ) {

                const matrizRestaurada =
                    criarCelulasVazias();


                Object.keys(
                    matrizRestaurada
                ).forEach(
                    chave => {

                        if (
                            rascunho.celulas[
                                chave
                            ]
                        ) {

                            matrizRestaurada[
                                chave
                            ] = {

                                ...matrizRestaurada[
                                    chave
                                ],

                                ...rascunho.celulas[
                                    chave
                                ]

                            };

                        }

                    }
                );


                setCelulas(
                    matrizRestaurada
                );

            }


            setModalAberto(
                true
            );

        } catch (error) {

            console.error(
                "Erro ao recuperar rascunho:",
                error
            );

            limparRascunho();

        }

    }, []);


    /*
    =================================================
    SALVAMENTO AUTOMÁTICO DO RASCUNHO
    =================================================
    */

    useEffect(() => {

        if (!modalAberto) {

            return;

        }


        const timer =
            setTimeout(
                () => {

                    salvarRascunho();

                },
                200
            );


        return () =>
            clearTimeout(
                timer
            );

    }, [
        modalAberto,
        itemSelecionado,
        nome,
        descricao,
        padraoMedicao,
        grupoId,
        precoBase,
        imagemUrl,
        imagemRemovida,
        celulas
    ]);


    /*
    =================================================
    FILTROS
    =================================================
    */

    const itensFiltrados =
        useMemo(() => {

            const texto =
                busca
                    .trim()
                    .toLowerCase();


            return itens.filter(
                item => {

                    const correspondeBusca =

                        !texto ||

                        item.nome
                            ?.toLowerCase()
                            .includes(
                                texto
                            )

                        ||

                        item.descricao
                            ?.toLowerCase()
                            .includes(
                                texto
                            );


                    const correspondeGrupo =

                        !grupoFiltro ||

                        String(
                            item.grupo_id
                        ) === String(
                            grupoFiltro
                        );


                    const correspondeStatus =

                        statusFiltro ===
                        "todos"

                        ||

                        (
                            statusFiltro ===
                            "ativos"

                            &&

                            item.ativo
                        )

                        ||

                        (
                            statusFiltro ===
                            "inativos"

                            &&

                            !item.ativo
                        );


                    return (

                        correspondeBusca &&

                        correspondeGrupo &&

                        correspondeStatus

                    );

                }
            );

        }, [
            itens,
            busca,
            grupoFiltro,
            statusFiltro
        ]);


    /*
    =================================================
    ABRIR NOVO
    =================================================
    */

    function abrirNovo() {

        limparRascunho();


        setItemSelecionado(
            null
        );


        setNome("");

        setDescricao("");

        setPadraoMedicao("");


        setGrupoId(
            grupos[0]?.id
                ? String(
                    grupos[0].id
                )
                : ""
        );


        setPrecoBase("");

        setImagemUrl("");

        setImagemArquivo(
            null
        );

        setImagemRemovida(
            false
        );


        setCelulas(
            criarCelulasVazias()
        );


        setModalAberto(
            true
        );

    }


    /*
    =================================================
    ABRIR EDIÇÃO
    =================================================
    */

    function abrirEdicao(
        item
    ) {

        limparRascunho();


        setItemSelecionado(
            item
        );


        setNome(
            item.nome || ""
        );


        setDescricao(
            item.descricao || ""
        );


        setPadraoMedicao(
            item.padrao_medicao || ""
        );


        setGrupoId(
            String(
                item.grupo_id || ""
            )
        );


        setPrecoBase(
            item.preco_base ?? ""
        );


        setImagemUrl(
            item.imagem_url || ""
        );


        setImagemArquivo(
            null
        );


        /*
        Ao abrir uma edição, a foto existente
        começa normalmente ativa.
        */

        setImagemRemovida(
            false
        );


        const matriz =
            criarCelulasVazias();


        (
            item.valores || []
        ).forEach(
            valor => {

                const chave =
                    chaveCelula(
                        valor.cor,
                        valor.complexidade
                    );


                matriz[chave] = {

                    id:
                        valor.id,

                    cor:
                        valor.cor,

                    complexidade:
                        valor.complexidade,

                    formula:
                        valor.formula || "",

                    valor_calculado:
                        valor.valor_calculado,

                    valor_manual:
                        valor.valor_manual,

                    usar_valor_manual:
                        valor.usar_valor_manual,

                    ativo:
                        valor.ativo

                };

            }
        );


        /*
        IMPORTANTE:

        Ao abrir uma edição, recalculamos
        a matriz usando as fórmulas atuais.
        */

        const matrizCalculada =
            recalcularMatriz(
                matriz
            );


        setCelulas(
            matrizCalculada
        );


        setModalAberto(
            true
        );

    }


    /*
    =================================================
    FECHAR MODAL
    =================================================
    */

    function fecharModal({
        descartar = false
    } = {}) {

        if (salvando) {

            return;

        }


        if (descartar) {

            limparRascunho();

        }


        setModalAberto(
            false
        );


        setItemSelecionado(
            null
        );

    }


    /*
    =================================================
    REMOVER IMAGEM
    =================================================
    */

    function removerImagem() {

        /*
        Remove qualquer arquivo novo selecionado.
        */

        setImagemArquivo(
            null
        );


        /*
        Remove a URL existente da interface
        e marca a imagem para ser removida
        no próximo salvamento.
        */

        setImagemUrl("");


        setImagemRemovida(
            true
        );

    }


    /*
    =================================================
    UPLOAD IMAGEM
    =================================================
    */

    async function enviarImagem() {

        /*
        Se o usuário marcou a imagem para remover,
        não enviamos nenhuma imagem.
        */

        if (imagemRemovida) {

            return null;

        }


        if (
            !imagemArquivo
        ) {

            return imagemUrl;

        }


        const extensao =
            imagemArquivo.name
                .split(".")
                .pop()
                ?.toLowerCase();


        const nomeArquivo =
            `${crypto.randomUUID()}.${extensao}`;


        const caminho =
            `itens/${nomeArquivo}`;


        const {
            error
        } = await supabase
            .storage
            .from(
                "tabela-precos"
            )
            .upload(
                caminho,
                imagemArquivo,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false
                }
            );


        if (error) {

            throw error;

        }


        const {
            data
        } = supabase
            .storage
            .from(
                "tabela-precos"
            )
            .getPublicUrl(
                caminho
            );


        return data.publicUrl;

    }


    /*
    =================================================
    CONTEXTO PARA CÁLCULO
    =================================================
    */

    function montarContexto(
        matrizAtual
    ) {

        const contexto = {

            PRECO_BASE:
                numero(
                    precoBase
                )

        };


        CORES.forEach(
            cor => {

                COMPLEXIDADES.forEach(
                    complexidade => {

                        const chave =
                            chaveCelula(
                                cor,
                                complexidade
                            );


                        const celula =
                            matrizAtual[
                                chave
                            ];


                        const nomeReferencia =
                            chave
                                .toUpperCase();


                        let valor =
                            numero(
                                celula?.valor_calculado
                            );


                        if (
                            celula?.usar_valor_manual
                        ) {

                            valor =
                                numero(
                                    celula.valor_manual
                                );

                        }


                        contexto[
                            nomeReferencia
                        ] =
                            valor;

                    }
                );

            }
        );


        return contexto;

    }


    /*
    =================================================
    CALCULAR MATRIZ
    =================================================
    */

    function recalcularMatriz(
        matrizOriginal
    ) {

        /*
        =============================================
        CLONAR A MATRIZ COMPLETAMENTE
        =============================================
        */

        const matriz = {};


        Object.keys(
            matrizOriginal
        ).forEach(
            chave => {

                matriz[chave] = {

                    ...matrizOriginal[chave]

                };

            }
        );


        /*
        =============================================
        CONTROLE DE CÁLCULO
        =============================================
        */

        const calculando =
            new Set();


        const calculados =
            new Set();


        /*
        =============================================
        FUNÇÃO PRINCIPAL
        =============================================
        */

        function calcularCelula(
            cor,
            complexidade
        ) {

            const chave =
                chaveCelula(
                    cor,
                    complexidade
                );


            const celula =
                matriz[chave];


            /*
            -----------------------------------------
            CÉLULA INEXISTENTE
            -----------------------------------------
            */

            if (!celula) {

                return 0;

            }


            /*
            -----------------------------------------
            VALOR MANUAL
            -----------------------------------------
            */

            if (
                celula.usar_valor_manual
            ) {

                const valorManual =
                    numero(
                        celula.valor_manual
                    );


                celula.valor_calculado =
                    valorManual;


                calculados.add(
                    chave
                );


                return valorManual;

            }


            /*
            -----------------------------------------
            JÁ CALCULADO
            -----------------------------------------
            */

            if (
                calculados.has(
                    chave
                )
            ) {

                return numero(
                    celula.valor_calculado
                );

            }


            /*
            -----------------------------------------
            SEM FÓRMULA
            -----------------------------------------
            */

            if (
                !celula.formula ||
                !celula.formula.trim()
            ) {

                const valorExistente =
                    celula.valor_calculado !== null &&
                    celula.valor_calculado !== undefined
                        ? numero(
                            celula.valor_calculado
                        )
                        : 0;


                calculados.add(
                    chave
                );


                return valorExistente;

            }


            /*
            -----------------------------------------
            REFERÊNCIA CIRCULAR
            -----------------------------------------
            */

            if (
                calculando.has(
                    chave
                )
            ) {

                throw new Error(
                    `Referência circular em ${chave.toUpperCase()}`
                );

            }


            calculando.add(
                chave
            );


            /*
            =========================================
            CONTEXTO DINÂMICO
            =========================================
            */

            const contexto = {

                PRECO_BASE:
                    numero(
                        precoBase
                    )

            };


            CORES.forEach(
                c => {

                    COMPLEXIDADES.forEach(
                        cx => {

                            const outraChave =
                                chaveCelula(
                                    c,
                                    cx
                                );


                            const referencia =
                                outraChave
                                    .toUpperCase();


                            Object.defineProperty(
                                contexto,
                                referencia,
                                {
                                    enumerable: true,

                                    configurable: true,

                                    get: () => {

                                        return calcularCelula(
                                            c,
                                            cx
                                        );

                                    }

                                }
                            );

                        }
                    );

                }
            );


            try {

                /*
                =====================================
                CALCULAR FÓRMULA
                =====================================
                */

                const resultado =
                    calcularFormula(
                        celula.formula,
                        contexto
                    );


                celula.valor_calculado =
                    resultado;


                calculados.add(
                    chave
                );


                return resultado;

            } catch (erro) {

                console.warn(
                    `Erro ao calcular ${chave.toUpperCase()}:`,
                    erro
                );


                throw erro;

            } finally {

                calculando.delete(
                    chave
                );

            }

        }


        /*
        =============================================
        RECALCULAR TODAS AS CÉLULAS
        =============================================
        */

        CORES.forEach(
            cor => {

                COMPLEXIDADES.forEach(
                    complexidade => {

                        try {

                            calcularCelula(
                                cor,
                                complexidade
                            );

                        } catch (
                            erro
                        ) {

                            console.warn(
                                `Não foi possível calcular ${chaveCelula(
                                    cor,
                                    complexidade
                                ).toUpperCase()}:`,
                                erro
                            );

                        }

                    }
                );

            }
        );


        return matriz;

    }


    /*
    =================================================
    ALTERAR CÉLULA
    =================================================
    */

    function alterarCelula(
        chave,
        campo,
        valor
    ) {

        setCelulas(
            atual => {

                const nova = {};


                Object.keys(
                    atual
                ).forEach(
                    chaveAtual => {

                        nova[chaveAtual] = {

                            ...atual[chaveAtual]

                        };

                    }
                );


                nova[chave] = {

                    ...nova[chave],

                    [campo]:
                        valor

                };


                return recalcularMatriz(
                    nova
                );

            }
        );

    }


    /*
    =================================================
    PEGAR VALOR FINAL DE UMA CÉLULA
    =================================================
    */

    function obterValorCelula(
        item,
        cor,
        complexidade
    ) {

        const valor =
            (
                item.valores || []
            ).find(
                registro =>
                    Number(
                        registro.cor
                    ) === Number(cor) &&

                    Number(
                        registro.complexidade
                    ) === Number(complexidade)
            );


        if (!valor) {

            return null;

        }


        if (
            valor.usar_valor_manual
        ) {

            return valor.valor_manual;

        }


        return valor.valor_calculado;

    }


    /*
    =================================================
    VERIFICAR SE A CÉLULA POSSUI DADO
    =================================================
    */

    function possuiValorCelula(
        item,
        cor,
        complexidade
    ) {

        const valor =
            (
                item.valores || []
            ).find(
                registro =>
                    Number(
                        registro.cor
                    ) === Number(cor) &&

                    Number(
                        registro.complexidade
                    ) === Number(complexidade)
            );


        if (!valor) {

            return false;

        }


        return Boolean(

            valor.formula ||

            valor.valor_calculado !== null ||

            valor.valor_manual !== null

        );

    }


    /*
    =================================================
    SALVAR
    =================================================
    */

    async function salvar(
        event
    ) {

        event.preventDefault();


        if (
            !nome.trim()
        ) {

            abrirPopup({

                tipo:
                    "aviso",

                titulo:
                    "Nome obrigatório",

                mensagem:
                    "Informe o nome do item antes de salvar.",

                textoConfirmar:
                    "Entendi"

            });


            return;

        }


        if (
            !grupoId
        ) {

            abrirPopup({

                tipo:
                    "aviso",

                titulo:
                    "Grupo obrigatório",

                mensagem:
                    "Selecione o grupo do item antes de salvar.",

                textoConfirmar:
                    "Entendi"

            });


            return;

        }


        setSalvando(
            true
        );


        try {

            /*
            =========================================
            IMAGEM
            =========================================
            */

            const imagemFinal =
                await enviarImagem();


            let itemId =
                itemSelecionado?.id;


            /*
            =========================================
            USUÁRIO
            =========================================
            */

            const {
                data: usuarioAtual
            } =
                await supabase
                    .auth
                    .getUser();


            const usuarioId =
                usuarioAtual
                    ?.user
                    ?.id ||
                null;


            /*
            =========================================
            DADOS DO ITEM
            =========================================
            */

            const dadosItem = {

                nome:
                    nome.trim(),

                descricao:
                    descricao.trim() ||
                    null,

                /*
                Se imagemRemovida = true,
                imagemFinal será null.

                Se foi escolhida uma nova imagem,
                imagemFinal será a nova URL.

                Se nada foi alterado,
                imagemFinal continua sendo a URL antiga.
                */

                imagem_url:
                    imagemFinal ||
                    null,

                padrao_medicao:
                    padraoMedicao.trim() ||
                    null,

                grupo_id:
                    Number(
                        grupoId
                    ),

                preco_base:
                    numero(
                        precoBase
                    ),

                ativo:
                    itemSelecionado
                        ?.ativo ??
                    true,

                updated_by:
                    usuarioId

            };


            /*
            =========================================
            ATUALIZAR ITEM
            =========================================
            */

            if (
                itemSelecionado
            ) {

                const {
                    error
                } = await supabase
                    .from(
                        "tabela_preco_itens"
                    )
                    .update(
                        dadosItem
                    )
                    .eq(
                        "id",
                        itemSelecionado.id
                    );


                if (error) {

                    throw error;

                }

            }


            /*
            =========================================
            INSERIR ITEM
            =========================================
            */

            else {

                const {
                    data,
                    error
                } = await supabase
                    .from(
                        "tabela_preco_itens"
                    )
                    .insert({

                        ...dadosItem,

                        created_by:
                            usuarioId

                    })
                    .select(
                        "id"
                    )
                    .single();


                if (error) {

                    throw error;

                }


                itemId =
                    data.id;

            }


            /*
            =========================================
            RECALCULAR MATRIZ
            =========================================
            */

            const matriz =
                recalcularMatriz(
                    celulas
                );


            /*
            =========================================
            SALVAR 24 CÉLULAS
            =========================================
            */

            const registros =
                Object.values(
                    matriz
                ).map(
                    celula => {

                        const registro = {

                            item_id:
                                itemId,

                            cor:
                                celula.cor,

                            complexidade:
                                celula.complexidade,

                            formula:
                                celula.formula?.trim() ||
                                null,

                            valor_calculado:
                                celula.valor_calculado,

                            valor_manual:
                                celula.valor_manual ===
                                ""
                                    ? null
                                    : numero(
                                        celula.valor_manual
                                    ),

                            usar_valor_manual:
                                Boolean(
                                    celula.usar_valor_manual
                                ),

                            ativo:
                                Boolean(
                                    celula.ativo
                                )

                        };


                        /*
                        IMPORTANTE:

                        Não enviamos id null.
                        */

                        if (
                            celula.id
                        ) {

                            registro.id =
                                celula.id;

                        }


                        return registro;

                    }
                );


            const {
                error:
                    erroValores
            } = await supabase
                .from(
                    "tabela_preco_valores"
                )
                .upsert(
                    registros,
                    {
                        onConflict:
                            "item_id,cor,complexidade"
                    }
                );


            if (
                erroValores
            ) {

                throw erroValores;

            }


            /*
            =========================================
            SUCESSO
            =========================================
            */

            limparRascunho();


            fecharModal();


            await carregarItens();


            abrirPopup({

                tipo:
                    "sucesso",

                titulo:
                    itemSelecionado
                        ? "Item atualizado"
                        : "Item criado",

                mensagem:
                    itemSelecionado
                        ? `"${nome.trim()}" foi atualizado com sucesso.`
                        : `"${nome.trim()}" foi cadastrado com sucesso.`,

                textoConfirmar:
                    "Fechar"

            });

        } catch (
            error
        ) {

            console.error(
                error
            );


            abrirPopup({

                tipo:
                    "erro",

                titulo:
                    "Erro ao salvar item",

                mensagem:
                    error?.message ||
                    "Não foi possível salvar o item.",

                textoConfirmar:
                    "Fechar"

            });

        } finally {

            setSalvando(
                false
            );

        }

    }


    /*
    =================================================
    EXCLUIR
    =================================================
    */

    function excluir(
        item
    ) {

        abrirPopup({

            tipo:
                "confirmacao",

            titulo:
                "Excluir item?",

            mensagem:
                `Deseja realmente excluir "${item.nome}"? Esta ação não poderá ser desfeita.`,

            textoConfirmar:
                "Excluir item",

            textoCancelar:
                "Cancelar",

            mostrarCancelar:
                true,

            onConfirmar:
                async () => {

                    const {
                        error
                    } = await supabase
                        .from(
                            "tabela_preco_itens"
                        )
                        .delete()
                        .eq(
                            "id",
                            item.id
                        );


                    if (error) {

                        throw error;

                    }


                    await carregarItens();


                    return {

                        tipo:
                            "sucesso",

                        titulo:
                            "Item excluído",

                        mensagem:
                            `"${item.nome}" foi removido da tabela de preços.`,

                        textoConfirmar:
                            "Fechar"

                    };

                }

        });

    }


    /*
    =================================================
    ATIVAR / INATIVAR
    =================================================
    */

    async function alternarAtivo(
        item
    ) {

        const novoStatus =
            !item.ativo;


        try {

            const {
                error
            } = await supabase
                .from(
                    "tabela_preco_itens"
                )
                .update({
                    ativo:
                        novoStatus
                })
                .eq(
                    "id",
                    item.id
                );


            if (error) {

                throw error;

            }


            await carregarItens();


            abrirPopup({

                tipo:
                    "sucesso",

                titulo:
                    novoStatus
                        ? "Item ativado"
                        : "Item desativado",

                mensagem:
                    novoStatus
                        ? `"${item.nome}" está ativo novamente na tabela de preços.`
                        : `"${item.nome}" foi desativado da tabela de preços.`,

                textoConfirmar:
                    "Fechar"

            });

        } catch (error) {

            console.error(
                error
            );


            abrirPopup({

                tipo:
                    "erro",

                titulo:
                    "Erro ao alterar status",

                mensagem:
                    error?.message ||
                    "Não foi possível alterar o status do item.",

                textoConfirmar:
                    "Fechar"

            });

        }

    }


    /*
    =================================================
    RENDER
    =================================================
    */

    return (

        <section className="tabela-preco-page">


            {/* =================================================
                CABEÇALHO
            ================================================= */}

            <header
                className="tabela-preco-header"
            >

                <div>

                    <span>
                        COMERCIAL
                    </span>

                    <h1>
                        Tabela de preços
                    </h1>

                    <p>
                        Cadastre, consulte e gerencie
                        os preços dos itens da ALME.
                    </p>

                </div>


                <button
                    type="button"
                    className="tabela-preco-novo"
                    onClick={
                        abrirNovo
                    }
                >

                    <FiPlus />

                    Novo item

                </button>

            </header>


            {/* =================================================
                FILTROS
            ================================================= */}

            <section
                className="tabela-preco-filtros"
            >

                <div
                    className="tabela-preco-search"
                >

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Buscar por nome ou descrição..."
                        value={
                            busca
                        }
                        onChange={event =>
                            setBusca(
                                event.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={
                        grupoFiltro
                    }
                    onChange={event =>
                        setGrupoFiltro(
                            event.target.value
                        )
                    }
                >

                    <option value="">
                        Todos os grupos
                    </option>

                    {
                        grupos.map(
                            grupo => (

                                <option
                                    key={
                                        grupo.id
                                    }
                                    value={
                                        grupo.id
                                    }
                                >

                                    {
                                        grupo.nome
                                    }

                                </option>

                            )
                        )
                    }

                </select>


                <select
                    value={
                        statusFiltro
                    }
                    onChange={event =>
                        setStatusFiltro(
                            event.target.value
                        )
                    }
                >

                    <option value="ativos">
                        Ativos
                    </option>

                    <option value="inativos">
                        Inativos
                    </option>

                    <option value="todos">
                        Todos
                    </option>

                </select>


                <button
                    type="button"
                    className="tabela-preco-refresh"
                    onClick={
                        carregarItens
                    }
                    title="Atualizar"
                >

                    <FiRefreshCw />

                </button>

            </section>


            {/* =================================================
                CONTADOR
            ================================================= */}

            <div
                className="tabela-preco-info"
            >

                <strong>
                    {
                        itensFiltrados.length
                    }
                </strong>

                <span>

                    {
                        itensFiltrados.length === 1
                            ? " item encontrado"
                            : " itens encontrados"
                    }

                </span>

            </div>


            {/* =================================================
                TABELA PRINCIPAL
            ================================================= */}

            <section
                className="tabela-preco-lista"
            >

                {
                    carregando ? (

                        <div
                            className="tabela-preco-vazio"
                        >

                            Carregando tabela de preços...

                        </div>

                    ) : itensFiltrados.length === 0 ? (

                        <div
                            className="tabela-preco-vazio"
                        >

                            <FiDollarSign />

                            <h2>
                                Nenhum item encontrado
                            </h2>

                            <p>
                                Adicione o primeiro item
                                à tabela de preços.
                            </p>

                        </div>

                    ) : (

                        <div
                            className="tabela-preco-table-wrapper"
                        >

                            <table
                                className="tabela-preco-table tabela-preco-matriz-principal"
                            >

                                <thead>

                                    <tr>

                                        <th
                                            rowSpan="2"
                                            className="coluna-item"
                                        >
                                            Item
                                        </th>


                                        <th
                                            rowSpan="2"
                                            className="coluna-descricao"
                                        >
                                            Descrição
                                        </th>


                                        <th
                                            rowSpan="2"
                                            className="coluna-imagem"
                                        >
                                            Imagem
                                        </th>


                                        <th
                                            rowSpan="2"
                                            className="coluna-medicao"
                                        >
                                            Padrão de medição
                                        </th>


                                        {
                                            CORES.map(
                                                cor => (

                                                    <th
                                                        key={
                                                            `cabecalho-cor-${cor}`
                                                        }
                                                        colSpan={
                                                            COMPLEXIDADES.length
                                                        }
                                                        className="coluna-cor"
                                                    >

                                                        COR {cor}

                                                    </th>

                                                )
                                            )
                                        }


                                        <th
                                            rowSpan="2"
                                            className="coluna-status"
                                        >
                                            Status
                                        </th>


                                        <th
                                            rowSpan="2"
                                            className="coluna-acoes"
                                        >
                                            Ações
                                        </th>

                                    </tr>


                                    <tr>

                                        {
                                            CORES.map(
                                                cor => (

                                                    COMPLEXIDADES.map(
                                                        complexidade => (

                                                            <th
                                                                key={
                                                                    `cabecalho-${cor}-${complexidade}`
                                                                }
                                                                className="coluna-complexidade"
                                                            >

                                                                Complexidade {
                                                                    complexidade
                                                                }

                                                            </th>

                                                        )
                                                    )

                                                )
                                            )
                                        }

                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        itensFiltrados.map(
                                            item => (

                                                <tr
                                                    key={
                                                        item.id
                                                    }
                                                >

                                                    <td
                                                        className="coluna-item"
                                                    >

                                                        <div
                                                            className="tabela-preco-item"
                                                        >

                                                            <div
                                                                className="tabela-preco-thumb"
                                                            >

                                                                {
                                                                    item.imagem_url
                                                                        ? (

                                                                            <img
                                                                                src={
                                                                                    item.imagem_url
                                                                                }
                                                                                alt={
                                                                                    item.nome
                                                                                }
                                                                            />

                                                                        )
                                                                        : (

                                                                            <FiImage />

                                                                        )
                                                                }

                                                            </div>


                                                            <div>

                                                                <strong>
                                                                    {
                                                                        item.nome
                                                                    }
                                                                </strong>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    <td
                                                        className="coluna-descricao"
                                                    >

                                                        {
                                                            item.descricao ||
                                                            "—"
                                                        }

                                                    </td>


                                                    <td
                                                        className="coluna-imagem"
                                                    >

                                                        {
                                                            item.imagem_url
                                                                ? (

                                                                    <div
                                                                        className="tabela-preco-imagem-tabela"
                                                                    >

                                                                        <img
                                                                            src={
                                                                                item.imagem_url
                                                                            }
                                                                            alt={
                                                                                item.nome
                                                                            }
                                                                        />

                                                                    </div>

                                                                )
                                                                : (

                                                                    <span>
                                                                        —
                                                                    </span>

                                                                )
                                                        }

                                                    </td>


                                                    <td
                                                        className="coluna-medicao"
                                                    >

                                                        {
                                                            item.padrao_medicao ||
                                                            "—"
                                                        }

                                                    </td>


                                                    {
                                                        CORES.map(
                                                            cor => (

                                                                COMPLEXIDADES.map(
                                                                    complexidade => {

                                                                        const valor =
                                                                            obterValorCelula(
                                                                                item,
                                                                                cor,
                                                                                complexidade
                                                                            );


                                                                        const possui =
                                                                            possuiValorCelula(
                                                                                item,
                                                                                cor,
                                                                                complexidade
                                                                            );


                                                                        const registro =
                                                                            (
                                                                                item.valores ||
                                                                                []
                                                                            ).find(
                                                                                itemValor =>
                                                                                    Number(
                                                                                        itemValor.cor
                                                                                    ) === Number(
                                                                                        cor
                                                                                    ) &&

                                                                                    Number(
                                                                                        itemValor.complexidade
                                                                                    ) === Number(
                                                                                        complexidade
                                                                                    )
                                                                            );


                                                                        const manual =
                                                                            registro?.usar_valor_manual;


                                                                        return (

                                                                            <td
                                                                                key={
                                                                                    `${item.id}-${cor}-${complexidade}`
                                                                                }
                                                                                className={
                                                                                    manual
                                                                                        ? "preco-celula preco-manual"
                                                                                        : "preco-celula"
                                                                                }
                                                                            >

                                                                                {
                                                                                    possui
                                                                                        ? (

                                                                                            <div
                                                                                                className="preco-celula-conteudo"
                                                                                            >

                                                                                                <strong>
                                                                                                    {
                                                                                                        formatarMoeda(
                                                                                                            valor
                                                                                                        )
                                                                                                    }
                                                                                                </strong>


                                                                                                {
                                                                                                    manual && (

                                                                                                        <span
                                                                                                            className="preco-manual-label"
                                                                                                        >
                                                                                                            Manual
                                                                                                        </span>

                                                                                                    )
                                                                                                }

                                                                                            </div>

                                                                                        )
                                                                                        : (

                                                                                            <span
                                                                                                className="preco-vazio"
                                                                                            >
                                                                                                —
                                                                                            </span>

                                                                                        )
                                                                                }

                                                                            </td>

                                                                        );

                                                                    }
                                                                )

                                                            )
                                                        )
                                                    }


                                                    <td
                                                        className="coluna-status"
                                                    >

                                                        <button
                                                            type="button"
                                                            className={
                                                                item.ativo
                                                                    ? "status ativo"
                                                                    : "status inativo"
                                                            }
                                                            onClick={() =>
                                                                alternarAtivo(
                                                                    item
                                                                )
                                                            }
                                                        >

                                                            {
                                                                item.ativo
                                                                    ? "Ativo"
                                                                    : "Inativo"
                                                            }

                                                        </button>

                                                    </td>


                                                    <td
                                                        className="coluna-acoes"
                                                    >

                                                        <div
                                                            className="tabela-preco-acoes"
                                                        >

                                                            <button
                                                                type="button"
                                                                title="Editar"
                                                                onClick={() =>
                                                                    abrirEdicao(
                                                                        item
                                                                    )
                                                                }
                                                            >

                                                                <FiEdit2 />

                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="perigo"
                                                                title="Excluir"
                                                                onClick={() =>
                                                                    excluir(
                                                                        item
                                                                    )
                                                                }
                                                            >

                                                                <FiTrash2 />

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )
                                    }

                                </tbody>

                            </table>

                        </div>

                    )
                }

            </section>


            {/* =================================================
                MODAL
            ================================================= */}

            {
                modalAberto && (

                    <div
                        className="tabela-preco-overlay"
                        onMouseDown={event => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {

                                fecharModal({
                                    descartar: true
                                });

                            }

                        }}
                    >

                        <div
                            className="tabela-preco-modal"
                        >

                            <header
                                className="tabela-preco-modal-header"
                            >

                                <div>

                                    <span>
                                        COMERCIAL
                                    </span>

                                    <h2>

                                        {
                                            itemSelecionado
                                                ? "Editar item"
                                                : "Novo item"
                                        }

                                    </h2>

                                </div>


                                <button
                                    type="button"
                                    onClick={() =>
                                        fecharModal({
                                            descartar: true
                                        })
                                    }
                                >

                                    <FiX />

                                </button>

                            </header>


                            <form
                                onSubmit={
                                    salvar
                                }
                            >

                                {/* =================================================
                                    DADOS DO ITEM
                                ================================================= */}

                                <section
                                    className="tabela-preco-form-grid"
                                >

                                    <div
                                        className="campo campo-grande"
                                    >

                                        <label>
                                            Nome do item
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                nome
                                            }
                                            onChange={event =>
                                                setNome(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>


                                    <div
                                        className="campo"
                                    >

                                        <label>
                                            Grupo do item
                                        </label>

                                        <select
                                            value={
                                                grupoId
                                            }
                                            onChange={event =>
                                                setGrupoId(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        >

                                            <option value="">
                                                Selecione
                                            </option>

                                            {
                                                grupos.map(
                                                    grupo => (

                                                        <option
                                                            key={
                                                                grupo.id
                                                            }
                                                            value={
                                                                grupo.id
                                                            }
                                                        >

                                                            {
                                                                grupo.nome
                                                            }

                                                        </option>

                                                    )
                                                )
                                            }

                                        </select>

                                    </div>


                                    <div
                                        className="campo"
                                    >

                                        <label>
                                            Padrão de medição
                                        </label>

                                        <select
                                            value={
                                                padraoMedicao
                                            }
                                            onChange={event =>
                                                setPadraoMedicao(
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Selecione
                                            </option>

                                            <option value="Altura × Largura">
                                                Altura × Largura
                                            </option>

                                            <option value="Largura × Profundidade">
                                                Largura × Profundidade
                                            </option>

                                            <option value="Altura × Largura × Profundidade">
                                                Altura × Largura × Profundidade
                                            </option>

                                            <option value="Comprimento × Largura">
                                                Comprimento × Largura
                                            </option>

                                            <option value="Comprimento × Largura × Altura">
                                                Comprimento × Largura × Altura
                                            </option>

                                            <option value="Largura">
                                                Largura
                                            </option>

                                            <option value="Altura">
                                                Altura
                                            </option>

                                            <option value="Comprimento">
                                                Comprimento
                                            </option>

                                            <option value="Diâmetro">
                                                Diâmetro
                                            </option>

                                            <option value="Unidade">
                                                Unidade
                                            </option>

                                            <option value="Metro Linear">
                                                Metro Linear
                                            </option>

                                        </select>

                                    </div>


                                    <div
                                        className="campo"
                                    >

                                        <label>
                                            Preço base
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                precoBase
                                            }
                                            onChange={event =>
                                                setPrecoBase(
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </div>


                                    <div
                                        className="campo campo-grande"
                                    >

                                        <label>
                                            Descrição
                                        </label>

                                        <textarea
                                            rows="3"
                                            value={
                                                descricao
                                            }
                                            onChange={event =>
                                                setDescricao(
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </div>


                                    <div
                                        className="campo campo-imagem"
                                    >

                                        <label>
                                            Imagem pequena
                                        </label>

                                        <div
                                            className="tabela-preco-upload"
                                        >

                                            <label>

                                                <FiImage />

                                                <span>
                                                    Selecionar imagem
                                                </span>

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={event => {

                                                        const arquivo =
                                                            event.target.files?.[0] ||
                                                            null;

                                                        setImagemArquivo(
                                                            arquivo
                                                        );


                                                        /*
                                                        Se o usuário escolher
                                                        uma nova imagem depois
                                                        de remover a antiga,
                                                        cancela a remoção.
                                                        */

                                                        if (arquivo) {

                                                            setImagemRemovida(
                                                                false
                                                            );

                                                        }

                                                    }}
                                                />

                                            </label>


                                            {
                                                (
                                                    imagemArquivo ||
                                                    imagemUrl
                                                ) && (

                                                    <div
                                                        className="tabela-preco-preview"
                                                    >

                                                        <img
                                                            src={
                                                                imagemArquivo
                                                                    ? URL.createObjectURL(
                                                                        imagemArquivo
                                                                    )
                                                                    : imagemUrl
                                                            }
                                                            alt="Preview"
                                                        />

                                                    </div>

                                                )
                                            }


                                            {/* =================================================
                                                NOVO:
                                                BOTÃO REMOVER FOTO
                                            ================================================= */}

                                            {
                                                (
                                                    imagemArquivo ||
                                                    imagemUrl
                                                ) && (

                                                    <button
                                                        type="button"
                                                        className="tabela-preco-remover-imagem"
                                                        onClick={
                                                            removerImagem
                                                        }
                                                        disabled={
                                                            salvando
                                                        }
                                                    >

                                                        <FiTrash2 />

                                                        Remover foto

                                                    </button>

                                                )
                                            }

                                        </div>

                                    </div>

                                </section>


                                {/* =================================================
                                    MATRIZ DO MODAL
                                ================================================= */}

                                <section
                                    className="tabela-preco-matriz"
                                >

                                    <header>

                                        <div>

                                            <span>
                                                MATRIZ DE PREÇOS
                                            </span>

                                            <h3>
                                                Cores e complexidades
                                            </h3>

                                            <p>
                                                Use fórmulas para calcular
                                                automaticamente ou ative
                                                o valor manual para sobrescrever
                                                o resultado.
                                            </p>

                                        </div>

                                    </header>


                                    <div
                                        className="tabela-preco-matriz-wrapper"
                                    >

                                        <table
                                            className="tabela-preco-matriz-table"
                                        >

                                            <thead>

                                                <tr>

                                                    <th>
                                                        Cor
                                                    </th>

                                                    {
                                                        COMPLEXIDADES.map(
                                                            complexidade => (

                                                                <th
                                                                    key={
                                                                        complexidade
                                                                    }
                                                                >

                                                                    Complexidade {
                                                                        complexidade
                                                                    }

                                                                </th>

                                                            )
                                                        )
                                                    }

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    CORES.map(
                                                        cor => (

                                                            <tr
                                                                key={
                                                                    cor
                                                                }
                                                            >

                                                                <th>
                                                                    Cor {cor}
                                                                </th>


                                                                {
                                                                    COMPLEXIDADES.map(
                                                                        complexidade => {

                                                                            const chave =
                                                                                chaveCelula(
                                                                                    cor,
                                                                                    complexidade
                                                                                );


                                                                            const celula =
                                                                                celulas[
                                                                                    chave
                                                                                ];


                                                                            return (

                                                                                <td
                                                                                    key={
                                                                                        chave
                                                                                    }
                                                                                >

                                                                                    <div
                                                                                        className="matriz-celula"
                                                                                    >

                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder="Ex.: PRECO_BASE * 1.5"
                                                                                            value={
                                                                                                celula?.formula ||
                                                                                                ""
                                                                                            }
                                                                                            onChange={event =>
                                                                                                alterarCelula(
                                                                                                    chave,
                                                                                                    "formula",
                                                                                                    event.target.value
                                                                                                )
                                                                                            }
                                                                                        />


                                                                                        <div
                                                                                            className="matriz-resultado"
                                                                                        >

                                                                                            <span>
                                                                                                Resultado
                                                                                            </span>


                                                                                            <strong>

                                                                                                {
                                                                                                    celula?.usar_valor_manual

                                                                                                        ? formatarMoeda(
                                                                                                            celula.valor_manual
                                                                                                        )

                                                                                                        : formatarMoeda(
                                                                                                            celula.valor_calculado
                                                                                                        )
                                                                                                }

                                                                                            </strong>

                                                                                        </div>


                                                                                        <label
                                                                                            className="matriz-manual"
                                                                                        >

                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={
                                                                                                    Boolean(
                                                                                                        celula?.usar_valor_manual
                                                                                                    )
                                                                                                }
                                                                                                onChange={event =>
                                                                                                    alterarCelula(
                                                                                                        chave,
                                                                                                        "usar_valor_manual",
                                                                                                        event.target.checked
                                                                                                    )
                                                                                                }
                                                                                            />


                                                                                            <span>
                                                                                                Manual
                                                                                            </span>

                                                                                        </label>


                                                                                        {
                                                                                            celula?.usar_valor_manual && (

                                                                                                <input
                                                                                                    className="matriz-input-manual"
                                                                                                    type="number"
                                                                                                    min="0"
                                                                                                    step="0.01"
                                                                                                    placeholder="Valor manual"
                                                                                                    value={
                                                                                                        celula?.valor_manual ?? ""
                                                                                                    }
                                                                                                    onChange={event =>
                                                                                                        alterarCelula(
                                                                                                            chave,
                                                                                                            "valor_manual",
                                                                                                            event.target.value
                                                                                                        )
                                                                                                    }
                                                                                                />

                                                                                            )
                                                                                        }

                                                                                    </div>

                                                                                </td>

                                                                            );

                                                                        }
                                                                    )
                                                                }

                                                            </tr>

                                                        )
                                                    )
                                                }

                                            </tbody>

                                        </table>

                                    </div>


                                    <div
                                        className="tabela-preco-formula-ajuda"
                                    >

                                        <strong>
                                            Fórmulas disponíveis
                                        </strong>

                                        <span>
                                            PRECO_BASE
                                        </span>

                                        <span>
                                            COR1_COMPLEXIDADE1
                                        </span>

                                        <span>
                                            COR2_COMPLEXIDADE3
                                        </span>

                                        <span>
                                            + &nbsp; − &nbsp; * &nbsp; /
                                        </span>

                                        <span>
                                            × &nbsp; ÷
                                        </span>

                                        <span>
                                            ( )
                                        </span>

                                    </div>

                                </section>


                                {/* =================================================
                                    RODAPÉ
                                ================================================= */}

                                <footer
                                    className="tabela-preco-modal-footer"
                                >

                                    <button
                                        type="button"
                                        className="botao-cancelar"
                                        onClick={() =>
                                            fecharModal({
                                                descartar: true
                                            })
                                        }
                                        disabled={
                                            salvando
                                        }
                                    >

                                        Cancelar

                                    </button>


                                    <button
                                        type="submit"
                                        className="botao-salvar"
                                        disabled={
                                            salvando
                                        }
                                    >

                                        <FiSave />

                                        {
                                            salvando
                                                ? "Salvando..."
                                                : "Salvar item"
                                        }

                                    </button>

                                </footer>

                            </form>

                        </div>

                    </div>

                )

            }


            {/* =================================================
                POPUP PERSONALIZADO
            ================================================= */}

            {
                popup && (

                    <div
                        className="tabela-preco-popup-overlay"
                        onMouseDown={event => {

                            if (
                                event.target ===
                                event.currentTarget &&
                                !popupProcessando &&
                                !popup.mostrarCancelar
                            ) {

                                fecharPopup();

                            }

                        }}
                    >

                        <div
                            className={
                                `tabela-preco-popup tabela-preco-popup-${popup.tipo}`
                            }
                            role="dialog"
                            aria-modal="true"
                        >

                            <div
                                className="tabela-preco-popup-icone"
                            >

                                {
                                    popup.tipo ===
                                    "sucesso" &&
                                    "✓"
                                }

                                {
                                    popup.tipo ===
                                    "erro" &&
                                    "!"
                                }

                                {
                                    popup.tipo ===
                                    "aviso" &&
                                    "!"
                                }

                                {
                                    popup.tipo ===
                                    "confirmacao" &&
                                    "?"
                                }

                                {
                                    popup.tipo ===
                                    "info" &&
                                    "i"
                                }

                            </div>


                            <div
                                className="tabela-preco-popup-conteudo"
                            >

                                <h3>
                                    {
                                        popup.titulo
                                    }
                                </h3>


                                <p>
                                    {
                                        popup.mensagem
                                    }
                                </p>

                            </div>


                            <div
                                className="tabela-preco-popup-acoes"
                            >

                                {
                                    popup.mostrarCancelar && (

                                        <button
                                            type="button"
                                            className="tabela-preco-popup-cancelar"
                                            onClick={
                                                fecharPopup
                                            }
                                            disabled={
                                                popupProcessando
                                            }
                                        >

                                            {
                                                popup.textoCancelar
                                            }

                                        </button>

                                    )
                                }


                                <button
                                    type="button"
                                    className={
                                        popup.mostrarCancelar
                                            ? "tabela-preco-popup-confirmar"
                                            : "tabela-preco-popup-ok"
                                    }
                                    onClick={
                                        popup.mostrarCancelar
                                            ? confirmarPopup
                                            : fecharPopup
                                    }
                                    disabled={
                                        popupProcessando
                                    }
                                >

                                    {
                                        popupProcessando
                                            ? "Processando..."
                                            : popup.textoConfirmar
                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </section>

    );

}