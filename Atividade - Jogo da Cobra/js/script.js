// ===== Elementos da página =====
const canvas = document.getElementById("tela");
const ctx = canvas.getContext("2d");
const elPontos = document.getElementById("pontos");
const elRecorde = document.getElementById("recorde");
const elMensagem = document.getElementById("mensagem");
const botao = document.getElementById("botao");

// ===== Configurações =====
const TAMANHO = 20;                          // tamanho de cada quadradinho (px)
const COLUNAS = canvas.width / TAMANHO;      // 20 colunas
const LINHAS = canvas.height / TAMANHO;      // 20 linhas
const VELOCIDADE_INICIAL = 150;              // milissegundos entre cada movimento
const VELOCIDADE_MINIMA = 60;

// ===== Estado do jogo =====
let cobra;
let direcao;          // direção atual da cobra
let proximaDirecao;   // direção pedida pelo jogador (aplicada no próximo passo)
let comida;
let pontos;
let recorde = carregarRecorde();
let velocidade;
let intervalo = null; // guarda o setInterval
let estado = "parado"; // "parado", "jogando", "pausado" ou "fimDeJogo"

elRecorde.textContent = recorde;

// ===== Recorde salvo no navegador =====
function carregarRecorde() {
    try {
        return Number(localStorage.getItem("recordeCobra")) || 0;
    } catch (erro) {
        return 0; // se o navegador bloquear o localStorage, segue sem salvar
    }
}

function salvarRecorde() {
    try {
        localStorage.setItem("recordeCobra", recorde);
    } catch (erro) {
        // ignora
    }
}

// ===== Início / reinício =====
function iniciarJogo() {
    cobra = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direcao = { x: 1, y: 0 };
    proximaDirecao = { x: 1, y: 0 };
    pontos = 0;
    velocidade = VELOCIDADE_INICIAL;
    elPontos.textContent = pontos;
    elMensagem.textContent = "";
    botao.textContent = "Reiniciar";

    criarComida();
    estado = "jogando";
    iniciarLoop();
    desenhar();
}

function iniciarLoop() {
    clearInterval(intervalo);
    intervalo = setInterval(atualizar, velocidade);
}

// ===== Comida =====
function criarComida() {
    let posicao;
    do {
        posicao = {
            x: Math.floor(Math.random() * COLUNAS),
            y: Math.floor(Math.random() * LINHAS)
        };
    } while (posicaoNaCobra(posicao));   // não deixa nascer em cima da cobra
    comida = posicao;
}

function posicaoNaCobra(pos) {
    return cobra.some(parte => parte.x === pos.x && parte.y === pos.y);
}

// ===== Lógica de cada passo =====
function atualizar() {
    direcao = proximaDirecao;

    const cabeca = {
        x: cobra[0].x + direcao.x,
        y: cobra[0].y + direcao.y
    };

    // bateu na parede?
    if (cabeca.x < 0 || cabeca.x >= COLUNAS || cabeca.y < 0 || cabeca.y >= LINHAS) {
        fimDeJogo();
        return;
    }

    // bateu no próprio corpo?
    if (posicaoNaCobra(cabeca)) {
        fimDeJogo();
        return;
    }

    cobra.unshift(cabeca); // adiciona a nova cabeça

    if (cabeca.x === comida.x && cabeca.y === comida.y) {
        // comeu: não remove a cauda, então a cobra cresce
        pontos += 10;
        elPontos.textContent = pontos;
        if (pontos > recorde) {
            recorde = pontos;
            elRecorde.textContent = recorde;
            salvarRecorde();
        }
        // a cada comida o jogo fica um pouquinho mais rápido
        if (velocidade > VELOCIDADE_MINIMA) {
            velocidade -= 5;
            iniciarLoop();
        }
        criarComida();
    } else {
        cobra.pop(); // não comeu: remove a cauda
    }

    desenhar();
}

function fimDeJogo() {
    clearInterval(intervalo);
    estado = "fimDeJogo";
    elMensagem.textContent = "Fim de jogo! Pressione ESPAÇO para jogar de novo";
    desenhar();
}

function alternarPausa() {
    if (estado === "jogando") {
        clearInterval(intervalo);
        estado = "pausado";
        elMensagem.textContent = "Pausado - pressione ESPAÇO para continuar";
    } else if (estado === "pausado") {
        estado = "jogando";
        elMensagem.textContent = "";
        iniciarLoop();
    }
}

// ===== Desenho =====
function desenhar() {
    // fundo
    ctx.fillStyle = "#2f3640";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // comida
    ctx.fillStyle = "#e84118";
    ctx.fillRect(comida.x * TAMANHO + 2, comida.y * TAMANHO + 2, TAMANHO - 4, TAMANHO - 4);

    // cobra (a cabeça tem cor diferente)
    cobra.forEach((parte, i) => {
        ctx.fillStyle = i === 0 ? "#44bd32" : "#4cd137";
        ctx.fillRect(parte.x * TAMANHO + 1, parte.y * TAMANHO + 1, TAMANHO - 2, TAMANHO - 2);
    });
}

// ===== Controles =====
function mudarDirecao(nova) {
    // impede de voltar na direção contrária (a cobra "se comeria")
    if (nova.x === -direcao.x && nova.y === -direcao.y) return;
    proximaDirecao = nova;
}

document.addEventListener("keydown", function (evento) {
    const tecla = evento.key.toLowerCase();

    if (tecla === " " || tecla === "spacebar") {
        evento.preventDefault();
        if (estado === "jogando" || estado === "pausado") {
            alternarPausa();
        } else {
            iniciarJogo();
        }
        return;
    }

    if (estado !== "jogando") return;

    if (tecla === "arrowup" || tecla === "w") {
        evento.preventDefault();
        mudarDirecao({ x: 0, y: -1 });
    } else if (tecla === "arrowdown" || tecla === "s") {
        evento.preventDefault();
        mudarDirecao({ x: 0, y: 1 });
    } else if (tecla === "arrowleft" || tecla === "a") {
        evento.preventDefault();
        mudarDirecao({ x: -1, y: 0 });
    } else if (tecla === "arrowright" || tecla === "d") {
        evento.preventDefault();
        mudarDirecao({ x: 1, y: 0 });
    }
});

botao.addEventListener("click", function () {
    iniciarJogo();
    botao.blur(); // evita que ESPAÇO "clique" no botão de novo
});

// ===== Tela inicial =====
cobra = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
direcao = { x: 1, y: 0 };
proximaDirecao = direcao;
comida = { x: 15, y: 10 };
desenhar();