export type StepType = 'todo' | 'question' | 'yesno' | 'rating';

export interface TaskStep {
  type: StepType;
  text: string;
  /** Rating scale end labels (1 = lowLabel, 5 = highLabel). Only used for type 'rating'. */
  lowLabel?:  string;
  highLabel?: string;
}

export interface TestingTask {
  id:            string;
  title:         string;
  timeEstimate:  string;
  description:   string;
  steps:         TaskStep[];
  feedbackGoalHint: string;
}

// Scenario shared across all tasks:
// "You own a house. You've been thinking about solar panels.
//  You know roughly how big it is, when it was built, and that one side faces south."

export const TESTING_TASKS: TestingTask[] = [
  {
    id:           'task-1',
    title:        'First impressions',
    timeEstimate: '3–5 min',
    description:  'You\'ve just opened the tool for the first time. Take a minute to look around the map — don\'t click anything yet. Just take in what you see.',
    steps: [
      { type: 'rating',   text: 'How clear is it what you\'re supposed to do on this screen?', lowLabel: 'No idea', highLabel: 'Immediately clear' },
      { type: 'rating',   text: 'How easy is it to find a building to explore?', lowLabel: 'Very hard to find', highLabel: 'Obvious' },
      { type: 'todo',     text: 'Click on a building to open it' },
      { type: 'rating',   text: 'How easy was it to open the building?', lowLabel: 'Very difficult', highLabel: 'Very easy' },
      { type: 'rating',   text: 'How approachable does the tool feel overall so far?', lowLabel: 'Overwhelming', highLabel: 'Easy to approach' },
    ],
    feedbackGoalHint: 'I landed on the map for the first time and was trying to understand what to do and how to open a building.',
  },
  {
    id:           'task-2',
    title:        'Understand the building overview',
    timeEstimate: '5–8 min',
    description:  'You\'ve opened a building. The tool has filled in some data automatically from public records. Take a moment to explore what\'s shown — the energy figures, the building parameters, and the envelope breakdown.',
    steps: [
      { type: 'yesno',    text: 'Does the energy usage information make sense to you?' },
      { type: 'yesno',    text: 'Do the pre-filled building details (type, size, construction year) look roughly right for the building?' },
      { type: 'question', text: 'What would you want to change or check first before trusting these numbers?' },
      { type: 'rating',   text: 'How easy is it to understand what the overview is showing?', lowLabel: 'Very confusing', highLabel: 'Very clear' },
      { type: 'rating',   text: 'How confident are you in the automatically filled data?', lowLabel: 'Not at all', highLabel: 'Very confident' },
    ],
    feedbackGoalHint: 'I was looking at the building overview — energy figures, pre-filled parameters, and building envelope breakdown.',
  },
  {
    id:           'task-3',
    title:        'Set up the roof and add solar panels',
    timeEstimate: '8–12 min',
    description:  'Your house has a pitched roof with a south-facing slope — ideal for solar. Open the configurator, make sure the roof shape is set correctly, then add a solar PV system to the south-facing surface.',
    steps: [
      { type: 'todo',     text: 'Open the configurator from the overview' },
      { type: 'todo',     text: 'Find the roof section and check what type of roof is currently set' },
      { type: 'todo',     text: 'Change the roof type to one that has a south-facing slope (e.g. Gable)' },
      { type: 'yesno',    text: 'Does the roof shape shown match what you\'d expect a south-facing pitched roof to look like?' },
      { type: 'todo',     text: 'Find the south-facing roof surface and add a solar PV system to it' },
      { type: 'rating',   text: 'How confident are you that the solar panels are now installed?', lowLabel: 'Not at all', highLabel: 'Very confident' },
      { type: 'rating',   text: 'How easy was this task overall?', lowLabel: 'Very difficult', highLabel: 'Very easy' },
    ],
    feedbackGoalHint: 'I was opening the configurator, setting the roof type, and adding solar panels to the south-facing surface.',
  },
  {
    id:           'task-4',
    title:        'Review the results',
    timeEstimate: '3–5 min',
    description:  'You\'ve configured the building and added solar panels. Go back to the overview to see how the energy figures have changed, then try to export or save the configuration.',
    steps: [
      { type: 'todo',     text: 'Go back to the overview and check the updated energy figures' },
      { type: 'yesno',    text: 'Is it clear what changed after adding solar panels?' },
      { type: 'todo',     text: 'Find and use the export option to save the configuration' },
      { type: 'question', text: 'What would you do with the exported file next in your usual workflow?' },
      { type: 'rating',   text: 'How easy was it to review the impact of your changes?', lowLabel: 'Very difficult', highLabel: 'Very easy' },
      { type: 'rating',   text: 'How easy was it to find and use the export?', lowLabel: 'Very difficult', highLabel: 'Very easy' },
    ],
    feedbackGoalHint: 'I was going back to the overview to review the updated results and then trying to export the configuration.',
  },
];
