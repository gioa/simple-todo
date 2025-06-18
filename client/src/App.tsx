
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Form state
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;

    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: editingId,
        title: editTitle,
        description: editDescription || null
      });
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === editingId ? updatedTodo : t))
      );
      setEditingId(null);
      setEditTitle('');
      setEditDescription('');
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const filteredTodos = todos.filter((todo: Todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const completedCount = todos.filter((t: Todo) => t.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Todo List</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Add new todo form */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Add New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done? 🎯"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add some details... (optional)"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !formData.title.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {isLoading ? '✨ Adding...' : '➕ Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filter buttons and stats */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All ({todos.length})
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
              size="sm"
            >
              Active ({activeCount})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
              size="sm"
            >
              Completed ({completedCount})
            </Button>
          </div>
          
          {todos.length > 0 && (
            <div className="text-center">
              <Badge variant="secondary" className="text-sm">
                📊 {completedCount} of {todos.length} tasks completed
              </Badge>
            </div>
          )}
        </div>

        {/* Todo list */}
        {filteredTodos.length === 0 ? (
          <Card className="text-center py-12 shadow-lg">
            <CardContent>
              <div className="text-6xl mb-4">
                {filter === 'completed' ? '🎉' : todos.length === 0 ? '📝' : '✨'}
              </div>
              <p className="text-xl text-gray-600 mb-2">
                {filter === 'completed' && completedCount === 0
                  ? "No completed tasks yet!"
                  : filter === 'active' && activeCount === 0
                  ? "All tasks completed! Great job!"
                  : todos.length === 0
                  ? "No tasks yet. Add one above!"
                  : "No tasks to show"}
              </p>
              {todos.length === 0 && (
                <p className="text-gray-500">Start by adding your first task above 👆</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTodos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`shadow-md transition-all duration-200 hover:shadow-lg ${
                  todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                }`}
              >
                <CardContent className="p-4">
                  {editingId === todo.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
                        className="text-lg"
                      />
                      <Textarea
                        value={editDescription}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                          💾 Save
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" size="sm">
                          ❌ Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-medium ${
                          todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                        }`}>
                          {todo.completed ? '✅ ' : ''}{todo.title}
                        </h3>
                        {todo.description && (
                          <p className={`text-sm mt-1 ${
                            todo.completed ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {todo.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span>Created: {todo.created_at.toLocaleDateString()}</span>
                          {todo.updated_at.getTime() !== todo.created_at.getTime() && (
                            <span>Updated: {todo.updated_at.toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => handleEdit(todo)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          ✏️
                        </Button>
                        <Button
                          onClick={() => handleDelete(todo.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer stats */}
        {todos.length > 0 && (
          <div className="mt-8 text-center">
            <Separator className="mb-4" />
            <p className="text-sm text-gray-500">
              Keep going! You've got this! 💪
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
