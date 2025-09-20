import React, { useState } from 'react';

const scenarios = [
  {
    negativeThought: "I failed the test, I'm so stupid.",
    options: [
      "This is a learning opportunity.",
      "I'll never succeed.",
      "Everyone is better than me."
    ],
    correctAnswer: "This is a learning opportunity."
  },
  {
    negativeThought: "My friend didn't call me back, they must be mad at me.",
    options: [
      "They are probably busy.",
      "I'm a bad friend.",
      "I have no real friends."
    ],
    correctAnswer: "They are probably busy."
  },
  {
    negativeThought: "I made a mistake at work, I'm going to get fired.",
    options: [
      "Everyone makes mistakes, I'll fix it.",
      "I'm incompetent.",
      "My boss hates me."
    ],
    correctAnswer: "Everyone makes mistakes, I'll fix it."
  }
];

const CognitiveReframingCards: React.FC = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const handleOptionClick = (option: string) => {
    if (option === scenarios[currentCard].correctAnswer) {
      setScore(score + 1);
      setMessage('Great reframing!');
    } else {
      setMessage('Try a more positive perspective.');
    }
    setTimeout(() => {
      setCurrentCard((currentCard + 1) % scenarios.length);
      setMessage('');
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Cognitive Reframing Cards</h2>
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md mb-4">
        <p className="text-lg font-semibold text-gray-700 mb-4">Negative Thought:</p>
        <p className="text-gray-600">{scenarios[currentCard].negativeThought}</p>
      </div>
      <div className="w-full max-w-md">
        {scenarios[currentCard].options.map((option) => (
          <button
            key={option}
            className="w-full px-4 py-2 mb-2 bg-blue-500 text-white rounded-lg"
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="text-lg mt-4">Score: {score}</p>
      <p className="text-lg">{message}</p>
    </div>
  );
};

export default CognitiveReframingCards;
