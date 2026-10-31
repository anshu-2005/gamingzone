/* ====================================================
   NEON LASER REFLECTOR — 52 CURATED & VERIFIED LEVELS
   5 Chapters:
   - Chapter 1: Optic Awakening (Levels 1-10)
   - Chapter 2: Cyber Circuit Routing (Levels 11-20)
   - Chapter 3: Quantum Obstacle Field (Levels 21-30)
   - Chapter 4: Prism Beam Splitting (Levels 31-40)
   - Chapter 5: Grand Optical Matrix (Levels 41-52)
   ==================================================== */

export const LASER_CHAPTERS = [
  { id: 1, name: 'Optic Awakening', start: 1, end: 10, desc: 'Master basic 90° reflection physics' },
  { id: 2, name: 'Cyber Routing', start: 11, end: 20, desc: 'Multi-mirror serpentine laser paths' },
  { id: 3, name: 'Quantum Obstacles', start: 21, end: 30, desc: 'Navigate dense absorbing barrier blocks' },
  { id: 4, name: 'Prism Splitting', start: 31, end: 40, desc: 'Beam splitters powering dual crystals' },
  { id: 5, name: 'Matrix Grandmaster', start: 41, end: 52, desc: 'Elite multi-target optical challenges' }
];

export const LASER_LEVELS = [
  {
    "id": 1,
    "chapter": 1,
    "title": "Optic Vector 1",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 4,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 4,
        "row": 4,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 4
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 2,
    "chapter": 1,
    "title": "Optic Vector 2",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 5,
        "row": 4,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 5,
        "row": 1,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 1
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 3,
    "chapter": 1,
    "title": "Optic Vector 3",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 3,
        "row": 4,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 4
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 4,
    "chapter": 1,
    "title": "Optic Vector 4",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 4,
        "row": 4,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 1,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 1
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 5,
    "chapter": 1,
    "title": "Optic Vector 5",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 5,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 5,
        "row": 4,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 4
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 6,
    "chapter": 1,
    "title": "Optic Vector 6",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 4,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 1
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 7,
    "chapter": 1,
    "title": "Optic Vector 7",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 4,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 4,
        "row": 4,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 4
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 8,
    "chapter": 1,
    "title": "Optic Vector 8",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 5,
        "row": 4,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 5,
        "row": 1,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 1
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 9,
    "chapter": 1,
    "title": "Optic Vector 9",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 3,
        "row": 4,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 4
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 10,
    "chapter": 1,
    "title": "Optic Vector 10",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 4,
        "row": 4,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 1,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 8,
        "row": 1
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 11,
    "chapter": 2,
    "title": "Circuit Pathway 11",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 3,
        "row": 5,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 6,
        "row": 5,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 12,
    "chapter": 2,
    "title": "Circuit Pathway 12",
    "emitter": {
      "col": 0,
      "row": 1,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 2,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 2,
        "row": 4,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 5,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 5,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 13,
    "chapter": 2,
    "title": "Circuit Pathway 13",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 3,
        "row": 5,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 6,
        "row": 5,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 14,
    "chapter": 2,
    "title": "Circuit Pathway 14",
    "emitter": {
      "col": 0,
      "row": 1,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 2,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 2,
        "row": 4,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 5,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 5,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 15,
    "chapter": 2,
    "title": "Circuit Pathway 15",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 3,
        "row": 5,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 6,
        "row": 5,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 16,
    "chapter": 2,
    "title": "Circuit Pathway 16",
    "emitter": {
      "col": 0,
      "row": 1,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 2,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 2,
        "row": 4,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 5,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 5,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 17,
    "chapter": 2,
    "title": "Circuit Pathway 17",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 3,
        "row": 5,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 6,
        "row": 5,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 18,
    "chapter": 2,
    "title": "Circuit Pathway 18",
    "emitter": {
      "col": 0,
      "row": 1,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 2,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 2,
        "row": 4,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 5,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 5,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 19,
    "chapter": 2,
    "title": "Circuit Pathway 19",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 2,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 3,
        "row": 5,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 6,
        "row": 5,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 20,
    "chapter": 2,
    "title": "Circuit Pathway 20",
    "emitter": {
      "col": 0,
      "row": 1,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 2,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 2,
        "row": 4,
        "angle": 135,
        "solution": 135
      },
      {
        "col": 5,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 5,
        "row": 0
      }
    ],
    "blocks": [],
    "prisms": []
  },
  {
    "id": 21,
    "chapter": 3,
    "title": "Quantum Barrier 21",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 22,
    "chapter": 3,
    "title": "Quantum Barrier 22",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 23,
    "chapter": 3,
    "title": "Quantum Barrier 23",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 24,
    "chapter": 3,
    "title": "Quantum Barrier 24",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 25,
    "chapter": 3,
    "title": "Quantum Barrier 25",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 26,
    "chapter": 3,
    "title": "Quantum Barrier 26",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 27,
    "chapter": 3,
    "title": "Quantum Barrier 27",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 28,
    "chapter": 3,
    "title": "Quantum Barrier 28",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 29,
    "chapter": 3,
    "title": "Quantum Barrier 29",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 30,
    "chapter": 3,
    "title": "Quantum Barrier 30",
    "emitter": {
      "col": 0,
      "row": 3,
      "dir": "RIGHT"
    },
    "mirrors": [
      {
        "col": 3,
        "row": 3,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 3,
        "row": 0,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 7,
        "row": 0,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 7,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 9,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 4,
        "row": 3
      },
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 6,
        "row": 3
      }
    ],
    "prisms": []
  },
  {
    "id": 31,
    "chapter": 4,
    "title": "Prism Resonance 31",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 32,
    "chapter": 4,
    "title": "Prism Resonance 32",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 33,
    "chapter": 4,
    "title": "Prism Resonance 33",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 34,
    "chapter": 4,
    "title": "Prism Resonance 34",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 35,
    "chapter": 4,
    "title": "Prism Resonance 35",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 36,
    "chapter": 4,
    "title": "Prism Resonance 36",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 37,
    "chapter": 4,
    "title": "Prism Resonance 37",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 38,
    "chapter": 4,
    "title": "Prism Resonance 38",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 39,
    "chapter": 4,
    "title": "Prism Resonance 39",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 40,
    "chapter": 4,
    "title": "Prism Resonance 40",
    "emitter": {
      "col": 0,
      "row": 2,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 4,
        "row": 2
      }
    ],
    "mirrors": [
      {
        "col": 7,
        "row": 2,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 4,
        "row": 5,
        "angle": 45,
        "solution": 135
      }
    ],
    "targets": [
      {
        "col": 7,
        "row": 0
      },
      {
        "col": 8,
        "row": 5
      }
    ],
    "blocks": [
      {
        "col": 2,
        "row": 4
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 41,
    "chapter": 5,
    "title": "Grandmaster Matrix 41",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 42,
    "chapter": 5,
    "title": "Grandmaster Matrix 42",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 43,
    "chapter": 5,
    "title": "Grandmaster Matrix 43",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 44,
    "chapter": 5,
    "title": "Grandmaster Matrix 44",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 45,
    "chapter": 5,
    "title": "Grandmaster Matrix 45",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 46,
    "chapter": 5,
    "title": "Grandmaster Matrix 46",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 47,
    "chapter": 5,
    "title": "Grandmaster Matrix 47",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 48,
    "chapter": 5,
    "title": "Grandmaster Matrix 48",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 49,
    "chapter": 5,
    "title": "Grandmaster Matrix 49",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 50,
    "chapter": 5,
    "title": "Grandmaster Matrix 50",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 51,
    "chapter": 5,
    "title": "Grandmaster Matrix 51",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  },
  {
    "id": 52,
    "chapter": 5,
    "title": "Grandmaster Matrix 52",
    "emitter": {
      "col": 0,
      "row": 4,
      "dir": "RIGHT"
    },
    "prisms": [
      {
        "col": 3,
        "row": 4
      }
    ],
    "mirrors": [
      {
        "col": 3,
        "row": 1,
        "angle": 135,
        "solution": 45
      },
      {
        "col": 6,
        "row": 1,
        "angle": 45,
        "solution": 135
      },
      {
        "col": 8,
        "row": 4,
        "angle": 135,
        "solution": 45
      }
    ],
    "targets": [
      {
        "col": 6,
        "row": 3
      },
      {
        "col": 8,
        "row": 0
      }
    ],
    "blocks": [
      {
        "col": 5,
        "row": 3
      },
      {
        "col": 7,
        "row": 2
      }
    ],
    "hasSplitter": true
  }
];
