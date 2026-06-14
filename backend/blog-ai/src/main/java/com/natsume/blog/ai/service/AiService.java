package com.natsume.blog.ai.service;

import com.natsume.blog.ai.dto.AskResponse;
import com.natsume.blog.ai.dto.RetrievedDoc;
import com.natsume.blog.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class AiService {

    private static final String SYSTEM_PROMPT = """
            你是《夏目友人帐》中的猫咪老师（斑）。
            说话风格慵懒、傲娇又暗藏温柔，偶尔贪吃，喜欢自称“本大爷”。
            你现在是“夏目博客”的 AI 助手，帮助访客解答关于文章、妖怪和生活的问题。
            回答要简洁、亲切、有治愈感，可以适当使用颜文字，但不要太长。
            """;

    private static final String WRITER_SYSTEM = """
            你是一位文笔细腻、温柔治愈的博客作者，文风带有《夏目友人帐》般的自然与诗意。
            请输出规范的 Markdown：包含一级标题、若干小节（二级标题）、适当的列表或引用。
            内容真挚、有画面感，避免空话套话。只输出文章正文，不要额外解释。
            """;

    private final ChatClient chatClient;
    private final SearchClient searchClient;

    public AiService(ChatClient.Builder builder, SearchClient searchClient) {
        this.chatClient = builder.build();
        this.searchClient = searchClient;
    }

    /* ---------------- 对话 ---------------- */

    public String chat(String message) {
        return chatClient.prompt().system(SYSTEM_PROMPT).user(message).call().content();
    }

    public Flux<String> stream(String message) {
        return chatClient.prompt().system(SYSTEM_PROMPT).user(message).stream().content();
    }

    /* ---------------- 写作辅助 ---------------- */

    public String summarize(String content) {
        return chatClient.prompt()
                .user(u -> u.text("请用不超过 80 字，为下面这篇博客文章生成一段温柔、引人入胜的摘要，直接输出摘要内容：\n\n{article}")
                        .param("article", clip(content, 4000)))
                .call().content();
    }

    /** 流式生成整篇文章 */
    public Flux<String> generateArticle(String topic, String style, String category) {
        String s = (style == null || style.isBlank()) ? "温柔治愈" : style;
        String c = (category == null || category.isBlank()) ? "随笔" : category;
        String user = """
                请以「%s」为主题写一篇博客文章。
                风格：%s；分类：%s。
                字数 500-900 字，结构清晰，富有画面感。
                """.formatted(topic, s, c);
        return chatClient.prompt().system(WRITER_SYSTEM).user(user).stream().content();
    }

    /** 续写 */
    public Flux<String> continueWriting(String existing) {
        return chatClient.prompt().system(WRITER_SYSTEM)
                .user(u -> u.text("请承接下面的内容自然地继续写下去，保持文风一致，只输出续写的部分：\n\n{text}")
                        .param("text", clip(existing, 4000)))
                .stream().content();
    }

    /** 润色 */
    public String polish(String content) {
        return chatClient.prompt().system(WRITER_SYSTEM)
                .user(u -> u.text("请在保持原意的前提下润色下面的文字，使其更优美流畅，直接输出润色后的 Markdown：\n\n{text}")
                        .param("text", clip(content, 4000)))
                .call().content();
    }

    /** 根据主题/正文生成标题候选 */
    public List<String> suggestTitles(String topicOrContent) {
        String raw = chatClient.prompt()
                .user(u -> u.text("根据以下内容，生成 5 个吸引人的中文博客标题，每行一个，不要序号、不要多余符号：\n\n{text}")
                        .param("text", clip(topicOrContent, 2000)))
                .call().content();
        List<String> titles = new ArrayList<>();
        for (String line : raw.split("\\r?\\n")) {
            String t = line.replaceAll("^[\\d.、\\-*\\s]+", "").trim();
            if (!t.isBlank()) titles.add(t);
        }
        return titles;
    }

    /** 根据正文推荐标签 */
    public List<String> suggestTags(String content) {
        String raw = chatClient.prompt()
                .user(u -> u.text("根据以下文章内容，推荐 3-6 个简短的中文标签，用英文逗号分隔，只输出标签：\n\n{text}")
                        .param("text", clip(content, 2000)))
                .call().content();
        List<String> tags = new ArrayList<>();
        for (String t : raw.split("[,，\\n]")) {
            String str = t.replaceAll("[#\\s]", "").trim();
            if (!str.isBlank() && str.length() <= 10) tags.add(str);
        }
        return tags;
    }

    /* ---------------- RAG 问答 ---------------- */

    public AskResponse ask(String question) {
        List<RetrievedDoc> docs = retrieve(question, 4);
        AskResponse resp = new AskResponse();
        List<AskResponse.Citation> citations = new ArrayList<>();
        StringBuilder context = new StringBuilder();
        int i = 1;
        for (RetrievedDoc d : docs) {
            context.append("【资料").append(i).append("】标题：").append(d.getTitle())
                    .append("\n").append(clip(d.getContent(), 500)).append("\n\n");
            AskResponse.Citation cit = new AskResponse.Citation();
            cit.setPostId(d.getPostId());
            cit.setTitle(d.getTitle());
            cit.setScore(d.getScore());
            citations.add(cit);
            i++;
        }
        String prompt = context.length() == 0
                ? "博客里暂时没有相关文章，请你以猫咪老师的口吻温柔地告诉用户这一点，并简短回答：" + question
                : """
                你是夏目博客的 AI 助手「猫咪老师」。请**仅根据**下面检索到的博客资料回答用户的问题。
                如果资料不足以回答，就如实说明。回答用中文，简洁亲切，可在末尾用「（参考：标题）」标注引用。

                === 检索到的资料 ===
                %s
                === 用户问题 ===
                %s
                """.formatted(context, question);

        String answer = chatClient.prompt().system(SYSTEM_PROMPT).user(prompt).call().content();
        resp.setAnswer(answer);
        resp.setCitations(citations);
        return resp;
    }

    private List<RetrievedDoc> retrieve(String query, int topK) {
        try {
            Result<List<RetrievedDoc>> r = searchClient.retrieve(query, topK);
            return r != null && r.getData() != null ? r.getData() : List.of();
        } catch (Exception e) {
            log.warn("RAG 召回失败: {}", e.getMessage());
            return List.of();
        }
    }

    private static String clip(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) : s;
    }
}
