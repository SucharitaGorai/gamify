// Shooter Quiz Game: NCERT Class 8 Science - Force (Pure JavaScript, Importable)

export function runShooterQuiz() {
  // Game state
  let playerHP = 100;
  let monsterHP = 100;
  let wrongAnswers = 0;
  let correctAnswers = 0;

  // Questions: NCERT Class 8 Science (Chapter: Force)
  const questions = [
    {
      question: "Which of the following best defines force?",
      options: ["A push or pull", "Energy stored in an object", "Rate of change of work", "A form of heat"],
      answer: "A push or pull"
    },
    {
      question: "Which of these is NOT an effect of force?",
      options: ["Changing the mass of an object", "Changing the shape of an object", "Changing the speed of an object", "Changing the direction of motion"],
      answer: "Changing the mass of an object"
    },
    {
      question: "Which is a contact force?",
      options: ["Frictional force", "Magnetic force", "Gravitational force", "Electrostatic force"],
      answer: "Frictional force"
    },
    {
      question: "Which is a non-contact force?",
      options: ["Muscular force", "Frictional force", "Normal reaction", "Magnetic force"],
      answer: "Magnetic force"
    },
    {
      question: "SI unit of force is:",
      options: ["Joule", "Newton", "Pascal", "Watt"],
      answer: "Newton"
    },
    {
      question: "A force can change the ______ of an object.",
      options: ["Color", "Mass", "State of motion", "Temperature only"],
      answer: "State of motion"
    },
    {
      question: "When two forces act in the same direction on an object, the net force is:",
      options: ["The difference of the two forces", "Zero", "The sum of the two forces", "Always equal to the larger force"],
      answer: "The sum of the two forces"
    },
    {
      question: "Balanced forces on a body:",
      options: ["Change the state of motion", "Change the shape only", "Produce acceleration", "Do not change the state of motion"],
      answer: "Do not change the state of motion"
    },
    {
      question: "Unbalanced forces acting on a body can:",
      options: ["Keep it at rest forever", "Only change shape", "Cause a change in speed or direction", "Only reduce its mass"],
      answer: "Cause a change in speed or direction"
    },
    {
      question: "Which instrument is commonly used to measure force?",
      options: ["Spring balance", "Thermometer", "Voltmeter", "Barometer"],
      answer: "Spring balance"
    },
    {
      question: "Gravitational force acts between:",
      options: ["Only between Earth and Moon", "Only between charged bodies", "Any two masses", "Only between magnets"],
      answer: "Any two masses"
    },
    {
      question: "Which force opposes the relative motion between surfaces in contact?",
      options: ["Electrostatic force", "Frictional force", "Magnetic force", "Gravitational force"],
      answer: "Frictional force"
    },
    {
      question: "Muscular force is an example of:",
      options: ["Non-contact force", "Contact force", "Field force", "Nuclear force"],
      answer: "Contact force"
    },
    {
      question: "The direction of force is important because force is a:",
      options: ["Scalar quantity", "Vector quantity", "Dimensionless quantity", "Unitless quantity"],
      answer: "Vector quantity"
    },
    {
      question: "Pushing a door to open it is an example of:",
      options: ["Gravitational force", "Magnetic force", "Applied force", "Electrostatic force"],
      answer: "Applied force"
    }
  ];

  // Utility: shuffle array (Fisher-Yates)
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Start game
  alert(
    "Shooter Quiz Game: NCERT Class 8 Science - Force\n\nRules:\n- Player and Monster start with 100 HP each.\n- Correct answer: Monster -10 HP.\n- Wrong answer: Player -10 HP.\n- 5 total wrong answers: instant Game Over.\n- 10 correct answers: Victory.\n- Answer by entering 1, 2, 3, or 4."
  );

  const shuffled = shuffle(questions.slice()); // copy + shuffle
  let qIndex = 0;

  while (playerHP > 0 && monsterHP > 0 && wrongAnswers < 5 && correctAnswers < 10) {
    if (qIndex >= shuffled.length) {
      shuffle(shuffled);
      qIndex = 0;
    }

    const q = shuffled[qIndex];
    qIndex++;

    const promptText =
      "HP — Player: " +
      playerHP +
      " | Monster: " +
      monsterHP +
      "\n\nQ: " +
      q.question +
      "\n1) " +
      q.options[0] +
      "\n2) " +
      q.options[1] +
      "\n3) " +
      q.options[2] +
      "\n4) " +
      q.options[3] +
      "\n\nEnter your choice (1-4):";

    const input = prompt(promptText);

    if (input === null) {
      alert("Game aborted.");
      return;
    }

    const choice = parseInt(input, 10);
    if (![1, 2, 3, 4].includes(choice)) {
      alert("Invalid input. Please enter 1, 2, 3, or 4.");
      qIndex--; // re-ask same question
      continue;
    }

    const selected = q.options[choice - 1];
    const isCorrect = selected === q.answer;

    if (isCorrect) {
      correctAnswers++;
      monsterHP = Math.max(0, monsterHP - 10);
      alert("Monster hit! ✅\nCorrect Answer: " + q.answer + "\n\nHP — Player: " + playerHP + " | Monster: " + monsterHP);
    } else {
      wrongAnswers++;
      playerHP = Math.max(0, playerHP - 10);
      alert("Player hit! ❌\nCorrect Answer: " + q.answer + "\n\nHP — Player: " + playerHP + " | Monster: " + monsterHP);
    }

    if (wrongAnswers >= 5) {
      playerHP = 0;
      break;
    }
    if (correctAnswers >= 10) {
      monsterHP = 0;
      break;
    }
  }

  if (correctAnswers >= 10 || monsterHP <= 0) {
    alert("Victory! 🎉 You killed the monster!");
  } else {
    alert("Game Over! 💀 The monster killed you.");
  }
}
