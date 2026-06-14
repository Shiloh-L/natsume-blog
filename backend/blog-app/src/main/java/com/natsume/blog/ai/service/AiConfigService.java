package com.natsume.blog.ai.service;

import com.natsume.blog.ai.dto.AiConfigDTO;
import com.natsume.blog.ai.dto.AiConfigVO;
import com.natsume.blog.ai.entity.AiConfig;
import com.natsume.blog.ai.mapper.AiConfigMapper;
import com.natsume.blog.common.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * AI 配置中心：DB 持久化 + 运行时热重建 ChatClient。
 * - 配置存于 t_ai_config 单行；管理员在后台修改后立即重建 ChatClient，无需重启。
 * - api_key 留空时回退到环境变量 LLM_API_KEY，避免把密钥写进数据库/仓库。
 */
@Slf4j
@Service
public class AiConfigService {

    private static final Long CONFIG_ID = 1L;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final AiConfigMapper mapper;

    @Value("${LLM_BASE_URL:https://api.deepseek.com}")
    private String envBaseUrl;
    @Value("${LLM_API_KEY:}")
    private String envApiKey;
    @Value("${LLM_MODEL:deepseek-chat}")
    private String envModel;

    private volatile ChatClient cachedClient;

    public AiConfigService(AiConfigMapper mapper) {
        this.mapper = mapper;
    }

    @PostConstruct
    public void init() {
        try {
            rebuild();
            log.info("AI 配置已加载并初始化 ChatClient");
        } catch (Exception e) {
            log.warn("AI ChatClient 初始化失败（将在首次调用时重试）: {}", e.getMessage());
        }
    }

    /** 业务调用入口：始终返回当前生效配置构建的 ChatClient */
    public ChatClient chatClient() {
        ChatClient c = cachedClient;
        if (c == null) {
            synchronized (this) {
                if (cachedClient == null) {
                    rebuild();
                }
                c = cachedClient;
            }
        }
        return c;
    }

    /** 读取生效配置（DB 优先，缺省回退环境变量），密钥脱敏 */
    public AiConfigVO getView() {
        AiConfig cfg = loadOrDefault();
        AiConfigVO vo = new AiConfigVO();
        vo.setProvider(cfg.getProvider());
        vo.setBaseUrl(cfg.getBaseUrl());
        vo.setModel(cfg.getModel());
        vo.setTemperature(cfg.getTemperature() == null ? 0.7 : cfg.getTemperature().doubleValue());
        String effectiveKey = effectiveKey(cfg);
        vo.setApiKeySet(effectiveKey != null && !effectiveKey.isBlank() && !"sk-no-key-required".equals(effectiveKey));
        vo.setApiKeyMasked(mask(effectiveKey));
        vo.setUpdateTime(cfg.getUpdateTime() == null ? null : cfg.getUpdateTime().format(FMT));
        return vo;
    }

    /** 管理员更新配置：持久化 + 重建 ChatClient */
    public synchronized AiConfigVO update(AiConfigDTO dto) {
        if (dto.getBaseUrl() == null || dto.getBaseUrl().isBlank()) {
            throw new BusinessException("服务地址不能为空呢");
        }
        if (dto.getModel() == null || dto.getModel().isBlank()) {
            throw new BusinessException("模型名称不能为空呢");
        }
        AiConfig cfg = mapper.selectById(CONFIG_ID);
        boolean insert = (cfg == null);
        if (cfg == null) {
            cfg = new AiConfig();
            cfg.setId(CONFIG_ID);
        }
        cfg.setProvider(dto.getProvider() == null || dto.getProvider().isBlank() ? "自定义" : dto.getProvider().trim());
        cfg.setBaseUrl(dto.getBaseUrl().trim());
        cfg.setModel(dto.getModel().trim());
        double t = dto.getTemperature() == null ? 0.7 : dto.getTemperature();
        cfg.setTemperature(BigDecimal.valueOf(Math.max(0, Math.min(2, t))));
        // 仅当传入新密钥时才覆盖；留空则保持原值（继续回退环境变量）
        if (dto.getApiKey() != null && !dto.getApiKey().isBlank()) {
            cfg.setApiKey(dto.getApiKey().trim());
        } else if (insert) {
            cfg.setApiKey("");
        }
        if (insert) {
            mapper.insert(cfg);
        } else {
            mapper.updateById(cfg);
        }
        rebuild();
        log.info("AI 配置已更新并重建 ChatClient: provider={} model={} baseUrl={}",
                cfg.getProvider(), cfg.getModel(), cfg.getBaseUrl());
        return getView();
    }

    /** 用当前生效配置重建 ChatClient */
    private synchronized void rebuild() {
        AiConfig cfg = loadOrDefault();
        String key = effectiveKey(cfg);
        OpenAiApi api = OpenAiApi.builder()
                .baseUrl(cfg.getBaseUrl())
                .apiKey(key == null || key.isBlank() ? "sk-no-key-required" : key)
                .build();
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(cfg.getModel())
                .temperature(cfg.getTemperature() == null ? 0.7 : cfg.getTemperature().doubleValue())
                // 本机/第三方网关可能向模型注入外部工具，关闭内部工具执行避免 No ToolCallback 报错
                .internalToolExecutionEnabled(false)
                .build();
        OpenAiChatModel model = OpenAiChatModel.builder()
                .openAiApi(api)
                .defaultOptions(options)
                .build();
        this.cachedClient = ChatClient.create(model);
    }

    private AiConfig loadOrDefault() {
        AiConfig cfg = mapper.selectById(CONFIG_ID);
        if (cfg == null) {
            cfg = new AiConfig();
            cfg.setId(CONFIG_ID);
            cfg.setProvider("DeepSeek");
            cfg.setBaseUrl(envBaseUrl);
            cfg.setApiKey("");
            cfg.setModel(envModel);
            cfg.setTemperature(BigDecimal.valueOf(0.7));
        }
        return cfg;
    }

    /** DB 密钥优先，留空则回退环境变量 */
    private String effectiveKey(AiConfig cfg) {
        if (cfg.getApiKey() != null && !cfg.getApiKey().isBlank()) {
            return cfg.getApiKey();
        }
        return envApiKey;
    }

    private String mask(String key) {
        if (key == null || key.isBlank() || "sk-no-key-required".equals(key)) {
            return "";
        }
        if (key.length() <= 8) {
            return "****";
        }
        return key.substring(0, 4) + "…" + key.substring(key.length() - 4);
    }
}
