const SEMANAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const AJUDA = [
  "As atividades ficam no arquivo atividades.js, na pasta do projeto.",
  "",
  "rotina",
  "  Vale para todos os dias. Para trocar ou incluir, edite essa lista.",
  "  Cada item tem id, texto e prioridade. Prioridade 1 aparece primeiro.",
  "",
  "futuras",
  "  A chave é a data, no formato AAAA-MM-DD.",
  "  Uma lista soma esses itens ao dia.",
  "  substituiRotina: true troca a rotina inteira naquela data.",
  "",
  "Salve o arquivo e volte a esta janela.",
  "O log é dados/registro.json, com ano, mês, dia e a prioridade.",
  "Marcar um item grava o dia inteiro, inclusive em datas futuras.",
  "",
  "Dia passado que já foi marcado abre pelo registro gravado.",
  "Hoje e os dias futuros abrem pela lista do código.",
  "",
  "N pula para a próxima data que tem atividades próprias.",
  "P volta para a anterior.",
  "",
  "Esc volta",
];

let modo = "lista";
let dataAtual = "";
let atividades = [];
let indice = 0;
let configAtual = { rotina: [], futuras: {} };
let registroAtual = {};
let substituiRotina = false;
let vendoRegistro = false;
let erroAtual = "";
let aviso = "";
let notaConfig = "";
let bufferData = "";
let ocupado = false;
let geracao = 0;

const listaEl = document.getElementById("lista");
const cabecalhoEl = document.getElementById("cabecalho");
const teclasEl = document.getElementById("teclas");
const promptEl = document.getElementById("prompt");

function el(tag, classe, texto) {
  const no = document.createElement(tag);
  if (classe) no.className = classe;
  if (texto != null) no.textContent = texto;
  return no;
}

function partes(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia, data: new Date(ano, mes - 1, dia) };
}

function isoDe(data) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return data.getFullYear() + "-" + mes + "-" + dia;
}

function hojeIso() {
  return isoDe(new Date());
}

function addDias(iso, quantidade) {
  const { data } = partes(iso);
  data.setDate(data.getDate() + quantidade);
  return isoDe(data);
}

function addMeses(iso, quantidade) {
  const { ano, mes, dia } = partes(iso);
  const base = new Date(ano, mes - 1 + quantidade, 1);
  const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(dia, ultimo));
  return isoDe(base);
}

function dataValida(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const { ano, mes, dia, data } = partes(iso);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

function rotuloQuando(iso) {
  const hoje = hojeIso();
  if (iso === hoje) return "hoje";
  return iso > hoje ? "futuro" : "passado";
}

function fraseData(iso) {
  const { ano, mes, dia, data } = partes(iso);
  return SEMANAS[data.getDay()] + ", " + dia + " de " + MESES[mes - 1] + " de " + ano;
}

function barra(total, feitas) {
  const largura = 16;
  if (total <= 0) return "[" + "-".repeat(largura) + "]";
  const cheios = Math.round((feitas / total) * largura);
  return "[" + "#".repeat(cheios) + "-".repeat(largura - cheios) + "]";
}

function primeiroPendente(itens) {
  const achado = itens.findIndex((item) => !item.concluida);
  return achado === -1 ? 0 : achado;
}

function datasAgendadas() {
  const futuras = configAtual.futuras || {};
  return Object.keys(futuras).filter(dataValida).sort();
}

function normalizarItem(item, origem, ordem) {
  if (!item || typeof item !== "object") {
    throw new Error("Há uma atividade vazia em atividades.js.");
  }
  const id = String(item.id || "").trim();
  const texto = String(item.texto || "").trim();
  if (!id || !texto) throw new Error("Toda atividade precisa de id e texto.");
  const prioridade = Number(item.prioridade);
  return {
    id,
    texto,
    prioridade: Number.isFinite(prioridade) ? prioridade : 99,
    origem,
    ordem,
  };
}

function planoDoDia(iso) {
  const rotina = Array.isArray(configAtual.rotina) ? configAtual.rotina : [];
  const futuras = configAtual.futuras && typeof configAtual.futuras === "object" ? configAtual.futuras : {};
  const bruto = futuras[iso];
  let substitui = false;
  let extras = [];
  if (Array.isArray(bruto)) {
    extras = bruto;
  } else if (bruto && typeof bruto === "object") {
    substitui = Boolean(bruto.substituiRotina);
    extras = Array.isArray(bruto.itens) ? bruto.itens : [];
  }

  const base = substitui ? [] : rotina;
  const itens = [];
  let ordem = 0;
  base.forEach((item) => itens.push(normalizarItem(item, "rotina", ordem++)));
  extras.forEach((item) => itens.push(normalizarItem(item, "data", ordem++)));

  const vistos = new Set();
  itens.forEach((item) => {
    if (vistos.has(item.id)) throw new Error('O id "' + item.id + '" está repetido neste dia.');
    vistos.add(item.id);
  });
  itens.sort((a, b) => a.prioridade - b.prioridade || a.ordem - b.ordem);
  return { itens, substitui };
}

function aplicarLog(itens, entrada) {
  const salvas = new Map(((entrada && entrada.atividades) || []).map((item) => [item.id, item]));
  return itens.map((item) => {
    const salva = salvas.get(item.id);
    const concluida = Boolean(salva && salva.concluida);
    return {
      id: item.id,
      texto: item.texto,
      prioridade: item.prioridade,
      origem: item.origem,
      concluida,
      concluidaEm: concluida && salva ? salva.concluidaEm || null : null,
    };
  });
}

function doRegistro(entrada) {
  return (entrada.atividades || []).map((item, ordem) => ({
    id: String(item.id),
    texto: String(item.texto || ""),
    prioridade: Number.isFinite(Number(item.prioridade)) ? Number(item.prioridade) : 99,
    origem: item.origem || "registro",
    concluida: Boolean(item.concluida),
    concluidaEm: item.concluida ? item.concluidaEm || null : null,
    ordem,
  }));
}

function aplicarDia(iso, idPreferido) {
  const entrada = registroAtual[iso];
  const quando = rotuloQuando(iso);
  if (quando === "passado" && entrada && Array.isArray(entrada.atividades) && entrada.atividades.length) {
    atividades = doRegistro(entrada);
    substituiRotina = false;
    vendoRegistro = true;
  } else {
    const plano = planoDoDia(iso);
    atividades = aplicarLog(plano.itens, entrada);
    substituiRotina = plano.substitui;
    vendoRegistro = false;
  }
  dataAtual = iso;
  if (idPreferido) {
    const posicao = atividades.findIndex((item) => item.id === idPreferido);
    indice = posicao >= 0 ? posicao : primeiroPendente(atividades);
  } else {
    indice = primeiroPendente(atividades);
  }
  document.title = "Checklist " + iso;
}

function atualizarNota() {
  const futuras = configAtual.futuras || {};
  const ruins = Object.keys(futuras).filter((chave) => !dataValida(chave));
  notaConfig = ruins.length ? "Data inválida em futuras: " + ruins.join(", ") : "";
}

async function carregarAtividades() {
  const resposta = await fetch("/atividades.js?t=" + Date.now(), { cache: "no-store" });
  if (!resposta.ok) throw new Error("Não encontrei atividades.js.");
  const codigo = await resposta.text();
  let dados;
  try {
    dados = new Function(codigo + "\nreturn typeof CHECKLIST !== 'undefined' ? CHECKLIST : null;")();
  } catch (erro) {
    throw new Error("Erro em atividades.js: " + erro.message);
  }
  if (!dados || typeof dados !== "object") throw new Error("atividades.js precisa definir CHECKLIST.");
  return dados;
}

async function carregarRegistro() {
  const resposta = await fetch("/api/registro", { cache: "no-store" });
  if (!resposta.ok) throw new Error("Não consegui ler o registro.");
  const dados = await resposta.json();
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw new Error("dados\\registro.json precisa ser um objeto.");
  }
  return dados;
}

async function recarregar(preservar) {
  const ticket = ++geracao;
  const idAtual = preservar && atividades[indice] ? atividades[indice].id : null;
  const iso = dataAtual || hojeIso();
  try {
    const [config, registro] = await Promise.all([carregarAtividades(), carregarRegistro()]);
    if (ticket !== geracao) return;
    configAtual = config;
    registroAtual = registro;
    atualizarNota();
    aplicarDia(iso, preservar ? idAtual : null);
    erroAtual = "";
  } catch (erro) {
    if (ticket !== geracao) return;
    atividades = [];
    erroAtual = erro instanceof TypeError
      ? "Não consegui falar com o servidor. Abra o checklist pelo iniciar.bat."
      : (erro.message || "Falha ao carregar.");
  }
  render();
}

function entradaDoDia(iso, lista) {
  const { ano, mes, dia } = partes(iso);
  return {
    ano,
    mes,
    dia,
    atualizadoEm: new Date().toISOString(),
    atividades: lista.map((item) => ({
      id: item.id,
      texto: item.texto,
      prioridade: item.prioridade,
      origem: item.origem,
      concluida: item.concluida,
      concluidaEm: item.concluida ? item.concluidaEm : null,
    })),
  };
}

async function persistir(iso, lista) {
  const resposta = await fetch("/api/registro", { cache: "no-store" });
  if (!resposta.ok) throw new Error("leitura");
  const registro = await resposta.json();
  if (!registro || typeof registro !== "object" || Array.isArray(registro)) throw new Error("registro");
  registro[iso] = entradaDoDia(iso, lista);
  const ordenado = {};
  Object.keys(registro).sort().forEach((chave) => {
    ordenado[chave] = registro[chave];
  });
  const gravacao = await fetch("/api/registro", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(ordenado, null, 2),
  });
  if (!gravacao.ok) throw new Error("gravacao");
  registroAtual = ordenado;
}

async function alternarAtual() {
  if (ocupado || modo !== "lista" || erroAtual || atividades.length === 0) return;
  const item = atividades[indice];
  if (!item) return;
  const antes = item.concluida;
  const antesEm = item.concluidaEm;
  item.concluida = !antes;
  item.concluidaEm = item.concluida ? new Date().toISOString() : null;
  const iso = dataAtual;
  const snapshot = atividades.map((atual) => ({ ...atual }));
  render();
  ocupado = true;
  try {
    await persistir(iso, snapshot);
    aviso = "";
  } catch (erro) {
    item.concluida = antes;
    item.concluidaEm = antesEm;
    aviso = "Não consegui gravar dados\\registro.json.";
    render();
  } finally {
    ocupado = false;
  }
}

function irPara(iso) {
  if (!dataValida(iso)) {
    aviso = "Essa data não existe.";
    render();
    return;
  }
  try {
    aplicarDia(iso, null);
    erroAtual = "";
    aviso = "";
  } catch (erro) {
    dataAtual = iso;
    atividades = [];
    erroAtual = erro.message;
  }
  render();
}

function pularAgendada(direcao) {
  const datas = datasAgendadas();
  const destino = direcao > 0
    ? datas.find((data) => data > dataAtual)
    : datas.filter((data) => data < dataAtual).pop();
  if (!destino) {
    aviso = direcao > 0
      ? "Não há próxima data com atividades próprias."
      : "Não há data anterior com atividades próprias.";
    render();
    return;
  }
  irPara(destino);
}

function formatarBuffer(digitos) {
  const ano = (digitos.slice(0, 4) + "____").slice(0, 4);
  const mes = (digitos.slice(4, 6) + "__").slice(0, 2);
  const dia = (digitos.slice(6, 8) + "__").slice(0, 2);
  return ano + "-" + mes + "-" + dia;
}

function confirmarData() {
  if (bufferData.length !== 8) {
    aviso = "A data precisa ter 8 números: ano, mês e dia.";
    render();
    return;
  }
  const iso = bufferData.slice(0, 4) + "-" + bufferData.slice(4, 6) + "-" + bufferData.slice(6, 8);
  if (!dataValida(iso)) {
    aviso = "Essa data não existe.";
    render();
    return;
  }
  modo = "lista";
  bufferData = "";
  irPara(iso);
}

function desenharCabecalho() {
  cabecalhoEl.replaceChildren();
  if (!dataAtual) return;
  const quando = rotuloQuando(dataAtual);
  const linha = el("div", "linha");
  linha.append(el("span", null, fraseData(dataAtual)));
  linha.append(el("span", "selo " + quando, quando.toUpperCase()));
  cabecalhoEl.append(linha);

  const feitas = atividades.filter((item) => item.concluida).length;
  const total = atividades.length;
  const progresso = el("div", "linha progresso");
  progresso.append(el("span", null, barra(total, feitas) + "  " + feitas + "/" + total));
  if (total > 0 && feitas === total) {
    progresso.append(el("span", "completo", "dia completo"));
  } else {
    const extras = atividades.filter((item) => item.origem === "data").length;
    if (extras > 0) {
      const legenda = extras === 1 ? "1 atividade desta data" : extras + " atividades desta data";
      progresso.append(el("span", "dim", legenda));
    }
  }
  cabecalhoEl.append(progresso);

  if (substituiRotina && !vendoRegistro) {
    cabecalhoEl.append(el("div", "dim", "A rotina padrão não entra neste dia."));
  }
  if (vendoRegistro) {
    cabecalhoEl.append(el("div", "dim", "Registro gravado deste dia."));
  }
  if (notaConfig) cabecalhoEl.append(el("div", "aviso", notaConfig));
}

function desenharLista() {
  listaEl.replaceChildren();
  if (erroAtual) {
    listaEl.append(el("div", "erro", erroAtual));
    return;
  }
  if (modo === "ajuda") {
    const bloco = el("div", "ajuda");
    bloco.textContent = AJUDA.join("\n");
    listaEl.append(bloco);
    return;
  }
  if (atividades.length === 0) {
    listaEl.append(el("div", "vazio", "Nenhuma atividade neste dia. Edite atividades.js"));
    return;
  }

  const cabeca = el("div", "item cabeca-lista");
  cabeca.append(el("span", "seta", ""));
  cabeca.append(el("span", null, ""));
  cabeca.append(el("span", null, "pri"));
  cabeca.append(el("span", null, "atividade"));
  cabeca.append(el("span", null, ""));
  listaEl.append(cabeca);

  atividades.forEach((item, posicao) => {
    const linha = el("div", "item" + (item.concluida ? " feita" : "") + (posicao === indice ? " sel" : ""));
    linha.dataset.i = String(posicao);
    linha.setAttribute("role", "option");
    linha.setAttribute("aria-selected", posicao === indice ? "true" : "false");
    linha.append(el("span", "seta", ">"));
    linha.append(el("span", "caixa", item.concluida ? "[X]" : "[ ]"));
    const prio = el("span", "prio" + (item.prioridade === 1 ? " alta" : ""), "p" + item.prioridade);
    linha.append(prio);
    const texto = el("span", "texto", item.texto);
    if (posicao === indice) texto.append(el("span", "cursor"));
    linha.append(texto);
    linha.append(el("span", "tag", item.origem === "data" ? "NESTE DIA" : ""));
    listaEl.append(linha);
  });

  const selecionada = listaEl.querySelector(".sel");
  if (selecionada) selecionada.scrollIntoView({ block: "nearest" });
}

function desenharTeclas() {
  teclasEl.replaceChildren();
  if (aviso) teclasEl.append(el("div", "aviso", aviso));
  if (modo === "ajuda") {
    teclasEl.append(el("div", null, "Esc volta"));
    return;
  }
  if (modo === "data") {
    teclasEl.append(el("div", null, "Digite a data e pressione Enter. Esc cancela."));
    return;
  }
  teclasEl.append(el("div", null, "↑↓ mover    espaço marcar    ←→ dia    PgUp avança mês    PgDn volta mês"));
  teclasEl.append(el("div", null, "G data    N próxima    P anterior    T hoje    F1 ajuda"));
}

function desenharPrompt() {
  promptEl.replaceChildren();
  promptEl.append(document.createTextNode("C:\\CHECKLIST> "));
  let comando = "";
  if (modo === "ajuda") comando = "ajuda";
  if (modo === "data") comando = "ir " + formatarBuffer(bufferData);
  promptEl.append(document.createTextNode(comando));
  const cursor = el("span", "cursor");
  if (comando) cursor.style.marginLeft = "2px";
  promptEl.append(cursor);
}

function render() {
  if (indice > atividades.length - 1) indice = Math.max(0, atividades.length - 1);
  desenharCabecalho();
  desenharLista();
  desenharTeclas();
  desenharPrompt();
}

function tick() {
  const agora = new Date();
  const dois = (numero) => String(numero).padStart(2, "0");
  document.getElementById("relogio").textContent =
    dois(agora.getHours()) + ":" + dois(agora.getMinutes()) + ":" + dois(agora.getSeconds());
}

function onKey(evento) {
  const tecla = evento.key;
  const bloqueadas = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "PageUp", "PageDown", "Home", "End", "F1"];
  if (bloqueadas.includes(tecla)) evento.preventDefault();
  if (ocupado) return;

  if (modo === "ajuda") {
    if (tecla === "Escape" || tecla === "F1") {
      modo = "lista";
      aviso = "";
      recarregar(true);
    }
    return;
  }

  if (modo === "data") {
    evento.preventDefault();
    if (tecla === "Escape") {
      modo = "lista";
      bufferData = "";
      aviso = "";
      render();
    } else if (tecla === "Enter") {
      confirmarData();
    } else if (tecla === "Backspace") {
      bufferData = bufferData.slice(0, -1);
      aviso = "";
      render();
    } else if (/^\d$/.test(tecla) && bufferData.length < 8) {
      bufferData += tecla;
      aviso = "";
      render();
    }
    return;
  }

  if (tecla === "ArrowUp") {
    if (atividades.length) indice = (indice - 1 + atividades.length) % atividades.length;
    aviso = "";
    render();
  } else if (tecla === "ArrowDown") {
    if (atividades.length) indice = (indice + 1) % atividades.length;
    aviso = "";
    render();
  } else if (tecla === "Home") {
    indice = 0;
    render();
  } else if (tecla === "End") {
    indice = Math.max(0, atividades.length - 1);
    render();
  } else if (tecla === " " || tecla === "Enter") {
    if (evento.repeat) return;
    alternarAtual();
  } else if (tecla === "ArrowLeft") {
    irPara(addDias(dataAtual, -1));
  } else if (tecla === "ArrowRight") {
    irPara(addDias(dataAtual, 1));
  } else if (tecla === "PageUp") {
    irPara(addMeses(dataAtual, 1));
  } else if (tecla === "PageDown") {
    irPara(addMeses(dataAtual, -1));
  } else if (tecla === "t" || tecla === "T") {
    irPara(hojeIso());
  } else if (tecla === "g" || tecla === "G") {
    modo = "data";
    bufferData = "";
    aviso = "";
    render();
  } else if (tecla === "n" || tecla === "N") {
    pularAgendada(1);
  } else if (tecla === "p" || tecla === "P") {
    pularAgendada(-1);
  } else if (tecla === "F1" || tecla === "h" || tecla === "H") {
    modo = "ajuda";
    aviso = "";
    render();
  }
}

listaEl.addEventListener("click", (evento) => {
  if (ocupado || modo !== "lista" || erroAtual) return;
  const linha = evento.target.closest("[data-i]");
  if (!linha) return;
  indice = Number(linha.dataset.i);
  alternarAtual();
});

document.addEventListener("keydown", onKey);
window.addEventListener("focus", () => {
  if (!ocupado && modo === "lista") recarregar(true);
});

tick();
setInterval(tick, 1000);
recarregar(false);
