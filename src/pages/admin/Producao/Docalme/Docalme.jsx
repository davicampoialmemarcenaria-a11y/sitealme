import { useEffect, useMemo, useState } from "react";

import {
    FiArrowLeft,
    FiCheck,
    FiDownload,
    FiEdit2,
    FiEye,
    FiExternalLink,
    FiFileText,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
    FiUpload,
    FiX
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../../../services/supabase";

import "./Docalme.scss";

const BUCKET = "documentos-alme";

const FORM_INICIAL = {
    obra_id: "",
    nome: "",
    tipo: "",
    descricao: "",
    arquivo: null
};

const TIPOS_DOCUMENTO = [
    {
        value: "imagens",
        label: "Imagens"
    },
    {
        value: "sketchup",
        label: "SketchUp"
    },
    {
        value: "pdf",
        label: "PDF"
    },
    {
        value: "documentos",
        label: "Documentos"
    },
    {
        value: "planilhas",
        label: "Planilhas"
    },
    {
        value: "outros",
        label: "Outros"
    }
];

export default function Docalme() {

    const navigate = useNavigate();

    const [documentos, setDocumentos] =
        useState([]);

    const [obrasAtivas, setObrasAtivas] =
        useState([]);

    const [obrasConcluidas, setObrasConcluidas] =
        useState([]);

    const [usuarioAtual, setUsuarioAtual] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const [aba, setAba] =
        useState("ativas");

    const [busca, setBusca] =
        useState("");

    const [modalAberto, setModalAberto] =
        useState(false);

    const [modalSelecaoObra, setModalSelecaoObra] =
        useState(false);

    const [documentoSelecionado, setDocumentoSelecionado] =
        useState(null);

    const [obraSelecionada, setObraSelecionada] =
        useState(null);

    const [form, setForm] =
        useState(FORM_INICIAL);

    /*
     * Estado da pré-visualização
     */
    const [previewAberto, setPreviewAberto] =
        useState(false);

    const [previewDocumento, setPreviewDocumento] =
        useState(null);

    const [previewUrl, setPreviewUrl] =
        useState("");

    const [previewLoading, setPreviewLoading] =
        useState(false);


    /* =========================================================
       NORMALIZAÇÃO
    ========================================================= */

    const getObraId = (item) =>
        item?.obra_id ??
        item?.obraId ??
        item?.obra?.id ??
        "";

    const getObraNome = (item) =>
        item?.obra_nome ??
        item?.obra?.nome ??
        item?.obra?.nome_obra ??
        item?.nome_obra ??
        "Obra não informada";

    const getArquitetoEmpresa = (item) =>
        item?.arquiteto_empresa ??
        item?.obra?.arquiteto_empresa ??
        item?.arquitetoEmpresa ??
        item?.obra?.arquitetoEmpresa ??
        "Não informado";

    const getDocumentoNome = (item) =>
        item?.nome ??
        item?.nome_arquivo ??
        item?.arquivo_nome ??
        item?.titulo ??
        "Documento";

    const getDocumentoTipo = (item) =>
        item?.tipo ??
        item?.tipo_documento ??
        "outros";

    const getDocumentoDescricao = (item) =>
        item?.descricao ??
        item?.observacao ??
        "";

    const getDocumentoData = (item) =>
        item?.created_at ??
        item?.data ??
        item?.data_criacao ??
        null;


    /* =========================================================
       EXTRAIR ERRO DA EDGE FUNCTION
    ========================================================= */

    const extrairErroFunction = async (
        error
    ) => {

        if (
            error?.context &&
            typeof error.context.json ===
                "function"
        ) {

            try {

                const resposta =
                    await error.context.json();

                return (
                    resposta?.error ||
                    resposta?.message ||
                    error?.message ||
                    "Erro desconhecido na Edge Function."
                );

            } catch {

                if (
                    typeof error.context.text ===
                        "function"
                ) {

                    try {

                        const texto =
                            await error.context.text();

                        if (texto) {
                            return texto;
                        }

                    } catch {
                        // ignora
                    }

                }

                return (
                    error?.message ||
                    "Erro desconhecido na Edge Function."
                );

            }

        }

        return (
            error?.message ||
            "Erro desconhecido."
        );

    };


    /* =========================================================
       CARREGAR DADOS
    ========================================================= */

    const carregarDados = async () => {

        try {

            setLoading(true);
            setErro("");

            const {
                data,
                error
            } =
                await supabase.functions.invoke(
                    "admin-documentos-alme",
                    {
                        body: {
                            action: "list"
                        }
                    }
                );

            if (error) {

                const mensagem =
                    await extrairErroFunction(
                        error
                    );

                throw new Error(
                    mensagem
                );

            }

            if (data?.error) {

                throw new Error(
                    data.error
                );

            }

            setDocumentos(
                Array.isArray(
                    data?.documentos
                )
                    ? data.documentos
                    : []
            );

            setObrasAtivas(
                Array.isArray(
                    data?.obrasAtivas
                )
                    ? data.obrasAtivas
                    : []
            );

            setObrasConcluidas(
                Array.isArray(
                    data?.obrasConcluidas
                )
                    ? data.obrasConcluidas
                    : []
            );

            setUsuarioAtual(
                data?.usuarioAtual ??
                null
            );

        } catch (error) {

            console.error(
                "ERRO AO CARREGAR DOCUMENTOS:",
                error
            );

            setErro(
                error?.message ||
                    "Não foi possível carregar os documentos."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        carregarDados();

    }, []);


    /* =========================================================
       OBRAS DA ABA ATUAL
    ========================================================= */

    const obrasExibidas =
        useMemo(() => {

            return aba === "ativas"
                ? obrasAtivas
                : obrasConcluidas;

        }, [
            aba,
            obrasAtivas,
            obrasConcluidas
        ]);


    /* =========================================================
       IDS DAS OBRAS DA ABA
    ========================================================= */

    const idsObrasExibidas =
        useMemo(() => {

            return new Set(
                obrasExibidas.map(
                    (obra) =>
                        String(
                            obra.id
                        )
                )
            );

        }, [
            obrasExibidas
        ]);


    /* =========================================================
       DOCUMENTOS FILTRADOS
    ========================================================= */

    const documentosFiltrados =
        useMemo(() => {

            const termo =
                busca
                    .trim()
                    .toLowerCase();

            return documentos.filter(
                (documento) => {

                    const obraId =
                        String(
                            getObraId(
                                documento
                            )
                        );

                    if (
                        !idsObrasExibidas.has(
                            obraId
                        )
                    ) {

                        return false;

                    }

                    if (!termo) {
                        return true;
                    }

                    const texto = [
                        getObraNome(
                            documento
                        ),
                        getArquitetoEmpresa(
                            documento
                        ),
                        getDocumentoNome(
                            documento
                        ),
                        getDocumentoTipo(
                            documento
                        ),
                        getDocumentoDescricao(
                            documento
                        )
                    ]
                        .join(" ")
                        .toLowerCase();

                    return texto.includes(
                        termo
                    );

                }
            );

        }, [
            documentos,
            idsObrasExibidas,
            busca
        ]);


    /* =========================================================
       ESTATÍSTICAS
    ========================================================= */

    const quantidadeDocumentos =
        documentosFiltrados.length;

    const quantidadeObras =
        useMemo(() => {

            const termo =
                busca
                    .trim()
                    .toLowerCase();

            if (!termo) {

                return obrasExibidas.length;

            }

            return obrasExibidas.filter(
                (obra) => {

                    const texto = [
                        obra?.nome,
                        obra?.nome_obra,
                        obra?.arquiteto_empresa
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return texto.includes(
                        termo
                    );

                }
            ).length;

        }, [
            obrasExibidas,
            busca
        ]);


    const obrasComDocumentos =
        useMemo(() => {

            const ids =
                new Set();

            documentosFiltrados.forEach(
                (documento) => {

                    const obraId =
                        getObraId(
                            documento
                        );

                    if (obraId) {

                        ids.add(
                            String(
                                obraId
                            )
                        );

                    }

                }
            );

            return ids.size;

        }, [
            documentosFiltrados
        ]);


    /* =========================================================
       MODAIS
    ========================================================= */

    const abrirSelecaoObra = () => {

        setErro("");

        setModalSelecaoObra(
            true
        );

    };


    const selecionarObra = (
        obra
    ) => {

        setObraSelecionada(
            obra
        );

        setForm({
            ...FORM_INICIAL,
            obra_id:
                obra.id
        });

        setModalSelecaoObra(
            false
        );

        setModalAberto(
            true
        );

    };


    const fecharModal = () => {

        if (salvando) {
            return;
        }

        setModalAberto(
            false
        );

        setDocumentoSelecionado(
            null
        );

        setObraSelecionada(
            null
        );

        setForm({
            ...FORM_INICIAL
        });

    };


    /* =========================================================
       EDITAR
    ========================================================= */

    const editarDocumento = (
        documento
    ) => {

        const obraId =
            getObraId(
                documento
            );

        const obra =
            obrasAtivas.find(
                (item) =>
                    String(
                        item.id
                    ) ===
                    String(
                        obraId
                    )
            ) ||
            obrasConcluidas.find(
                (item) =>
                    String(
                        item.id
                    ) ===
                    String(
                        obraId
                    )
            );

        setDocumentoSelecionado(
            documento
        );

        setObraSelecionada(
            obra || {
                id:
                    obraId,

                nome:
                    documento?.obra_nome ||
                    "Obra não informada",

                arquiteto_empresa:
                    documento?.arquiteto_empresa ||
                    ""
            }
        );

        setForm({

            obra_id:
                obraId,

            nome:
                getDocumentoNome(
                    documento
                ),

            tipo:
                getDocumentoTipo(
                    documento
                ),

            descricao:
                getDocumentoDescricao(
                    documento
                ),

            arquivo:
                null

        });

        setModalAberto(
            true
        );

    };


    /* =========================================================
       ALTERAR FORM
    ========================================================= */

    const alterarCampo = (
        campo,
        valor
    ) => {

        setForm(
            (atual) => ({
                ...atual,
                [campo]:
                    valor
            })
        );

    };


    /* =========================================================
       EXTENSÃO
    ========================================================= */

    const obterExtensaoArquivo = (
        arquivo
    ) => {

        if (!arquivo?.name) {
            return "";
        }

        const partes =
            arquivo.name.split(
                "."
            );

        if (
            partes.length <= 1
        ) {

            return "";

        }

        return partes
            .pop()
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            );

    };


    /* =========================================================
       UPLOAD
    ========================================================= */

    const fazerUpload = async (
        arquivo,
        obraId,
        tipo
    ) => {

        if (!arquivo) {
            return null;
        }

        try {

            const extensao =
                obterExtensaoArquivo(
                    arquivo
                );

            if (!extensao) {

                throw new Error(
                    "Não foi possível identificar a extensão do arquivo."
                );

            }


            const {
                data,
                error
            } =
                await supabase.functions.invoke(
                    "admin-documentos-alme",
                    {
                        body: {

                            action:
                                "create_upload_url",

                            obra_id:
                                Number(
                                    obraId
                                ),

                            tipo,

                            extensao

                        }
                    }
                );


            if (error) {

                const mensagem =
                    await extrairErroFunction(
                        error
                    );

                throw new Error(
                    `Erro ao preparar upload: ${mensagem}`
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
                !data?.path ||
                !data?.token
            ) {

                throw new Error(
                    "A Edge Function não retornou path/token para o upload."
                );

            }


            const {
                error:
                    uploadError
            } =
                await supabase.storage
                    .from(
                        BUCKET
                    )
                    .uploadToSignedUrl(
                        data.path,
                        data.token,
                        arquivo
                    );


            if (
                uploadError
            ) {

                throw new Error(
                    `Erro ao enviar arquivo: ${uploadError.message}`
                );

            }


            return {

                path:
                    data.path,

                nomeArquivo:
                    arquivo.name,

                extensao,

                mimeType:
                    arquivo.type ||
                    null,

                tamanho:
                    arquivo.size

            };

        } catch (
            error
        ) {

            console.error(
                "ERRO COMPLETO NO UPLOAD:",
                error
            );

            throw error;

        }

    };


    /* =========================================================
       SALVAR
    ========================================================= */

    const salvarDocumento =
        async (e) => {

            e.preventDefault();

            try {

                setSalvando(
                    true
                );

                setErro("");


                if (
                    !form.obra_id
                ) {

                    throw new Error(
                        "Selecione uma obra."
                    );

                }


                if (
                    !form.nome.trim()
                ) {

                    throw new Error(
                        "Informe o nome do documento."
                    );

                }


                if (
                    !form.tipo
                ) {

                    throw new Error(
                        "Selecione o tipo do documento."
                    );

                }


                /* =================================================
                   NOVO DOCUMENTO
                ================================================= */

                if (
                    !documentoSelecionado
                ) {

                    if (
                        !form.arquivo
                    ) {

                        throw new Error(
                            "Selecione um arquivo para enviar."
                        );

                    }


                    const upload =
                        await fazerUpload(
                            form.arquivo,
                            form.obra_id,
                            form.tipo
                        );


                    if (!upload) {

                        throw new Error(
                            "O upload do arquivo não foi concluído."
                        );

                    }


                    const {
                        data,
                        error
                    } =
                        await supabase.functions.invoke(
                            "admin-documentos-alme",
                            {
                                body: {

                                    action:
                                        "create",

                                    obra_id:
                                        Number(
                                            form.obra_id
                                        ),

                                    nome:
                                        form.nome.trim(),

                                    nome_arquivo:
                                        upload.nomeArquivo,

                                    tipo:
                                        form.tipo,

                                    extensao:
                                        upload.extensao,

                                    mime_type:
                                        upload.mimeType,

                                    tamanho:
                                        upload.tamanho,

                                    storage_path:
                                        upload.path,

                                    descricao:
                                        form.descricao.trim()

                                }
                            }
                        );


                    if (
                        error
                    ) {

                        const mensagem =
                            await extrairErroFunction(
                                error
                            );

                        throw new Error(
                            `Erro ao salvar documento: ${mensagem}`
                        );

                    }


                    if (
                        data?.error
                    ) {

                        throw new Error(
                            data.error
                        );

                    }

                }


                /* =================================================
                   EDITAR
                ================================================= */

                else {

                    let upload =
                        null;


                    if (
                        form.arquivo
                    ) {

                        upload =
                            await fazerUpload(
                                form.arquivo,
                                documentoSelecionado.obra_id,
                                form.tipo
                            );

                    }


                    const body = {

                        action:
                            "update",

                        id:
                            Number(
                                documentoSelecionado.id
                            ),

                        nome:
                            form.nome.trim(),

                        tipo:
                            form.tipo,

                        descricao:
                            form.descricao.trim()

                    };


                    if (
                        upload
                    ) {

                        body.nome_arquivo =
                            upload.nomeArquivo;

                        body.extensao =
                            upload.extensao;

                        body.mime_type =
                            upload.mimeType;

                        body.tamanho =
                            upload.tamanho;

                        body.storage_path =
                            upload.path;

                    }


                    const {
                        data,
                        error
                    } =
                        await supabase.functions.invoke(
                            "admin-documentos-alme",
                            {
                                body
                            }
                        );


                    if (
                        error
                    ) {

                        const mensagem =
                            await extrairErroFunction(
                                error
                            );

                        throw new Error(
                            `Erro ao atualizar documento: ${mensagem}`
                        );

                    }


                    if (
                        data?.error
                    ) {

                        throw new Error(
                            data.error
                        );

                    }

                }


                await carregarDados();

                fecharModal();


            } catch (
                error
            ) {

                console.error(
                    "ERRO AO SALVAR DOCUMENTO:",
                    error
                );

                setErro(
                    error?.message ||
                        "Não foi possível salvar o documento."
                );

            } finally {

                setSalvando(
                    false
                );

            }

        };


    /* =========================================================
       EXCLUIR
    ========================================================= */

    const excluirDocumento =
        async (
            documento
        ) => {

            const nome =
                getDocumentoNome(
                    documento
                );

            const confirmar =
                window.confirm(
                    `Tem certeza que deseja excluir o documento "${nome}"?`
                );

            if (
                !confirmar
            ) {
                return;
            }


            try {

                setErro("");


                const {
                    data,
                    error
                } =
                    await supabase.functions.invoke(
                        "admin-documentos-alme",
                        {
                            body: {

                                action:
                                    "delete",

                                id:
                                    Number(
                                        documento.id
                                    )

                            }
                        }
                    );


                if (
                    error
                ) {

                    const mensagem =
                        await extrairErroFunction(
                            error
                        );

                    throw new Error(
                        mensagem
                    );

                }


                if (
                    data?.error
                ) {

                    throw new Error(
                        data.error
                    );

                }


                await carregarDados();


            } catch (
                error
            ) {

                console.error(
                    "Erro ao excluir documento:",
                    error
                );

                setErro(
                    error?.message ||
                        "Não foi possível excluir o documento."
                );

            }

        };


    /* =========================================================
       TIPO DE PREVIEW
    ========================================================= */

    const obterTipoPreview = (
        documento
    ) => {

        const mime =
            String(
                documento?.mime_type ??
                    documento?.mimeType ??
                    ""
            )
                .toLowerCase()
                .trim();

        const extensao =
            String(
                documento?.extensao ??
                    ""
            )
                .toLowerCase()
                .replace(
                    /^\./,
                    ""
                )
                .trim();

        const nomeArquivo =
            String(
                documento?.nome_arquivo ??
                    ""
            )
                .toLowerCase();


        if (
            mime ===
                "application/pdf" ||
            extensao === "pdf" ||
            nomeArquivo.endsWith(
                ".pdf"
            )
        ) {

            return "pdf";

        }


        if (
            mime.startsWith(
                "image/"
            ) ||
            [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "bmp",
                "svg"
            ].includes(
                extensao
            )
        ) {

            return "image";

        }


        if (
            mime.startsWith(
                "video/"
            ) ||
            [
                "mp4",
                "webm",
                "ogg"
            ].includes(
                extensao
            )
        ) {

            return "video";

        }


        if (
            mime.startsWith(
                "audio/"
            ) ||
            [
                "mp3",
                "wav",
                "ogg",
                "m4a"
            ].includes(
                extensao
            )
        ) {

            return "audio";

        }


        if (
            mime.startsWith(
                "text/"
            ) ||
            [
                "txt",
                "csv",
                "json",
                "xml"
            ].includes(
                extensao
            )
        ) {

            return "text";

        }


        return "unsupported";

    };


    /* =========================================================
       PRÉ-VISUALIZAR
    ========================================================= */

    const visualizarDocumento =
        async (
            documento
        ) => {

            try {

                setErro("");

                setPreviewDocumento(
                    documento
                );

                setPreviewUrl("");

                setPreviewAberto(
                    true
                );

                setPreviewLoading(
                    true
                );


                const {
                    data,
                    error
                } =
                    await supabase.functions.invoke(
                        "admin-documentos-alme",
                        {
                            body: {

                                action:
                                    "signed_url",

                                id:
                                    Number(
                                        documento.id
                                    ),

                                download:
                                    false

                            }
                        }
                    );


                if (
                    error
                ) {

                    const mensagem =
                        await extrairErroFunction(
                            error
                        );

                    throw new Error(
                        mensagem
                    );

                }


                if (
                    data?.error
                ) {

                    throw new Error(
                        data.error
                    );

                }


                const url =
                    data?.url;


                if (
                    !url
                ) {

                    throw new Error(
                        "Não foi possível gerar o link do documento."
                    );

                }


                setPreviewUrl(
                    url
                );


            } catch (
                error
            ) {

                console.error(
                    "ERRO AO PRÉ-VISUALIZAR DOCUMENTO:",
                    error
                );

                setPreviewAberto(
                    false
                );

                setPreviewDocumento(
                    null
                );

                setPreviewUrl(
                    ""
                );

                setErro(
                    error?.message ||
                        "Não foi possível visualizar o documento."
                );

            } finally {

                setPreviewLoading(
                    false
                );

            }

        };


    /* =========================================================
       FECHAR PREVIEW
    ========================================================= */

    const fecharPreview = () => {

        setPreviewAberto(
            false
        );

        setPreviewDocumento(
            null
        );

        setPreviewUrl("");

        setPreviewLoading(
            false
        );

    };


    /* =========================================================
       ABRIR ARQUIVO EXTERNAMENTE
    ========================================================= */

    const abrirArquivoEmNovaAba =
        () => {

            if (
                !previewUrl
            ) {

                return;

            }


            window.open(
                previewUrl,
                "_blank",
                "noopener,noreferrer"
            );

        };


    /* =========================================================
       DOWNLOAD
    ========================================================= */

    const baixarDocumento =
        async (
            documento
        ) => {

            try {

                setErro("");


                const {
                    data,
                    error
                } =
                    await supabase.functions.invoke(
                        "admin-documentos-alme",
                        {
                            body: {

                                action:
                                    "signed_url",

                                id:
                                    Number(
                                        documento.id
                                    ),

                                download:
                                    true

                            }
                        }
                    );


                if (
                    error
                ) {

                    const mensagem =
                        await extrairErroFunction(
                            error
                        );

                    throw new Error(
                        mensagem
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
                    !data?.url
                ) {

                    throw new Error(
                        "Não foi possível gerar o link para download."
                    );

                }


                window.open(
                    data.url,
                    "_blank",
                    "noopener,noreferrer"
                );


            } catch (
                error
            ) {

                console.error(
                    "Erro ao baixar documento:",
                    error
                );

                setErro(
                    error?.message ||
                        "Não foi possível baixar o documento."
                );

            }

        };


    /* =========================================================
       FORMATAÇÕES
    ========================================================= */

    const formatarData =
        (data) => {

            if (!data) {
                return "—";
            }

            const dataObj =
                new Date(
                    data
                );

            if (
                Number.isNaN(
                    dataObj.getTime()
                )
            ) {

                return "—";

            }

            return dataObj.toLocaleDateString(
                "pt-BR"
            );

        };


    const formatarTipo =
        (tipo) => {

            const encontrado =
                TIPOS_DOCUMENTO.find(
                    (item) =>
                        item.value ===
                        tipo
                );

            return (
                encontrado?.label ||
                "Outros"
            );

        };


    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div className="docalme-page">


            {/* =================================================
                CABEÇALHO
            ================================================= */}

            <header className="docalme-header">

                <div className="docalme-header-left">

                    <button
                        className="docalme-back"
                        onClick={() =>
                            navigate(-1)
                        }
                        type="button"
                        title="Voltar"
                    >
                        <FiArrowLeft />
                    </button>


                    <div>

                        <span className="docalme-eyebrow">
                            ALME
                        </span>

                        <h1>
                            Documentos ALME
                        </h1>

                        <p>
                            Central de documentos e arquivos das obras
                        </p>

                    </div>

                </div>


                <div className="docalme-header-actions">

                    <button
                        className="docalme-refresh"
                        onClick={
                            carregarDados
                        }
                        type="button"
                        title="Atualizar"
                        disabled={
                            loading
                        }
                    >

                        <FiRefreshCw
                            className={
                                loading
                                    ? "docalme-spinning"
                                    : ""
                            }
                        />

                        <span>
                            Atualizar
                        </span>

                    </button>


                    <button
                        className="docalme-add"
                        onClick={
                            abrirSelecaoObra
                        }
                        type="button"
                    >

                        <FiPlus />

                        <span>
                            Adicionar documento
                        </span>

                    </button>

                </div>

            </header>


            {/* =================================================
                USUÁRIO
            ================================================= */}

            {usuarioAtual?.nome && (

                <div className="docalme-user">

                    <span>
                        Usuário:
                    </span>

                    <strong>
                        {
                            usuarioAtual.nome
                        }
                    </strong>

                </div>

            )}


            {/* =================================================
                ERRO
            ================================================= */}

            {erro && (

                <div className="docalme-error">

                    <span>
                        {erro}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setErro("")
                        }
                        title="Fechar"
                    >

                        <FiX />

                    </button>

                </div>

            )}


            {/* =================================================
                RESUMO
            ================================================= */}

            <section className="docalme-summary">

                <div className="docalme-summary-card">

                    <div className="docalme-summary-icon">
                        <FiFileText />
                    </div>

                    <div>

                        <span>
                            Documentos
                        </span>

                        <strong>
                            {
                                quantidadeDocumentos
                            }
                        </strong>

                    </div>

                </div>


                <div className="docalme-summary-card">

                    <div className="docalme-summary-icon">
                        <FiCheck />
                    </div>

                    <div>

                        <span>
                            Obras
                        </span>

                        <strong>
                            {
                                quantidadeObras
                            }
                        </strong>

                    </div>

                </div>


                <div className="docalme-summary-card">

                    <div className="docalme-summary-icon">
                        <FiFileText />
                    </div>

                    <div>

                        <span>
                            Obras com documentos
                        </span>

                        <strong>
                            {
                                obrasComDocumentos
                            }
                        </strong>

                    </div>

                </div>

            </section>


            {/* =================================================
                ABAS
            ================================================= */}

            <div className="docalme-tabs">

                <button
                    type="button"
                    className={
                        aba === "ativas"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setAba(
                            "ativas"
                        )
                    }
                >

                    Obras em andamento

                    <span>
                        {
                            obrasAtivas.length
                        }
                    </span>

                </button>


                <button
                    type="button"
                    className={
                        aba === "concluidas"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setAba(
                            "concluidas"
                        )
                    }
                >

                    Obras concluídas

                    <span>
                        {
                            obrasConcluidas.length
                        }
                    </span>

                </button>

            </div>


            {/* =================================================
                FILTROS
            ================================================= */}

            <section className="docalme-filters">

                <div className="docalme-search">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Pesquisar obra, arquiteto, empresa ou documento..."
                        value={
                            busca
                        }
                        onChange={(e) =>
                            setBusca(
                                e.target.value
                            )
                        }
                    />

                    {busca && (

                        <button
                            type="button"
                            onClick={() =>
                                setBusca("")
                            }
                            title="Limpar pesquisa"
                        >

                            <FiX />

                        </button>

                    )}

                </div>

            </section>


            {/* =================================================
                TÍTULO
            ================================================= */}

            <div className="docalme-section-title">

                <div>

                    <h2>

                        {aba ===
                        "ativas"
                            ? "Documentos das obras em andamento"
                            : "Documentos das obras concluídas"}

                    </h2>

                    <p>
                        Arquivos vinculados às obras selecionadas
                    </p>

                </div>


                <span>

                    {
                        documentosFiltrados.length
                    }{" "}

                    {
                        documentosFiltrados.length ===
                        1
                            ? "documento"
                            : "documentos"
                    }

                </span>

            </div>


            {/* =================================================
                TABELA
            ================================================= */}

            <section className="docalme-table-wrapper">

                {loading ? (

                    <div className="docalme-loading">

                        <div className="docalme-spinner" />

                        <span>
                            Carregando documentos...
                        </span>

                    </div>

                ) : documentosFiltrados.length ===
                  0 ? (

                    <div className="docalme-empty">

                        <div className="docalme-empty-icon">

                            <FiFileText />

                        </div>


                        <h3>
                            Nenhum documento encontrado
                        </h3>


                        <p>

                            {busca
                                ? "Tente alterar os termos da pesquisa."
                                : "Ainda não existem documentos cadastrados para esta categoria."}

                        </p>


                        {!busca && (

                            <button
                                type="button"
                                onClick={
                                    abrirSelecaoObra
                                }
                            >

                                <FiPlus />

                                Adicionar documento

                            </button>

                        )}

                    </div>

                ) : (

                    <div className="docalme-table-scroll">

                        <table className="docalme-table">

                            <thead>

                                <tr>

                                    <th>
                                        OBRA
                                    </th>

                                    <th>
                                        ARQUITETO / EMPRESA
                                    </th>

                                    <th>
                                        DOCUMENTO
                                    </th>

                                    <th>
                                        TIPO
                                    </th>

                                    <th>
                                        DATA
                                    </th>

                                    <th>
                                        AÇÕES
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {documentosFiltrados.map(
                                    (
                                        documento
                                    ) => (

                                        <tr
                                            key={
                                                documento.id
                                            }
                                        >

                                            <td>

                                                <div className="docalme-obra-cell">

                                                    <strong>

                                                        {
                                                            getObraNome(
                                                                documento
                                                            )
                                                        }

                                                    </strong>

                                                </div>

                                            </td>


                                            <td>

                                                <div className="docalme-arquiteto-cell">

                                                    {
                                                        getArquitetoEmpresa(
                                                            documento
                                                        )
                                                    }

                                                </div>

                                            </td>


                                            <td>

                                                <div className="docalme-document-cell">

                                                    <div className="docalme-document-icon">

                                                        <FiFileText />

                                                    </div>


                                                    <div>

                                                        <strong>

                                                            {
                                                                getDocumentoNome(
                                                                    documento
                                                                )
                                                            }

                                                        </strong>


                                                        {getDocumentoDescricao(
                                                            documento
                                                        ) && (

                                                            <span>

                                                                {
                                                                    getDocumentoDescricao(
                                                                        documento
                                                                    )
                                                                }

                                                            </span>

                                                        )}

                                                    </div>

                                                </div>

                                            </td>


                                            <td>

                                                <span className="docalme-type">

                                                    {
                                                        formatarTipo(
                                                            getDocumentoTipo(
                                                                documento
                                                            )
                                                        )
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                <span className="docalme-date">

                                                    {
                                                        formatarData(
                                                            getDocumentoData(
                                                                documento
                                                            )
                                                        )
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                <div className="docalme-actions">

                                                    {/* VISUALIZAR */}

                                                    <button
                                                        type="button"
                                                        className="docalme-action-view"
                                                        title="Visualizar documento"
                                                        onClick={() =>
                                                            visualizarDocumento(
                                                                documento
                                                            )
                                                        }
                                                    >

                                                        <FiEye />

                                                    </button>


                                                    {/* DOWNLOAD */}

                                                    <button
                                                        type="button"
                                                        className="docalme-action-download"
                                                        title="Baixar documento"
                                                        onClick={() =>
                                                            baixarDocumento(
                                                                documento
                                                            )
                                                        }
                                                    >

                                                        <FiDownload />

                                                    </button>


                                                    {/* EDITAR */}

                                                    <button
                                                        type="button"
                                                        className="docalme-action-edit"
                                                        title="Editar"
                                                        onClick={() =>
                                                            editarDocumento(
                                                                documento
                                                            )
                                                        }
                                                    >

                                                        <FiEdit2 />

                                                    </button>


                                                    {/* EXCLUIR */}

                                                    <button
                                                        type="button"
                                                        className="docalme-action-delete"
                                                        title="Excluir"
                                                        onClick={() =>
                                                            excluirDocumento(
                                                                documento
                                                            )
                                                        }
                                                    >

                                                        <FiTrash2 />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* =================================================
                MODAL SELEÇÃO DE OBRA
            ================================================= */}

            {modalSelecaoObra && (

                <div
                    className="docalme-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {

                            setModalSelecaoObra(
                                false
                            );

                        }

                    }}
                >

                    <div className="docalme-modal docalme-selection-modal">


                        <div className="docalme-modal-header">

                            <div>

                                <span>
                                    NOVO DOCUMENTO
                                </span>

                                <h2>
                                    Selecione a obra
                                </h2>

                                <p>
                                    Escolha a obra à qual o documento será vinculado.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setModalSelecaoObra(
                                        false
                                    )
                                }
                            >

                                <FiX />

                            </button>

                        </div>


                        <div className="docalme-selection-list">

                            {obrasAtivas.length ===
                            0 ? (

                                <div className="docalme-selection-empty">

                                    <FiFileText />

                                    <span>
                                        Nenhuma obra em andamento encontrada.
                                    </span>


                                    {obrasConcluidas.length >
                                        0 && (

                                        <small>
                                            As obras concluídas continuam disponíveis na aba de consulta, mas novos documentos são vinculados às obras em andamento.
                                        </small>

                                    )}

                                </div>

                            ) : (

                                obrasAtivas.map(
                                    (
                                        obra
                                    ) => (

                                        <button
                                            type="button"
                                            className="docalme-selection-card"
                                            key={
                                                obra.id
                                            }
                                            onClick={() =>
                                                selecionarObra(
                                                    obra
                                                )
                                            }
                                        >

                                            <div className="docalme-selection-icon">

                                                <FiFileText />

                                            </div>


                                            <div className="docalme-selection-info">

                                                <strong>

                                                    {
                                                        obra.nome ||
                                                        obra.nome_obra ||
                                                        "Obra sem nome"
                                                    }

                                                </strong>


                                                <span>

                                                    {
                                                        obra.arquiteto_empresa ||
                                                        "Arquiteto / empresa não informado"
                                                    }

                                                </span>

                                            </div>


                                            <FiPlus />

                                        </button>

                                    )
                                )

                            )}

                        </div>


                        <div className="docalme-modal-footer">

                            <button
                                type="button"
                                className="docalme-btn-secondary"
                                onClick={() =>
                                    setModalSelecaoObra(
                                        false
                                    )
                                }
                            >
                                Cancelar
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                MODAL DOCUMENTO
            ================================================= */}

            {modalAberto && (

                <div
                    className="docalme-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {

                            fecharModal();

                        }

                    }}
                >

                    <div className="docalme-modal">


                        <div className="docalme-modal-header">

                            <div>

                                <span>

                                    {documentoSelecionado
                                        ? "EDITAR DOCUMENTO"
                                        : "NOVO DOCUMENTO"}

                                </span>


                                <h2>

                                    {documentoSelecionado
                                        ? "Editar documento"
                                        : "Adicionar documento"}

                                </h2>


                                <p>
                                    Preencha as informações do arquivo.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    fecharModal
                                }
                                disabled={
                                    salvando
                                }
                            >

                                <FiX />

                            </button>

                        </div>


                        {obraSelecionada && (

                            <div className="docalme-selected-work">

                                <div className="docalme-selected-work-icon">

                                    <FiCheck />

                                </div>


                                <div>

                                    <span>
                                        OBRA SELECIONADA
                                    </span>


                                    <strong>

                                        {
                                            obraSelecionada.nome ||
                                            obraSelecionada.nome_obra ||
                                            "Obra sem nome"
                                        }

                                    </strong>


                                    <small>

                                        {
                                            obraSelecionada.arquiteto_empresa ||
                                            "Arquiteto / empresa não informado"
                                        }

                                    </small>

                                </div>

                            </div>

                        )}


                        <form
                            className="docalme-form"
                            onSubmit={
                                salvarDocumento
                            }
                        >

                            <div className="docalme-form-grid">


                                <div className="docalme-field docalme-field-full">

                                    <label>
                                        Nome do documento
                                    </label>


                                    <input
                                        type="text"
                                        value={
                                            form.nome
                                        }
                                        onChange={(e) =>
                                            alterarCampo(
                                                "nome",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ex.: Projeto executivo"
                                        disabled={
                                            salvando
                                        }
                                    />

                                </div>


                                <div className="docalme-field">

                                    <label>
                                        Tipo
                                    </label>


                                    <select
                                        value={
                                            form.tipo
                                        }
                                        onChange={(e) =>
                                            alterarCampo(
                                                "tipo",
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            salvando
                                        }
                                    >

                                        <option value="">
                                            Selecione
                                        </option>


                                        {TIPOS_DOCUMENTO.map(
                                            (
                                                tipo
                                            ) => (

                                                <option
                                                    key={
                                                        tipo.value
                                                    }
                                                    value={
                                                        tipo.value
                                                    }
                                                >

                                                    {
                                                        tipo.label
                                                    }

                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                <div className="docalme-field">

                                    <label>
                                        Arquivo
                                    </label>


                                    <label className="docalme-file-input">

                                        <FiUpload />


                                        <span>

                                            {form.arquivo
                                                ? form.arquivo.name
                                                : documentoSelecionado
                                                    ? "Selecionar novo arquivo"
                                                    : "Selecionar arquivo"}

                                        </span>


                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                alterarCampo(
                                                    "arquivo",
                                                    e.target.files?.[0] ||
                                                        null
                                                )
                                            }
                                            disabled={
                                                salvando
                                            }
                                        />

                                    </label>

                                </div>


                                <div className="docalme-field docalme-field-full">

                                    <label>

                                        Descrição

                                        <small>
                                            opcional
                                        </small>

                                    </label>


                                    <textarea
                                        value={
                                            form.descricao
                                        }
                                        onChange={(e) =>
                                            alterarCampo(
                                                "descricao",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Adicione uma descrição ou observação sobre o documento..."
                                        rows="4"
                                        disabled={
                                            salvando
                                        }
                                    />

                                </div>

                            </div>


                            <div className="docalme-modal-footer">

                                <button
                                    type="button"
                                    className="docalme-btn-secondary"
                                    onClick={
                                        fecharModal
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    Cancelar
                                </button>


                                <button
                                    type="submit"
                                    className="docalme-btn-primary"
                                    disabled={
                                        salvando
                                    }
                                >

                                    {salvando ? (

                                        <>

                                            <span className="docalme-button-spinner" />

                                            Salvando...

                                        </>

                                    ) : (

                                        <>

                                            <FiCheck />

                                            {documentoSelecionado
                                                ? "Salvar alterações"
                                                : "Adicionar documento"}

                                        </>

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* =================================================
                MODAL DE PRÉ-VISUALIZAÇÃO
            ================================================= */}

            {previewAberto && (

                <div
                    className="docalme-preview-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {

                            fecharPreview();

                        }

                    }}
                >

                    <div className="docalme-preview-modal">


                        {/* HEADER */}

                        <div className="docalme-preview-header">

                            <div className="docalme-preview-title">

                                <div className="docalme-preview-title-icon">

                                    <FiFileText />

                                </div>


                                <div>

                                    <span>
                                        PRÉ-VISUALIZAÇÃO
                                    </span>

                                    <h2>
                                        {
                                            previewDocumento
                                                ? getDocumentoNome(
                                                    previewDocumento
                                                )
                                                : "Documento"
                                        }
                                    </h2>

                                    {previewDocumento && (

                                        <small>

                                            {
                                                getObraNome(
                                                    previewDocumento
                                                )
                                            }

                                        </small>

                                    )}

                                </div>

                            </div>


                            <div className="docalme-preview-header-actions">

                                {previewUrl && (

                                    <button
                                        type="button"
                                        className="docalme-preview-open"
                                        onClick={
                                            abrirArquivoEmNovaAba
                                        }
                                        title="Abrir em nova aba"
                                    >

                                        <FiExternalLink />

                                        <span>
                                            Abrir
                                        </span>

                                    </button>

                                )}


                                {previewDocumento && (

                                    <button
                                        type="button"
                                        className="docalme-preview-download"
                                        onClick={() =>
                                            baixarDocumento(
                                                previewDocumento
                                            )
                                        }
                                        title="Baixar"
                                    >

                                        <FiDownload />

                                        <span>
                                            Baixar
                                        </span>

                                    </button>

                                )}


                                <button
                                    type="button"
                                    className="docalme-preview-close"
                                    onClick={
                                        fecharPreview
                                    }
                                    title="Fechar"
                                >

                                    <FiX />

                                </button>

                            </div>

                        </div>


                        {/* CONTENT */}

                        <div className="docalme-preview-content">

                            {previewLoading ? (

                                <div className="docalme-preview-loading">

                                    <div className="docalme-spinner" />

                                    <span>
                                        Preparando pré-visualização...
                                    </span>

                                </div>

                            ) : previewDocumento && previewUrl ? (

                                <>
                                    {obterTipoPreview(
                                        previewDocumento
                                    ) ===
                                    "pdf" && (

                                        <div className="docalme-preview-pdf">

                                            <iframe
                                                src={
                                                    previewUrl
                                                }
                                                title={
                                                    getDocumentoNome(
                                                        previewDocumento
                                                    )
                                                }
                                            />

                                        </div>

                                    )}


                                    {obterTipoPreview(
                                        previewDocumento
                                    ) ===
                                    "image" && (

                                        <div className="docalme-preview-image">

                                            <img
                                                src={
                                                    previewUrl
                                                }
                                                alt={
                                                    getDocumentoNome(
                                                        previewDocumento
                                                    )
                                                }
                                            />

                                        </div>

                                    )}


                                    {obterTipoPreview(
                                        previewDocumento
                                    ) ===
                                    "video" && (

                                        <div className="docalme-preview-video">

                                            <video
                                                controls
                                                autoPlay
                                            >

                                                <source
                                                    src={
                                                        previewUrl
                                                    }
                                                    type={
                                                        previewDocumento.mime_type ||
                                                        undefined
                                                    }
                                                />

                                                Seu navegador não suporta reprodução de vídeo.

                                            </video>

                                        </div>

                                    )}


                                    {obterTipoPreview(
                                        previewDocumento
                                    ) ===
                                    "audio" && (

                                        <div className="docalme-preview-audio">

                                            <div className="docalme-preview-media-icon">

                                                <FiFileText />

                                            </div>

                                            <h3>
                                                {
                                                    getDocumentoNome(
                                                        previewDocumento
                                                    )
                                                }
                                            </h3>

                                            <audio
                                                controls
                                            >

                                                <source
                                                    src={
                                                        previewUrl
                                                    }
                                                    type={
                                                        previewDocumento.mime_type ||
                                                        undefined
                                                    }
                                                />

                                                Seu navegador não suporta reprodução de áudio.

                                            </audio>

                                        </div>

                                    )}


                                    {obterTipoPreview(
                                        previewDocumento
                                    ) ===
                                    "text" && (

                                        <div className="docalme-preview-text">

                                            <iframe
                                                src={
                                                    previewUrl
                                                }
                                                title={
                                                    getDocumentoNome(
                                                        previewDocumento
                                                    )
                                                }
                                            />

                                        </div>

                                    )}


                                    {obterTipoPreview(
                                        previewDocumento
                                    ) ===
                                    "unsupported" && (

                                        <div className="docalme-preview-unsupported">

                                            <div className="docalme-preview-unsupported-icon">

                                                <FiFileText />

                                            </div>


                                            <h3>
                                                Pré-visualização não disponível
                                            </h3>


                                            <p>

                                                Este formato não possui visualização nativa no navegador.

                                            </p>


                                            <button
                                                type="button"
                                                onClick={
                                                    abrirArquivoEmNovaAba
                                                }
                                            >

                                                <FiExternalLink />

                                                Abrir arquivo

                                            </button>

                                        </div>

                                    )}

                                </>

                            ) : (

                                <div className="docalme-preview-unsupported">

                                    <div className="docalme-preview-unsupported-icon">

                                        <FiFileText />

                                    </div>

                                    <h3>
                                        Não foi possível carregar o documento
                                    </h3>

                                    <p>
                                        Tente novamente ou abra o arquivo em uma nova aba.
                                    </p>

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}