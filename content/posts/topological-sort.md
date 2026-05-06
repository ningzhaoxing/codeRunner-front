---
title: "图论：拓扑排序与依赖解析"
date: "2026-05-04"
tags: [Go, 图论, 算法]
summary: "用入度表和队列实现拓扑排序，理解课程表、任务编排和依赖检测。"
---

拓扑排序解决的是“有依赖关系的任务应该按什么顺序执行”。例如课程先修关系、构建系统依赖、工作流编排，都可以抽象成有向图。

如果有一条边 `A -> B`，表示必须先完成 A，才能完成 B。

## 入度是什么

入度表示一个节点还有多少前置依赖没有完成。

```go
func indegrees(n int, edges [][2]int) []int {
    indeg := make([]int, n)
    for _, e := range edges {
        to := e[1]
        indeg[to]++
    }
    return indeg
}
```

入度为 0 的节点没有前置依赖，可以立刻执行。

## 建图

```go
func buildGraph(n int, edges [][2]int) [][]int {
    graph := make([][]int, n)
    for _, e := range edges {
        from, to := e[0], e[1]
        graph[from] = append(graph[from], to)
    }
    return graph
}
```

这里用邻接表表示图。`graph[x]` 存放所有依赖 `x` 的后续节点。

## Kahn 算法

```go
func topoSort(n int, edges [][2]int) ([]int, bool) {
    graph := buildGraph(n, edges)
    indeg := indegrees(n, edges)

    queue := []int{}
    for i := 0; i < n; i++ {
        if indeg[i] == 0 {
            queue = append(queue, i)
        }
    }

    order := []int{}
    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        order = append(order, node)

        for _, next := range graph[node] {
            indeg[next]--
            if indeg[next] == 0 {
                queue = append(queue, next)
            }
        }
    }

    return order, len(order) == n
}
```

如果最终排序结果长度小于节点数，说明图里有环。有环就不存在合法的拓扑序。

## 课程表例子

```go
func canFinish(numCourses int, prerequisites [][2]int) bool {
    edges := make([][2]int, 0, len(prerequisites))
    for _, p := range prerequisites {
        course, pre := p[0], p[1]
        edges = append(edges, [2]int{pre, course})
    }

    _, ok := topoSort(numCourses, edges)
    return ok
}
```

如果 `prerequisites` 里 `[1, 0]` 表示学 1 前要先学 0，那么图上的边就是 `0 -> 1`。

## 小结

拓扑排序的套路很固定：

1. 建邻接表。
2. 统计入度。
3. 把入度为 0 的点入队。
4. 不断弹出节点，删除它指向的边。
5. 如果所有节点都被弹出，说明没有环。

试试让 AI Agent 补全一个 `main`：输入 4 门课和几条依赖，打印拓扑序；再加入一条反向依赖，看看如何检测环。
