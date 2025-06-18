
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Test inputs
const testCreateInput: CreateTodoInput = {
  title: 'Original Todo',
  description: 'Original description'
};

const testUpdateInput: UpdateTodoInput = {
  id: 1, // Will be set dynamically in tests
  title: 'Updated Todo',
  description: 'Updated description',
  completed: true
};

// Helper function to create a todo directly in the database for testing
const createTestTodo = async (input: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a todo', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo(testCreateInput);
    
    // Update the todo
    const updateInput = {
      ...testUpdateInput,
      id: createdTodo.id
    };
    
    const result = await updateTodo(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Todo');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update only title', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo(testCreateInput);
    
    // Update only title
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'New Title Only'
    };
    
    const result = await updateTodo(updateInput);

    // Verify only title changed
    expect(result.title).toEqual('New Title Only');
    expect(result.description).toEqual(createdTodo.description);
    expect(result.completed).toEqual(createdTodo.completed);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update only completed status', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo(testCreateInput);
    
    // Update only completed status
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      completed: true
    };
    
    const result = await updateTodo(updateInput);

    // Verify only completed status changed
    expect(result.title).toEqual(createdTodo.title);
    expect(result.description).toEqual(createdTodo.description);
    expect(result.completed).toEqual(true);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo(testCreateInput);
    
    // Update description to null
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      description: null
    };
    
    const result = await updateTodo(updateInput);

    // Verify description is null
    expect(result.description).toBeNull();
    expect(result.title).toEqual(createdTodo.title);
    expect(result.completed).toEqual(createdTodo.completed);
  });

  it('should save updated todo to database', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo(testCreateInput);
    
    // Update the todo
    const updateInput = {
      ...testUpdateInput,
      id: createdTodo.id
    };
    
    const result = await updateTodo(updateInput);

    // Query database to verify changes were saved
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Todo');
    expect(todos[0].description).toEqual('Updated description');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999,
      title: 'This should fail'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/Todo with id 999 not found/i);
  });
});
