package com.natsume.blog.content.controller;

import com.natsume.blog.common.dto.PostIndexEvent;
import com.natsume.blog.content.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * 订阅与站点地图：为博客提供 RSS 2.0 订阅源与 sitemap.xml，便于阅读器订阅与搜索引擎收录。
 * 直接复用 PostService 的已发布文章数据，无需额外存储。
 */
@RestController
@RequiredArgsConstructor
public class FeedController {

    private final PostService postService;

    @Value("${site.base-url:http://localhost:8888}")
    private String siteBaseUrl;

    private static final DateTimeFormatter RFC822 =
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);
    private static final DateTimeFormatter W3C =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private String base() {
        String b = siteBaseUrl == null ? "" : siteBaseUrl.trim();
        return b.endsWith("/") ? b.substring(0, b.length() - 1) : b;
    }

    @GetMapping(value = "/rss.xml", produces = "application/rss+xml; charset=UTF-8")
    public String rss() {
        String base = base();
        List<PostIndexEvent> posts = postService.allIndexEvents();
        posts.sort(Comparator.comparing(PostIndexEvent::getCreateTime,
                Comparator.nullsLast(Comparator.reverseOrder())));

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n");
        sb.append("  <channel>\n");
        sb.append("    <title>夏目友人帐 · 温柔小屋</title>\n");
        sb.append("    <link>").append(esc(base)).append("</link>\n");
        sb.append("    <atom:link href=\"").append(esc(base)).append("/rss.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n");
        sb.append("    <description>关于代码、夏天与回忆的点滴</description>\n");
        sb.append("    <language>zh-CN</language>\n");
        for (PostIndexEvent p : posts) {
            String link = base + "/post/" + p.getId();
            String desc = p.getSummary() != null && !p.getSummary().isBlank()
                    ? p.getSummary() : clip(p.getContent(), 200);
            sb.append("    <item>\n");
            sb.append("      <title>").append(esc(nv(p.getTitle()))).append("</title>\n");
            sb.append("      <link>").append(esc(link)).append("</link>\n");
            sb.append("      <guid isPermaLink=\"true\">").append(esc(link)).append("</guid>\n");
            if (p.getCategoryName() != null) {
                sb.append("      <category>").append(esc(p.getCategoryName())).append("</category>\n");
            }
            if (p.getCreateTime() != null) {
                sb.append("      <pubDate>")
                        .append(p.getCreateTime().atZone(ZoneId.of("Asia/Shanghai")).format(RFC822))
                        .append("</pubDate>\n");
            }
            sb.append("      <description>").append(esc(nv(desc))).append("</description>\n");
            sb.append("    </item>\n");
        }
        sb.append("  </channel>\n");
        sb.append("</rss>\n");
        return sb.toString();
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE + "; charset=UTF-8")
    public String sitemap() {
        String base = base();
        List<PostIndexEvent> posts = postService.allIndexEvents();

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        // 站点固定入口
        sb.append("  <url><loc>").append(esc(base)).append("/</loc></url>\n");
        for (String path : new String[]{"/archive", "/moments", "/about"}) {
            sb.append("  <url><loc>").append(esc(base)).append(esc(path)).append("</loc></url>\n");
        }
        // 每篇已发布文章
        for (PostIndexEvent p : posts) {
            sb.append("  <url>\n");
            sb.append("    <loc>").append(esc(base)).append("/post/").append(p.getId()).append("</loc>\n");
            if (p.getCreateTime() != null) {
                sb.append("    <lastmod>").append(p.getCreateTime().format(W3C)).append("</lastmod>\n");
            }
            sb.append("  </url>\n");
        }
        sb.append("</urlset>\n");
        return sb.toString();
    }

    private static String nv(String s) {
        return s == null ? "" : s;
    }

    private static String clip(String s, int max) {
        if (s == null) return "";
        String t = s.replaceAll("[#>*`\\-\\[\\]!]", " ").replaceAll("\\s+", " ").trim();
        return t.length() > max ? t.substring(0, max) + "…" : t;
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
