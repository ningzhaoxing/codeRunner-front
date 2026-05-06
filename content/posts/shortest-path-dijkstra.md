---
title: "图论：Dijkstra 最短路算法"
date: "2026-05-02"
tags: [Go, 图论, 算法]
summary: "用优先队列实现 Dijkstra，理解非负权图中的单源最短路。"
---

最短路问题问的是：从一个起点出发，到其他节点的最小代价是多少。Dijkstra 算法适用于边权非负的图。

如果图里存在负权边，就不要直接用 Dijkstra，需要考虑 Bellman-Ford 或 SPFA 等方案。

## 图结构

```go
type Edge struct {
    To     int
    Weight int
}

func addEdge(graph [][]Edge, from, to, weight int) {
    graph[from] = append(graph[from], Edge{To: to, Weight: weight})
}
```

这里用邻接表表示带权图。`Weight` 可以是距离、耗时、费用，也可以是任何非负代价。

## 优先队列元素

Go 标准库提供了 `container/heap`，实现最小堆需要定义几个方法。

```go
type Item struct {
    Node int
    Dist int
}

type MinHeap []Item

func (h MinHeap) Len() int           { return len(h) }
func (h MinHeap) Less(i, j int) bool { return h[i].Dist < h[j].Dist }
func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *MinHeap) Push(x any) {
    *h = append(*h, x.(Item))
}

func (h *MinHeap) Pop() any {
    old := *h
    n := len(old)
    item := old[n-1]
    *h = old[:n-1]
    return item
}
```

堆顶永远是当前已知距离最小的节点。

## Dijkstra 主流程

```go
func dijkstra(graph [][]Edge, start int) []int {
    const INF = int(1e18)
    dist := make([]int, len(graph))
    for i := range dist {
        dist[i] = INF
    }
    dist[start] = 0

    pq := &MinHeap{{Node: start, Dist: 0}}
    heap.Init(pq)

    for pq.Len() > 0 {
        item := heap.Pop(pq).(Item)
        if item.Dist > dist[item.Node] {
            continue
        }

        for _, edge := range graph[item.Node] {
            nextDist := item.Dist + edge.Weight
            if nextDist < dist[edge.To] {
                dist[edge.To] = nextDist
                heap.Push(pq, Item{Node: edge.To, Dist: nextDist})
            }
        }
    }

    return dist
}
```

`if item.Dist > dist[item.Node]` 是为了跳过过期状态。因为 Go 的 heap 没有原地 decrease-key，通常直接把新距离再推入堆，旧状态弹出来时丢掉。

## 构造一个例子

```go
func buildWeightedGraph() [][]Edge {
    graph := make([][]Edge, 5)
    addEdge(graph, 0, 1, 2)
    addEdge(graph, 0, 2, 5)
    addEdge(graph, 1, 2, 1)
    addEdge(graph, 1, 3, 2)
    addEdge(graph, 2, 3, 1)
    addEdge(graph, 3, 4, 3)
    return graph
}
```

从 0 到 2 的最短路不是直接走 `0 -> 2`，而是 `0 -> 1 -> 2`，总代价是 3。

## 小结

Dijkstra 的核心是不反悔：每次从优先队列取出当前距离最小的节点，在非负权图中，这个距离就是最终答案。

试试让 AI Agent 补全 import 和 main，运行 `buildWeightedGraph()`，打印从 0 到所有节点的最短距离。
