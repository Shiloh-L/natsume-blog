-- ============================================================
--  AI 模型配置（可在后台管理页配置，运行时热生效）— 追加到 blog 库
-- ============================================================
USE `blog`;

CREATE TABLE IF NOT EXISTS `t_ai_config` (
  `id`          BIGINT       NOT NULL COMMENT '固定单行，id=1',
  `provider`    VARCHAR(50)  NOT NULL DEFAULT 'DeepSeek' COMMENT '供应商标签',
  `base_url`    VARCHAR(255) NOT NULL COMMENT 'OpenAI 兼容 base-url',
  `api_key`     VARCHAR(255) NOT NULL DEFAULT '' COMMENT '密钥；留空则回退到环境变量 LLM_API_KEY',
  `model`       VARCHAR(100) NOT NULL COMMENT '模型名',
  `temperature` DECIMAL(3,2) NOT NULL DEFAULT 0.70 COMMENT '采样温度',
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 模型配置';

-- 种子：DeepSeek，api_key 留空（运行时回退到 .env 的 LLM_API_KEY，避免密钥入库）
INSERT INTO `t_ai_config` (`id`, `provider`, `base_url`, `api_key`, `model`, `temperature`) VALUES
  (1, 'DeepSeek', 'https://api.deepseek.com', '', 'deepseek-chat', 0.70)
ON DUPLICATE KEY UPDATE `id` = `id`;
