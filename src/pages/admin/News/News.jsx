import { useEffect, useState } from "react";
import { supabase } from "../../../services/supabase";
import toast from "react-hot-toast";

import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiImage,
    FiX
} from "react-icons/fi";

import "./News.scss";

export default function News() {

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState(null);

    const [uploading, setUploading] = useState(false);

    const blocoInicial = {

        ordem: 1,

        titulo: "",

        texto: "",

        imagem_url: "",

        imagem_file: null,

        imagem_preview: ""

    };

    const [form, setForm] = useState({

        titulo: "",

        descricao: "",

        capa_url: "",

        capa_file: null,

        status: "publicado",

        blocos: [

            {

                ...blocoInicial

            }

        ]

    });

    useEffect(() => {

        buscarNoticias();

    }, []);

    async function buscarNoticias() {

        setLoading(true);

        const { data, error } = await supabase

            .from("news")

            .select(`
                *,
                news_blocks(*)
            `)

            .order("created_at", {

                ascending: false

            });

        if (error) {

            console.log(error);

            toast.error("Erro ao carregar notícias.");

            setLoading(false);

            return;

        }

        const lista = (data || []).map(item => ({

            ...item,

            news_blocks:

                (item.news_blocks || [])

                    .sort((a, b) => a.ordem - b.ordem)

        }));

        setNews(lista);

        setLoading(false);

    }

    async function uploadImagem(file) {

        if (!file) return null;

        try {

            setUploading(true);

            const extensao = file.name.split(".").pop();

            const nome = `${Date.now()}-${Math.random()}.${extensao}`;

            const { error } = await supabase

                .storage

                .from("news")

                .upload(nome, file);

            if (error) throw error;

            const { data } = supabase

                .storage

                .from("news")

                .getPublicUrl(nome);

            return data.publicUrl;

        }

        catch (err) {

            console.log(err);

            toast.error("Erro ao enviar imagem.");

            return null;

        }

        finally {

            setUploading(false);

        }

    }

    function abrirModal() {

        setEditando(null);

        setForm({

            titulo: "",

            descricao: "",

            capa_url: "",

            capa_file: null,

            status: "publicado",

            blocos: [

                {

                    ...blocoInicial

                }

            ]

        });

        setModal(true);

    }

    function editarNoticia(item) {

        setEditando(item.id);

        setForm({

            titulo: item.titulo,

            descricao: item.descricao || "",

            capa_url: item.capa_url || "",

            capa_file: null,

            status: item.status,

            blocos:

                item.news_blocks.length

                    ?

                    item.news_blocks.map(bloco => ({

                        ordem: bloco.ordem,

                        titulo: bloco.titulo || "",

                        texto: bloco.texto || "",

                        imagem_url: bloco.imagem_url || "",

                        imagem_preview: bloco.imagem_url || "",

                        imagem_file: null

                    }))

                    :

                    [

                        {

                            ...blocoInicial

                        }

                    ]

        });

        setModal(true);

    }

    function alterarCampo(campo, valor) {

        setForm({

            ...form,

            [campo]: valor

        });

    }

    function alterarCapa(e) {

        const arquivo = e.target.files[0];

        if (!arquivo) return;

        setForm({

            ...form,

            capa_file: arquivo,

            capa_url: URL.createObjectURL(arquivo)

        });

    }

    function adicionarBloco() {

        setForm({

            ...form,

            blocos: [

                ...form.blocos,

                {

                    ...blocoInicial,

                    ordem: form.blocos.length + 1

                }

            ]

        });

    }

    function removerBloco(index) {

        if (form.blocos.length === 1) {

            toast.error("A notícia precisa ter ao menos uma seção.");

            return;

        }

        const novos = form.blocos

            .filter((_, i) => i !== index)

            .map((item, i) => ({

                ...item,

                ordem: i + 1

            }));

        setForm({

            ...form,

            blocos: novos

        });

    }

    function alterarBloco(index, campo, valor) {

        const novos = [...form.blocos];

        novos[index][campo] = valor;

        setForm({

            ...form,

            blocos: novos

        });

    }     async function salvar(e) {

        e.preventDefault();

        if (!form.titulo.trim()) {

            toast.error("Digite o título da notícia.");

            return;

        }

        try {

            const { data: userData } = await supabase.auth.getUser();

            const user = userData.user;

            if (!user) {

                toast.error("Usuário não autenticado.");

                return;

            }

            let noticiaId;

            let capaFinal = form.capa_url;

            /*
            ======================================
            Upload da capa
            ======================================
            */

            if (form.capa_file) {

                capaFinal = await uploadImagem(form.capa_file);

            }

            /*
            ======================================
            Editar notícia
            ======================================
            */

            if (editando) {

                const { error } = await supabase

                    .from("news")

                    .update({

                        titulo: form.titulo,

                        descricao: form.descricao,

                        capa_url: capaFinal,

                        status: form.status

                    })

                    .eq("id", editando);

                if (error) throw error;

                noticiaId = editando;

                await supabase

                    .from("news_blocks")

                    .delete()

                    .eq("news_id", noticiaId);

            }

            /*
            ======================================
            Criar notícia
            ======================================
            */

            else {

                const {

                    data,

                    error

                } = await supabase

                    .from("news")

                    .insert({

                        titulo: form.titulo,

                        descricao: form.descricao,

                        capa_url: capaFinal,

                        status: form.status,

                        autor_id: user.id

                    })

                    .select()

                    .single();

                if (error) throw error;

                noticiaId = data.id;

            }

            /*
            ======================================
            Upload dos blocos
            ======================================
            */

            const blocos = [];

            for (let i = 0; i < form.blocos.length; i++) {

                const bloco = form.blocos[i];

                let imagemFinal = bloco.imagem_url || null;

                if (bloco.imagem_file) {

                    imagemFinal = await uploadImagem(

                        bloco.imagem_file

                    );

                }

                blocos.push({

                    news_id: noticiaId,

                    ordem: i + 1,

                    tipo: "texto",

                    titulo: bloco.titulo,

                    texto: bloco.texto,

                    imagem_url: imagemFinal

                });

            }

         if (blocos.length > 0) {

    const {
        error: blocoError
    } = await supabase
        .from("news_blocks")
        .insert(blocos);


    if (blocoError) {

        throw blocoError;

    }

}


    
            toast.success(

                editando

                    ? "Artigo atualizado."

                    : "Artigo criado."

            );

            setModal(false);

           await buscarNoticias();

        }

        catch (err) {

    console.log("ERRO COMPLETO:", err);

    toast.error(
        err?.message || "Erro ao salvar artigo."
    );

}

    }

    async function excluirNoticia(id) {

        const confirmar = window.confirm(

            "Deseja realmente excluir este artigo?"

        );

        if (!confirmar)

            return;

        const { error } = await supabase

            .from("news")

            .delete()

            .eq("id", id);

        if (error) {

            toast.error("Erro ao excluir.");

            return;

        }

        toast.success("Artigo removido.");

        buscarNoticias();

    }

    return (

        <section className="news-admin">

            <div className="news-admin__top">

                <div>

                    <span>

                        Painel Administrativo

                    </span>

                    <h1>

                        Gerenciamento de artigos

                    </h1>

                    <p>

                        Adicione, edite ou remova artigos do site.

                    </p>

                </div>

                <button

                    className="btn-add"

                    onClick={abrirModal}

                >

                    <FiPlus />

                    Novo artigo

                </button>

            </div>

            {

                loading

                    ?

                    (

                        <div className="news-loading">

                            Carregando...

                        </div>

                    )

                    :

                    (

                        <div className="news-grid">

                            {

                                news.map(item => (

                                    <article

                                        className="news-card"

                                        key={item.id}

                                    >

                                        <div className="news-card__image">

                                            <img

                                                src={

                                                    item.capa_url ||

                                                    "https://placehold.co/700x500"

                                                }

                                                alt=""

                                            />

                                        </div>

                                        <div className="news-card__content">

                                            <h3>

                                                {item.titulo}

                                            </h3>

                                            <p>

                                                {item.descricao}

                                            </p>

                                            <div className="news-card__footer">

                                                <button

                                                    onClick={() => editarNoticia(item)}

                                                >

                                                    <FiEdit2 />

                                                    Editar

                                                </button>

                                                <button

                                                    className="danger"

                                                    onClick={() => excluirNoticia(item.id)}

                                                >

                                                    <FiTrash2 />

                                                    Excluir

                                                </button>

                                            </div>

                                        </div>

                                    </article>

                                ))

                            }

                        </div>

                    )

            }

                         {
                modal && (

                    <div className="news-modal">

                        <div className="news-modal__overlay" />

                        <div className="news-modal__content">

                            <div className="news-modal__header">

                                <div>

                                    <span>Painel de edição</span>

                                    <h2>

                                        {

                                            editando

                                                ? "Editar artigo"

                                                : "Novo artigo"

                                        }

                                    </h2>

                                </div>

                                <button

                                    type="button"

                                    className="close"

                                    onClick={() => setModal(false)}

                                >

                                    <FiX />

                                </button>

                            </div>

                            <form

                                className="news-form"

                                onSubmit={salvar}

                            >

                                <div className="form-group">

                                    <label>

                                        Título

                                    </label>

                                    <input

                                        type="text"

                                        value={form.titulo}

                                        onChange={e =>

                                            alterarCampo(

                                                "titulo",

                                                e.target.value

                                            )

                                        }

                                        placeholder="Título do artigo"

                                    />

                                </div>

                                <div className="form-group">

                                    <label>

                                        Descrição

                                    </label>

                                    <textarea

                                        rows={3}

                                        value={form.descricao}

                                        onChange={e =>

                                            alterarCampo(

                                                "descricao",

                                                e.target.value

                                            )

                                        }

                                        placeholder="Descrição curta"

                                    />

                                </div>

                                <div className="form-group">

                                    <label>

                                        Imagem de capa

                                    </label>

                                    <label className="upload-capa">

                                        <FiImage />

                                        Selecionar imagem

                                        <input

                                            hidden

                                            type="file"

                                            accept="image/*"

                                            onChange={alterarCapa}

                                        />

                                    </label>

                                    {

                                        form.capa_url &&

                                        <img

                                            className="preview-capa"

                                            src={form.capa_url}

                                            alt=""

                                        />

                                    }

                                </div>

                                <div className="news-divider">

                                    Conteúdo do artigo

                                </div>

                                {

                                    form.blocos.map(

                                        (

                                            bloco,

                                            index

                                        ) => (

                                            <div

                                                className="bloco-card"

                                                key={index}

                                            >

                                                <div className="bloco-top">

                                                    <h3>

                                                        Seção {index + 1}

                                                    </h3>

                                                    {

                                                        form.blocos.length > 1 &&

                                                        <button

                                                            type="button"

                                                            className="btn-remove"

                                                            onClick={() =>

                                                                removerBloco(index)

                                                            }

                                                        >

                                                            <FiTrash2 />

                                                        </button>

                                                    }

                                                </div>

                                                <div className="form-group">

                                                    <label>

                                                        Título da seção

                                                    </label>

                                                    <input

                                                        value={bloco.titulo}

                                                        onChange={e =>

                                                            alterarBloco(

                                                                index,

                                                                "titulo",

                                                                e.target.value

                                                            )

                                                        }

                                                    />

                                                </div>

                                                <div className="form-group">

                                                    <label>

                                                        Texto

                                                    </label>

                                                    <textarea

                                                        rows={7}

                                                        value={bloco.texto}

                                                        onChange={e =>

                                                            alterarBloco(

                                                                index,

                                                                "texto",

                                                                e.target.value

                                                            )

                                                        }

                                                    />

                                                </div>

                                                <div className="form-group">

                                                    <label>

                                                        Imagem

                                                    </label>

                                                    <label className="upload-imagem">

                                                        <FiImage />

                                                        Selecionar imagem

                                                        <input

                                                            hidden

                                                            type="file"

                                                            accept="image/*"

                                                            onChange={e => {

                                                                const arquivo = e.target.files[0];

                                                                if (!arquivo) return;

                                                                const novos = [...form.blocos];

                                                                novos[index].imagem_file = arquivo;

                                                                novos[index].imagem_preview =

                                                                    URL.createObjectURL(arquivo);

                                                                setForm({

                                                                    ...form,

                                                                    blocos: novos

                                                                });

                                                            }}

                                                        />

                                                    </label>

                                                    {

                                                        bloco.imagem_preview &&

                                                        <img

                                                            src={bloco.imagem_preview}

                                                            className="preview-bloco"

                                                            alt=""

                                                        />

                                                    }

                                                </div>

                                            </div>

                                        )

                                    )

                                }

                                <button

                                    type="button"

                                    className="btn-add-section"

                                    onClick={adicionarBloco}

                                >

                                    <FiPlus />

                                    Adicionar nova seção

                                </button>                                 <div className="news-form__actions">

                                    <button

                                        type="button"

                                        className="btn-cancel"

                                        onClick={() => setModal(false)}

                                    >

                                        Cancelar

                                    </button>

                                    <button

                                        type="submit"

                                        className="btn-save"

                                        disabled={uploading}

                                    >

                                        {

                                            uploading

                                                ? "Enviando..."

                                                : editando

                                                    ? "Salvar alterações"

                                                    : "Publicar artigo"

                                        }

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )

            }

        </section>

    );

}
