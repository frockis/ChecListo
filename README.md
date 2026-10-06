# Checklist diário

----

## Como iniciar o aplicativo e os comandos

Dê um duplo clique em `iniciar.bat`.

Esse arquivo abre o `servidor.ps1`.

O navegador abre o checklist.

Deixe a janela preta aberta enquanto usa.

Fechar essa janela encerra o aplicativo.

----

| Tecla | Ação | Localização |
| --- | --- | --- |
| Seta para cima / para baixo | Move entre as atividades | `public/app.js` |
| Espaço | Marca ou desmarca | `public/app.js` |
| Seta para a esquerda / direita | Dia anterior ou próximo | `public/app.js` |
| PgUp | Avança um mês | `public/app.js` |
| PgDn | Volta um mês | `public/app.js` |
| G | Digita uma data e vai até ela | `public/app.js` |
| N | Próxima data que tem atividade própria | `public/app.js` |
| P | Data anterior que tem atividade própria | `public/app.js` |
| T | Volta para hoje | `public/app.js` |
| F1 | Abre a ajuda | `public/app.js` |
| Esc | Fecha a ajuda | `public/app.js` |

----

## Como o app funciona

O checklist é uma tela no navegador, com cara de CMD.

A lista do dia aparece na tela e você marca os itens pelo teclado.

A lista que você edita fica em `atividades.js`.

O que você marcou fica em `dados/registro.json`, com o ano, o mês, o dia, o nome da atividade, a prioridade e se ela foi feita.

A tela, as teclas e a troca de datas ficam em `public/app.js`.

O visual de terminal fica em `public/style.css` e em `public/index.html`.

----

Cada atividade em `atividades.js` tem três campos:

- `id`: apelido curto para o programa. Pode repetir em dias diferentes. Não pode repetir duas vezes no mesmo dia.
- `texto`: o nome que aparece na tela.
- `prioridade`: a ordem. O número 1 fica no topo.

A lista `rotina`, nesse mesmo arquivo, aparece em todo dia.

A lista `futuras`, também em `atividades.js`, guarda o que vale só para uma data.

----

## Como trocar o nome de uma atividade

Abra `atividades.js`.

Mude o texto entre aspas do campo `texto`.

Deixe o `id` como está.

Antes:

```javascript
{ id: "agua", texto: "Beber água", prioridade: 2 },
```

Depois:

```javascript
{ id: "agua", texto: "Beber 2 litros de água", prioridade: 2 },
```

Salve o arquivo e volte para a janela do checklist.

Não precisa mexer em `public/app.js` para trocar um nome.

----

## Como colocar atividades em dias futuros

Abra `atividades.js`.

Se a lista estiver vazia, ela está assim:

```javascript
futuras: {},
```

Apague essa linha e cole o bloco abaixo no lugar dela.

Mude a data, o `id` e o `texto`. A data fica entre aspas, no formato ano-mês-dia.

```javascript
futuras: {
  "2026-10-08": [
    { id: "revisao", texto: "Revisar a semana", prioridade: 1 },
  ],
},
```

----

`substituiRotina` apaga a lista de todo dia e coloca outra no lugar, só naquela data.

Cole este bloco quando quiser substituir uma rotina e ter agendamentos futuros ao mesmo tempo:

```javascript
futuras: {
  "2026-10-08": [
    { id: "revisao", texto: "Revisar a semana", prioridade: 1 },
  ],
  "2026-10-10": {
    substituiRotina: true,
    itens: [
      { id: "caminhada", texto: "Caminhada longa", prioridade: 1 },
      { id: "mercado", texto: "Feira ou mercado", prioridade: 2 },
    ],
  },
},
```

Essa atividade entra só nesse dia, junto com a rotina normal.

No dia 8 de outubro aparecem a rotina e também "Revisar a semana".

Nos outros dias, essa atividade não aparece.

----

O `id` novo não pode ser igual a um `id` que já está na rotina, porque os dois ficam na mesma tela nesse dia.

Salve o arquivo e volte para a janela do checklist.

----

## Como checar atividades futuras

Abra o checklist e vá até o dia da atividade.

Marque com a tecla espaço, do mesmo jeito que no dia de hoje.

Essas teclas estão em `public/app.js`.

----

Para chegar nesse dia:

- seta para a direita avança um dia
- `N` pula para a próxima data que tem atividade própria
- `G` deixa você digitar a data, por exemplo `20261008`, e Enter confirma

----

Quando você marca um item, o dia inteiro é gravado em `dados/registro.json`.

Isso vale mesmo que a data ainda não tenha chegado.

Quem grava esse arquivo é o `servidor.ps1`, quando a tela em `public/app.js` pede.

----

## Como desligar atividades

O `//` fica no começo da linha, dentro de `atividades.js`.

Não mexa nas funções de `public/app.js`.

----

Para desligar uma atividade, coloque `//` na frente da linha dela:

```javascript
rotina: [
  { id: "cama", texto: "Arrumar a cama", prioridade: 1 },
  // { id: "agua", texto: "Beber água", prioridade: 2 },
],
```

"Beber água" some da tela. A linha continua no arquivo, só fica desligada. Para voltar, apague o `//`.

----

Para desligar todas as atividades de todo dia, deixe a rotina vazia:

```javascript
rotina: [],
```

Para desligar todas as datas futuras, apague o que estiver dentro e deixe assim:

```javascript
futuras: {},
```

Para colocar os eventos futuros de novo, apague essa linha e cole o bloco da seção "Como colocar atividades em dias futuros".

Salve o `atividades.js` e volte para a janela do checklist.

----

## Onde está cada parte

- `iniciar.bat`: abre o aplicativo.
- `servidor.ps1`: sobe a tela no navegador e grava o log.
- `atividades.js`: rotina, dias futuros, nomes e `substituiRotina`.
- `public/app.js`: teclas, datas e marcação.
- `public/index.html`: a página da tela.
- `public/style.css`: a cara de CMD.
- `dados/registro.json`: o log do que foi marcado.

----

## Tecnologias e Ferramentas

Feito com IA

Linguagens e arquivos usados:

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000000)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)

![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

![PowerShell](https://img.shields.io/badge/PowerShell-5391FE?style=for-the-badge&logo=powershell&logoColor=white)

![Batch](https://img.shields.io/badge/Batch-4D4D4D?style=for-the-badge&logo=windowsterminal&logoColor=white)

![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)
