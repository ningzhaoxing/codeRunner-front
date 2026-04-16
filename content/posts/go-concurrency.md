---
title: "Go 并发编程：从 Goroutine 到 Channel"
date: "2026-04-10"
tags: [Go, 并发]
summary: "深入理解 Go 并发模型，通过可运行的代码示例学习 goroutine、channel 和 select。"
---

Go 语言的并发模型基于 CSP（Communicating Sequential Processes），核心概念是 `goroutine` 和 `channel`。

## Goroutine 基础

启动一个 goroutine 非常简单，只需在函数调用前加 `go` 关键字：

```go
package main

import "fmt"

func sayHello() {
    fmt.Println("Hello from goroutine!")
}

func main() {
    go sayHello()
    fmt.Println("main function")
}
```

运行上面的代码，你会发现 `sayHello` 的输出可能不会出现。这是因为 `main` 函数退出时，所有 goroutine 会被强制终止。

## 使用 WaitGroup 等待

我们可以用 `sync.WaitGroup` 来等待 goroutine 完成：

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
        fmt.Println("done!")
    }()
    wg.Wait()
}
```

> 提示：点击代码块右上角的 🤖 按钮可以唤起 AI 助手。
