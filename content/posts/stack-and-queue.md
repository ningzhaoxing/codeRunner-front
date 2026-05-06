---
title: "栈与队列：从括号匹配到 BFS"
date: "2026-05-05"
tags: [Go, 数据结构, 算法]
summary: "用 Go 实现栈和队列，理解后进先出、先进先出、括号匹配和 BFS。"
---

栈和队列是最基础的线性结构。它们都能用切片实现，但使用方式完全不同：

- 栈：后进先出，适合撤销、递归模拟、括号匹配。
- 队列：先进先出，适合任务排队、BFS、层序遍历。

## 栈：后进先出

```go
type Stack struct {
    data []int
}

func (s *Stack) Push(v int) {
    s.data = append(s.data, v)
}

func (s *Stack) Pop() (int, bool) {
    if len(s.data) == 0 {
        return 0, false
    }
    last := len(s.data) - 1
    v := s.data[last]
    s.data = s.data[:last]
    return v, true
}
```

栈顶就是切片末尾。`append` 入栈，截断切片出栈，复杂度都是 O(1)。

## 括号匹配

```go
func isValidBrackets(s string) bool {
    stack := []rune{}
    pairs := map[rune]rune{
        ')': '(',
        ']': '[',
        '}': '{',
    }

    for _, ch := range s {
        switch ch {
        case '(', '[', '{':
            stack = append(stack, ch)
        case ')', ']', '}':
            if len(stack) == 0 || stack[len(stack)-1] != pairs[ch] {
                return false
            }
            stack = stack[:len(stack)-1]
        }
    }

    return len(stack) == 0
}
```

遇到左括号入栈，遇到右括号就看栈顶是否匹配。这个模型也能迁移到 HTML 标签匹配、表达式求值等问题。

## 队列：先进先出

```go
type Queue struct {
    data []int
    head int
}

func (q *Queue) Push(v int) {
    q.data = append(q.data, v)
}

func (q *Queue) Pop() (int, bool) {
    if q.head >= len(q.data) {
        return 0, false
    }
    v := q.data[q.head]
    q.head++
    return v, true
}
```

这里没有用 `q.data = q.data[1:]`，因为频繁切片会保留底层数组引用。用 `head` 指针更容易控制复杂度和内存行为。

## BFS：队列的典型场景

```go
func bfs(graph map[int][]int, start int) []int {
    visited := map[int]bool{start: true}
    queue := []int{start}
    order := []int{}

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        order = append(order, node)

        for _, next := range graph[node] {
            if visited[next] {
                continue
            }
            visited[next] = true
            queue = append(queue, next)
        }
    }

    return order
}
```

BFS 每次取出当前“最早进入队列”的节点，再把它的邻居放到队尾。因此它天然按层推进。

## 小结

看到“最近的先处理”，优先想栈。看到“按到达顺序处理”，优先想队列。很多算法题的核心不是结构复杂，而是你能否识别应该用哪种顺序。

试试让 AI Agent 构造一个图，运行 BFS，观察访问顺序为什么是一层一层展开。
