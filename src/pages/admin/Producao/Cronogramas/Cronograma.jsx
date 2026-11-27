
import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FiArrowLeft,
    FiPlus,
    FiTrash2,
    FiSave,
    FiPrinter,
    FiRefreshCw,
    FiCheck,
    FiMenu,
    FiEye,
    FiEyeOff
} from "react-icons/fi";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    supabase
} from "../../../../services/supabase";

import logoAlme
    from "../../../../imgs/logobranca.png";

import logoAmarela
    from "../../../../imgs/logoamarela.png";

import "./Cronograma.scss";

/*
=====================================================
LINHAS INICIAIS
=====================================================
*/

const LINHAS_INICIAIS = [
    {
        item: "REUNIÃO DE ONBOARDING",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "singular"
    },
    {
        item: "MEDIÇÃO - PISO/FORRO",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "azul"
    },
    {
        item: "APROVAÇÃO DO PROJETO PELA ARQUITETA",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "singular"
    },
    {
        item: "APROVAÇÃO DO PROJETO PELO CLIENTE FINAL",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "amarela"
    },
    {
        item: "COMPRA DE MATERIAL",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "azul"
    },
    {
        item: "RECEBIMENTO DO MATERIAL",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "azul"
    },
    {
        item: "INÍCIO DE PRODUÇÃO",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "azul"
    },
    {
        item: "FIM DA PRODUÇÃO",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "azul"
    },
    {
        item: "CONFERÊNCIA PRÉ-FRETE",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "amarela"
    },
    {
        item: "FRETE",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "azul"
    },
    {
        item: "INÍCIO DE INSTALAÇÃO",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "azul"
    },
    {
        item: "FINALIZAÇÃO DA INSTALAÇÃO",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "azul"
    },
    {
        item: "MEDIÇÃO - BANCADAS ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    },
    {
        item: "COMPRA DE MATERIAL ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    },
    {
        item: "RECEBIMENTO DO MATERIAL ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    },
    {
        item: "INÍCIO DE PRODUÇÃO ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    },
    {
        item: "FIM DA PRODUÇÃO ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    },
    {
        item: "CONFERÊNCIA PRÉ-FRETE ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    },
    {
        item: "FRETE ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    },
    {
        item: "INÍCIO DE INSTALAÇÃO ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    },
    {
        item: "FINALIZAÇÃO DA INSTALAÇÃO ETAPA 2",
        data_prevista: "",
        data_realizada: "",
        observacoes: "",
        tipo: "laranja"
    }
];

/*
=====================================================
TIPOS DE LINHA
=====================================================
*/

const STATUS_AGUARDANDO_CLIENTE = "AGUARDANDO LIBERAÇÃO DO CLIENTE";

const TIPOS_LINHA = [
    {
        valor: "singular",
        nome: "Singular"
    },
    {
        valor: "azul",
        nome: "Primeira etapa"
    },
    {
        valor: "amarela",
        nome: "Validação do cliente"
    },
    {
        valor: "laranja",
        nome: "Segunda etapa"
    },
    {
        valor: "verde",
        nome: "Terceira etapa"
    },
    {
        valor: "roxo",
        nome: "Aditivo"
    }
];

/*
=====================================================
HELPERS
=====================================================
*/

function gerarIdLinha() {
    try {
        return crypto.randomUUID();
    } catch {
        return `${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;
    }
}

function criarLinhasIniciais() {
    return LINHAS_INICIAIS.map(
        linha => ({
            ...linha,
            id: gerarIdLinha()
        })
    );
}

function normalizarTipoLinha(tipo) {
    /*
     * Compatibilidade com cronogramas antigos:
     * "normal" passa a ser "singular".
     */
    if (tipo === "normal") {
        return "singular";
    }

    return TIPOS_LINHA.some(
        item =>
            item.valor === tipo
    )
        ? tipo
        : "singular";
}

function normalizarLinhas(lista) {
    if (
        !Array.isArray(lista)
    ) {
        return [];
    }

    return lista.map(
        linha => ({
            id:
                linha?.id ||
                gerarIdLinha(),

            item:
                String(
                    linha?.item ?? ""
                ),

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

            tipo:
                normalizarTipoLinha(
                    linha?.tipo
                ),

            // Recupera a configuração salva no banco.
            ocultar_pdf:
                linha?.ocultar_pdf === true
        })
    );
}
/*
=====================================================
ORDENAR LINHAS POR DATA DE FINALIZAÇÃO
=====================================================
*/

function ordenarLinhasPorData(lista) {
    return [...lista]
        .map((linha, indiceOriginal) => {
            const valor = String(linha?.data_realizada || "");
            const dataValida =
                /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
                !Number.isNaN(
                    new Date(`${valor}T00:00:00`).getTime()
                );

            return {
                linha,
                indiceOriginal,
                timestamp: dataValida
                    ? new Date(`${valor}T00:00:00`).getTime()
                    : Number.POSITIVE_INFINITY
            };
        })
        .sort((a, b) =>
            a.timestamp - b.timestamp ||
            a.indiceOriginal - b.indiceOriginal
        )
        .map(item => item.linha);
}

/*
=====================================================
FORMATAÇÃO DE DATAS
=====================================================
*/

function formatarData(valor) {
    if (!valor) {
        return "-";
    }

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            String(valor)
        )
    ) {
        const [
            ano,
            mes,
            dia
        ] =
            String(
                valor
            ).split("-");

        return `${dia}/${mes}/${ano}`;
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "-";
    }

    return data.toLocaleDateString(
        "pt-BR"
    );
}

function formatarDataHora(valor) {
    if (!valor) {
        return "-";
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "-";
    }

    return data.toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}

/*
=====================================================
NOME DO TIPO
=====================================================
*/

function obterNomeTipo(tipo) {
    const tipoNormalizado =
        tipo === "normal"
            ? "singular"
            : tipo;

    return (
        TIPOS_LINHA.find(
            item =>
                item.valor ===
                tipoNormalizado
        )?.nome ||
        "Singular"
    );
}

/*
=====================================================
ESCAPAR HTML PARA IMPRESSÃO
=====================================================
*/

function escaparHtml(valor) {
    return String(
        valor ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

/*
=====================================================
COMPONENTE
=====================================================
*/

export default function Cronograma() {
    const navigate =
        useNavigate();

    const {
        cronogramaId,
        versaoId
    } = useParams();

    /*
    =================================================
    ESTADOS
    =================================================
    */

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        salvando,
        setSalvando
    ] = useState(false);

    const [
        erro,
        setErro
    ] = useState("");

    const [
        sucesso,
        setSucesso
    ] = useState("");

    const [
        projeto,
        setProjeto
    ] = useState(null);

    const [
        versao,
        setVersao
    ] = useState(null);

    const [
        linhas,
        setLinhas
    ] = useState([]);

    const [linhaArrastadaId, setLinhaArrastadaId] = useState(null);

    // Controla as linhas ocultas no PDF e sincroniza com o banco.
const [linhasOcultasPdf, setLinhasOcultasPdf] = useState(() => new Set());

    const [
        sharepointId,
        setSharepointId
    ] = useState("");

    const [
        dataContrato,
        setDataContrato
    ] = useState("");

    const [
        carregadoDoServidor,
        setCarregadoDoServidor
    ] = useState(false);

    const [
        possuiAlteracoes,
        setPossuiAlteracoes
    ] = useState(false);

    /*
    =================================================
    STORAGE
    =================================================
    */

    const storageKey =
        useMemo(() => {
            if (
                !cronogramaId ||
                !versaoId
            ) {
                return null;
            }

            return (
                `alme_cronograma_${cronogramaId}_${versaoId}`
            );
        }, [
            cronogramaId,
            versaoId
        ]);

    /*
    =================================================
    ERRO EDGE FUNCTION
    =================================================
    */

    async function obterMensagemErroFunction(
        error,
        data
    ) {
        if (
            data?.error
        ) {
            return data.error;
        }

        if (
            data?.message
        ) {
            return data.message;
        }

        if (
            error?.context
        ) {
            try {
                const response =
                    error.context;

                if (
                    typeof response?.json ===
                    "function"
                ) {
                    const body =
                        await response.json();

                    if (
                        body?.error
                    ) {
                        return body.error;
                    }

                    if (
                        body?.message
                    ) {
                        return body.message;
                    }
                }
            } catch {
                // ignora
            }
        }

        return (
            error?.message ||
            "A Edge Function retornou um erro."
        );
    }

    /*
    =================================================
    CARREGAR
    =================================================
    */

    const carregarCronograma =
        useCallback(
            async () => {
                setLoading(
                    true
                );

                setErro("");
                setSucesso("");
                setCarregadoDoServidor(
                    false
                );

                try {
                    const cronogramaNumero =
                        Number(
                            cronogramaId
                        );

                    const versaoNumero =
                        Number(
                            versaoId
                        );

                    if (
                        !Number.isInteger(
                            cronogramaNumero
                        ) ||
                        cronogramaNumero <= 0 ||
                        !Number.isInteger(
                            versaoNumero
                        ) ||
                        versaoNumero <= 0
                    ) {
                        throw new Error(
                            "Identificação do cronograma inválida."
                        );
                    }

                    const {
                        data,
                        error
                    } =
                        await supabase
                            .functions
                            .invoke(
                                "admin-cronogramas",
                                {
                                    body: {
                                        action:
                                            "get_version",

                                        cronograma_id:
                                            cronogramaNumero,

                                        versao_id:
                                            versaoNumero
                                    }
                                }
                            );

                    if (
                        error
                    ) {
                        throw new Error(
                            await obterMensagemErroFunction(
                                error,
                                data
                            )
                        );
                    }

                    if (
                        data?.error
                    ) {
                        throw new Error(
                            data.error
                        );
                    }

                    /*
                    =========================================
                    PROJETO
                    =========================================
                    */

                    const projetoServidor =
                        data?.obra ||
                        data?.cronograma?.obra ||
                        null;

                    setProjeto(
                        projetoServidor
                    );

                    /*
                    =========================================
                    VERSÃO
                    =========================================
                    */

                    const versaoServidor =
                        data?.versao ||
                        null;

                    if (
                        !versaoServidor
                    ) {
                        throw new Error(
                            "A versão do cronograma não foi encontrada."
                        );
                    }

                    setVersao(
                        versaoServidor
                    );

                    /*
                    =========================================
                    SERVIDOR
                    =========================================
                    */

                    const sharepointServidor =
                        String(
                            versaoServidor?.sharepoint_id ??
                            ""
                        );

                    const dataContratoServidor =
                        versaoServidor
                            ?.data_finalizacao_contrato ||
                        "";

                    const linhasServidor =
                        Array.isArray(
                            versaoServidor?.linhas
                        )
                            ? normalizarLinhas(
                                versaoServidor.linhas
                            )
                            : [];

                    /*
                    =========================================
                    RASCUNHO
                    =========================================
                    */

                    let rascunhoLocal =
                        null;

                    if (
                        storageKey
                    ) {
                        try {
                            const salvo =
                                localStorage.getItem(
                                    storageKey
                                );

                            if (
                                salvo
                            ) {
                                const parsed =
                                    JSON.parse(
                                        salvo
                                    );

                                if (
                                    parsed &&
                                    typeof parsed ===
                                    "object"
                                ) {
                                    rascunhoLocal =
                                        parsed;
                                }
                            }
                        } catch (
                            storageError
                        ) {
                            console.error(
                                "Erro ao ler rascunho:",
                                storageError
                            );
                        }
                    }

/*
=========================================
APLICAR
=========================================
*/

// RASCUNHO LOCAL COM ALTERAÇÕES PENDENTES
if (
    rascunhoLocal &&
    rascunhoLocal.possuiAlteracoes === true &&
    Array.isArray(
        rascunhoLocal.linhas
    )
) {
    setSharepointId(
        String(
            rascunhoLocal.sharepointId ??
            sharepointServidor
        )
    );

    setDataContrato(
        rascunhoLocal.dataContrato ??
        dataContratoServidor
    );

    const linhasRascunho =
        normalizarLinhas(
            rascunhoLocal.linhas
        );

    setLinhas(
        linhasRascunho
    );

    // Recupera as configurações de visibilidade do rascunho.
    const ocultasRascunho =
        Array.isArray(
            rascunhoLocal.linhasOcultasPdf
        )
            ? rascunhoLocal.linhasOcultasPdf.map(
                id => String(id)
            )
            : linhasRascunho
                .filter(linha => linha.ocultar_pdf)
                .map(linha => String(linha.id));

    setLinhasOcultasPdf(
        new Set(ocultasRascunho)
    );

    setPossuiAlteracoes(
        true
    );

} else {

    // DADOS DEFINITIVOS DO SUPABASE
    setSharepointId(
        sharepointServidor
    );

    setDataContrato(
        dataContratoServidor
    );

    const linhasParaAplicar =
        linhasServidor.length > 0
            ? linhasServidor
            : criarLinhasIniciais();

    setLinhas(
        linhasParaAplicar
    );

    // Recupera as linhas ocultas diretamente do banco.
    setLinhasOcultasPdf(
        new Set(
            linhasParaAplicar
                .filter(
                    linha => linha.ocultar_pdf === true
                )
                .map(
                    linha => String(linha.id)
                )
        )
    );

    setPossuiAlteracoes(
        false
    );
}

                    setCarregadoDoServidor(
                        true
                    );
                } catch (
                    err
                ) {
                    console.error(
                        "Erro ao carregar cronograma:",
                        err
                    );

                    setErro(
                        err?.message ||
                        "Não foi possível carregar o cronograma."
                    );

                    /*
                    =========================================
                    RECUPERAR RASCUNHO EM CASO DE ERRO
                    =========================================
                    */

                    if (
                        storageKey
                    ) {
                        try {
                            const salvo =
                                localStorage.getItem(
                                    storageKey
                                );

                            if (
                                salvo
                            ) {
                                const parsed =
                                    JSON.parse(
                                        salvo
                                    );

                                if (
                                    parsed
                                ) {
                                    setSharepointId(
                                        parsed.sharepointId ||
                                        ""
                                    );

                                    setDataContrato(
                                        parsed.dataContrato ||
                                        ""
                                    );

                                    const linhasRascunho =
    normalizarLinhas(
        parsed.linhas
    );

setLinhas(
    linhasRascunho
);

setLinhasOcultasPdf(
    new Set(
        Array.isArray(parsed.linhasOcultasPdf)
            ? parsed.linhasOcultasPdf.map(
                id => String(id)
            )
            : linhasRascunho
                .filter(linha => linha.ocultar_pdf)
                .map(linha => String(linha.id))
    )
);

                                    setCarregadoDoServidor(
                                        true
                                    );

                                    setPossuiAlteracoes(
                                        true
                                    );
                                }
                            }
                        } catch (
                            storageError
                        ) {
                            console.error(
                                "Erro ao recuperar rascunho:",
                                storageError
                            );
                        }
                    }
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                cronogramaId,
                versaoId,
                storageKey
            ]
        );

    /*
    =================================================
    CARREGAMENTO
    =================================================
    */

    useEffect(() => {
        if (
            cronogramaId &&
            versaoId
        ) {
            carregarCronograma();
        }
    }, [
        cronogramaId,
        versaoId,
        carregarCronograma
    ]);

   useEffect(() => {
    if (
        !storageKey ||
        !carregadoDoServidor
    ) {
        return;
    }

    try {
        localStorage.setItem(
            storageKey,
            JSON.stringify({
                sharepointId,
                dataContrato,
                linhas,

                // Guarda também os IDs das linhas ocultas.
                linhasOcultasPdf:
                    Array.from(linhasOcultasPdf),

                possuiAlteracoes,

                salvoLocalmenteEm:
                    new Date().toISOString()
            })
        );
    } catch (
        error
    ) {
        console.error(
            "Erro ao salvar rascunho local:",
            error
        );
    }
}, [
    storageKey,
    carregadoDoServidor,
    sharepointId,
    dataContrato,
    linhas,
    linhasOcultasPdf,
    possuiAlteracoes
]);

    /*
    =================================================
    ALTERAR LINHA
    =================================================
    */

    function alterarLinha(
        id,
        campo,
        valor
    ) {
        setLinhas(
            prev =>
                prev.map(
                    linha =>
                        linha.id === id
                            ? {
                                ...linha,
                                [campo]:
                                    valor
                            }
                            : linha
                )
        );

        setPossuiAlteracoes(
            true
        );

        setSucesso("");
    }

    /*
    =================================================
    ALTERAR TIPO
    =================================================
    */

    function alterarTipoLinha(
        id,
        tipo
    ) {
        alterarLinha(
            id,
            "tipo",
            normalizarTipoLinha(
                tipo
            )
        );
    }

    function iniciarArrasteLinha(event, id) {
        setLinhaArrastadaId(id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(id));
    }

    function reordenarLinha(event, destinoId) {
        event.preventDefault();
        const origemId = linhaArrastadaId || event.dataTransfer.getData("text/plain");
        if (!origemId || origemId === destinoId) return;

        setLinhas(prev => {
            const origem = prev.findIndex(linha => String(linha.id) === String(origemId));
            const destino = prev.findIndex(linha => String(linha.id) === String(destinoId));
            if (origem < 0 || destino < 0) return prev;
            const atualizadas = [...prev];
            const [linha] = atualizadas.splice(origem, 1);
            atualizadas.splice(destino, 0, linha);
            return atualizadas;
        });
        setPossuiAlteracoes(true);
        setSucesso("");
        setLinhaArrastadaId(null);
    }

    /*
    =================================================
    ADICIONAR LINHA
    =================================================
    */

    function adicionarLinha() {
        setLinhas(
            prev => [
                ...prev,
                {
                    id:
                        gerarIdLinha(),

                    item:
                        "",

                    data_prevista:
                        "",

                    data_realizada:
                        "",

                    observacoes:
                        "",

                    tipo:
                        "singular"
                }
            ]
        );

        setPossuiAlteracoes(
            true
        );

        setSucesso("");
    }

    /*
    =================================================
    EXCLUIR LINHA
    =================================================
    */

    function excluirLinha(
        id
    ) {
        setLinhas(
            prev =>
                prev.filter(
                    linha =>
                        linha.id !== id
                )
        );

        setPossuiAlteracoes(
            true
        );

        setSucesso("");
    }

    /*
    =================================================
    VISIBILIDADE DA LINHA NO PDF
    =================================================
    */

    function alternarVisibilidadePdf(id) {
    const identificador = String(id);

    setLinhasOcultasPdf(prev => {
        const atualizadas = new Set(prev);

        if (atualizadas.has(identificador)) {
            atualizadas.delete(identificador);
        } else {
            atualizadas.add(identificador);
        }

        return atualizadas;
    });

    // Informa que existe uma alteração que precisa ser salva.
    setPossuiAlteracoes(true);

    setSucesso("");
}

    /*
    =================================================
    SHAREPOINT
    =================================================
    */

    function alterarSharepoint(
        valor
    ) {
        setSharepointId(
            valor
        );

        setPossuiAlteracoes(
            true
        );

        setSucesso("");
    }

    /*
    =================================================
    DATA CONTRATUAL
    =================================================
    */

    function alterarDataContrato(
        valor
    ) {
        setDataContrato(
            valor
        );

        setPossuiAlteracoes(
            true
        );

        setSucesso("");
    }

    /*
    =================================================
    VALIDAR
    =================================================
    */

    function validarFormulario() {
        const linhaVazia =
            linhas.some(
                linha =>
                    !String(
                        linha.item ??
                        ""
                    ).trim()
            );

        if (
            linhaVazia
        ) {
            return (
                "Todas as linhas precisam possuir uma descrição."
            );
        }

        return "";
    }

    /*
    =================================================
    SALVAR
    =================================================
    */

    async function salvarCronograma() {
        if (salvando) {
    return false;
}

        const erroValidacao =
            validarFormulario();

        if (
            erroValidacao
        ) {
            setErro(
                erroValidacao
            );

            setSucesso("");

            return false;
        }

        setSalvando(
            true
        );

        setErro("");
        setSucesso("");

        try {
            const payload = {
                action:
                    "save_version",

                cronograma_id:
                    Number(
                        cronogramaId
                    ),

                versao_id:
                    Number(
                        versaoId
                    ),

                sharepoint_id:
                    sharepointId
                        .trim() ||
                    null,

                data_finalizacao_contrato:
                    dataContrato ||
                    null,

                linhas:
    linhas.map(
        linha => ({
            // Mantém o mesmo ID da linha.
            id:
                linha.id,

            item:
                String(
                    linha.item ??
                    ""
                ).trim(),

            data_prevista:
                linha.data_prevista ||
                null,

            data_realizada:
                linha.data_realizada ||
                null,

            observacoes:
                String(
                    linha.observacoes ??
                    ""
                ).trim(),

            tipo:
                normalizarTipoLinha(
                    linha.tipo
                ),

            // Envia a configuração de visibilidade ao Supabase.
            ocultar_pdf:
                linhasOcultasPdf.has(
                    String(linha.id)
                )
        })
    )   
            };

            const {
                data,
                error
            } =
                await supabase
                    .functions
                    .invoke(
                        "admin-cronogramas",
                        {
                            body:
                                payload
                        }
                    );

            if (
                error
            ) {
                throw new Error(
                    await obterMensagemErroFunction(
                        error,
                        data
                    )
                );
            }

            if (
                data?.error
            ) {
                throw new Error(
                    data.error
                );
            }

            if (
                data?.versao
            ) {
                setVersao(
                    data.versao
                );
            }

            if (
                storageKey
            ) {
                localStorage.removeItem(
                    storageKey
                );
            }

            setPossuiAlteracoes(
                false
            );

            setSucesso(
                "Cronograma salvo com sucesso."
            );

            await carregarCronograma();
            return true;
        } catch (
            err
        ) {
            console.error(
                "Erro ao salvar:",
                err
            );

            setErro(
                err?.message ||
                "Não foi possível salvar o cronograma."
            );
            return false;
        } finally {
            setSalvando(
                false
            );
        }
    }

    /*
    =================================================
    CRIAR NOVA VERSÃO
    =================================================
    */

    async function criarNovaVersao() {
        if (
            salvando
        ) {
            return;
        }

        if (
            possuiAlteracoes
        ) {
            const confirmou =
                window.confirm(
                    "Existem alterações não salvas. Deseja criar a nova versão sem salvar essas alterações?"
                );

            if (
                !confirmou
            ) {
                return;
            }
        }

        setSalvando(
            true
        );

        setErro("");
        setSucesso("");

        try {
            const {
                data,
                error
            } =
                await supabase
                    .functions
                    .invoke(
                        "admin-cronogramas",
                        {
                            body: {
                                action:
                                    "create_version",

                                cronograma_id:
                                    Number(
                                        cronogramaId
                                    ),

                                origem_versao_id:
                                    Number(
                                        versaoId
                                    )
                            }
                        }
                    );

            if (
                error
            ) {
                throw new Error(
                    await obterMensagemErroFunction(
                        error,
                        data
                    )
                );
            }

            if (
                data?.error
            ) {
                throw new Error(
                    data.error
                );
            }

            if (
                !data?.versao?.id
            ) {
                throw new Error(
                    "A nova versão foi criada, mas o ID não foi retornado."
                );
            }

            if (
                storageKey
            ) {
                localStorage.removeItem(
                    storageKey
                );
            }

            navigate(
                `/admin/cronogramas/${cronogramaId}/${data.versao.id}`
            );
        } catch (
            err
        ) {
            console.error(
                "Erro ao criar versão:",
                err
            );

            setErro(
                err?.message ||
                "Não foi possível criar uma nova versão."
            );
        } finally {
            setSalvando(
                false
            );
        }
    }

    /*
    =================================================
    VOLTAR
    =================================================
    */

    function voltar() {
        navigate(
            "/admin/cronogramas"
        );
    }

    /*
    =================================================
    IMPRESSÃO PERSONALIZADA
    =================================================
    */

    async function imprimirCronograma() {
        const popup =
            window.open(
                "",
                "_blank",
                "width=1200,height=900,menubar=no,toolbar=no,location=no,status=no"
            );

        if (
            !popup
        ) {
            setErro(
                "O navegador bloqueou a janela de impressão. Permita pop-ups para imprimir o cronograma."
            );

            return;
        }

        /*
=====================================================
SALVAR ALTERAÇÕES ANTES DE GERAR O PDF
=====================================================
*/

if (possuiAlteracoes) {
    setErro("");
    setSucesso("Salvando alterações antes de gerar o PDF...");

    const salvou = await salvarCronograma();

    if (!salvou) {
        popup.close();
        return;
    }
}

        /*
        =============================================
        DADOS
        =============================================
        */

        const nomeProjeto =
            projeto?.nome ||
            "Projeto sem nome";

        const marceneiro =
            projeto?.marceneiro ||
            null;

        const nomeMarceneiro =
            marceneiro?.nome ||
            projeto?.marceneiro_nome ||
            projeto?.marceneiro_username ||
            "-";

        const numeroVersao =
            versao?.numero ??
            "-";

        const atualizadoEm =
            versao?.updated_at ||
            versao?.created_at ||
            null;

        /*
        =============================================
        FORMATAÇÃO
        =============================================
        */

        const formatarDataImpressao =
            valor => {
                if (
                    !valor
                ) {
                    return "-";
                }

                if (
                    /^\d{4}-\d{2}-\d{2}$/.test(
                        String(valor)
                    )
                ) {
                    const [
                        ano,
                        mes,
                        dia
                    ] =
                        String(
                            valor
                        ).split("-");

                    return `${dia}/${mes}/${ano}`;
                }

                const data =
                    new Date(
                        valor
                    );

                if (
                    Number.isNaN(
                        data.getTime()
                    )
                ) {
                    return "-";
                }

                return data.toLocaleDateString(
                    "pt-BR"
                );
            };

        const formatarDataHoraImpressao =
            valor => {
                if (
                    !valor
                ) {
                    return "-";
                }

                const data =
                    new Date(
                        valor
                    );

                if (
                    Number.isNaN(
                        data.getTime()
                    )
                ) {
                    return "-";
                }

                return data.toLocaleString(
                    "pt-BR",
                    {
                        dateStyle:
                            "short",
                        timeStyle:
                            "short"
                    }
                );
            };

        /*
        =============================================
        URL DA LOGO
        =============================================
        */

        const logoSrc =
            new URL(
                logoAmarela,
                window.location.href
            ).href;

        /*
        =============================================
        TABELA COMPLETA
        =============================================
        */

        const linhasVisiveisPdf =
            linhasOrdenadas.filter(
                linha =>
                    !linhasOcultasPdf.has(String(linha.id))
            );

        const linhasHtml =
            linhasVisiveisPdf.map(
                (
                    linha,
                    index
                ) => {
                    const tipo =
                        normalizarTipoLinha(
                            linha.tipo
                        );

                    const tipoNome =
                        obterNomeTipo(
                            tipo
                        );

                    return `
                        <tr class="row-${escaparHtml(String(linha.observacoes || "").trim().toLocaleUpperCase("pt-BR") === STATUS_AGUARDANDO_CLIENTE ? "amarela" : tipo)}">

                            <td class="item-cell">
                                <div class="item-cell-content">
                                    <div class="item-number">
                                        ${index + 1}
                                    </div>

                                    <div class="item-text">
                                        ${escaparHtml(
                                            linha.item ||
                                            "-"
                                        )}
                                    </div>
                                </div>
                            </td>

                           

                            <td class="date-cell">
                                ${escaparHtml(
                                    formatarDataImpressao(
                                        linha.data_realizada
                                    )
                                )}
                            </td>

                            <td class="observation-cell">
                                ${escaparHtml(
                                    linha.observacoes ||
                                    "-"
                                )}
                            </td>

                            <td class="color-cell">
                                <span class="color-badge">
                                    <span class="color-dot"></span>

                                    ${escaparHtml(
                                        tipoNome
                                    )}
                                </span>
                            </td>

                        </tr>
                    `;
                }
            ).join("");

        /*
        =============================================
        HTML
        =============================================
        */

        popup.document.open();

        popup.document.write(`
            <!DOCTYPE html>

            <html lang="pt-BR">

            <head>

                <meta charset="UTF-8" />

                <title>
                    ALME — Cronograma #${escaparHtml(
                        cronogramaId
                    )} — V${escaparHtml(
                        numeroVersao
                    )}
                </title>

                <style>

                    @page {
                        size: A4 portrait;
                        margin: 12mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                    }

                    body {
                        font-family:
                            Montserrat,
                            Arial,
                            Helvetica,
                            sans-serif;

                        color: #2e2116;

                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .document {
                        width: 100%;
                    }

                    /*
                    =================================
                    HEADER
                    =================================
                    */

                    .header {
                        display: grid;

                        grid-template-columns:
                            1.05fr
                            1fr
                            1.1fr;

                        align-items: center;

                        gap: 22px;

                        padding-bottom: 14px;

                        border-bottom:
                            1.5px solid #431c01;
                    }

                    .brand {
                        display: flex;

                        align-items: center;

                        gap: 12px;
                    }

                    .brand img {
                        width: 58px;
                        height: 58px;

                        object-fit: contain;
                    }

                    .brand-name {
                        font-size: 24px;
                        line-height: 1;

                        font-weight: 800;

                        letter-spacing:
                            0.08em;

                        color: #431c01;
                    }

                    .brand-subtitle {
                        margin-top: 5px;

                        font-size: 7px;

                        font-weight: 700;

                        letter-spacing:
                            0.32em;

                        color: #8c6a45;
                    }

                    .title {
                        text-align: center;
                    }

                    .title-label {
                        font-size: 9px;

                        font-weight: 800;

                        letter-spacing:
                            0.22em;

                        color: #8a6e50;
                    }

                    .title-main {
                        margin-top: 5px;

                        font-size: 18px;

                        font-weight: 800;

                        color: #431c01;
                    }

                    .header-fields {
                        display: grid;

                        grid-template-columns:
                            repeat(
                                2,
                                minmax(0, 1fr)
                            );

                        gap: 10px;
                    }

                    .header-fields > div {
                        min-width: 0;

                        display: flex;

                        flex-direction:
                            column;
                    }

                    .header-fields .field-label {
                        min-height:
                            3.3em;

                        display: flex;

                        align-items:
                            flex-end;

                        line-height:
                            1.1;
                    }

                    .field-label {
                        display: block;

                        margin-bottom: 4px;

                        font-size: 7px;

                        font-weight: 800;

                        letter-spacing:
                            0.08em;

                        color: #8c765e;

                        overflow-wrap:
                            anywhere;
                    }

                    .field-value {
                        min-height: 27px;

                        display: flex;

                        align-items: center;

                        padding: 5px 7px;

                        border:
                            1px solid #d9d0c6;

                        border-radius: 4px;

                        background:
                            #faf8f5;

                        font-size: 8px;

                        font-weight: 600;

                        color: #38291c;

                        word-break:
                            break-word;
                    }

                    /*
                    =================================
                    PROJECT INFO
                    =================================
                    */

                    .project-info {
                        display: grid;

                        grid-template-columns:
                            minmax(0, 1.55fr)
                            minmax(0, 1.45fr)
                            minmax(0, 0.55fr)
                            minmax(0, 0.95fr);

                        border:
                            1px solid #d8d0c6;

                        border-top: 0;

                        margin-bottom: 14px;
                    }

                    .project-card {
                        min-width: 0;

                        min-height: 58px;

                        padding: 8px 10px;

                        border-right:
                            1px solid #d8d0c6;

                        display: flex;

                        flex-direction:
                            column;

                        justify-content:
                            center;
                    }

                    .project-card:last-child {
                        border-right: 0;
                    }

                    .project-label {
                        margin-bottom: 5px;

                        font-size: 6.5px;

                        font-weight: 800;

                        letter-spacing:
                            0.1em;

                        color: #92775b;
                    }

                    .project-value {
                        font-size: 9px;

                        line-height: 1.25;

                        font-weight: 700;

                        color: #342519;

                        word-break:
                            break-word;

                        overflow-wrap:
                            anywhere;
                    }

                    /*
                    =================================
                    TABLE
                    =================================
                    */

                    .table {
                        width: 100%;

                        border-collapse:
                            collapse;

                        table-layout:
                            fixed;

                        border-spacing:
                            0;
                    }

                    .table th {
                        height: 35px;

                        padding: 5px 6px;

                        border:
                            1px solid #cfc5bb;

                        background:
                            #f0ece8;

                        text-align:
                            left;

                        vertical-align:
                            middle;

                        font-size: 6.5px;

                        line-height: 1.25;

                        font-weight: 800;

                        letter-spacing:
                            0.06em;

                        color: #5d4024;
                    }

                    .table td {
                        padding: 6px;

                        border:
                            1px solid #d7d0c8;

                        vertical-align:
                            middle;

                        font-size: 7.5px;

                        line-height: 1.35;

                        color: #33251a;

                        word-wrap:
                            break-word;

                        overflow-wrap:
                            anywhere;
                    }

                    .col-item {
                        width: 32%;
                    }

                    .col-date {
                        width: 14%;
                    }

                    .col-observation {
                        width: 40%;
                    }

                    .col-color {
                        width: 14%;
                    }

                    .item-cell {
                        vertical-align:
                            middle;
                    }

                    .item-cell-content {
                        display: flex;

                        align-items:
                            center;

                        gap: 7px;
                    }

                    .item-number {
                        width: 18px;
                        min-width: 18px;

                        height: 18px;

                        display: flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        border-radius:
                            3px;

                        background:
                            rgba(
                                67,
                                28,
                                1,
                                0.08
                            );

                        font-size: 6.5px;

                        font-weight: 800;

                        color: #654422;
                    }

                    .item-text {
                        flex: 1;

                        font-weight: 650;
                    }

                    .date-cell {
                        text-align:
                            center;
                    }

                    .observation-cell {
                        font-size: 7px;
                    }

                    /*
                    =================================
                    CORES
                    =================================
                    */

                    .row-singular {
                        background:
                            #ffffff;
                    }

                    .row-azul {
                        background:
                            #edf5fb;
                    }

                    .row-amarela {
                        background:
                            #fff8df;
                    }

                    .row-laranja {
                        background:
                            #fff0e2;
                    }

                    .color-cell {
                        text-align:
                            center;
                    }

                    .color-badge {
                        display:
                            inline-flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        gap: 5px;

                        max-width:
                            100%;

                        padding:
                            4px 6px;

                        border-radius:
                            4px;

                        font-size: 6.5px;

                        font-weight: 700;

                        line-height: 1.1;

                        border:
                            1px solid
                            rgba(
                                70,
                                45,
                                24,
                                0.14
                            );

                        color:
                            #59402a;
                    }

                    .row-singular .color-badge {
                        background:
                            #ffffff;
                    }

                    .row-azul .color-badge {
                        background:
                            #dcecf8;

                        color:
                            #3d627c;
                    }

                    .row-amarela .color-badge {
                        background:
                            #faedb7;

                        color:
                            #735d16;
                    }

                    .row-laranja .color-badge {
                        background:
                            #f9dfca;

                        color:
                            #8f5228;
                    }

                    .color-dot {
                        width: 7px;
                        height: 7px;

                        min-width: 7px;

                        border-radius:
                            50%;

                        background:
                            #ffffff;

                        border:
                            1px solid
                            rgba(
                                70,
                                45,
                                24,
                                0.2
                            );
                    }

                    .row-azul .color-dot {
                        background:
                            #7caed2;
                    }

                    .row-amarela .color-dot {
                        background:
                            #d8b92f;
                    }

                    .row-laranja .color-dot {
                        background:
                            #d98343;
                    }

                    /*
                    =================================
                    FINAL DATE
                    =================================
                    */

                    .final-date {
                        margin-top: 13px;

                        display: flex;

                        align-items:
                            center;

                        justify-content:
                            space-between;

                        gap: 15px;

                        padding: 9px 10px;

                        border:
                            1px solid #d8d0c6;

                        background:
                            #faf8f5;
                    }

                    .final-label {
                        font-size: 7px;

                        font-weight: 800;

                        letter-spacing:
                            0.07em;

                        color: #765a3b;
                    }

                    .final-value {
                        font-size: 10px;

                        font-weight: 800;

                        color: #431c01;
                    }

                    /*
                    =================================
                    FOOTER
                    =================================
                    */

                    .footer {
                        margin-top: 11px;

                        padding-top: 8px;

                        border-top:
                            1px solid #ded6ce;

                        display: flex;

                        align-items:
                            center;

                        justify-content:
                            space-between;

                        font-size: 6.5px;

                        font-weight: 700;

                        letter-spacing:
                            0.07em;

                        color: #987d60;
                    }

                    /*
                    =================================
                    QUEBRAS DE PÁGINA
                    =================================
                    */

                    thead {
                        display:
                            table-header-group;
                    }

                    tr {
                        break-inside:
                            avoid;

                        page-break-inside:
                            avoid;
                    }

                    .project-info,
                    .final-date {
                        break-inside:
                            avoid;

                        page-break-inside:
                            avoid;
                    }

                    /*
                    =================================
                    PRINT
                    =================================
                    */

                    @media print {

                        body {
                            margin: 0;
                        }

                        .document {
                            width: 100%;
                        }

                    }

                </style>

            </head>

            <body>

                <div class="document">

                    <header class="header">

                        <div class="brand">

                            <img
                                src="${escaparHtml(
                                    logoSrc
                                )}"
                                alt="ALME"
                            />

                            <div>

                                <div class="brand-name">
                                    ALME
                                </div>

                                <div class="brand-subtitle">
                                    MARCENARIA
                                </div>

                            </div>

                        </div>

                        <div class="title">

                            <div class="title-label">
                                CRONOGRAMA
                            </div>

                            <div class="title-main">
                                #${escaparHtml(
                                    cronogramaId
                                )} — V${escaparHtml(
                                    numeroVersao
                                )}
                            </div>

                        </div>

                        <div class="header-fields">

                            <div>

                                <span class="field-label">
                                    ID DO PROJETO
                                </span>

                                <div class="field-value">
                                    ${escaparHtml(
                                        sharepointId ||
                                        "-"
                                    )}
                                </div>

                            </div>

                            <div>

                                <span class="field-label">
                                   PREVISÃO DE FINALIZAÇÃO CONTRATUAL
                                </span>

                                <div class="field-value">
                                    ${escaparHtml(
                                        formatarDataImpressao(
                                            dataContrato
                                        )
                                    )}
                                </div>

                            </div>

                        </div>

                    </header>

                    <section class="project-info">

                        <div class="project-card">

                            <span class="project-label">
                                PROJETO
                            </span>

                            <span class="project-value">
                                ${escaparHtml(
                                    nomeProjeto
                                )}
                            </span>

                        </div>

                        <div class="project-card">

                            <span class="project-label">
                                MARCENEIRO RESPONSÁVEL
                            </span>

                            <span class="project-value">
                                ${escaparHtml(
                                    nomeMarceneiro
                                )}
                            </span>

                        </div>

                        <div class="project-card">

                            <span class="project-label">
                                VERSÃO
                            </span>

                            <span class="project-value">
                                V${escaparHtml(
                                    numeroVersao
                                )}
                            </span>

                        </div>

                        <div class="project-card">

                            <span class="project-label">
                                ATUALIZADO EM
                            </span>

                            <span class="project-value">
                                ${escaparHtml(
                                    formatarDataHoraImpressao(
                                        atualizadoEm
                                    )
                                )}
                            </span>

                        </div>

                    </section>

                    <table class="table">

                        <colgroup>

                            <col class="col-item" />

                          

                            <col class="col-date" />

                            <col class="col-observation" />

                            <col class="col-color" />

                        </colgroup>

                        <thead>

                            <tr>

                                <th>
                                    ITENS
                                </th>

                               

                                <th>
                                    DATA DE FINALIZAÇÃO
                                    <br />
                                   
                                </th>

                                <th>
                                    STATUS
                                </th>

                                <th>
                                   ETAPA
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${linhasHtml}

                        </tbody>

                    </table>

                    <section class="final-date">

                        <div class="final-label">
                            DATA FINAL PREVISTA DE ENTREGA DO PROJETO
                        </div>

                        <div class="final-value">
                            ${escaparHtml(
                                formatarDataImpressao(
                                    dataContrato
                                )
                            )}
                        </div>

                    </section>

                    <footer class="footer">

                        <span>
                            ALME MARCENARIA
                        </span>

                        <span>
                            CRONOGRAMA #${escaparHtml(
                                cronogramaId
                            )}
                        </span>

                        <span>
                            VERSÃO ${escaparHtml(
                                numeroVersao
                            )}
                        </span>

                    </footer>

                </div>

                <script>

                    window.addEventListener(
                        "load",
                        function () {

                            setTimeout(
                                function () {

                                    window.print();

                                },
                                250
                            );

                        }
                    );

                    window.addEventListener(
                        "afterprint",
                        function () {

                            setTimeout(
                                function () {

                                    window.close();

                                },
                                250
                            );

                        }
                    );

                </script>

            </body>

            </html>
        `);

        popup.document.close();

        popup.focus();
    }

    /*
    =================================================
    DADOS
    =================================================
    */

    const atualizadoEm =
        versao?.updated_at ||
        versao?.created_at ||
        null;

    const nomeProjeto =
        projeto?.nome ||
        "Projeto sem nome";

    const marceneiroResponsavel =
        projeto?.marceneiro ||
        null;

    const nomeMarceneiro =
        marceneiroResponsavel?.nome ||
        projeto?.marceneiro_nome ||
        projeto?.marceneiro_username ||
        "-";

    const usernameMarceneiro =
        marceneiroResponsavel?.username ||
        projeto?.marceneiro_username ||
        "";

    const numeroVersao =
        versao?.numero ??
        "-";

    // A ordem visual e a ordem do PDF seguem a data de finalização.
    // Linhas sem data ficam no final; datas iguais preservam a ordem manual.
    const linhasOrdenadas = useMemo(
        () => ordenarLinhasPorData(linhas),
        [linhas]
    );

    /*
    =================================================
    LOADING
    =================================================
    */

    if (
        loading
    ) {
        return (
            <section
                className="cronograma-page"
            >

                <div
                    className="cronograma-loading"
                >

                    <FiRefreshCw
                        className="rotating"
                    />

                    <span>
                        Carregando cronograma...
                    </span>

                </div>

            </section>
        );
    }

    /*
    =================================================
    RENDER
    =================================================
    */

    return (
        <section
            className="cronograma-page"
        >

            <style>
                {`
                    .cronograma-row.status-aguardando-cliente > td {
                        background-color: #fff2b3 !important;
                    }

                    .cronograma-row-actions {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }

                    .cronograma-row-visibility {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        padding: 0;
                        border: 1px solid #d8d0c6;
                        border-radius: 6px;
                        background: #fff;
                        color: #89490a;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .cronograma-row-visibility:hover {
                        background: #f5eee7;
                        border-color: #89490a;
                    }

                    .cronograma-row-visibility svg {
                        width: 16px;
                        height: 16px;
                    }

                    .cronograma-row-visibility.is-hidden {
                        background: #f5eee7;
                        color: #8a4b16;
                        border-color: #c99b70;
                    }

                    .cronograma-row-visibility:focus-visible {
                        outline: 2px solid #89490a;
                        outline-offset: 2px;
                    }
                `}
            </style>

            <div
                className="cronograma-topbar"
            >

                <button
                    type="button"
                    className="cronograma-back"
                    onClick={
                        voltar
                    }
                >

                    <FiArrowLeft />

                    <span>
                        Voltar
                    </span>

                </button>

                <div
                    className="cronograma-topbar-center"
                >

                    <div
                        className={
                            possuiAlteracoes
                                ? "cronograma-status draft"
                                : "cronograma-status saved"
                        }
                    >

                        <span
                            className="status-dot"
                        />

                        {
                            possuiAlteracoes
                                ? "Alterações não salvas"
                                : "Tudo salvo"
                        }

                    </div>

                </div>

                <div
                    className="cronograma-topbar-actions"
                >

                    <button
    type="button"
    className="cronograma-btn-secondary"
    onClick={imprimirCronograma}
    disabled={salvando}
>

                        <FiPlus />

                        <span>
                            Nova versão
                        </span>

                    </button>

                    <button
                        type="button"
                        className="cronograma-btn-secondary"
                        onClick={
                            imprimirCronograma
                        }
                    >

                        <FiPrinter />

                        <span>
                            PDF
                        </span>

                    </button>

                    <button
                        type="button"
                        className="cronograma-btn-primary"
                        onClick={
                            salvarCronograma
                        }
                        disabled={
                            salvando
                        }
                    >

                        {
                            salvando
                                ? (
                                    <FiRefreshCw
                                        className="rotating"
                                    />
                                )
                                : (
                                    <FiSave />
                                )
                        }

                        <span>
                            {
                                salvando
                                    ? "Salvando..."
                                    : "Salvar alterações"
                            }
                        </span>

                    </button>

                </div>

            </div>

            {
                erro && (
                    <div
                        className="cronograma-alert erro"
                    >
                        {erro}
                    </div>
                )
            }

            {
                sucesso && (
                    <div
                        className="cronograma-alert sucesso"
                    >

                        <FiCheck />

                        <span>
                            {sucesso}
                        </span>

                    </div>
                )
            }

            <main
                className="cronograma-document"
            >

                <header
                    className="cronograma-document-header"
                >

                    <div
                        className="cronograma-brand"
                    >

                        <img
                            src={
                                logoAlme
                            }
                            alt="ALME Marcenaria"
                        />

                        <div
                            className="cronograma-brand-text"
                        >

                            <h1>
                                ALME
                            </h1>

                            <span>
                                MARCENARIA
                            </span>

                        </div>

                    </div>

                    <div
                        className="cronograma-title"
                    >

                        <span>
                            CRONOGRAMA
                        </span>

                        <strong>
                            {
                                numeroVersao !==
                                    "-"
                                    ? `#${cronogramaId} — V${numeroVersao}`
                                    : `#${cronogramaId}`
                            }
                        </strong>

                    </div>

                    <div
                        className="cronograma-header-info"
                    >

                        <div
                            className="cronograma-input-group"
                        >

                            <label>
                                ID DO PROJETO
                            </label>

                            <input
                                type="text"
                                value={
                                    sharepointId
                                }
                                onChange={e =>
                                    alterarSharepoint(
                                        e.target.value
                                    )
                                }
                                placeholder="ID do projeto"
                            />

                        </div>

                        <div
                            className="cronograma-input-group"
                        >

                            <label>
                                PREVISÃO DE FINALIZAÇÃO CONTRATUAL
                            </label>

                            <input
                                type="date"
                                value={
                                    dataContrato
                                }
                                onChange={e =>
                                    alterarDataContrato(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                </header>

                <section
                    className="cronograma-project-info"
                >

                    <div
                        className="project-info-card project-main"
                    >

                        <span>
                            PROJETO
                        </span>

                        <strong>
                            {
                                nomeProjeto
                            }
                        </strong>

                    </div>

                    <div
                        className="project-info-card"
                    >

                        <span>
                            MARCENEIRO RESPONSÁVEL
                        </span>

                        <strong>
                            {
                                nomeMarceneiro
                            }
                        </strong>

                        {
                            usernameMarceneiro &&
                            usernameMarceneiro !==
                                nomeMarceneiro && (
                                <small>
                                    @{usernameMarceneiro}
                                </small>
                            )
                        }

                    </div>

                    <div
                        className="project-info-card compact"
                    >

                        <span>
                            VERSÃO
                        </span>

                        <strong>
                            {
                                numeroVersao !==
                                    "-"
                                    ? `V${numeroVersao}`
                                    : "-"
                            }
                        </strong>

                    </div>

                    <div
                        className="project-info-card"
                    >

                        <span>
                            ATUALIZADO EM
                        </span>

                        <strong>
                            {
                                formatarDataHora(
                                    atualizadoEm
                                )
                            }
                        </strong>

                    </div>

                </section>

                <section
                    className="cronograma-table-section"
                >

                    <div
                        className="cronograma-table-wrap"
                    >

                        <table
                            className="cronograma-table"
                        >

                            <thead>

                                <tr>

                                    <th className="col-item">
                                        ITENS
                                    </th>

                                   

                                    <th className="col-date">
                                        DATA DE FINALIZAÇÃO
                                        
                                    </th>

                                    <th className="col-obs">
                                        STATUS
                                    </th>

                                    <th className="col-color">
                                        LEGENDA
                                    </th>

                                    <th className="col-action">
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {
                                    linhasOrdenadas.length ===
                                        0
                                        ? (
                                            <tr>

                                                <td
                                                    colSpan="5"
                                                    className="cronograma-empty"
                                                >
                                                    Nenhuma linha cadastrada.
                                                </td>

                                            </tr>
                                        )
                                        : (
                                            linhasOrdenadas.map(
                                                (
                                                    linha,
                                                    index
                                                ) => (
                                                    <tr
                                                        key={
                                                            linha.id
                                                        }
                                                        className={
                                                            `cronograma-row tipo-${normalizarTipoLinha(
                                                                linha.tipo
                                                            )}${String(linha.observacoes || "").trim().toLocaleUpperCase("pt-BR") === STATUS_AGUARDANDO_CLIENTE ? " status-aguardando-cliente" : ""}${linhaArrastadaId === linha.id ? " is-dragging" : ""}`
                                                        }
                                                        onDragOver={event => event.preventDefault()}
                                                        onDrop={event => reordenarLinha(event, linha.id)}
                                                    >

                                                        <td
                                                            className="cronograma-item-cell"
                                                        >

                                                            <div
                                                                className="cronograma-item-number"
                                                            >
                                                                {
                                                                    index + 1
                                                                }
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className="cronograma-row-drag"
                                                                draggable="true"
                                                                onDragStart={event => iniciarArrasteLinha(event, linha.id)}
                                                                onDragEnd={() => setLinhaArrastadaId(null)}
                                                                title="Arraste para mudar a ordem da linha"
                                                                aria-label={`Arrastar linha ${index + 1} para mudar a ordem`}
                                                            >
                                                                <FiMenu />
                                                            </button>

                                                            <input
                                                                type="text"
                                                                value={
                                                                    linha.item
                                                                }
                                                                onChange={e =>
                                                                    alterarLinha(
                                                                        linha.id,
                                                                        "item",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="Descrição do item"
                                                            />

                                                        </td>

                                                      

                                                        <td>

                                                            <input
                                                                type="date"
                                                                value={
                                                                    linha.data_realizada
                                                                }
                                                                onChange={e =>
                                                                    alterarLinha(
                                                                        linha.id,
                                                                        "data_realizada",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />

                                                        </td>

                                                        <td>

                                                            <input
                                                                type="text"
                                                                value={
                                                                    linha.observacoes
                                                                }
                                                                onChange={e =>
                                                                    alterarLinha(
                                                                        linha.id,
                                                                        "observacoes",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="Status"
                                                                list="cronograma-status-sugestoes"
                                                            />
                                                            <datalist id="cronograma-status-sugestoes">
                                                                <option value={STATUS_AGUARDANDO_CLIENTE} />
                                                            </datalist>

                                                        </td>

                                                        <td className="cronograma-color-cell">

                                                            <div
                                                                className={
                                                                    `cronograma-color-control tipo-${normalizarTipoLinha(
                                                                        linha.tipo
                                                                    )}`
                                                                }
                                                            >

                                                                <span
                                                                    className="cronograma-color-dot"
                                                                />

                                                                <select
                                                                    className="cronograma-tipo-select"
                                                                    value={
                                                                        normalizarTipoLinha(
                                                                            linha.tipo
                                                                        )
                                                                    }
                                                                    onChange={e =>
                                                                        alterarTipoLinha(
                                                                            linha.id,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    title="Definir cor da linha"
                                                                >

                                                                    {
                                                                        TIPOS_LINHA.map(
                                                                            tipo => (
                                                                                <option
                                                                                    key={
                                                                                        tipo.valor
                                                                                    }
                                                                                    value={
                                                                                        tipo.valor
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        tipo.nome
                                                                                    }
                                                                                </option>
                                                                            )
                                                                        )
                                                                    }

                                                                </select>

                                                            </div>

                                                        </td>

                                                        <td>

                                                            <div className="cronograma-row-actions">

                                                            <button
                                                                type="button"
                                                                className={`cronograma-row-visibility ${
                                                                    linhasOcultasPdf.has(String(linha.id))
                                                                        ? "is-hidden"
                                                                        : ""
                                                                }`}
                                                                onClick={() =>
                                                                    alternarVisibilidadePdf(linha.id)
                                                                }
                                                                title={
                                                                    linhasOcultasPdf.has(String(linha.id))
                                                                        ? "Exibir esta linha no PDF"
                                                                        : "Ocultar esta linha no PDF"
                                                                }
                                                                aria-label={
                                                                    linhasOcultasPdf.has(String(linha.id))
                                                                        ? "Exibir linha no PDF"
                                                                        : "Ocultar linha no PDF"
                                                                }
                                                                aria-pressed={linhasOcultasPdf.has(String(linha.id))}
                                                            >
                                                                {
                                                                    linhasOcultasPdf.has(String(linha.id))
                                                                        ? <FiEyeOff />
                                                                        : <FiEye />
                                                                }
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="cronograma-row-delete"
                                                                onClick={() =>
                                                                    excluirLinha(
                                                                        linha.id
                                                                    )
                                                                }
                                                                title="Excluir linha"
                                                            >
                                                                <FiTrash2 />
                                                            </button>

                                                            </div>

                                                        </td>

                                                    </tr>
                                                )
                                            )
                                        )
                                }

                            </tbody>

                        </table>

                    </div>

                    <div
                        className="cronograma-legend"
                    >

                        <div>

                            <span
                                className="legend-color legend-singular"
                            />

                            <span>
                                Singular
                            </span>

                        </div>

                        <div>

                            <span
                                className="legend-color legend-blue"
                            />

                            <span>
                                Primeira etapa
                            </span>

                        </div>

                        <div>

                            <span
                                className="legend-color legend-yellow"
                            />

                            <span>
                                Validação do cliente
                            </span>

                        </div>

                        <div>

                            <span
                                className="legend-color legend-orange"
                            />

                            <span>
                                Segunda etapa
                            </span>

                        </div>

                        <div>

                            <span className="legend-color legend-green" />

                            <span>
                                Terceira etapa
                            </span>

                        </div>

                        <div>

                            <span className="legend-color legend-purple" />

                            <span>
                                Aditivo
                            </span>

                        </div>

                    </div>

                    <button
                        type="button"
                        className="cronograma-add-row"
                        onClick={
                            adicionarLinha
                        }
                    >

                        <FiPlus />

                        <span>
                            Adicionar linha
                        </span>

                    </button>

                </section>

                <section
                    className="cronograma-final-date"
                >

                    <div>
                        Data final prevista de entrega do projeto:
                    </div>

                    <strong>
                        {
                            dataContrato
                                ? formatarData(
                                    dataContrato
                                )
                                : "-"
                        }
                    </strong>

                </section>

                <footer
                    className="cronograma-document-footer"
                >

                    <span>
                        ALME MARCENARIA
                    </span>

                    <span>
                        Cronograma #{cronogramaId}
                    </span>

                    <span>
                        Versão{" "}
                        {
                            numeroVersao
                        }
                    </span>

                </footer>

            </main>

        </section>
    );
}

