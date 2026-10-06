// Checklist diario
//
// rotina
//   Aparece em todo dia. Para trocar ou incluir uma atividade, edite esta lista.
//   prioridade 1 fica no topo. O id nao pode repetir no mesmo dia.
//
// futuras
//   A chave e a data, no formato AAAA-MM-DD.
//   Uma lista soma esses itens ao dia.
//   substituiRotina apaga a lista de todo dia e coloca outra no lugar, só naquela data.
//     "2026-12-24": {
//       substituiRotina: true,
//       itens: [
//         { id: "ceia", texto: "Preparar a ceia", prioridade: 1 }
//       ]
//     }
//
// Salve este arquivo e volte para a janela do checklist.
// O log fica em dados/registro.json.

const CHECKLIST = {
  rotina: [
    { id: "cama", texto: "Arrumar a cama", prioridade: 1 },
    { id: "Almoco", texto: "Almoçar", prioridade: 1 },
    { id: "Academia", texto: "Malhar e Alongar", prioridade: 1 },
    { id: "Tomar banho", texto: "Tomar banho", prioridade: 1 },
  ],
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
};
