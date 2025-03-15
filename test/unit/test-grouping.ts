// Test file for game grouping logic
import { areGamesRelated } from '@/shared/external-apis/steam/utils';

// Test cases
const testCases: [string, string][] = [
  // Should group (same game, different modes)
  ['Call of Duty: Black Ops', 'Call of Duty: Black Ops - Multiplayer'],
  [
    'Call of Duty: Modern Warfare 2 (2009)',
    'Call of Duty: Modern Warfare 2 (2009) - Multiplayer',
  ],
  ['DARK SOULS™ II', 'DARK SOULS™ II - Scholar of the First Sin'],

  // Should NOT group (different games in same series)
  ['Call of Duty: Black Ops', 'Call of Duty: Black Ops II'],
  ['Call of Duty: Modern Warfare', 'Call of Duty: Modern Warfare 2'],
  ['Call of Duty: Black Ops', 'Call of Duty: Modern Warfare'],

  // Should NOT group (remasters)
  [
    'Call of Duty: Modern Warfare 2',
    'Call of Duty: Modern Warfare 2 Remastered',
  ],
  ['Dark Souls', 'Dark Souls Remastered'],

  // Should NOT group (different years)
  [
    'Call of Duty: Modern Warfare 2 (2009)',
    'Call of Duty: Modern Warfare 2 (2022)',
  ],
];

console.log('Testing game grouping logic:');
testCases.forEach(([game1, game2]) => {
  const result = areGamesRelated(game1, game2);
  console.log(`${game1} + ${game2} = ${result ? 'GROUPED' : 'NOT GROUPED'}`);
});
