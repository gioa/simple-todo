
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion'
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Delete the todo
    const result = await deleteTodo({ id: todoId });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify todo no longer exists in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when deleting non-existent todo', async () => {
    // Try to delete a todo that doesn't exist
    const result = await deleteTodo({ id: 999 });

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });

  it('should handle multiple todos correctly', async () => {
    // Create multiple todos
    const createResults = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo' },
        { title: 'Todo 2', description: 'Second todo' },
        { title: 'Todo 3', description: 'Third todo' }
      ])
      .returning()
      .execute();

    const todoToDelete = createResults[1]; // Delete the middle one

    // Delete one specific todo
    const result = await deleteTodo({ id: todoToDelete.id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify only the specific todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.find(todo => todo.id === todoToDelete.id)).toBeUndefined();
    expect(remainingTodos.find(todo => todo.id === createResults[0].id)).toBeDefined();
    expect(remainingTodos.find(todo => todo.id === createResults[2].id)).toBeDefined();
  });
});
