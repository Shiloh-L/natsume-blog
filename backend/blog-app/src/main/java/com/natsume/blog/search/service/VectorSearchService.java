package com.natsume.blog.search.service;

import com.natsume.blog.common.dto.PostIndexEvent;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.search.entity.RetrievedDoc;
import com.natsume.blog.search.entity.SearchVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 向量检索服务：基于 Spring AI VectorStore + Qdrant + 本地 ONNX 向量化。
 * 实现语义搜索（semantic search）与 RAG 召回（retrieve）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VectorSearchService {

    private final VectorStore vectorStore;

    private static String docId(Long postId) {
        return UUID.nameUUIDFromBytes(("post-" + postId).getBytes()).toString();
    }

    /** 新增 / 更新文章向量 */
    public void index(PostIndexEvent e) {
        delete(e.getId());
        String text = buildText(e);
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("postId", String.valueOf(e.getId()));
        meta.put("title", nv(e.getTitle()));
        meta.put("summary", nv(e.getSummary()));
        meta.put("cover", nv(e.getCover()));
        meta.put("categoryName", nv(e.getCategoryName()));
        meta.put("authorName", nv(e.getAuthorName()));
        meta.put("tags", e.getTags() == null ? "" : String.join(",", e.getTags()));
        meta.put("viewCount", String.valueOf(e.getViewCount() == null ? 0L : e.getViewCount()));
        meta.put("createTime", e.getCreateTime() == null ? "" : e.getCreateTime().toString());
        meta.put("content", clip(nv(e.getContent()), 600));

        Document doc = new Document(docId(e.getId()), text, meta);
        vectorStore.add(List.of(doc));
        log.info("向量索引文章 id={} title={}", e.getId(), e.getTitle());
    }

    public void delete(Long postId) {
        try {
            vectorStore.delete(List.of(docId(postId)));
        } catch (Exception ex) {
            log.debug("删除向量(可忽略) id={} : {}", postId, ex.getMessage());
        }
    }

    /** 语义搜索（向量召回 + 关键词重排的混合检索） */
    public PageResult<SearchVO> search(String keyword, int current, int size) {
        if (!StringUtils.hasText(keyword)) {
            return PageResult.empty(current, size);
        }
        List<Document> docs = vectorStore.similaritySearch(
                SearchRequest.builder().query(keyword).topK(50).similarityThreshold(0.0).build());
        // 混合打分：向量相似度 + 关键词重叠度
        List<Scored> scored = new ArrayList<>();
        for (Document d : docs) {
            double hybrid = hybridScore(keyword, d);
            scored.add(new Scored(d, hybrid));
        }
        scored.sort((a, b) -> Double.compare(b.score, a.score));

        int from = Math.min((current - 1) * size, scored.size());
        int to = Math.min(from + size, scored.size());
        List<SearchVO> page = new ArrayList<>();
        for (Scored s : scored.subList(from, to)) {
            SearchVO vo = toVO(s.doc);
            vo.setScore(round(s.score));
            page.add(vo);
        }
        return PageResult.of(page, scored.size(), current, size);
    }

    /** RAG 召回：混合检索返回最相关的若干篇文章（含正文片段） */
    public List<RetrievedDoc> retrieve(String query, int topK) {
        if (!StringUtils.hasText(query)) {
            return List.of();
        }
        List<Document> docs = vectorStore.similaritySearch(
                SearchRequest.builder().query(query).topK(50).similarityThreshold(0.0).build());
        List<Scored> scored = new ArrayList<>();
        for (Document d : docs) {
            scored.add(new Scored(d, hybridScore(query, d)));
        }
        scored.sort((a, b) -> Double.compare(b.score, a.score));

        List<RetrievedDoc> result = new ArrayList<>();
        for (Scored s : scored.subList(0, Math.min(topK, scored.size()))) {
            Map<String, Object> m = s.doc.getMetadata();
            RetrievedDoc r = new RetrievedDoc();
            r.setPostId(asLong(m.get("postId")));
            r.setTitle(str(m.get("title")));
            r.setContent(s.doc.getText());
            r.setScore(round(s.score));
            result.add(r);
        }
        return result;
    }

    private record Scored(Document doc, double score) {}

    /** 混合得分 = 0.45*向量相似度 + 0.55*关键词重叠（对中文友好） */
    private double hybridScore(String query, Document d) {
        double vec = d.getScore() == null ? 0.0 : d.getScore();
        Map<String, Object> m = d.getMetadata();
        String title = str(m.get("title"));
        String body = str(m.get("title")) + " " + str(m.get("summary")) + " "
                + str(m.get("tags")) + " " + d.getText();
        double kwTitle = overlap(query, title);
        double kwBody = overlap(query, body);
        double kw = 0.6 * kwTitle + 0.4 * kwBody;
        return 0.45 * vec + 0.55 * kw;
    }

    /** 关键词重叠度：query 的 2-gram 在目标文本中出现的比例 */
    private double overlap(String query, String text) {
        if (query == null || text == null || query.isBlank()) return 0.0;
        String q = query.toLowerCase().replaceAll("\\s+", "");
        String t = text.toLowerCase();
        if (q.length() == 1) return t.contains(q) ? 1.0 : 0.0;
        int hit = 0, total = 0;
        for (int i = 0; i + 2 <= q.length(); i++) {
            total++;
            if (t.contains(q.substring(i, i + 2))) hit++;
        }
        return total == 0 ? 0.0 : (double) hit / total;
    }

    private static double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    private SearchVO toVO(Document d) {
        Map<String, Object> m = d.getMetadata();
        SearchVO vo = new SearchVO();
        vo.setId(asLong(m.get("postId")));
        vo.setTitle(str(m.get("title")));
        vo.setSummary(str(m.get("summary")));
        vo.setCover(str(m.get("cover")));
        vo.setCategoryName(str(m.get("categoryName")));
        vo.setAuthorName(str(m.get("authorName")));
        String tags = str(m.get("tags"));
        vo.setTags(tags.isBlank() ? List.of() : List.of(tags.split(",")));
        vo.setViewCount(asLong(m.get("viewCount")));
        vo.setCreateTime(str(m.get("createTime")));
        vo.setScore(d.getScore());
        vo.setSnippet(clip(str(m.get("summary")).isBlank() ? d.getText() : str(m.get("summary")), 120));
        return vo;
    }

    private String buildText(PostIndexEvent e) {
        StringBuilder sb = new StringBuilder();
        if (e.getTitle() != null) sb.append(e.getTitle()).append("。");
        if (e.getSummary() != null) sb.append(e.getSummary()).append("。");
        if (e.getTags() != null && !e.getTags().isEmpty()) sb.append("标签：").append(String.join(" ", e.getTags())).append("。");
        if (e.getContent() != null) sb.append(clip(e.getContent(), 1500));
        return sb.toString();
    }

    private static String nv(String s) { return s == null ? "" : s; }
    private static String str(Object o) { return o == null ? "" : o.toString(); }
    private static Long asLong(Object o) {
        if (o == null) return 0L;
        try { return Long.parseLong(o.toString()); } catch (Exception e) { return 0L; }
    }
    private static String clip(String s, int max) {
        if (s == null) return "";
        s = s.replaceAll("[#>*`\\-]", " ").replaceAll("\\s+", " ").trim();
        return s.length() > max ? s.substring(0, max) : s;
    }
}
