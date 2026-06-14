package com.natsume.blog.ai.controller;

import com.natsume.blog.ai.dto.AskRequest;
import com.natsume.blog.ai.dto.AskResponse;
import com.natsume.blog.ai.dto.ChatRequest;
import com.natsume.blog.ai.dto.GenerateRequest;
import com.natsume.blog.ai.dto.SummaryRequest;
import com.natsume.blog.ai.service.AiService;
import com.natsume.blog.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@Tag(name = "AI 助手 · 猫咪老师")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @Operation(summary = "与猫咪老师对话")
    @PostMapping("/chat")
    public Result<String> chat(@Valid @RequestBody ChatRequest request) {
        return Result.success(aiService.chat(request.getMessage()));
    }

    @Operation(summary = "流式对话 (SSE)")
    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> stream(@RequestParam String message) {
        return aiService.stream(message);
    }

    @Operation(summary = "AI 生成文章摘要")
    @PostMapping("/summary")
    public Result<String> summary(@Valid @RequestBody SummaryRequest request) {
        return Result.success(aiService.summarize(request.getContent()));
    }

    /* ---------------- AI 写作 ---------------- */

    @Operation(summary = "AI 流式生成整篇文章 (SSE)")
    @GetMapping(value = "/write/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> writeStream(@RequestParam String topic,
                                    @RequestParam(required = false) String style,
                                    @RequestParam(required = false) String category) {
        return aiService.generateArticle(topic, style, category);
    }

    @Operation(summary = "AI 一次性生成整篇文章")
    @PostMapping("/write")
    public Result<String> write(@Valid @RequestBody GenerateRequest req) {
        String article = aiService.generateArticle(req.getTopic(), req.getStyle(), req.getCategory())
                .collectList().map(list -> String.join("", list)).block();
        return Result.success(article);
    }

    @Operation(summary = "AI 续写 (SSE)")
    @PostMapping(value = "/continue/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> continueStream(@RequestBody Map<String, String> body) {
        return aiService.continueWriting(body.getOrDefault("text", ""));
    }

    @Operation(summary = "AI 润色")
    @PostMapping("/polish")
    public Result<String> polish(@Valid @RequestBody SummaryRequest req) {
        return Result.success(aiService.polish(req.getContent()));
    }

    @Operation(summary = "AI 生成标题候选")
    @PostMapping("/titles")
    public Result<List<String>> titles(@RequestBody Map<String, String> body) {
        return Result.success(aiService.suggestTitles(body.getOrDefault("text", "")));
    }

    @Operation(summary = "AI 推荐标签")
    @PostMapping("/tags")
    public Result<List<String>> tags(@Valid @RequestBody SummaryRequest req) {
        return Result.success(aiService.suggestTags(req.getContent()));
    }

    /* ---------------- RAG 问答 ---------------- */

    @Operation(summary = "基于博客内容的 RAG 问答")
    @PostMapping("/ask")
    public Result<AskResponse> ask(@Valid @RequestBody AskRequest req) {
        return Result.success(aiService.ask(req.getQuestion()));
    }
}
