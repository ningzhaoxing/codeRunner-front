---
title: "图论：并查集与连通分量"
date: "2026-05-03"
tags: [Go, 图论, 数据结构, 算法]
summary: "用并查集维护连通关系，理解路径压缩、按大小合并和连通分量统计。"
---

并查集适合处理“元素是否属于同一个集合”的问题。它不关心路径长什么样，只关心两个点现在是否连通。

典型场景包括朋友圈、岛屿数量、网络连通性、最小生成树里的 Kruskal 算法。

## 初始化

```go
type DSU struct {
    parent []int
    size   []int
}

func NewDSU(n int) *DSU {
    parent := make([]int, n)
    size := make([]int, n)
    for i := 0; i < n; i++ {
        parent[i] = i
        size[i] = 1
    }
    return &DSU{parent: parent, size: size}
}
```

一开始每个节点都是自己的集合代表，也就是 `parent[i] = i`。

## 查找根节点

```go
func (d *DSU) Find(x int) int {
    if d.parent[x] != x {
        d.parent[x] = d.Find(d.parent[x])
    }
    return d.parent[x]
}
```

这一步叫路径压缩。查找时顺手把沿途节点都挂到根节点下面，后续查询会更快。

## 合并集合

```go
func (d *DSU) Union(a, b int) bool {
    ra, rb := d.Find(a), d.Find(b)
    if ra == rb {
        return false
    }

    if d.size[ra] < d.size[rb] {
        ra, rb = rb, ra
    }
    d.parent[rb] = ra
    d.size[ra] += d.size[rb]
    return true
}
```

按大小合并可以避免树退化。小集合挂到大集合下面，整体高度会更低。

## 判断连通

```go
func (d *DSU) Connected(a, b int) bool {
    return d.Find(a) == d.Find(b)
}
```

连通性判断就是比较两个节点的根节点是否相同。

## 统计连通分量

```go
func countComponents(n int, edges [][2]int) int {
    dsu := NewDSU(n)
    count := n

    for _, e := range edges {
        if dsu.Union(e[0], e[1]) {
            count--
        }
    }

    return count
}
```

每成功合并两个原本不连通的集合，连通分量数量就减少 1。

## 小结

并查集的能力边界很明确：它擅长回答“是否连通”，但不擅长告诉你“路径是什么”。如果题目只问分组、连通、合并，优先考虑并查集。

试试让 AI Agent 构造 6 个点，依次合并 `(0,1)、(1,2)、(3,4)`，然后查询 `0` 和 `2`、`0` 和 `4` 是否连通。
