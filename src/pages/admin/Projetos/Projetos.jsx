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

import "./Projetos.scss";

export default function Projetos() {

    const [projetos, setProjetos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [modal, setModal] = useState(false);

    const [editando, setEditando] = useState(null);

    const [modalExcluir, setModalExcluir] = useState(false);

    const [idExcluir, setIdExcluir] = useState(null);

    const [uploading, setUploading] = useState(false);

    const formularioInicial = {

        nome: "",

        titulo: "",

        descricao: "",

        texto: "",

        imagem_capa: "",

        imagem_file: null,

        area: "",

        tempo_producao: "",

        cidade: "",

        escopo: "",

        galeria: [],

        galeria_preview: [],

        imagens_existentes: []

    };

    const [form, setForm] = useState(formularioInicial);

    useEffect(() => {

        buscarProjetos();

    }, []);

    async function buscarProjetos() {

        setLoading(true);

        const { data, error } = await supabase

            .from("projects")

            .select("*")

            .order("created_at", {

                ascending: false

            });

        if (error) {

            console.log(error);

            toast.error("Erro ao carregar projetos.");

            setLoading(false);

            return;

        }

        setProjetos(data || []);

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

                .from("projects")

                .upload(nome, file);

            if (error) throw error;

            const { data } = supabase

                .storage

                .from("projects")

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

    async function uploadGaleria(projectId) {

        if (form.galeria.length === 0) return;

        const imagens = [];

        for (let i = 0; i < form.galeria.length; i++) {

            const file = form.galeria[i];

            const extensao = file.name.split(".").pop();

            const nome = `${Date.now()}-${i}.${extensao}`;

            const { error } = await supabase

                .storage

                .from("projects")

                .upload(nome, file);

            if (error) {

                console.log(error);

                continue;

            }

            const { data } = supabase

                .storage

                .from("projects")

                .getPublicUrl(nome);

            imagens.push({

                project_id: projectId,

                imagem_url: data.publicUrl,

                ordem: i + 1

            });

        }

        if (imagens.length > 0) {

            const { error } = await supabase

                .from("project_images")

                .insert(imagens);

            if (error) {

                console.log(error);

                toast.error("Erro ao salvar galeria.");

            }

        }

    }  function abrirModal() {

        setEditando(null);

        setForm(formularioInicial);

        setModal(true);

    }

    async function editarProjeto(item) {

        const { data: imagens } = await supabase

            .from("project_images")

            .select("*")

            .eq("project_id", item.id)

            .order("ordem");

        setEditando(item.id);

        setForm({

            nome: item.nome || "",

            titulo: item.titulo || "",

            descricao: item.descricao || "",

            texto: item.texto || "",

            imagem_capa: item.imagem_capa || "",

            imagem_file: null,

            area: item.area || "",

            tempo_producao: item.tempo_producao || "",

            cidade: item.cidade || "",

            escopo: item.escopo || "",

            galeria: [],

            galeria_preview: [],

            imagens_existentes: imagens || []

        });

        setModal(true);

    }

    function alterarCampo(campo, valor) {

        setForm({

            ...form,

            [campo]: valor

        });

    }

    function alterarImagem(e) {

        const arquivo = e.target.files[0];

        if (!arquivo) return;

        setForm({

            ...form,

            imagem_file: arquivo,

            imagem_capa: URL.createObjectURL(arquivo)

        });

    }

    function alterarGaleria(e) {

        const arquivos = [...e.target.files];

        if (arquivos.length === 0) return;

        setForm({

            ...form,

            galeria: arquivos,

            galeria_preview: arquivos.map(file =>

                URL.createObjectURL(file)

            )

        });

    }

    function removerPreview(index) {

        const galeria = [...form.galeria];

        const previews = [...form.galeria_preview];

        galeria.splice(index, 1);

        previews.splice(index, 1);

        setForm({

            ...form,

            galeria,

            galeria_preview: previews

        });

    }

    async function removerImagemExistente(id) {

        const { error } = await supabase

            .from("project_images")

            .delete()

            .eq("id", id);

        if (error) {

            toast.error("Erro ao remover imagem.");

            return;

        }

        setForm({

            ...form,

            imagens_existentes:

                form.imagens_existentes.filter(

                    imagem => imagem.id !== id

                )

        });

        toast.success("Imagem removida.");

    }

    async function salvar(e) {

        e.preventDefault();

        try {

            const { data: userData } =

                await supabase.auth.getUser();

            const user = userData.user;

            if (!user) {

                toast.error("Usuário não autenticado.");

                return;

            }

            let capaFinal = form.imagem_capa;

            if (form.imagem_file) {

                capaFinal = await uploadImagem(

                    form.imagem_file

                );

            }

            const dados = {

                nome: form.nome,

                titulo: form.titulo,

                descricao: form.descricao,
texto: form.texto,
                imagem_capa: capaFinal,

                area: form.area,

                tempo_producao: form.tempo_producao,

                cidade: form.cidade,

                escopo: form.escopo

            };

            let projetoId;

            if (editando) {

                const { error } = await supabase

                    .from("projects")

                    .update(dados)

                    .eq("id", editando);

                if (error) throw error;

                projetoId = editando;

                toast.success("Projeto atualizado.");

            }

            else {

                const {

                    data,

                    error

                } = await supabase

                    .from("projects")

                    .insert({

                        ...dados,

                        autor_id: user.id

                    })

                    .select()

                    .single();

                if (error) throw error;

                projetoId = data.id;

                toast.success("Projeto criado.");

            }

            if (form.galeria.length > 0) {

                await uploadGaleria(projetoId);

            }

            setModal(false);

            buscarProjetos();

        }

        catch (err) {

            console.log(err);

            toast.error(

                err.message ||

                "Erro ao salvar projeto."

            );

        }

    }return (

<section className="projects-admin">

    <div className="projects-admin__top">

        <div>

            <span>

                Painel Administrativo

            </span>

            <h1>

                Gerenciamento de projetos

            </h1>

            <p>

                Cadastre e gerencie os projetos realizados.

            </p>

        </div>

        <button

            className="btn-add"

            onClick={abrirModal}

        >

            <FiPlus />

            Novo projeto

        </button>

    </div>

    {

        loading ?

        (

            <div>

                Carregando...

            </div>

        )

        :

        (

            <div className="projects-grid">

                {

                    projetos.map(item=>(

                        <article

                            className="project-card"

                            key={item.id}

                        >

                            <div className="project-card__image">

                                <img

                                    src={

                                        item.imagem_capa ||

                                        "https://placehold.co/700x500"

                                    }

                                    alt=""

                                />

                            </div>

                            <div className="project-card__content">

                                <h3>

                                    {item.titulo}

                                </h3>

                                <p>

                                    {item.descricao}

                                </p>

                                <div className="project-card__footer">

                                    <button

                                        onClick={()=>

                                            editarProjeto(item)

                                        }

                                    >

                                        <FiEdit2 />

                                        Editar

                                    </button>

                                    <button

                                        className="danger"

                                        onClick={()=>

                                            confirmarExcluir(item.id)

                                        }

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

            <div className="project-modal">

                <div className="project-modal__content">

                    <header>

                        <h2>

                            {

                                editando

                                ?

                                "Editar projeto"

                                :

                                "Novo projeto"

                            }

                        </h2>

                        <button

                            type="button"

                            onClick={()=>setModal(false)}

                        >

                            X

                        </button>

                    </header>

                    <form onSubmit={salvar}>

                        <label>

                            Nome

                        </label>

                        <input

                            value={form.nome}

                            onChange={e=>

                                alterarCampo(

                                    "nome",

                                    e.target.value

                                )

                            }

                        />

                        <label>

                            Título

                        </label>

                        <input

                            value={form.titulo}

                            onChange={e=>

                                alterarCampo(

                                    "titulo",

                                    e.target.value

                                )

                            }

                        />

                        <label>

                            Descrição

                        </label>

                        <textarea

                            rows={4}

                            value={form.descricao}

                            onChange={e=>

                                alterarCampo(

                                    "descricao",

                                    e.target.value

                                )

                            }

                        />

                        <label>
Texto completo
</label>

<textarea
    rows={10}
    value={form.texto}
    onChange={(e) =>
        alterarCampo("texto", e.target.value)
    }
/>

                        <label className="upload">

                            <FiImage />

                            Selecionar imagem de capa

                            <input

                                hidden

                                type="file"

                                accept="image/*"

                                onChange={alterarImagem}

                            />

                        </label>

                        {

                            form.imagem_capa && (

                                <div className="preview">

                                    <img

                                        src={form.imagem_capa}

                                        alt=""

                                    />

                                    <button

                                        type="button"

                                        onClick={()=>

                                            setForm({

                                                ...form,

                                                imagem_capa:"",

                                                imagem_file:null

                                            })

                                        }

                                    >

                                        <FiX />

                                    </button>

                                </div>

                            )

                        }  <label>

                            Área

                        </label>

                        <input

                            value={form.area}

                            onChange={e=>

                                alterarCampo(

                                    "area",

                                    e.target.value

                                )

                            }

                        />

                        <label>

                            Tempo de produção

                        </label>

                        <input

                            value={form.tempo_producao}

                            onChange={e=>

                                alterarCampo(

                                    "tempo_producao",

                                    e.target.value

                                )

                            }

                        />

                        <label>

                            Cidade

                        </label>

                        <input

                            value={form.cidade}

                            onChange={e=>

                                alterarCampo(

                                    "cidade",

                                    e.target.value

                                )

                            }

                        />

                        <label>

                            Escopo

                        </label>

                        <textarea

                            rows={6}

                            value={form.escopo}

                            onChange={e=>

                                alterarCampo(

                                    "escopo",

                                    e.target.value

                                )

                            }

                        />



                        <label className="upload">

                            <FiImage />

                            Selecionar galeria (até 15 imagens)

                            <input

                                hidden

                                multiple

                                type="file"

                                accept="image/*"

                                onChange={alterarGaleria}

                            />

                        </label>



                        {

                            form.galeria_preview.length > 0 &&

                            <div className="preview-gallery">

                                {

                                    form.galeria_preview.map((img,index)=>(

                                        <div

                                            className="preview-item"

                                            key={index}

                                        >

                                            <img

                                                src={img}

                                                alt=""

                                            />

                                            <button

                                                type="button"

                                                onClick={()=>

                                                    removerPreview(index)

                                                }

                                            >

                                                <FiX/>

                                            </button>

                                        </div>

                                    ))

                                }

                            </div>

                        }



                        {

                            form.imagens_existentes.length > 0 &&

                            <>

                                <h3 className="gallery-title">

                                    Imagens cadastradas

                                </h3>

                                <div className="preview-gallery">

                                    {

                                        form.imagens_existentes.map(imagem=>(

                                            <div

                                                className="preview-item"

                                                key={imagem.id}

                                            >

                                                <img

                                                    src={imagem.imagem_url}

                                                    alt=""

                                                />

                                                <button

                                                    type="button"

                                                    onClick={()=>

                                                        removerImagemExistente(imagem.id)

                                                    }

                                                >

                                                    <FiX/>

                                                </button>

                                            </div>

                                        ))

                                    }

                                </div>

                            </>

                        }



                        <div className="actions">

                            <button

                                type="button"

                                onClick={()=>setModal(false)}

                            >

                                Cancelar

                            </button>

                            <button

                                type="submit"

                                disabled={uploading}

                            >

                                {

                                    uploading

                                    ?

                                    "Enviando..."

                                    :

                                    editando

                                    ?

                                    "Salvar alterações"

                                    :

                                    "Cadastrar projeto"

                                }

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        )

    }



    {

        modalExcluir && (

            <div className="confirm-modal">

                <div>

                    <h2>

                        Excluir projeto?

                    </h2>

                    <p>

                        Essa ação removerá o projeto permanentemente.

                    </p>

                    <div className="actions">

                        <button

                            onClick={()=>

                                setModalExcluir(false)

                            }

                        >

                            Cancelar

                        </button>

                        <button

                            className="danger"

                            onClick={excluirProjeto}

                        >

                            Excluir

                        </button>

                    </div>

                </div>

            </div>

        )

    }

</section>

);

}

