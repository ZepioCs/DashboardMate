import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, GripVertical } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import type { Todo } from './TodoList'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-3 bg-secondary rounded-lg',
        isDragging && 'opacity-50'
      )}
    >
      <button className="cursor-grab active:cursor-grabbing p-1" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      <label className="flex-1 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className="checkbox"
        />
        <span className={cn('text-sm', todo.completed && 'line-through text-muted-foreground')}>
          {todo.text}
        </span>
      </label>

      <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)} className="h-8 w-8">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
