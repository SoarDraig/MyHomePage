"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useIsMobile } from "@/hooks/use-mobile"

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export function Notes() {
  const isMobile = useIsMobile()
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [shatteringId, setShatteringId] = useState<string | null>(null)

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
    setShatteringId(id)
    setTimeout(() => {
      setDeletingId(id)
      setShatteringId(null)
      setTimeout(() => {
        setTodos(todos.filter((todo) => todo.id !== id))
        setDeletingId(null)
      }, 300)
    }, 500)
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
            className={`flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 ease-out group ${
              isMobile ? "" : "hover:bg-white/20"
            } ${shatteringId === todo.id ? "animate-glass-shatter" : deletingId === todo.id ? "opacity-0 scale-0" : "animate-fade-in"}`}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} className="mt-0.5" />
            </div>
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
              className={`h-6 w-6 transition-all duration-300 shrink-0 hover:scale-110 hover:rotate-90 ${
                isMobile
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              } ${shatteringId === todo.id ? "opacity-0" : ""}`}
              onClick={(e) => {
                e.stopPropagation()
                if (shatteringId !== todo.id) {
                  handleDeleteTodo(todo.id)
                }
              }}
              disabled={shatteringId === todo.id}
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
