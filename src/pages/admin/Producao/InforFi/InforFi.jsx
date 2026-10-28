import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FiArrowLeft,
    FiCheck,
    FiEye,
    FiEyeOff,
    FiRefreshCw,
    FiSearch,
    FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../services/supabase";

// Reutiliza os estilos da tabela Extratos unificados.
import "../../Financeiro/ExtratosUni/ExtratosUni.scss";

const COLUNAS_REGISTRO =
    "id, obra_id, custo_realizado, maximo_adto_marceneiro_12_5, adto_marceneiro, oculto, updated_at";

function chaveObra(id) {
    return String(id ?? "");
}

function valorParaInput(valor) {
    return valor === null || valor === undefined ? "" : String(valor);
}

function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === "") {
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

function formatarDataHora(valor) {
    if (!valor) return "—";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return "—";
    }

    return data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

function obterInformacaoFinanceira(obra, mapaFinanceiro) {
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
        custo_realizado: valorParaInput(registro.custo_realizado),
        maximo_adto_marceneiro_12_5: valorParaInput(
            registro.maximo_adto_marceneiro_12_5
        ),
        adto_marceneiro: valorParaInput(registro.adto_marceneiro),
        oculto: Boolean(registro.oculto),
        updated_at: registro.updated_at,
    };
}

export default function InforFi() {
    const navigate = useNavigate();

    const [obras, setObras] = useState([]);
    const [registrosSalvos, setRegistrosSalvos] = useState({});
    const [
        informacoesFinanceirasPorObra,
        setInformacoesFinanceirasPorObra,
    ] = useState({});

    const [abaAtiva, setAbaAtiva] = useState("ativas");
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState("");
    const [avisoFinanceiro, setAvisoFinanceiro] = useState("");

    // =====================================================
    // CARREGAR A VERSÃO MAIS RECENTE SALVA
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

            try {
                // Busca todas as obras ainda não concluídas,
                // incluindo as que foram ocultadas manualmente.
                const {
                    data: obrasCarregadas,
                    error: erroObras,
                } = await supabase.rpc(
                    "listar_obras_extratos_unificados"
                );

                if (erroObras) {
                    throw new Error(
                        `Não foi possível carregar as obras: ${erroObras.message}`
                    );
                }

                setObras(
                    Array.isArray(obrasCarregadas)
                        ? obrasCarregadas
                        : []
                );

                // Consulta os valores que realmente estão salvos no banco.
                // Não carrega rascunhos ou valores digitados e não salvos.
                const {
                    data: registros,
                    error: erroRegistros,
                } = await supabase
                    .from("extratos_unificados")
                    .select(COLUNAS_REGISTRO);

                if (erroRegistros) {
                    throw new Error(
                        `Não foi possível consultar os últimos valores salvos: ${erroRegistros.message}`
                    );
                }

                const mapaRegistros = {};

                (registros || []).forEach((registro) => {
                    mapaRegistros[chaveObra(registro.obra_id)] =
                        normalizarRegistro(registro);
                });

                setRegistrosSalvos(mapaRegistros);

                // Busca os valores financeiros mantidos no fluxo
                // utilizado pelo formulário da tela Obras.
                const {
                    data: dadosFinanceiros,
                    error: erroDadosFinanceiros,
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
                        "As obras e os valores dos extratos foram carregados, " +
                        "mas não foi possível consultar teto de custo, meta de custo " +
                        "e valor destinado à produção. " +
                        (
                            motivo ||
                            "Verifique a permissão da função admin-inforfi para este perfil."
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
                                ] =
                                    obraFinanceira.informacaoFinanceira;
                            }
                        }
                    );

                    setInformacoesFinanceirasPorObra(
                        mapaFinanceiro
                    );
                }
            } catch (err) {
                console.error(
                    "Erro ao carregar Informações financeiras:",
                    err
                );

                setErro(
                    err?.message ||
                    "Não foi possível carregar a tabela de informações financeiras."
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
    // FILTRAR POR ABA E PELA BUSCA
    // =====================================================

    const obrasFiltradas = useMemo(() => {
        const termo = busca
            .trim()
            .toLocaleLowerCase("pt-BR");

        return obras.filter((obra) => {
            const id = chaveObra(obra.id);
            const registro = registrosSalvos[id];
            const estaOculta = Boolean(registro?.oculto);

            if (
                abaAtiva === "ocultas" &&
                !estaOculta
            ) {
                return false;
            }

            if (
                abaAtiva === "ativas" &&
                estaOculta
            ) {
                return false;
            }

            if (!termo) {
                return true;
            }

            const info = obterInformacaoFinanceira(
                obra,
                informacoesFinanceirasPorObra
            );

            return [
                obra.nome,
                obra.rdo_nome,
                obra.marceneiro_nome,
                info.teto_custo,
                info.meta_custo,
                info.valor_destinado_producao,
                registro?.custo_realizado,
                registro?.maximo_adto_marceneiro_12_5,
                registro?.adto_marceneiro,
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

    const quantidadeOcultas = useMemo(
        () =>
            obras.filter((obra) =>
                Boolean(
                    registrosSalvos[
                        chaveObra(obra.id)
                    ]?.oculto
                )
            ).length,
        [obras, registrosSalvos]
    );

    const quantidadeAtivas =
        obras.length - quantidadeOcultas;

    function trocarAba(novaAba) {
        setAbaAtiva(novaAba);
        setBusca("");
    }

    // =====================================================
    // POSSÍVEL ADIANTAMENTO
    // =====================================================

    function possivelAdto(obraId) {
        const registro =
            registrosSalvos[chaveObra(obraId)];

        const maximo =
            registro?.maximo_adto_marceneiro_12_5;

        const adiantado =
            registro?.adto_marceneiro;

        if (
            maximo === "" ||
            maximo === null ||
            maximo === undefined ||
            adiantado === "" ||
            adiantado === null ||
            adiantado === undefined
        ) {
            return null;
        }

        const diferenca =
            Number(maximo) - Number(adiantado);

        return Number.isFinite(diferenca)
            ? diferenca
            : null;
    }

    // =====================================================
    // VISUALIZAÇÃO
    // =====================================================

    return (
        <main className="extratos-uni-page">
            <header className="extratos-uni-header">
                <div className="extratos-uni-header-title">
                    <span className="extratos-uni-eyebrow">
                        PRODUÇÃO
                    </span>

                    <h1>Informações financeiras</h1>

                    <p>
                        Consulta somente leitura da versão mais recente
                        salva dos Extratos unificados.
                    </p>
                </div>

                <div className="extratos-uni-header-actions">
                    <button
                        type="button"
                        className="extratos-uni-button extratos-uni-button-secondary"
                        onClick={() =>
                            navigate("/admin/producao")
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

            <section className="extratos-uni-panel">
                <div className="extratos-uni-panel-header">
                    <div>
                        <span className="extratos-uni-section-eyebrow">
                            CONSULTA
                        </span>

                        <h2>
                            {abaAtiva === "ocultas"
                                ? "Obras ocultas"
                                : "Obras em andamento"}
                        </h2>

                        <p>
                            Os campos são somente para visualização.
                            Para alterar valores, utilize Extratos unificados
                            no Financeiro.
                        </p>
                    </div>

                    <div className="extratos-uni-count">
                        <strong>{obrasFiltradas.length}</strong>

                        <span>
                            {obrasFiltradas.length === 1
                                ? "obra"
                                : "obras"}
                        </span>
                    </div>
                </div>

                <div className="extratos-uni-toolbar">
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
                            onClick={() =>
                                trocarAba("ativas")
                            }
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
                            onClick={() =>
                                trocarAba("ocultas")
                            }
                        >
                            <FiEyeOff />
                            Ocultas
                            <span>{quantidadeOcultas}</span>
                        </button>
                    </div>

                    <div className="extratos-uni-search">
                        <FiSearch aria-hidden="true" />

                        <input
                            type="search"
                            value={busca}
                            onChange={(event) =>
                                setBusca(event.target.value)
                            }
                            placeholder="Buscar por obra, RDO ou marceneiro..."
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
                                <th>Custo realizado</th>
                                <th>Máximo adto. marceneiro (12,5%)</th>
                                <th>Adto. marceneiro</th>
                                <th>Possível adto.</th>
                                <th>RDO responsável</th>
                                <th>Marceneiro</th>
                                <th>Última atualização</th>
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
                                        Carregando os últimos valores salvos...
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
                                    const id =
                                        chaveObra(obra.id);

                                    const info =
                                        obterInformacaoFinanceira(
                                            obra,
                                            informacoesFinanceirasPorObra
                                        );

                                    const registro =
                                        registrosSalvos[id];

                                    const possivel =
                                        possivelAdto(obra.id);

                                    const negativo =
                                        possivel !== null &&
                                        possivel < 0;

                                    return (
                                        <tr key={id}>
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

                                            <td>
                                                <span className="extratos-uni-money">
                                                    {formatarMoeda(
                                                        registro?.custo_realizado
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="extratos-uni-money">
                                                    {formatarMoeda(
                                                        registro?.maximo_adto_marceneiro_12_5
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="extratos-uni-money">
                                                    {formatarMoeda(
                                                        registro?.adto_marceneiro
                                                    )}
                                                </span>
                                            </td>

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
                                                {obra.marceneiro_nome || "—"}
                                            </td>

                                            <td>
                                                {formatarDataHora(
                                                    registro?.updated_at
                                                )}
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
                        Esta página consulta diretamente os dados salvos
                        no Supabase. Não exibe rascunhos nem permite alterações.
                    </span>

                    <span>
                        <FiCheck />
                        Apenas visualização
                    </span>
                </footer>
            </section>
        </main>
    );
}