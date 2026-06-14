-- ============================================================
--  关注关系表 — 追加到 blog 库
-- ============================================================
USE `blog`;

CREATE TABLE IF NOT EXISTS `t_follow` (
  `id`           BIGINT   NOT NULL AUTO_INCREMENT,
  `follower_id`  BIGINT   NOT NULL COMMENT '关注者(粉丝)用户ID',
  `followee_id`  BIGINT   NOT NULL COMMENT '被关注者用户ID',
  `create_time`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follower_followee` (`follower_id`, `followee_id`),
  KEY `idx_followee` (`followee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关注关系';

-- 种子：猫咪老师(2) 关注 夏目贵志(1)
INSERT INTO `t_follow` (`follower_id`, `followee_id`) VALUES (2, 1);
