
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First description',
          completed: false
        },
        {
          title: 'Second Todo',
          description: null,
          completed: true
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(typeof result[0].completed).toBe('boolean');
  });

  it('should return todos ordered by created_at descending', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'Created first',
        completed: false
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'Created second',
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    // Most recent should be first (descending order)
    expect(result[0].title).toEqual('Second Todo');
    expect(result[1].title).toEqual('First Todo');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle nullable description field correctly', async () => {
    await db.insert(todosTable)
      .values([
        {
          title: 'Todo with description',
          description: 'Has description',
          completed: false
        },
        {
          title: 'Todo without description',
          description: null,
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    
    const todoWithDesc = result.find(t => t.title === 'Todo with description');
    const todoWithoutDesc = result.find(t => t.title === 'Todo without description');

    expect(todoWithDesc?.description).toEqual('Has description');
    expect(todoWithoutDesc?.description).toBeNull();
  });
});
