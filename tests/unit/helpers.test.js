'use strict';

const { formatTemplate, sleep } = require('../../src/utils/helpers');

describe('formatTemplate', () => {
  test('replaces single placeholder', () => {
    expect(formatTemplate('Hello {{name}}!', { name: 'Alice' })).toBe('Hello Alice!');
  });

  test('replaces multiple placeholders', () => {
    const result = formatTemplate('{{greeting}}, {{name}}! Time: {{time}}', {
      greeting: 'Hey', name: 'Bob', time: '1:00 PM',
    });
    expect(result).toBe('Hey, Bob! Time: 1:00 PM');
  });

  test('leaves unknown placeholders intact', () => {
    expect(formatTemplate('Hello {{unknown}}!', {})).toBe('Hello {{unknown}}!');
  });

  test('handles empty vars', () => {
    expect(formatTemplate('No placeholders here', {})).toBe('No placeholders here');
  });
});

describe('sleep', () => {
  test('resolves after specified ms', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });
});