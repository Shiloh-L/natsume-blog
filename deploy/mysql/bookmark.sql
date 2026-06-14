-- ============================================================
--  文章收藏（藏书阁）— 追加到 blog 库
-- ============================================================
USE `blog`;

CREATE TABLE IF NOT EXISTS `t_bookmark` (
  `id`          BIGINT   NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT   NOT NULL COMMENT '收藏者用户ID',
  `post_id`     BIGINT   NOT NULL COMMENT '被收藏文章ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_post` (`user_id`, `post_id`),
  KEY `idx_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章收藏';

-- 种子：猫咪老师(2) 收藏了《用 Spring Cloud 搭建一座桥》(3) 与《前端的温柔》(5)
INSERT INTO `t_bookmark` (`user_id`, `post_id`) VALUES (2, 3), (2, 5);
