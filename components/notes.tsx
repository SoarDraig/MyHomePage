"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export function Notes() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodo, setNewTodo] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("todos")
    if (saved) {
      setTodos(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])

  const handleAddTodo = () => {
    if (!newTodo.trim()) return

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setTodos([todo, ...todos])
    setNewTodo("")
  }

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddTodo()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-medium text-foreground text-center mb-4">待办事项</h2>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="添加新任务..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-white/5 border-white/10 focus:border-primary/50"
        />
        <Button size="sm" onClick={handleAddTodo} disabled={!newTodo.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all group"
          >
            <Checkbox checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm break-words ${
                  todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {todo.text}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={() => handleDeleteTodo(todo.id)}
            >
              <X className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}

        {todos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无待办事项</p>
            <p className="text-sm mt-1">输入任务按回车添加</p>
          </div>
        )}
      </div>
    </div>
  )
}
