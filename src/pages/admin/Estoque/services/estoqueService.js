import { supabase } from "../../../../services/supabase";

// =====================================================
// PRODUTOS
// =====================================================

export async function listarProdutos() {
  const { data, error } = await supabase
    .from("estoque_resumo")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function buscarProduto(id) {
  const { data, error } = await supabase
    .from("estoque_resumo")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function criarProduto({
  nome,
  sku,
  codigoAlme,
  valorUnitario,
  preco,
}) {
  const { data, error } = await supabase.rpc(
    "criar_produto_estoque",
    {
      p_nome: nome,
      p_sku: sku,
      p_codigo_alme: codigoAlme,
      p_valor_unitario: valorUnitario,
      p_preco: preco,
    }
  );

  if (error) throw error;

  return data;
}

export async function editarProduto({
  id,
  nome,
  sku,
  codigoAlme,
  valorUnitario,
  preco,
}) {
  const { data, error } = await supabase.rpc(
    "editar_produto_estoque",
    {
      p_id: id,
      p_nome: nome,
      p_sku: sku,
      p_codigo_alme: codigoAlme,
      p_valor_unitario: valorUnitario,
      p_preco: preco,
    }
  );

  if (error) throw error;

  return data;
}

export async function excluirProduto(id) {
  const { data, error } = await supabase.rpc(
    "excluir_produto_estoque",
    {
      p_id: id,
    }
  );

  if (error) throw error;

  return data;
}

// =====================================================
// ENTRADAS
// =====================================================

export async function listarEntradas() {
  const { data, error } = await supabase
    .from("estoque_entradas")
    .select(`
      *,
      estoque_produtos (
        id,
        nome,
        sku,
        codigo_alme
      )
    `)
    .order("data_entrada", {
      ascending: false,
    })
    .order("id", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

export async function criarEntrada({
  produtoId,
  nfEntrada,
  nomeItem,
  sku,
  codigoAlme,
  quantidade,
  valorUnitario,
  valorTotal,
  valorUnitarioFinal,
  preco,
}) {
  const { data, error } = await supabase.rpc(
    "criar_entrada_estoque",
    {
      p_produto_id: produtoId,
      p_nf_entrada: nfEntrada,
      p_nome_item: nomeItem,
      p_sku: sku,
      p_codigo_alme: codigoAlme,
      p_quantidade: quantidade,
      p_valor_unitario: valorUnitario,
      p_valor_total: valorTotal,
      p_valor_unitario_final: valorUnitarioFinal,
      p_preco: preco,
    }
  );

  if (error) throw error;

  return data;
}

export async function editarEntrada({
  id,
  produtoId,
  nfEntrada,
  nomeItem,
  sku,
  codigoAlme,
  quantidade,
  valorUnitario,
  valorTotal,
  valorUnitarioFinal,
  preco,
}) {
  const { data, error } = await supabase.rpc(
    "editar_entrada_estoque",
    {
      p_id: id,
      p_produto_id: produtoId,
      p_nf_entrada: nfEntrada,
      p_nome_item: nomeItem,
      p_sku: sku,
      p_codigo_alme: codigoAlme,
      p_quantidade: quantidade,
      p_valor_unitario: valorUnitario,
      p_valor_total: valorTotal,
      p_valor_unitario_final: valorUnitarioFinal,
      p_preco: preco,
    }
  );

  if (error) throw error;

  return data;
}

export async function excluirEntrada(id) {
  const { data, error } = await supabase.rpc(
    "excluir_entrada_estoque",
    {
      p_id: id,
    }
  );

  if (error) throw error;

  return data;
}

// =====================================================
// SAÍDAS
// =====================================================

export async function listarSaidas() {
  const { data, error } = await supabase
    .from("estoque_saidas")
    .select(`
      *,
      estoque_saida_itens (
        id,
        produto_id,
        quantidade,
        preco_unitario,
        valor_total,
        estoque_produtos (
          id,
          nome,
          sku,
          codigo_alme
        )
      )
    `)
    .order("data_saida", {
      ascending: false,
    })
    .order("id", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

// =====================================================
// CRIAR SAÍDA
// =====================================================

export async function criarSaida({
  produtoId,
  quantidade,
  solicitante,
}) {
  const nomeSolicitante = String(
    solicitante ?? ""
  ).trim();

  if (!nomeSolicitante) {
    throw new Error(
      "Informe o nome da pessoa que está retirando o produto."
    );
  }

  const quantidadeNumerica = Number(quantidade);
  const produtoIdNumerico = Number(produtoId);

  if (
    !Number.isFinite(produtoIdNumerico) ||
    produtoIdNumerico <= 0
  ) {
    throw new Error("Produto inválido.");
  }

  if (
    !Number.isFinite(quantidadeNumerica) ||
    quantidadeNumerica <= 0
  ) {
    throw new Error(
      "Informe uma quantidade maior que zero."
    );
  }

  const { data, error } = await supabase.rpc(
    "criar_saida_estoque",
    {
      p_produto_id: produtoIdNumerico,
      p_quantidade: quantidadeNumerica,
      p_solicitante: nomeSolicitante,
    }
  );

  if (error) throw error;

  return data;
}

// =====================================================
// EDITAR ITEM DA SAÍDA
// =====================================================

export async function editarSaidaItem({
  itemId,
  quantidade,
}) {
  const { data, error } = await supabase.rpc(
    "editar_saida_item_estoque",
    {
      p_item_id: itemId,
      p_quantidade: quantidade,
    }
  );

  if (error) throw error;

  return data;
}

// =====================================================
// EXCLUIR SAÍDA
// =====================================================

export async function excluirSaida(id) {
  const { data, error } = await supabase.rpc(
    "excluir_saida_estoque",
    {
      p_saida_id: id,
    }
  );

  if (error) throw error;

  return data;
}

// =====================================================
// ÚLTIMAS SAÍDAS
// =====================================================

export async function listarUltimasSaidas(
  limit = 10
) {
  const { data, error } = await supabase
    .from("estoque_ultimas_saidas")
    .select("*")
    .limit(limit);

  if (error) throw error;

  return data || [];
}