import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    FiArrowLeft,
    FiDownload,
    FiEdit2,
    FiEye,
    FiFile,
    FiFileText,
    FiFolder,
    FiImage,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
    FiUploadCloud,
    FiX
} from "react-icons/fi";

import {
    useNavigate
} from "react-router-dom";

import {
    supabase
} from "../../../../services/supabase";

import "./DocumentosCliente.scss";


/* =====================================================
   CONSTANTES
===================================================== */

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


const FORM_INICIAL = {
    obra_id: "",
    nome: "",
    tipo: "outros",
    arquivo: null
};


/* =====================================================
   EXTENSÕES
===================================================== */

const EXTENSOES_IMAGEM = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "bmp",
    "tiff",
    "svg",
    "heic",
    "avif"
];


const EXTENSOES_VIDEO = [
    "mp4",
    "webm",
    "ogg",
    "mov",
    "m4v"
];


const EXTENSOES_AUDIO = [
    "mp3",
    "wav",
    "ogg",
    "m4a",
    "aac",
    "flac"
];


const EXTENSOES_TEXTO = [
    "txt",
    "csv"
];


/* =====================================================
   HELPERS
===================================================== */

function formatarTamanho(bytes) {

    if (
        bytes === null ||
        bytes === undefined ||
        Number.isNaN(Number(bytes))
    ) {
        return "-";
    }

    const tamanho =
        Number(bytes);


    if (tamanho < 1024) {
        return `${tamanho} B`;
    }


    if (tamanho < 1024 * 1024) {
        return `${(
            tamanho / 1024
        ).toFixed(1)} KB`;
    }


    if (
        tamanho <
        1024 * 1024 * 1024
    ) {
        return `${(
            tamanho /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    }


    return `${(
        tamanho /
        (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
}


function formatarData(data) {

    if (!data) {
        return "-";
    }


    try {

        return new Intl.DateTimeFormat(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        ).format(
            new Date(data)
        );

    } catch {

        return "-";

    }
}


function obterExtensao(
    nomeArquivo = ""
) {

    const partes =
        String(
            nomeArquivo
        ).split(".");


    if (
        partes.length <= 1
    ) {
        return "";
    }


    return partes
        .pop()
        .toLowerCase();
}


function normalizarExtensao(
    extensao = ""
) {

    return String(
        extensao
    )
        .replace(
            ".",
            ""
        )
        .trim()
        .toLowerCase();
}


function obterTipoAutomatico(
    arquivo
) {

    if (!arquivo) {
        return "outros";
    }


    const nome =
        String(
            arquivo.name || ""
        ).toLowerCase();


    const extensao =
        obterExtensao(
            nome
        );


    if (
        arquivo.type?.startsWith(
            "image/"
        ) ||
        EXTENSOES_IMAGEM.includes(
            extensao
        )
    ) {
        return "imagens";
    }


    if (
        extensao === "skp"
    ) {
        return "sketchup";
    }


    if (
        extensao === "pdf" ||
        arquivo.type ===
            "application/pdf"
    ) {
        return "pdf";
    }


    if (
        [
            "doc",
            "docx",
            "txt",
            "rtf",
            "odt"
        ].includes(
            extensao
        )
    ) {
        return "documentos";
    }


    if (
        [
            "xls",
            "xlsx",
            "csv",
            "ods"
        ].includes(
            extensao
        )
    ) {
        return "planilhas";
    }


    return "outros";
}


function obterLabelTipo(
    tipo
) {

    return (
        TIPOS_DOCUMENTO.find(
            item =>
                item.value === tipo
        )?.label ||
        "Outros"
    );
}


/* =====================================================
   TIPO DE PRÉ-VISUALIZAÇÃO
===================================================== */

function obterTipoPreview(
    documento
) {

    const extensao =
        normalizarExtensao(
            documento?.extensao ||
            obterExtensao(
                documento?.nome_arquivo
            )
        );


    const mime =
        String(
            documento?.mime_type ||
            ""
        ).toLowerCase();


    /* ================================================
       IMAGENS
    ================================================ */

    if (
        mime.startsWith(
            "image/"
        ) ||
        EXTENSOES_IMAGEM.includes(
            extensao
        )
    ) {
        return "image";
    }


    /* ================================================
       PDF
    ================================================ */

    if (
        mime ===
            "application/pdf" ||
        extensao === "pdf"
    ) {
        return "pdf";
    }


    /* ================================================
       VÍDEOS
    ================================================ */

    if (
        mime.startsWith(
            "video/"
        ) ||
        EXTENSOES_VIDEO.includes(
            extensao
        )
    ) {
        return "video";
    }


    /* ================================================
       ÁUDIOS
    ================================================ */

    if (
        mime.startsWith(
            "audio/"
        ) ||
        EXTENSOES_AUDIO.includes(
            extensao
        )
    ) {
        return "audio";
    }


    /* ================================================
       TEXTO
    ================================================ */

    if (
        mime.startsWith(
            "text/"
        ) ||
        EXTENSOES_TEXTO.includes(
            extensao
        )
    ) {
        return "text";
    }


    /* ================================================
       SEM PRÉVIA
    ================================================ */

    return "download";
}


/* =====================================================
   ÍCONE DO DOCUMENTO
===================================================== */

function obterIconeDocumento(
    documento
) {

    const extensao =
        normalizarExtensao(
            documento?.extensao ||
            obterExtensao(
                documento?.nome_arquivo
            )
        );


    if (
        EXTENSOES_IMAGEM.includes(
            extensao
        )
    ) {
        return <FiImage />;
    }


    if (
        extensao === "pdf"
    ) {
        return <FiFileText />;
    }


    if (
        extensao === "skp"
    ) {
        return (
            <span className="documentos-cliente-file-icon-skp">
                SKP
            </span>
        );
    }


    return <FiFile />;
}


/* =====================================================
   COMPONENTE
===================================================== */

export default function DocumentosCliente() {

    const navigate =
        useNavigate();


    const inputArquivoRef =
        useRef(null);


    /* =================================================
       STATES
    ================================================= */

    const [
        obras,
        setObras
    ] = useState([]);


    const [
        documentos,
        setDocumentos
    ] = useState([]);


    const [
        usuarioAtual,
        setUsuarioAtual
    ] = useState(null);


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
        filtro,
        setFiltro
    ] = useState("");


    const [
        obraSelecionada,
        setObraSelecionada
    ] = useState(null);


    const [
        modalObras,
        setModalObras
    ] = useState(false);


    const [
        modalDocumento,
        setModalDocumento
    ] = useState(false);


    const [
        modalDocumentosObra,
        setModalDocumentosObra
    ] = useState(false);


    const [
        modalExclusao,
        setModalExclusao
    ] = useState(false);


    const [
        documentoSelecionado,
        setDocumentoSelecionado
    ] = useState(null);


    const [
        form,
        setForm
    ] = useState(
        FORM_INICIAL
    );


    /* =================================================
       PREVIEW
    ================================================= */

    const [
        modalPreview,
        setModalPreview
    ] = useState(false);


    const [
        previewUrl,
        setPreviewUrl
    ] = useState("");


    const [
        previewTipo,
        setPreviewTipo
    ] = useState("download");


    const [
        previewDocumento,
        setPreviewDocumento
    ] = useState(null);


    const [
        carregandoPreview,
        setCarregandoPreview
    ] = useState(false);


    /* =================================================
       CARREGAR DADOS
    ================================================= */

    async function carregarDados(
        mostrarLoading = true
    ) {

        if (mostrarLoading) {
            setLoading(true);
        }

        setErro("");


        try {

            const {
                data,
                error
            } =
                await supabase.functions.invoke(
                    "admin-documentos",
                    {
                        body: {
                            action: "list"
                        }
                    }
                );


            if (error) {
                throw error;
            }


            if (
                !data?.success
            ) {
                throw new Error(
                    data?.error ||
                    "Não foi possível carregar os documentos."
                );
            }


            setObras(
                Array.isArray(
                    data?.obras
                )
                    ? data.obras
                    : []
            );


            setDocumentos(
                Array.isArray(
                    data?.documentos
                )
                    ? data.documentos
                    : []
            );


            setUsuarioAtual(
                data?.usuarioAtual ||
                null
            );


        } catch (error) {

            console.error(
                "Erro ao carregar documentos:",
                error
            );


            setErro(
                error?.message ||
                "Não foi possível carregar os documentos."
            );


        } finally {

            if (mostrarLoading) {
                setLoading(false);
            }

        }

    }


    useEffect(() => {

        carregarDados();

    }, []);


    /* =================================================
       MAPA DE DOCUMENTOS POR OBRA
    ================================================= */

    const documentosPorObra =
        useMemo(() => {

            const mapa = {};


            documentos.forEach(
                documento => {

                    const chave =
                        String(
                            documento.obra_id
                        );


                    if (
                        !mapa[chave]
                    ) {
                        mapa[chave] = [];
                    }


                    mapa[chave].push(
                        documento
                    );

                }
            );


            return mapa;

        }, [
            documentos
        ]);


    /* =================================================
       OBRAS FILTRADAS
    ================================================= */

    const obrasFiltradas =
        useMemo(() => {

            const termo =
                filtro
                    .trim()
                    .toLowerCase();


            if (!termo) {
                return obras;
            }


            return obras.filter(
                obra => {

                    const campos = [
                        obra.nome,
                        obra.rdo_nome,
                        obra.marceneiro_nome,
                        obra.projetista_nome
                    ];


                    return campos.some(
                        campo =>
                            String(
                                campo || ""
                            )
                                .toLowerCase()
                                .includes(
                                    termo
                                )
                    );

                }
            );

        }, [
            obras,
            filtro
        ]);


    /* =================================================
       DOCUMENTOS DA OBRA
    ================================================= */

    const documentosDaObra =
        useMemo(() => {

            if (
                !obraSelecionada
            ) {
                return [];
            }


            return (
                documentosPorObra[
                    String(
                        obraSelecionada.id
                    )
                ] || []
            );

        }, [
            documentosPorObra,
            obraSelecionada
        ]);


    /* =================================================
       AGRUPAR DOCUMENTOS
    ================================================= */

    const documentosAgrupados =
        useMemo(() => {

            const grupos = {};


            TIPOS_DOCUMENTO.forEach(
                tipo => {

                    grupos[
                        tipo.value
                    ] = [];

                }
            );


            documentosDaObra.forEach(
                documento => {

                    const tipo =
                        documento.tipo ||
                        "outros";


                    if (
                        !grupos[tipo]
                    ) {
                        grupos[tipo] = [];
                    }


                    grupos[tipo].push(
                        documento
                    );

                }
            );


            return grupos;

        }, [
            documentosDaObra
        ]);


    /* =================================================
       CONTADORES
    ================================================= */

    const quantidadeObras =
        obras.length;


    const quantidadeDocumentos =
        documentos.length;


    /* =================================================
       LIMPAR MENSAGENS
    ================================================= */

    function limparMensagens() {

        setErro("");

        setSucesso("");

    }


    /* =================================================
       ABRIR NOVO
    ================================================= */

    function abrirNovo() {

        limparMensagens();


        setDocumentoSelecionado(
            null
        );


        setForm({
            ...FORM_INICIAL,

            obra_id:
                obraSelecionada?.id
                    ? String(
                        obraSelecionada.id
                    )
                    : ""
        });


        setModalDocumento(
            true
        );

    }


    /* =================================================
       ABRIR NOVO PELA OBRA
    ================================================= */

    function abrirNovoParaObra(
        obra
    ) {

        limparMensagens();


        setObraSelecionada(
            obra
        );


        setDocumentoSelecionado(
            null
        );


        setForm({
            ...FORM_INICIAL,

            obra_id:
                String(
                    obra.id
                )
        });


        setModalDocumento(
            true
        );

    }


    /* =================================================
       ABRIR EDIÇÃO
    ================================================= */

    function abrirEdicao(
        documento
    ) {

        limparMensagens();


        setDocumentoSelecionado(
            documento
        );


        setForm({
            obra_id:
                String(
                    documento.obra_id
                ),

            nome:
                documento.nome ||
                documento.nome_arquivo ||
                "",

            tipo:
                documento.tipo ||
                "outros",

            arquivo:
                null
        });


        setModalDocumento(
            true
        );

    }


    /* =================================================
       FECHAR MODAL DOCUMENTO
    ================================================= */

    function fecharModalDocumento() {

        if (salvando) {
            return;
        }


        setModalDocumento(
            false
        );


        setDocumentoSelecionado(
            null
        );


        setForm(
            FORM_INICIAL
        );


        if (
            inputArquivoRef.current
        ) {

            inputArquivoRef.current.value =
                "";

        }

    }


    /* =================================================
       SELECIONAR ARQUIVO
    ================================================= */

    function handleArquivo(
        event
    ) {

        const arquivo =
            event.target.files?.[0];


        if (!arquivo) {
            return;
        }


        const tipoAutomatico =
            obterTipoAutomatico(
                arquivo
            );


        setForm(
            atual => ({

                ...atual,

                arquivo,

                tipo:
                    documentoSelecionado
                        ? atual.tipo
                        : tipoAutomatico,

                nome:
                    atual.nome ||
                    arquivo.name
                        .replace(
                            /\.[^/.]+$/,
                            ""
                        )

            })
        );

    }


    /* =================================================
       ALTERAR CAMPO
    ================================================= */

    function alterarCampo(
        campo,
        valor
    ) {

        setForm(
            atual => ({

                ...atual,

                [campo]:
                    valor

            })
        );

    }


    /* =================================================
       UPLOAD
    ================================================= */

    async function fazerUpload(
        arquivo,
        obraId,
        tipo
    ) {

        const extensao =
            obterExtensao(
                arquivo.name
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
                "admin-documentos",
                {
                    body: {

                        action:
                            "create_upload_url",

                        obra_id:
                            obraId,

                        tipo,

                        extensao

                    }
                }
            );


        if (error) {
            throw error;
        }


        if (
            !data?.success ||
            !data?.path ||
            !data?.token
        ) {

            throw new Error(
                data?.error ||
                "Não foi possível preparar o upload."
            );

        }


        const {
            error:
                uploadError
        } =
            await supabase.storage
                .from(
                    "documentos-clientes"
                )
                .uploadToSignedUrl(
                    data.path,
                    data.token,
                    arquivo
                );


        if (uploadError) {
            throw uploadError;
        }


        return {

            path:
                data.path,

            extensao:
                extensao,

            mime_type:
                arquivo.type ||
                null,

            tamanho:
                arquivo.size

        };

    }


    /* =================================================
       SALVAR
    ================================================= */

    async function salvar(
        event
    ) {

        event?.preventDefault();


        if (salvando) {
            return;
        }


        limparMensagens();


        const obraId =
            Number(
                form.obra_id
            );


        if (!obraId) {

            setErro(
                "Selecione uma obra."
            );

            return;

        }


        if (
            !form.nome.trim()
        ) {

            setErro(
                "Informe o nome do documento."
            );

            return;

        }


        if (
            !documentoSelecionado &&
            !form.arquivo
        ) {

            setErro(
                "Selecione um arquivo."
            );

            return;

        }


        setSalvando(
            true
        );


        try {

            let upload = null;


            /* =========================================
               NOVO ARQUIVO
            ========================================= */

            if (
                form.arquivo
            ) {

                upload =
                    await fazerUpload(
                        form.arquivo,
                        obraId,
                        form.tipo
                    );

            }


            /* =========================================
               CRIAR
            ========================================= */

            if (
                !documentoSelecionado
            ) {

                const {
                    data,
                    error
                } =
                    await supabase.functions.invoke(
                        "admin-documentos",
                        {
                            body: {

                                action:
                                    "create",

                                obra_id:
                                    obraId,

                                nome:
                                    form.nome.trim(),

                                nome_arquivo:
                                    form.arquivo.name,

                                tipo:
                                    form.tipo,

                                extensao:
                                    upload.extensao,

                                mime_type:
                                    upload.mime_type,

                                tamanho:
                                    upload.tamanho,

                                storage_path:
                                    upload.path

                            }
                        }
                    );


                if (error) {
                    throw error;
                }


                if (
                    !data?.success
                ) {

                    throw new Error(
                        data?.error ||
                        "Não foi possível criar o documento."
                    );

                }


                setSucesso(
                    "Documento adicionado com sucesso."
                );

            }


            /* =========================================
               EDITAR
            ========================================= */

            else {

                const body = {

                    action:
                        "update",

                    id:
                        documentoSelecionado.id,

                    nome:
                        form.nome.trim(),

                    tipo:
                        form.tipo

                };


                if (
                    form.arquivo &&
                    upload
                ) {

                    body.nome_arquivo =
                        form.arquivo.name;

                    body.extensao =
                        upload.extensao;

                    body.mime_type =
                        upload.mime_type;

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
                        "admin-documentos",
                        {
                            body
                        }
                    );


                if (error) {
                    throw error;
                }


                if (
                    !data?.success
                ) {

                    throw new Error(
                        data?.error ||
                        "Não foi possível editar o documento."
                    );

                }


                /* =====================================
                   APAGAR ARQUIVO ANTIGO
                ===================================== */

                if (
                    upload &&
                    data?.antigoStoragePath &&
                    data.antigoStoragePath !==
                        upload.path
                ) {

                    await supabase.storage
                        .from(
                            "documentos-clientes"
                        )
                        .remove([
                            data.antigoStoragePath
                        ]);

                }


                setSucesso(
                    "Documento alterado com sucesso."
                );

            }


            /* =========================================
               RECARREGAR
            ========================================= */

            await carregarDados(
                false
            );


            fecharModalDocumento();


            setTimeout(
                () => {

                    setSucesso("");

                },
                3000
            );


        } catch (error) {

            console.error(
                "Erro ao salvar documento:",
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

    }


    /* =================================================
       ABRIR DOCUMENTOS DA OBRA
    ================================================= */

    function abrirDocumentosObra(
        obra
    ) {

        limparMensagens();


        setObraSelecionada(
            obra
        );


        setModalDocumentosObra(
            true
        );

    }


    /* =================================================
       FECHAR DOCUMENTOS DA OBRA
    ================================================= */

    function fecharDocumentosObra() {

        setModalDocumentosObra(
            false
        );

    }


    /* =================================================
       ABRIR MODAL DE OBRAS
    ================================================= */

    function abrirSelecaoObra() {

        limparMensagens();


        setModalObras(
            true
        );

    }


    /* =================================================
       SELECIONAR OBRA
    ================================================= */

    function selecionarObra(
        obra
    ) {

        if (
            !obra ||
            obra.concluida
        ) {
            return;
        }


        setObraSelecionada(
            obra
        );


        setModalObras(
            false
        );


        setModalDocumentosObra(
            true
        );

    }


    /* =================================================
       EXCLUSÃO
    ================================================= */

    function abrirExclusao(
        documento
    ) {

        limparMensagens();


        setDocumentoSelecionado(
            documento
        );


        setModalExclusao(
            true
        );

    }


    function fecharExclusao() {

        if (salvando) {
            return;
        }


        setModalExclusao(
            false
        );


        setDocumentoSelecionado(
            null
        );

    }


    async function excluirDocumento() {

        if (
            !documentoSelecionado ||
            salvando
        ) {
            return;
        }


        setSalvando(
            true
        );


        limparMensagens();


        try {

            const {
                data,
                error
            } =
                await supabase.functions.invoke(
                    "admin-documentos",
                    {
                        body: {

                            action:
                                "delete",

                            id:
                                documentoSelecionado.id

                        }
                    }
                );


            if (error) {
                throw error;
            }


            if (
                !data?.success
            ) {

                throw new Error(
                    data?.error ||
                    "Não foi possível excluir o documento."
                );

            }


            setModalExclusao(
                false
            );


            setDocumentoSelecionado(
                null
            );


            await carregarDados(
                false
            );


            setSucesso(
                "Documento excluído com sucesso."
            );


            setTimeout(
                () => {

                    setSucesso("");

                },
                3000
            );


        } catch (error) {

            console.error(
                "Erro ao excluir documento:",
                error
            );


            setErro(
                error?.message ||
                "Não foi possível excluir o documento."
            );


        } finally {

            setSalvando(
                false
            );

        }

    }


    /* =================================================
       OBTER URL ASSINADA
    ================================================= */

    async function obterUrlDocumento(
        documento
    ) {

        const {
            data,
            error
        } =
            await supabase.functions.invoke(
                "admin-documentos",
                {
                    body: {

                        action:
                            "signed_url",

                        id:
                            documento.id

                    }
                }
            );


        if (error) {
            throw error;
        }


        if (
            !data?.success ||
            !data?.url
        ) {

            throw new Error(
                data?.error ||
                "Não foi possível gerar o link do documento."
            );

        }


        return data.url;

    }


    /* =================================================
       PRÉ-VISUALIZAR DOCUMENTO
    ================================================= */

    async function abrirPreview(
        documento
    ) {

        limparMensagens();


        setPreviewDocumento(
            documento
        );


        setPreviewTipo(
            obterTipoPreview(
                documento
            )
        );


        setPreviewUrl(
            ""
        );


        setModalPreview(
            true
        );


        setCarregandoPreview(
            true
        );


        try {

            const url =
                await obterUrlDocumento(
                    documento
                );


            setPreviewUrl(
                url
            );


        } catch (error) {

            console.error(
                "Erro ao carregar preview:",
                error
            );


            setModalPreview(
                false
            );


            setErro(
                error?.message ||
                "Não foi possível abrir o documento."
            );


        } finally {

            setCarregandoPreview(
                false
            );

        }

    }


    /* =================================================
       FECHAR PREVIEW
    ================================================= */

    function fecharPreview() {

        setModalPreview(
            false
        );


        setPreviewUrl(
            ""
        );


        setPreviewDocumento(
            null
        );


        setPreviewTipo(
            "download"
        );

    }


    /* =================================================
       DOWNLOAD
    ================================================= */

    async function baixarDocumento(
        documento
    ) {

        try {

            const url =
                await obterUrlDocumento(
                    documento
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.target =
                "_blank";


            link.rel =
                "noopener noreferrer";


            link.download =
                documento.nome_arquivo ||
                documento.nome ||
                "arquivo";


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


        } catch (error) {

            console.error(
                "Erro ao baixar documento:",
                error
            );


            setErro(
                error?.message ||
                "Não foi possível baixar o documento."
            );

        }

    }


    /* =================================================
       NOME DA OBRA
    ================================================= */

    function obterNomeObra(
        obraId
    ) {

        return (
            obras.find(
                obra =>
                    String(
                        obra.id
                    ) ===
                    String(
                        obraId
                    )
            )?.nome ||
            "Obra"
        );

    }


    /* =================================================
       RENDER
    ================================================= */

    return (

        <div className="documentos-cliente-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="documentos-cliente-header">

                <div className="documentos-cliente-header-left">

                    <button
                        type="button"
                        className="documentos-cliente-back"
                        onClick={() =>
                            navigate(-1)
                        }
                        title="Voltar"
                    >
                        <FiArrowLeft />
                    </button>


                    <div>

                        <span className="documentos-cliente-eyebrow">
                            PRODUÇÃO
                        </span>


                        <h1>
                            Documentos do cliente
                        </h1>


                        <p>
                            Organize os arquivos e documentos das obras da ALME.
                        </p>

                    </div>

                </div>


                <div className="documentos-cliente-header-actions">

                    <button
                        type="button"
                        className="documentos-cliente-btn documentos-cliente-btn-secondary"
                        onClick={() =>
                            carregarDados()
                        }
                        disabled={
                            loading
                        }
                    >

                        <FiRefreshCw
                            className={
                                loading
                                    ? "documentos-cliente-spin"
                                    : ""
                            }
                        />

                        Atualizar

                    </button>


                    <button
                        type="button"
                        className="documentos-cliente-btn documentos-cliente-btn-primary"
                        onClick={
                            abrirSelecaoObra
                        }
                    >

                        <FiPlus />

                        Adicionar documento

                    </button>

                </div>

            </div>


            {/* =================================================
                MENSAGENS
            ================================================= */}

            {erro && (

                <div className="documentos-cliente-alert documentos-cliente-alert-error">

                    <span>
                        {erro}
                    </span>


                    <button
                        type="button"
                        onClick={() =>
                            setErro("")
                        }
                    >
                        <FiX />
                    </button>

                </div>

            )}


            {sucesso && (

                <div className="documentos-cliente-alert documentos-cliente-alert-success">

                    <span>
                        {sucesso}
                    </span>


                    <button
                        type="button"
                        onClick={() =>
                            setSucesso("")
                        }
                    >
                        <FiX />
                    </button>

                </div>

            )}


            {/* =================================================
                RESUMO
            ================================================= */}

            <div className="documentos-cliente-summary">

                <div className="documentos-cliente-summary-card">

                    <div className="documentos-cliente-summary-icon">
                        <FiFolder />
                    </div>


                    <div>

                        <span>
                            Obras em andamento
                        </span>


                        <strong>
                            {quantidadeObras}
                        </strong>

                    </div>

                </div>


                <div className="documentos-cliente-summary-card">

                    <div className="documentos-cliente-summary-icon">
                        <FiFile />
                    </div>


                    <div>

                        <span>
                            Documentos cadastrados
                        </span>


                        <strong>
                            {quantidadeDocumentos}
                        </strong>

                    </div>

                </div>

            </div>


            {/* =================================================
                CONTEÚDO
            ================================================= */}

            <div className="documentos-cliente-content">

                <div className="documentos-cliente-toolbar">

                    <div className="documentos-cliente-search">

                        <FiSearch />


                        <input
                            type="text"
                            placeholder="Buscar obra, RDO, marceneiro ou projetista..."
                            value={
                                filtro
                            }
                            onChange={event =>
                                setFiltro(
                                    event.target.value
                                )
                            }
                        />


                        {filtro && (

                            <button
                                type="button"
                                onClick={() =>
                                    setFiltro("")
                                }
                            >
                                <FiX />
                            </button>

                        )}

                    </div>


                    <span className="documentos-cliente-results">

                        {obrasFiltradas.length}{" "}

                        {obrasFiltradas.length === 1
                            ? "obra"
                            : "obras"}

                    </span>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (

                    <div className="documentos-cliente-empty">

                        <FiRefreshCw
                            className="documentos-cliente-spin"
                        />


                        <strong>
                            Carregando documentos...
                        </strong>

                    </div>

                ) : obrasFiltradas.length === 0 ? (

                    <div className="documentos-cliente-empty">

                        <FiFolder />


                        <strong>
                            Nenhuma obra encontrada
                        </strong>


                        <span>
                            Não existem obras em andamento
                            disponíveis para você.
                        </span>

                    </div>

                ) : (

                    <div className="documentos-cliente-table-wrapper">

                        <table className="documentos-cliente-table">

                            <thead>

                                <tr>

                                    <th>
                                        Obra
                                    </th>

                                    <th>
                                        RDO
                                    </th>

                                    <th>
                                        Marceneiro
                                    </th>

                                    <th>
                                        Projetista
                                    </th>

                                    <th>
                                        Documentos
                                    </th>

                                    <th>
                                        Ações
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {obrasFiltradas.map(
                                    obra => {

                                        const docs =
                                            documentosPorObra[
                                                String(
                                                    obra.id
                                                )
                                            ] || [];


                                        return (

                                            <tr
                                                key={
                                                    obra.id
                                                }
                                            >

                                                <td>

                                                    <div className="documentos-cliente-work">

                                                        <div className="documentos-cliente-work-icon">
                                                            <FiFolder />
                                                        </div>


                                                        <div>

                                                            <strong>
                                                                {obra.nome}
                                                            </strong>


                                                            <span>
                                                                ID #{obra.id}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                <td>
                                                    {obra.rdo_nome || "-"}
                                                </td>


                                                <td>
                                                    {obra.marceneiro_nome || "-"}
                                                </td>


                                                <td>
                                                    {obra.projetista_nome || "-"}
                                                </td>


                                                <td>

                                                    <button
                                                        type="button"
                                                        className="documentos-cliente-doc-count"
                                                        onClick={() =>
                                                            abrirDocumentosObra(
                                                                obra
                                                            )
                                                        }
                                                    >

                                                        <FiFile />


                                                        <strong>
                                                            {docs.length}
                                                        </strong>


                                                        <span>
                                                            {docs.length === 1
                                                                ? "arquivo"
                                                                : "arquivos"}
                                                        </span>

                                                    </button>

                                                </td>


                                                <td>

                                                    <div className="documentos-cliente-actions">

                                                        <button
                                                            type="button"
                                                            className="documentos-cliente-action documentos-cliente-action-view"
                                                            onClick={() =>
                                                                abrirDocumentosObra(
                                                                    obra
                                                                )
                                                            }
                                                            title="Ver documentos"
                                                        >
                                                            <FiFolder />
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="documentos-cliente-action documentos-cliente-action-add"
                                                            onClick={() =>
                                                                abrirNovoParaObra(
                                                                    obra
                                                                )
                                                            }
                                                            title="Adicionar documento"
                                                        >
                                                            <FiPlus />
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                MODAL SELEÇÃO DE OBRA
            ================================================= */}

            {modalObras && (

                <div className="documentos-cliente-modal-overlay">

                    <div className="documentos-cliente-modal documentos-cliente-modal-selection">

                        <div className="documentos-cliente-modal-header">

                            <div>

                                <span>
                                    NOVO DOCUMENTO
                                </span>


                                <h2>
                                    Selecione a obra
                                </h2>


                                <p>
                                    Escolha em qual obra o documento será cadastrado.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setModalObras(false)
                                }
                            >
                                <FiX />
                            </button>

                        </div>


                        <div className="documentos-cliente-selection-list">

                            {obras.map(
                                obra => {

                                    const docs =
                                        documentosPorObra[
                                            String(
                                                obra.id
                                            )
                                        ] || [];


                                    return (

                                        <button
                                            type="button"
                                            className="documentos-cliente-selection-item"
                                            key={
                                                obra.id
                                            }
                                            onClick={() =>
                                                selecionarObra(
                                                    obra
                                                )
                                            }
                                        >

                                            <div className="documentos-cliente-selection-main">

                                                <div className="documentos-cliente-selection-icon">
                                                    <FiFolder />
                                                </div>


                                                <div>

                                                    <strong>
                                                        {obra.nome}
                                                    </strong>


                                                    <span>
                                                        {obra.rdo_nome || "RDO não informado"}
                                                    </span>

                                                </div>

                                            </div>


                                            <div className="documentos-cliente-selection-info">

                                                <span>

                                                    {docs.length}

                                                    {" "}

                                                    {docs.length === 1
                                                        ? "documento"
                                                        : "documentos"}

                                                </span>


                                                <FiArrowLeft
                                                    className="documentos-cliente-selection-arrow"
                                                />

                                            </div>

                                        </button>

                                    );

                                }
                            )}

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                MODAL DOCUMENTOS DA OBRA
            ================================================= */}

            {modalDocumentosObra &&
                obraSelecionada && (

                <div className="documentos-cliente-modal-overlay">

                    <div className="documentos-cliente-modal documentos-cliente-modal-documents">

                        <div className="documentos-cliente-modal-header">

                            <div>

                                <span>
                                    DOCUMENTOS DA OBRA
                                </span>


                                <h2>
                                    {obraSelecionada.nome}
                                </h2>


                                <p>

                                    RDO:{" "}
                                    {obraSelecionada.rdo_nome || "-"}

                                    {" · "}

                                    Marceneiro:{" "}
                                    {obraSelecionada.marceneiro_nome || "-"}

                                    {" · "}

                                    Projetista:{" "}
                                    {obraSelecionada.projetista_nome || "-"}

                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    fecharDocumentosObra
                                }
                            >
                                <FiX />
                            </button>

                        </div>


                        <div className="documentos-cliente-documents-body">

                            <div className="documentos-cliente-documents-toolbar">

                                <div>

                                    <strong>
                                        {documentosDaObra.length}
                                    </strong>


                                    <span>
                                        {" "}
                                        {documentosDaObra.length === 1
                                            ? "documento"
                                            : "documentos"}
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    className="documentos-cliente-btn documentos-cliente-btn-primary"
                                    onClick={() =>
                                        abrirNovoParaObra(
                                            obraSelecionada
                                        )
                                    }
                                >

                                    <FiPlus />

                                    Adicionar documento

                                </button>

                            </div>


                            {documentosDaObra.length === 0 ? (

                                <div className="documentos-cliente-empty documentos-cliente-empty-modal">

                                    <FiUploadCloud />


                                    <strong>
                                        Nenhum documento cadastrado
                                    </strong>


                                    <span>
                                        Adicione os arquivos desta obra para mantê-los organizados.
                                    </span>


                                    <button
                                        type="button"
                                        className="documentos-cliente-btn documentos-cliente-btn-primary"
                                        onClick={() =>
                                            abrirNovoParaObra(
                                                obraSelecionada
                                            )
                                        }
                                    >

                                        <FiPlus />

                                        Adicionar primeiro documento

                                    </button>

                                </div>

                            ) : (

                                <div className="documentos-cliente-groups">

                                    {TIPOS_DOCUMENTO.map(
                                        tipo => {

                                            const lista =
                                                documentosAgrupados[
                                                    tipo.value
                                                ] || [];


                                            if (
                                                lista.length === 0
                                            ) {
                                                return null;
                                            }


                                            return (

                                                <section
                                                    className="documentos-cliente-group"
                                                    key={
                                                        tipo.value
                                                    }
                                                >

                                                    <div className="documentos-cliente-group-header">

                                                        <div>

                                                            <span className="documentos-cliente-group-icon">
                                                                <FiFolder />
                                                            </span>


                                                            <div>

                                                                <h3>
                                                                    {tipo.label}
                                                                </h3>


                                                                <span>
                                                                    {lista.length}{" "}
                                                                    {lista.length === 1
                                                                        ? "arquivo"
                                                                        : "arquivos"}
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </div>


                                                    <div className="documentos-cliente-file-list">

                                                        {lista.map(
                                                            documento => (

                                                                <div
                                                                    className="documentos-cliente-file"
                                                                    key={
                                                                        documento.id
                                                                    }
                                                                >

                                                                    <div className="documentos-cliente-file-type">

                                                                        {obterIconeDocumento(
                                                                            documento
                                                                        )}

                                                                    </div>


                                                                    <div className="documentos-cliente-file-info">

                                                                        <strong
                                                                            title={
                                                                                documento.nome
                                                                            }
                                                                        >
                                                                            {documento.nome}
                                                                        </strong>


                                                                        <span
                                                                            title={
                                                                                documento.nome_arquivo
                                                                            }
                                                                        >
                                                                            {documento.nome_arquivo}
                                                                        </span>


                                                                        <small>

                                                                            {(
                                                                                documento.extensao ||
                                                                                obterExtensao(
                                                                                    documento.nome_arquivo
                                                                                )
                                                                            )
                                                                                .toUpperCase() || "ARQUIVO"}

                                                                            {" · "}

                                                                            {formatarTamanho(
                                                                                documento.tamanho
                                                                            )}

                                                                            {" · "}

                                                                            {formatarData(
                                                                                documento.created_at
                                                                            )}

                                                                        </small>

                                                                    </div>


                                                                    <div className="documentos-cliente-file-actions">

                                                                        {/* =========================================
                                                                            VISUALIZAR
                                                                        ========================================= */}

                                                                        <button
                                                                            type="button"
                                                                            title="Visualizar arquivo"
                                                                            onClick={() =>
                                                                                abrirPreview(
                                                                                    documento
                                                                                )
                                                                            }
                                                                        >
                                                                            <FiEye />
                                                                        </button>


                                                                        {/* =========================================
                                                                            EDITAR
                                                                        ========================================= */}

                                                                        <button
                                                                            type="button"
                                                                            title="Editar"
                                                                            onClick={() =>
                                                                                abrirEdicao(
                                                                                    documento
                                                                                )
                                                                            }
                                                                        >
                                                                            <FiEdit2 />
                                                                        </button>


                                                                        {/* =========================================
                                                                            EXCLUIR
                                                                        ========================================= */}

                                                                        <button
                                                                            type="button"
                                                                            className="documentos-cliente-file-delete"
                                                                            title="Excluir"
                                                                            onClick={() =>
                                                                                abrirExclusao(
                                                                                    documento
                                                                                )
                                                                            }
                                                                        >
                                                                            <FiTrash2 />
                                                                        </button>

                                                                    </div>

                                                                </div>

                                                            )
                                                        )}

                                                    </div>

                                                </section>

                                            );

                                        }
                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                MODAL NOVO / EDITAR
            ================================================= */}

            {modalDocumento && (

                <div className="documentos-cliente-modal-overlay">

                    <div className="documentos-cliente-modal documentos-cliente-modal-form">

                        <div className="documentos-cliente-modal-header">

                            <div>

                                <span>

                                    {documentoSelecionado
                                        ? "EDITAR DOCUMENTO"
                                        : "NOVO DOCUMENTO"}

                                </span>


                                <h2>

                                    {documentoSelecionado
                                        ? "Alterar documento"
                                        : "Adicionar documento"}

                                </h2>


                                <p>

                                    {documentoSelecionado
                                        ? "Altere as informações ou substitua o arquivo."
                                        : "Cadastre um arquivo para uma obra em andamento."}

                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    fecharModalDocumento
                                }
                                disabled={
                                    salvando
                                }
                            >
                                <FiX />
                            </button>

                        </div>


                        <form
                            className="documentos-cliente-form"
                            onSubmit={
                                salvar
                            }
                        >

                            <div className="documentos-cliente-form-grid">

                                <div className="documentos-cliente-field documentos-cliente-field-full">

                                    <label>
                                        Obra
                                    </label>


                                    <select
                                        value={
                                            form.obra_id
                                        }
                                        onChange={event =>
                                            alterarCampo(
                                                "obra_id",
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            !!documentoSelecionado ||
                                            salvando
                                        }
                                        required
                                    >

                                        <option value="">
                                            Selecione a obra
                                        </option>


                                        {obras.map(
                                            obra => (

                                                <option
                                                    value={
                                                        obra.id
                                                    }
                                                    key={
                                                        obra.id
                                                    }
                                                >
                                                    {obra.nome}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                <div className="documentos-cliente-form-work-info">

                                    {form.obra_id && (

                                        <>

                                            <div>

                                                <span>
                                                    RDO
                                                </span>


                                                <strong>

                                                    {obras.find(
                                                        obra =>
                                                            String(
                                                                obra.id
                                                            ) ===
                                                            String(
                                                                form.obra_id
                                                            )
                                                    )?.rdo_nome || "-"}

                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    Marceneiro
                                                </span>


                                                <strong>

                                                    {obras.find(
                                                        obra =>
                                                            String(
                                                                obra.id
                                                            ) ===
                                                            String(
                                                                form.obra_id
                                                            )
                                                    )?.marceneiro_nome || "-"}

                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    Projetista
                                                </span>


                                                <strong>

                                                    {obras.find(
                                                        obra =>
                                                            String(
                                                                obra.id
                                                            ) ===
                                                            String(
                                                                form.obra_id
                                                            )
                                                    )?.projetista_nome || "-"}

                                                </strong>

                                            </div>

                                        </>

                                    )}

                                </div>


                                <div className="documentos-cliente-field">

                                    <label>
                                        Nome do documento
                                    </label>


                                    <input
                                        type="text"
                                        value={
                                            form.nome
                                        }
                                        onChange={event =>
                                            alterarCampo(
                                                "nome",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Ex.: Projeto executivo cozinha"
                                        disabled={
                                            salvando
                                        }
                                        required
                                    />

                                </div>


                                <div className="documentos-cliente-field">

                                    <label>
                                        Tipo
                                    </label>


                                    <select
                                        value={
                                            form.tipo
                                        }
                                        onChange={event =>
                                            alterarCampo(
                                                "tipo",
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            salvando
                                        }
                                    >

                                        {TIPOS_DOCUMENTO.map(
                                            tipo => (

                                                <option
                                                    value={
                                                        tipo.value
                                                    }
                                                    key={
                                                        tipo.value
                                                    }
                                                >
                                                    {tipo.label}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                <div className="documentos-cliente-field documentos-cliente-field-full">

                                    <label>

                                        Arquivo

                                        {documentoSelecionado && (

                                            <small>
                                                Opcional para manter o arquivo atual
                                            </small>

                                        )}

                                    </label>


                                    <div className="documentos-cliente-upload">

                                        <input
                                            ref={
                                                inputArquivoRef
                                            }
                                            type="file"
                                            onChange={
                                                handleArquivo
                                            }
                                            disabled={
                                                salvando
                                            }
                                        />


                                        <div className="documentos-cliente-upload-content">

                                            <FiUploadCloud />


                                            <div>

                                                <strong>

                                                    {form.arquivo
                                                        ? form.arquivo.name
                                                        : documentoSelecionado
                                                            ? documentoSelecionado.nome_arquivo
                                                            : "Selecione um arquivo"}

                                                </strong>


                                                <span>

                                                    {form.arquivo
                                                        ? formatarTamanho(
                                                            form.arquivo.size
                                                        )
                                                        : "Imagens, PDF, SketchUp, Word, Excel e outros formatos"}

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            <div className="documentos-cliente-form-footer">

                                <button
                                    type="button"
                                    className="documentos-cliente-btn documentos-cliente-btn-secondary"
                                    onClick={
                                        fecharModalDocumento
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    Cancelar
                                </button>


                                <button
                                    type="submit"
                                    className="documentos-cliente-btn documentos-cliente-btn-primary"
                                    disabled={
                                        salvando
                                    }
                                >

                                    {salvando ? (

                                        <>

                                            <FiRefreshCw
                                                className="documentos-cliente-spin"
                                            />

                                            Salvando...

                                        </>

                                    ) : (

                                        <>

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
                MODAL PRÉ-VISUALIZAÇÃO
            ================================================= */}

            {modalPreview &&
                previewDocumento && (

                <div
                    className="documentos-cliente-modal-overlay documentos-cliente-preview-overlay"
                    onMouseDown={event => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            fecharPreview();
                        }

                    }}
                >

                    <div className="documentos-cliente-modal documentos-cliente-preview-modal">

                        {/* =========================================
                            HEADER
                        ========================================= */}

                        <div className="documentos-cliente-modal-header">

                            <div>

                                <span>
                                    VISUALIZAÇÃO
                                </span>


                                <h2>
                                    {previewDocumento.nome}
                                </h2>


                                <p>

                                    {previewDocumento.nome_arquivo}

                                    {" · "}

                                    {(
                                        previewDocumento.extensao ||
                                        obterExtensao(
                                            previewDocumento.nome_arquivo
                                        )
                                    )
                                        .toUpperCase() || "ARQUIVO"}

                                    {" · "}

                                    {formatarTamanho(
                                        previewDocumento.tamanho
                                    )}

                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    fecharPreview
                                }
                            >
                                <FiX />
                            </button>

                        </div>


                        {/* =========================================
                            CONTEÚDO
                        ========================================= */}

                        <div className="documentos-cliente-preview-body">

                            {carregandoPreview ? (

                                <div className="documentos-cliente-preview-loading">

                                    <FiRefreshCw
                                        className="documentos-cliente-spin"
                                    />


                                    <strong>
                                        Carregando arquivo...
                                    </strong>

                                </div>

                            ) : !previewUrl ? (

                                <div className="documentos-cliente-preview-empty">

                                    <FiFile />


                                    <strong>
                                        Não foi possível visualizar este arquivo.
                                    </strong>

                                </div>

                            ) : previewTipo === "image" ? (

                                <div className="documentos-cliente-preview-image-wrapper">

                                    <img
                                        src={
                                            previewUrl
                                        }
                                        alt={
                                            previewDocumento.nome
                                        }
                                        className="documentos-cliente-preview-image"
                                    />

                                </div>

                            ) : previewTipo === "pdf" ? (

                                <iframe
                                    src={
                                        previewUrl
                                    }
                                    title={
                                        previewDocumento.nome
                                    }
                                    className="documentos-cliente-preview-pdf"
                                />

                            ) : previewTipo === "video" ? (

                                <div className="documentos-cliente-preview-media">

                                    <video
                                        src={
                                            previewUrl
                                        }
                                        controls
                                        autoPlay={false}
                                        className="documentos-cliente-preview-video"
                                    />

                                </div>

                            ) : previewTipo === "audio" ? (

                                <div className="documentos-cliente-preview-audio">

                                    <div className="documentos-cliente-preview-audio-icon">
                                        <FiFile />
                                    </div>


                                    <strong>
                                        {previewDocumento.nome}
                                    </strong>


                                    <span>
                                        {previewDocumento.nome_arquivo}
                                    </span>


                                    <audio
                                        src={
                                            previewUrl
                                        }
                                        controls
                                        className="documentos-cliente-preview-audio-player"
                                    />

                                </div>

                            ) : (

                                <div className="documentos-cliente-preview-unsupported">

                                    <div className="documentos-cliente-preview-unsupported-icon">
                                        <FiFile />
                                    </div>


                                    <span>
                                        {obterLabelTipo(
                                            previewDocumento.tipo
                                        )}
                                    </span>


                                    <h3>
                                        Pré-visualização não disponível
                                    </h3>


                                    <p>
                                        Este formato não pode ser aberto
                                        diretamente no navegador.
                                    </p>


                                    <strong>
                                        {previewDocumento.nome_arquivo}
                                    </strong>


                                    <button
                                        type="button"
                                        className="documentos-cliente-btn documentos-cliente-btn-primary"
                                        onClick={() =>
                                            baixarDocumento(
                                                previewDocumento
                                            )
                                        }
                                    >

                                        <FiDownload />

                                        Baixar arquivo

                                    </button>

                                </div>

                            )}

                        </div>


                        {/* =========================================
                            FOOTER
                        ========================================= */}

                        <div className="documentos-cliente-preview-footer">

                            <div>

                                <span>
                                    {obterLabelTipo(
                                        previewDocumento.tipo
                                    )}
                                </span>


                                <span>
                                    {formatarData(
                                        previewDocumento.created_at
                                    )}
                                </span>

                            </div>


                            <div>

                                <button
                                    type="button"
                                    className="documentos-cliente-btn documentos-cliente-btn-secondary"
                                    onClick={() =>
                                        baixarDocumento(
                                            previewDocumento
                                        )
                                    }
                                >

                                    <FiDownload />

                                    Baixar arquivo

                                </button>


                                <button
                                    type="button"
                                    className="documentos-cliente-btn documentos-cliente-btn-primary"
                                    onClick={
                                        fecharPreview
                                    }
                                >
                                    Fechar
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                MODAL EXCLUSÃO
            ================================================= */}

            {modalExclusao &&
                documentoSelecionado && (

                <div className="documentos-cliente-modal-overlay">

                    <div className="documentos-cliente-modal documentos-cliente-modal-delete">

                        <div className="documentos-cliente-delete-icon">
                            <FiTrash2 />
                        </div>


                        <h2>
                            Excluir documento?
                        </h2>


                        <p>
                            Você está prestes a excluir:
                        </p>


                        <strong>
                            {documentoSelecionado.nome}
                        </strong>


                        <span className="documentos-cliente-delete-work">

                            {obterNomeObra(
                                documentoSelecionado.obra_id
                            )}

                        </span>


                        <p>
                            O arquivo também será removido permanentemente.
                        </p>


                        <div className="documentos-cliente-form-footer">

                            <button
                                type="button"
                                className="documentos-cliente-btn documentos-cliente-btn-secondary"
                                onClick={
                                    fecharExclusao
                                }
                                disabled={
                                    salvando
                                }
                            >
                                Cancelar
                            </button>


                            <button
                                type="button"
                                className="documentos-cliente-btn documentos-cliente-btn-danger"
                                onClick={
                                    excluirDocumento
                                }
                                disabled={
                                    salvando
                                }
                            >

                                {salvando ? (

                                    <>

                                        <FiRefreshCw
                                            className="documentos-cliente-spin"
                                        />

                                        Excluindo...

                                    </>

                                ) : (

                                    <>

                                        <FiTrash2 />

                                        Excluir

                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}