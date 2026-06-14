-- ============================================================
--  消息通知表 — 追加到 blog 库
-- ============================================================
USE `blog`;

CREATE TABLE IF NOT EXISTS `t_notification` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `recipient_id` BIGINT       NOT NULL COMMENT '接收者用户ID',
  `actor_id`     BIGINT       NOT NULL COMMENT '触发者用户ID',
  `actor_name`   VARCHAR(50)  DEFAULT NULL COMMENT '触发者(冗余,展示用读取时实时解析)',
  `type`         VARCHAR(30)  NOT NULL COMMENT 'POST_COMMENT/POST_REPLY/MOMENT_COMMENT/MOMENT_REPLY/MOMENT_LIKE',
  `target_type`  VARCHAR(20)  NOT NULL COMMENT 'POST / MOMENT',
  `target_id`    BIGINT       NOT NULL COMMENT '目标文章/动态ID',
  `excerpt`      VARCHAR(200) DEFAULT NULL COMMENT '内容摘要(评论内容/动态摘要)',
  `is_read`      TINYINT      NOT NULL DEFAULT 0,
  `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recipient` (`recipient_id`, `is_read`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知';
