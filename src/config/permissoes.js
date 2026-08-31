export const permissoes = {

    administrativo_geral: [
        "dashboard",
        "comercial",
        "producao",
        "financeiro",
        "projetos",
        "estoque",
        "news",
        "usuarios"
    ],

    comercial: [
        "comercial"
    ],

    producao: [
        "producao"
    ],

    financeiro: [
        "financeiro"
    ],

    homologado: [],

    parceiro: []

};


export function podeAcessar(role, permissao) {

    return (
        permissoes[role]?.includes(permissao) ?? false
    );

}