import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FiArrowLeft,
    FiCheck,
    FiEdit2,
    FiEye,
    FiEyeOff,
    FiRefreshCw,
    FiSave,
    FiSearch,
    FiX,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../services/supabase";
import "./ExtratosUni.scss";

const MANUAL_VAZIO = {
    custo_realizado: "",
    maximo_adto_marceneiro_12_5: "",
    adto_marceneiro: "",
};

const CAMPOS_MANUAIS = Object.keys(MANUAL_VAZIO);

const COLUNAS_REGISTRO = `
    id,
    obra_id,
    custo_realizado,
    maximo_adto_marceneiro_12_5,
    adto_marceneiro,
    updated_at,
    oculto
`;

function chaveObra(id) {
    return String(id ?? "");
}

function valorParaInput(valor) {
    return valor === null || valor === undefined
        ? ""
        : String(valor);
}

function numeroOuNulo(valor) {
    if (
        valor === "" ||
        valor === null ||
        valor === undefined
    ) {
        return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : null;
}

function formatarMoeda(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "—";
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "—";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function obterInformacaoFinanceira(
    obra,
    mapaFinanceiro
) {
    return (
        mapaFinanceiro[chaveObra(obra.id)] ||
        obra.informacaoFinanceira ||
        {}
    );
}

function normalizarRegistro(registro) {
    return {
        id: registro.id,
        obra_id: registro.obra_id,

        custo_realizado: valorParaInput(
            registro.custo_realizado
        ),

        maximo_adto_marceneiro_12_5: valorParaInput(
            registro.maximo_adto_marceneiro_12_5
        ),

        adto_marceneiro: valorParaInput(
            registro.adto_marceneiro
        ),

        updated_at: registro.updated_at,

        oculto: Boolean(registro.oculto),
    };
}

export default function ExtratosUni() {
    const navigate = useNavigate();

    const [obras, setObras] = useState([]);

    const [
        informacoesFinanceirasPorObra,
        setInformacoesFinanceirasPorObra
    ] = useState({});

    const [
        registrosSalvos,
        setRegistrosSalvos
    ] = useState({});

    const [
        rascunhos,
        setRascunhos
    ] = useState({});

    const [editandoId, setEditandoId] = useState(null);

    const [busca, setBusca] = useState("");

    const [abaAtiva, setAbaAtiva] = useState("ativas");

    const [carregando, setCarregando] = useState(true);

    const [atualizando, setAtualizando] = useState(false);

    const [salvandoId, setSalvandoId] = useState(null);

    const [
        alterandoOcultacaoId,
        setAlterandoOcultacaoId
    ] = useState(null);

    const [erro, setErro] = useState("");

    const [
        avisoFinanceiro,
        setAvisoFinanceiro
    ] = useState("");

    const [sucesso, setSucesso] = useState("");

    // =====================================================
    // CARREGAR OBRAS E REGISTROS
    // =====================================================

    const carregarDados = useCallback(
        async ({ silencioso = false } = {}) => {
            if (silencioso) {
                setAtualizando(true);
            } else {
                setCarregando(true);
            }

            setErro("");
            setAvisoFinanceiro("");
            setSucesso("");

            try {
                /*
                 * Esta função deve retornar as obras que não
                 * estão concluídas e que o usuário pode acessar.
                 */
                const {
                    data: obrasCarregadas,
                    error: erroObras
                } = await supabase.rpc(
                    "listar_obras_extratos_unificados"
                );

                if (erroObras) {
                    throw new Error(
                        `Não foi possível carregar as obras: ${erroObras.message}`
                    );
                }

                const listaObras = Array.isArray(obrasCarregadas)
                    ? obrasCarregadas
                    : [];

                setObras(listaObras);

                /*
                 * Carrega também o estado oculto de cada obra.
                 * O campo oculto precisa existir na tabela SQL.
                 */
                const {
                    data: registros,
                    error: erroRegistros
                } = await supabase
                    .from("extratos_unificados")
                    .select(COLUNAS_REGISTRO);

                if (erroRegistros) {
                    throw new Error(
                        `Não foi possível carregar os extratos: ${erroRegistros.message}`
                    );
                }

                const mapaRegistros = {};

                (registros || []).forEach((registro) => {
                    mapaRegistros[chaveObra(registro.obra_id)] =
                        normalizarRegistro(registro);
                });

                setRegistrosSalvos(mapaRegistros);

                setRascunhos((atuais) => ({
                    ...atuais,
                    ...mapaRegistros,
                }));

                /*
                 * Os valores de teto, meta e destinado à produção
                 * continuam vindo da função financeira existente.
                 */
                const {
                    data: dadosFinanceiros,
                    error: erroDadosFinanceiros
                } = await supabase.functions.invoke(
                    "admin-inforfi",
                    {
                        body: {
                            action: "list",
                        },
                    }
                );

                if (
                    erroDadosFinanceiros ||
                    dadosFinanceiros?.error
                ) {
                    const motivo =
                        dadosFinanceiros?.error ||
                        erroDadosFinanceiros?.message;

                    setInformacoesFinanceirasPorObra({});

                    setAvisoFinanceiro(
                        "As obras e os valores manuais foram carregados, " +
                        "mas não foi possível obter teto de custo, meta de custo " +
                        "e valor destinado à produção. " +
                        (
                            motivo ||
                            "Verifique a permissão da função admin-inforfi."
                        )
                    );
                } else {
                    const todasObrasFinanceiras = [
                        ...(
                            Array.isArray(
                                dadosFinanceiros?.obrasAtivas
                            )
                                ? dadosFinanceiros.obrasAtivas
                                : []
                        ),

                        ...(
                            Array.isArray(
                                dadosFinanceiros?.obrasConcluidas
                            )
                                ? dadosFinanceiros.obrasConcluidas
                                : []
                        ),
                    ];

                    const mapaFinanceiro = {};

                    todasObrasFinanceiras.forEach(
                        (obraFinanceira) => {
                            if (
                                obraFinanceira?.id != null &&
                                obraFinanceira?.informacaoFinanceira
                            ) {
                                mapaFinanceiro[
                                    chaveObra(obraFinanceira.id)
                                ] = obraFinanceira.informacaoFinanceira;
                            }
                        }
                    );

                    setInformacoesFinanceirasPorObra(
                        mapaFinanceiro
                    );
                }
            } catch (err) {
                console.error(
                    "Erro ao carregar Extratos unificados:",
                    err
                );

                setErro(
                    err?.message ||
                    "Não foi possível carregar os Extratos unificados."
                );
            } finally {
                setCarregando(false);
                setAtualizando(false);
            }
        },
        []
    );

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // =====================================================
    // FILTRAR OBRAS PELA ABA E PELA BUSCA
    // =====================================================

    const obrasFiltradas = useMemo(() => {
        const termo = busca
            .trim()
            .toLocaleLowerCase("pt-BR");

        /*
         * Aba "ativas": oculto deve ser falso.
         * Aba "ocultas": oculto deve ser verdadeiro.
         *
         * A comparação usa o ID da obra, não o nome.
         */
        const obrasDaAba = obras.filter((obra) => {
            const registro =
                registrosSalvos[chaveObra(obra.id)];

            const estaOculta = Boolean(
                registro?.oculto
            );

            return abaAtiva === "ocultas"
                ? estaOculta
                : !estaOculta;
        });

        if (!termo) {
            return obrasDaAba;
        }

        return obrasDaAba.filter((obra) => {
            const info = obterInformacaoFinanceira(
                obra,
                informacoesFinanceirasPorObra
            );

            const registro =
                registrosSalvos[chaveObra(obra.id)] ||
                MANUAL_VAZIO;

            return [
                obra.nome,
                obra.rdo_nome,
                obra.marceneiro_nome,

                info.teto_custo,
                info.meta_custo,
                info.valor_destinado_producao,

                registro.custo_realizado,
                registro.maximo_adto_marceneiro_12_5,
                registro.adto_marceneiro,
            ].some((campo) =>
                String(campo ?? "")
                    .toLocaleLowerCase("pt-BR")
                    .includes(termo)
            );
        });
    }, [
        obras,
        registrosSalvos,
        busca,
        abaAtiva,
        informacoesFinanceirasPorObra,
    ]);

    const quantidadeAtivas = useMemo(
        () =>
            obras.filter((obra) => {
                return !Boolean(
                    registrosSalvos[
                        chaveObra(obra.id)
                    ]?.oculto
                );
            }).length,
        [obras, registrosSalvos]
    );

    const quantidadeOcultas = useMemo(
        () =>
            obras.filter((obra) => {
                return Boolean(
                    registrosSalvos[
                        chaveObra(obra.id)
                    ]?.oculto
                );
            }).length,
        [obras, registrosSalvos]
    );

    // =====================================================
    // EDIÇÃO DOS VALORES MANUAIS
    // =====================================================

    function iniciarEdicao(obra) {
        const id = chaveObra(obra.id);

        const registro =
            registrosSalvos[id] || MANUAL_VAZIO;

        setRascunhos((atuais) => ({
            ...atuais,
            [id]: {
                ...MANUAL_VAZIO,
                ...registro,
            },
        }));

        setEditandoId(id);
        setErro("");
        setSucesso("");
    }

    function alterarCampoManual(
        obraId,
        campo,
        valor
    ) {
        const id = chaveObra(obraId);

        setRascunhos((atuais) => ({
            ...atuais,

            [id]: {
                ...MANUAL_VAZIO,

                ...(registrosSalvos[id] || {}),

                ...(atuais[id] || {}),

                [campo]: valor,
            },
        }));
    }

    function cancelarEdicao(obraId) {
        const id = chaveObra(obraId);

        setRascunhos((atuais) => ({
            ...atuais,

            [id]:
                registrosSalvos[id] ||
                { ...MANUAL_VAZIO },
        }));

        setEditandoId(null);
        setErro("");
        setSucesso("");
    }

    // =====================================================
    // SALVAR LINHA
    // =====================================================

    async function salvarLinha(obra) {
        const id = chaveObra(obra.id);

        const rascunho =
            rascunhos[id] || MANUAL_VAZIO;

        for (const campo of CAMPOS_MANUAIS) {
            const valor = rascunho[campo];

            if (
                valor !== "" &&
                (
                    !Number.isFinite(Number(valor)) ||
                    Number(valor) < 0
                )
            ) {
                setErro(
                    "Preencha os valores manuais com números válidos e não negativos."
                );
                return;
            }
        }

        setSalvandoId(id);
        setErro("");
        setSucesso("");

        try {
            const {
                data: authData
            } = await supabase.auth.getUser();

            const payload = {
                obra_id: Number(obra.id),

                custo_realizado: numeroOuNulo(
                    rascunho.custo_realizado
                ),

                maximo_adto_marceneiro_12_5:
                    numeroOuNulo(
                        rascunho.maximo_adto_marceneiro_12_5
                    ),

                adto_marceneiro: numeroOuNulo(
                    rascunho.adto_marceneiro
                ),

                updated_by: authData?.user?.id || null,

                // Preserva o estado da aba ao salvar os valores.
                oculto: Boolean(
                    registrosSalvos[id]?.oculto
                ),
            };

            const {
                data,
                error: erroSalvar
            } = await supabase
                .from("extratos_unificados")
                .upsert(
                    payload,
                    {
                        onConflict: "obra_id",
                    }
                )
                .select(COLUNAS_REGISTRO)
                .single();

            if (erroSalvar) {
                throw erroSalvar;
            }

            const salvo = normalizarRegistro(data);

            setRegistrosSalvos((atuais) => ({
                ...atuais,
                [id]: salvo,
            }));

            setRascunhos((atuais) => ({
                ...atuais,
                [id]: salvo,
            }));

            setEditandoId(null);

            setSucesso(
                `Valores de "${obra.nome}" salvos com sucesso.`
            );
        } catch (err) {
            console.error(
                "Erro ao salvar extrato da obra:",
                err
            );

            setErro(
                err?.message ||
                "Não foi possível salvar esta linha. Verifique o SQL e as permissões do Supabase."
            );
        } finally {
            setSalvandoId(null);
        }
    }

    // =====================================================
    // OCULTAR / RESTAURAR OBRA
    // =====================================================

    async function alterarOcultacao(
        obra,
        ocultar
    ) {
        const id = chaveObra(obra.id);

        setAlterandoOcultacaoId(id);
        setErro("");
        setSucesso("");

        try {
            const {
                data: authData
            } = await supabase.auth.getUser();

            const payload = {
                oculto: ocultar,
                updated_by: authData?.user?.id || null,
            };

            /*
             * Se já existe registro para a obra, atualizamos
             * somente a ocultação, preservando os valores manuais.
             */
            let resultado;

            if (registrosSalvos[id]?.id) {
                resultado = await supabase
                    .from("extratos_unificados")
                    .update(payload)
                    .eq("obra_id", Number(obra.id))
                    .select(COLUNAS_REGISTRO)
                    .single();
            } else {
                /*
                 * A obra pode ainda não ter valores manuais salvos.
                 * Nesse caso, criamos o registro de ocultação.
                 */
                resultado = await supabase
                    .from("extratos_unificados")
                    .insert({
                        obra_id: Number(obra.id),
                        ...payload,
                    })
                    .select(COLUNAS_REGISTRO)
                    .single();
            }

            if (resultado.error) {
                throw resultado.error;
            }

            const registroAtualizado =
                normalizarRegistro(resultado.data);

            setRegistrosSalvos((atuais) => ({
                ...atuais,
                [id]: registroAtualizado,
            }));

            setRascunhos((atuais) => ({
                ...atuais,
                [id]: {
                    ...(atuais[id] || MANUAL_VAZIO),
                    ...registroAtualizado,
                },
            }));

            // Se havia edição aberta nesta linha, encerra-a.
            if (editandoId === id) {
                setEditandoId(null);
            }

            setSucesso(
                ocultar
                    ? `A obra "${obra.nome}" foi movida para Ocultas.`
                    : `A obra "${obra.nome}" foi restaurada.`
            );
        } catch (err) {
            console.error(
                "Erro ao alterar ocultação da obra:",
                err
            );

            setErro(
                err?.message ||
                "Não foi possível alterar a visibilidade da obra. Verifique se a coluna oculto existe no Supabase."
            );
        } finally {
            setAlterandoOcultacaoId(null);
        }
    }

    // =====================================================
    // CÁLCULO DO POSSÍVEL ADIANTAMENTO
    // =====================================================

    function possivelAdto(obraId) {
        const id = chaveObra(obraId);

        const manual =
            rascunhos[id] ||
            registrosSalvos[id] ||
            MANUAL_VAZIO;

        const maximo = numeroOuNulo(
            manual.maximo_adto_marceneiro_12_5
        );

        const adiantado = numeroOuNulo(
            manual.adto_marceneiro
        );

        if (
            maximo === null ||
            adiantado === null
        ) {
            return null;
        }

        return maximo - adiantado;
    }

    // =====================================================
    // CAMPOS MANUAIS DA TABELA
    // =====================================================

    function renderCampoManual(
        obra,
        campo,
        label
    ) {
        const id = chaveObra(obra.id);

        const manual =
            rascunhos[id] ||
            registrosSalvos[id] ||
            MANUAL_VAZIO;

        const editavel = editandoId === id;

        return (
            <td key={campo}>
                {editavel ? (
                    <label className="extratos-uni-input-label">
                        <span className="extratos-uni-sr-only">
                            {label} — {obra.nome}
                        </span>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={manual[campo] ?? ""}
                            onChange={(event) =>
                                alterarCampoManual(
                                    obra.id,
                                    campo,
                                    event.target.value
                                )
                            }
                            placeholder="0,00"
                        />
                    </label>
                ) : (
                    <span className="extratos-uni-money">
                        {formatarMoeda(manual[campo])}
                    </span>
                )}
            </td>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="extratos-uni-page">
            <header className="extratos-uni-header">
                <div className="extratos-uni-header-title">
                    <span className="extratos-uni-eyebrow">
                        FINANCEIRO
                    </span>

                    <h1>Extratos unificados</h1>

                    <p>
                        Acompanhe os custos e os adiantamentos
                        das obras em andamento.
                    </p>
                </div>

                <div className="extratos-uni-header-actions">
                    <button
                        type="button"
                        className="extratos-uni-button extratos-uni-button-secondary"
                        onClick={() =>
                            navigate("/admin/financeiro")
                        }
                    >
                        <FiArrowLeft />
                        Voltar
                    </button>

                    <button
                        type="button"
                        className="extratos-uni-button extratos-uni-button-primary"
                        onClick={() =>
                            carregarDados({
                                silencioso: true,
                            })
                        }
                        disabled={atualizando || carregando}
                    >
                        <FiRefreshCw
                            className={
                                atualizando || carregando
                                    ? "is-spinning"
                                    : ""
                            }
                        />
                        Atualizar
                    </button>
                </div>
            </header>

            {erro && (
                <div
                    className="extratos-uni-alert extratos-uni-alert-error"
                    role="alert"
                >
                    {erro}
                </div>
            )}

            {avisoFinanceiro && (
                <div
                    className="extratos-uni-alert extratos-uni-alert-warning"
                    role="status"
                >
                    {avisoFinanceiro}
                </div>
            )}

            {sucesso && (
                <div
                    className="extratos-uni-alert extratos-uni-alert-success"
                    role="status"
                >
                    <FiCheck />
                    {sucesso}
                </div>
            )}

            <section className="extratos-uni-panel">
                <div className="extratos-uni-panel-header">
                    <div>
                        <span className="extratos-uni-section-eyebrow">
                            ACOMPANHAMENTO
                        </span>

                        <h2>
                            {abaAtiva === "ocultas"
                                ? "Obras ocultas"
                                : "Obras em andamento"}
                        </h2>

                        <p>
                            {abaAtiva === "ocultas"
                                ? "Obras retiradas da lista principal. Você pode restaurá-las a qualquer momento."
                                : "Edite os valores manuais, salve por obra e oculte as obras que não deseja visualizar nesta lista."}
                        </p>
                    </div>

                    <div className="extratos-uni-count">
                        <strong>
                            {obrasFiltradas.length}
                        </strong>

                        <span>
                            {obrasFiltradas.length === 1
                                ? "obra"
                                : "obras"}
                        </span>
                    </div>
                </div>

                {/* ABAS */}
                <div
                    className="extratos-uni-tabs"
                    role="tablist"
                    aria-label="Filtrar obras por visibilidade"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={abaAtiva === "ativas"}
                        className={`extratos-uni-tab ${
                            abaAtiva === "ativas"
                                ? "is-active"
                                : ""
                        }`}
                        onClick={() => {
                            setAbaAtiva("ativas");
                            setBusca("");
                            setErro("");
                            setSucesso("");
                        }}
                    >
                        <FiEye />
                        Obras em andamento
                        <span>{quantidadeAtivas}</span>
                    </button>

                    <button
                        type="button"
                        role="tab"
                        aria-selected={abaAtiva === "ocultas"}
                        className={`extratos-uni-tab ${
                            abaAtiva === "ocultas"
                                ? "is-active"
                                : ""
                        }`}
                        onClick={() => {
                            setAbaAtiva("ocultas");
                            setBusca("");
                            setErro("");
                            setSucesso("");
                        }}
                    >
                        <FiEyeOff />
                        Ocultas
                        <span>{quantidadeOcultas}</span>
                    </button>
                </div>

                <div className="extratos-uni-toolbar">
                    <div className="extratos-uni-search">
                        <FiSearch aria-hidden="true" />

                        <input
                            type="search"
                            value={busca}
                            onChange={(event) =>
                                setBusca(event.target.value)
                            }
                            placeholder={
                                abaAtiva === "ocultas"
                                    ? "Buscar entre obras ocultas..."
                                    : "Buscar por obra, RDO ou marceneiro..."
                            }
                            aria-label="Buscar obras"
                        />

                        {busca && (
                            <button
                                type="button"
                                onClick={() => setBusca("")}
                                aria-label="Limpar busca"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                </div>

                <div className="extratos-uni-table-wrap">
                    <table className="extratos-uni-table">
                        <thead>
                            <tr>
                                <th>Nome da obra</th>
                                <th>Valor destinado à produção</th>
                                <th>Meta de custo</th>
                                <th>Teto de custo</th>

                                <th>
                                    Custo realizado
                                    <span className="extratos-uni-th-tag">
                                        MANUAL
                                    </span>
                                </th>

                                <th>
                                    Máximo adto. marceneiro (12,5%)
                                    <span className="extratos-uni-th-tag">
                                        MANUAL
                                    </span>
                                </th>

                                <th>
                                    Adto. marceneiro
                                    <span className="extratos-uni-th-tag">
                                        MANUAL
                                    </span>
                                </th>

                                <th>Possível adto.</th>
                                <th>RDO responsável</th>
                                <th>Marceneiro</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {carregando ? (
                                <tr>
                                    <td
                                        className="extratos-uni-table-state"
                                        colSpan="11"
                                    >
                                        <FiRefreshCw className="is-spinning" />
                                        Carregando obras...
                                    </td>
                                </tr>
                            ) : obrasFiltradas.length === 0 ? (
                                <tr>
                                    <td
                                        className="extratos-uni-table-state"
                                        colSpan="11"
                                    >
                                        {abaAtiva === "ocultas"
                                            ? "Não há obras ocultas."
                                            : "Nenhuma obra em andamento encontrada."}
                                    </td>
                                </tr>
                            ) : (
                                obrasFiltradas.map((obra) => {
                                    const id = chaveObra(obra.id);

                                    const info =
                                        obterInformacaoFinanceira(
                                            obra,
                                            informacoesFinanceirasPorObra
                                        );

                                    const editando =
                                        editandoId === id;

                                    const possivel =
                                        possivelAdto(obra.id);

                                    const negativo =
                                        possivel !== null &&
                                        possivel < 0;

                                    const salvando =
                                        salvandoId === id;

                                    const alterandoOcultacao =
                                        alterandoOcultacaoId === id;

                                    return (
                                        <tr
                                            key={id}
                                            className={
                                                editando
                                                    ? "is-editing"
                                                    : ""
                                            }
                                        >
                                            <td>
                                                <div className="extratos-uni-obra-name">
                                                    <strong>
                                                        {obra.nome ||
                                                            "Obra sem nome"}
                                                    </strong>

                                                    <small>
                                                        #{obra.id}
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="extratos-uni-money">
                                                    {formatarMoeda(
                                                        info.valor_destinado_producao ??
                                                        obra.valor_destinado_producao
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="extratos-uni-money">
                                                    {formatarMoeda(
                                                        info.meta_custo ??
                                                        obra.meta_custo
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="extratos-uni-money">
                                                    {formatarMoeda(
                                                        info.teto_custo ??
                                                        obra.teto_custo
                                                    )}
                                                </span>
                                            </td>

                                            {renderCampoManual(
                                                obra,
                                                "custo_realizado",
                                                "Custo realizado"
                                            )}

                                            {renderCampoManual(
                                                obra,
                                                "maximo_adto_marceneiro_12_5",
                                                "Máximo adiantamento marceneiro 12,5%"
                                            )}

                                            {renderCampoManual(
                                                obra,
                                                "adto_marceneiro",
                                                "Adiantamento marceneiro"
                                            )}

                                            <td>
                                                <span
                                                    className={`extratos-uni-money extratos-uni-possible ${
                                                        negativo
                                                            ? "is-negative"
                                                            : ""
                                                    }`}
                                                >
                                                    {formatarMoeda(
                                                        possivel
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                {obra.rdo_nome || "—"}
                                            </td>

                                            <td>
                                                {obra.marceneiro_nome ||
                                                    "—"}
                                            </td>

                                            <td>
                                                <div className="extratos-uni-row-actions">
                                                    {editando ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="extratos-uni-icon-button extratos-uni-save"
                                                                onClick={() =>
                                                                    salvarLinha(
                                                                        obra
                                                                    )
                                                                }
                                                                disabled={
                                                                    salvando ||
                                                                    alterandoOcultacao
                                                                }
                                                                title="Salvar valores desta obra"
                                                                aria-label={`Salvar valores de ${obra.nome}`}
                                                            >
                                                                {salvando ? (
                                                                    <FiRefreshCw className="is-spinning" />
                                                                ) : (
                                                                    <FiSave />
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="extratos-uni-icon-button"
                                                                onClick={() =>
                                                                    cancelarEdicao(
                                                                        obra.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    salvando ||
                                                                    alterandoOcultacao
                                                                }
                                                                title="Cancelar edição"
                                                                aria-label={`Cancelar edição de ${obra.nome}`}
                                                            >
                                                                <FiX />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="extratos-uni-icon-button"
                                                                onClick={() =>
                                                                    iniciarEdicao(
                                                                        obra
                                                                    )
                                                                }
                                                                disabled={
                                                                    salvando ||
                                                                    alterandoOcultacao
                                                                }
                                                                title="Editar valores manuais"
                                                                aria-label={`Editar valores de ${obra.nome}`}
                                                            >
                                                                <FiEdit2 />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className={`extratos-uni-icon-button ${
                                                                    abaAtiva === "ocultas"
                                                                        ? "extratos-uni-restore"
                                                                        : "extratos-uni-hide"
                                                                }`}
                                                                onClick={() =>
                                                                    alterarOcultacao(
                                                                        obra,
                                                                        abaAtiva !== "ocultas"
                                                                    )
                                                                }
                                                                disabled={
                                                                    alterandoOcultacao ||
                                                                    salvando
                                                                }
                                                                title={
                                                                    abaAtiva === "ocultas"
                                                                        ? "Restaurar obra"
                                                                        : "Ocultar obra"
                                                                }
                                                                aria-label={
                                                                    abaAtiva === "ocultas"
                                                                        ? `Restaurar obra ${obra.nome}`
                                                                        : `Ocultar obra ${obra.nome}`
                                                                }
                                                            >
                                                                {alterandoOcultacao ? (
                                                                    <FiRefreshCw className="is-spinning" />
                                                                ) : abaAtiva === "ocultas" ? (
                                                                    <FiEye />
                                                                ) : (
                                                                    <FiEyeOff />
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="extratos-uni-panel-footer">
                    <span>
                        Os valores manuais são salvos por obra.
                        “Possível adto.” é calculado como máximo
                        de adiantamento menos adiantamento já realizado.
                        Ocultar não exclui os dados.
                    </span>

                    <span>
                        <FiCheck />
                        Salvamento individual por linha
                    </span>
                </footer>
            </section>
        </main>
    );
}