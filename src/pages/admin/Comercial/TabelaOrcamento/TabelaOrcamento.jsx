import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    FiArrowLeft,
    FiPlus,
    FiSave,
    FiTrash2,
    FiX
} from "react-icons/fi";

import { supabase } from "../../../../services/supabase";

import "./TabelaOrcamento.scss";


/*
=====================================================
CONSTANTES
=====================================================
*/

const DRAFT_STORAGE_KEY =
    "alme_orcamento_novo_rascunho";

const MAX_COMPLEMENTOS = 5;

const VALOR_POR_LED = 50;

const VALOR_POR_METALON = 400;

const MAX_LED = 5;

const MAX_METALON = 30;


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

        status:
            "Rascunho",

        observacoes:
            ""

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

        },
        []
    );


    /*
    =================================================
    RECUPERAR RASCUNHO
    =================================================
    */

    useEffect(
        () => {

            try {

                const salvo =
                    localStorage.getItem(
                        DRAFT_STORAGE_KEY
                    );


                if (
                    salvo
                ) {

                    const dados =
                        JSON.parse(
                            salvo
                        );


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

                    } else if (
                        Array.isArray(
                            dados.itens
                        )
                    ) {

                        setAmbientes([

                            {

                                ...novoAmbiente(
                                    "Ambiente 1"
                                ),

                                itens:
                                    dados.itens

                            }

                        ]);

                    }

                }

            } catch (
                error
            ) {

                console.error(
                    "Erro ao recuperar rascunho:",
                    error
                );

            } finally {

                setRascunhoCarregado(
                    true
                );

            }

        },
        []
    );


    /*
    =================================================
    SALVAR RASCUNHO AUTOMATICAMENTE
    =================================================
    */

    useEffect(
        () => {

            if (
                !rascunhoCarregado
            ) {

                return;

            }


            try {

                localStorage.setItem(

                    DRAFT_STORAGE_KEY,

                    JSON.stringify({

                        orcamento,

                        ambientes

                    })

                );

            } catch (
                error
            ) {

                console.error(
                    "Erro ao salvar rascunho:",
                    error
                );

            }

        },
        [
            orcamento,
            ambientes,
            rascunhoCarregado
        ]
    );


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

                                    Valor m² principal
                                    +
                                    Valor m² dos complementos
                                    */

                                    const valorFinalM2 =
                                        valorM2 +
                                        valorM2Complementos;


                                    /*
=====================================================
DESCONTO / ADICIONAL
=====================================================

Positivo = adicional
Negativo = desconto
*/

const descontoAdicional =
    numberValue(
        item.desconto_adicional
    );


/*
=====================================================
VALOR COM DESCONTO / ADICIONAL
=====================================================

Valor final do m²
+
desconto ou adicional
*/

const valorComDescontoAdicional =
    valorFinalM2 +
    descontoAdicional;


/*
=====================================================
VALOR UNITÁRIO
=====================================================

M² total
×
Valor com desconto ou adicional
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

const valorMinimoPropostaAlme =
    valorUnitario +
    valorLed +
    valorMetalon;


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

    calculadoValorMinimoPropostaAlme:
        valorMinimoPropostaAlme,

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
                ambientes
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
    SALVAR
    =================================================
    */

    const salvarOrcamento =
        () => {

            console.log(
                "ORÇAMENTO:",
                {

                    orcamento,

                    ambientes:
                        ambientesCalculados

                }
            );

        };


    /*
    =================================================
    RENDER
    =================================================
    */

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


                <button
                    type="button"
                    className="orcamento-salvar"
                    onClick={
                        salvarOrcamento
                    }
                >

                    <FiSave />

                    <span>
                        Salvar orçamento
                    </span>

                </button>

            </div>


            {/* =================================================
                DADOS DO ORÇAMENTO
            ================================================= */}

            <section className="orcamento-dados-card">

                <div className="orcamento-dados-titulo">

                    <span>
                        COMERCIAL
                    </span>

                    <h1>
                        Novo orçamento
                    </h1>

                </div>


                <div className="orcamento-form-grid">


                    <div className="orcamento-field">

                        <label>
                            Nome do orçamento
                        </label>

                        <input
                            type="text"
                            placeholder="Ex.: Residência Campoi"
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

                            <option value="Rascunho">
                                Rascunho
                            </option>

                            <option value="Em análise">
                                Em análise
                            </option>

                            <option value="Aprovado">
                                Aprovado
                            </option>

                            <option value="Cancelado">
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
                                    TABELA
                                ================================================= */}

                                <div className="orcamento-tabela-wrapper">

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
                                                    Ação
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>


                                            {
                                                ambiente.itens.length ===
                                                0 && (

                                                    <tr className="orcamento-tabela-vazia">

                                                        <td colSpan="20">

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

                                                                    <td>

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

                                                                            <td colSpan="19">

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

    <td colSpan="20">

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
                    Valor mínimo da proposta ALME
                </span>

                <strong>
                    {
                        money(
                            item.calculadoValorMinimoPropostaAlme
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

            </section>

        </div>

    );

}