---
title: "链表：从指针到反转链表"
date: "2026-05-06"
tags: [Go, 数据结构, 算法]
summary: "用 Go 理解单链表的节点、遍历、头插法、删除节点和反转链表。"
---

数组适合随机访问，链表适合在已知位置附近做插入和删除。链表的关键不是背 API，而是看清楚每个节点只保存两件事：当前值和下一个节点的地址。

本文用 Go 写单链表。代码块会故意保留成片段，你可以直接让 AI Agent 补全 `main`、构造测试数据并运行。

## 节点结构

```go
type ListNode struct {
    Val  int
    Next *ListNode
}

func buildList(nums []int) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    for _, n := range nums {
        cur.Next = &ListNode{Val: n}
        cur = cur.Next
    }
    return dummy.Next
}
```

`dummy` 是一个虚拟头节点。它不保存业务数据，只负责让“第一个节点”的处理和后续节点保持一致。

## 遍历链表

```go
func values(head *ListNode) []int {
    result := []int{}
    for cur := head; cur != nil; cur = cur.Next {
        result = append(result, cur.Val)
    }
    return result
}
```

链表不能像数组一样 `nums[i]` 直接跳到第 i 个元素。你只能从头节点开始，沿着 `Next` 一步步走。

## 头插法

头插法常用于“逆序构造链表”。每次新节点都插到当前头节点前面。

```go
func pushFront(head *ListNode, val int) *ListNode {
    node := &ListNode{Val: val}
    node.Next = head
    return node
}
```

如果连续插入 `1, 2, 3`，最终链表是 `3 -> 2 -> 1`。这也是反转链表的基本动作。

## 删除指定值

```go
func removeValue(head *ListNode, target int) *ListNode {
    dummy := &ListNode{Next: head}
    prev := dummy

    for prev.Next != nil {
        if prev.Next.Val == target {
            prev.Next = prev.Next.Next
            continue
        }
        prev = prev.Next
    }

    return dummy.Next
}
```

删除节点时，不需要真的“删除对象”。只要让前一个节点跳过它：`prev.Next = prev.Next.Next`。

## 反转链表

```go
func reverseList(head *ListNode) *ListNode {
    var prev *ListNode
    cur := head

    for cur != nil {
        next := cur.Next
        cur.Next = prev
        prev = cur
        cur = next
    }

    return prev
}
```

这段代码的核心是三个指针：

- `prev`：已经反转好的前半段
- `cur`：当前正在处理的节点
- `next`：提前保存原来的下一个节点，防止链断掉后找不回来

## 小结

链表题大多不是复杂算法，而是指针关系。写链表代码时，先画出“当前节点、前一个节点、下一个节点”，再动手写代码，错误会少很多。

试试让 AI Agent 补全一段程序：构造 `1 -> 2 -> 3 -> 4`，打印原链表，反转后再打印。
