-- ============================================================
--  朋友圈（动态广场）建表脚本 — 追加到 blog 库
-- ============================================================
USE `blog`;

CREATE TABLE IF NOT EXISTS `t_moment` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT       NOT NULL,
  `user_name`     VARCHAR(50)  DEFAULT NULL,
  `user_avatar`   VARCHAR(255) DEFAULT NULL,
  `content`       VARCHAR(2000) DEFAULT NULL COMMENT '文字内容',
  `images`        JSON         DEFAULT NULL COMMENT '图片URL数组(最多9)',
  `location`      VARCHAR(100) DEFAULT NULL COMMENT '位置',
  `like_count`    INT          NOT NULL DEFAULT 0,
  `comment_count` INT          NOT NULL DEFAULT 0,
  `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='朋友圈动态';

CREATE TABLE IF NOT EXISTS `t_moment_like` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `moment_id`   BIGINT      NOT NULL,
  `user_id`     BIGINT      NOT NULL,
  `user_name`   VARCHAR(50) DEFAULT NULL,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_moment_user` (`moment_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='朋友圈点赞';

CREATE TABLE IF NOT EXISTS `t_moment_comment` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `moment_id`    BIGINT       NOT NULL,
  `root_id`      BIGINT       NOT NULL DEFAULT 0 COMMENT '主楼评论ID,0为主楼',
  `user_id`      BIGINT       NOT NULL,
  `user_name`    VARCHAR(50)  DEFAULT NULL,
  `user_avatar`  VARCHAR(255) DEFAULT NULL,
  `reply_to_id`  BIGINT       NOT NULL DEFAULT 0 COMMENT '回复的用户ID',
  `reply_to_name` VARCHAR(50) DEFAULT NULL COMMENT '回复的用户名',
  `content`      VARCHAR(500) NOT NULL,
  `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_moment` (`moment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='朋友圈评论';

-- ---------------------- 种子数据 ----------------------
INSERT INTO `t_moment` (`id`,`user_id`,`user_name`,`user_avatar`,`content`,`images`,`location`,`like_count`,`comment_count`) VALUES
  (1,1,'夏目贵志','https://picsum.photos/seed/natsume-admin/100/100',
   '今天和斑去后山散步，遇见了一只小妖怪在采蘑菇。它说要请我吃晚饭，被猫咪老师一口拒绝了——「夏目的晚饭本大爷包了！」',
   JSON_ARRAY('https://picsum.photos/seed/m1a/600/600','https://picsum.photos/seed/m1b/600/600','https://picsum.photos/seed/m1c/600/600'),
   '八原町·后山', 12, 2),
  (2,2,'猫咪老师','https://picsum.photos/seed/nyanko-sensei/100/100',
   '今日份的刨冰打卡 🍧 草莓味的最棒，本大爷一口气吃了三碗。夏目还说我贪吃，哼。',
   JSON_ARRAY('https://picsum.photos/seed/m2a/600/600'),
   '夏日祭', 28, 1),
  (3,1,'夏目贵志','https://picsum.photos/seed/natsume-admin/100/100',
   '把今天归还的名字记在了友人帐里。又一位朋友，自由了。',
   JSON_ARRAY('https://picsum.photos/seed/m3a/600/600','https://picsum.photos/seed/m3b/600/600','https://picsum.photos/seed/m3c/600/600','https://picsum.photos/seed/m3d/600/600'),
   NULL, 18, 0);

INSERT INTO `t_moment_comment` (`moment_id`,`root_id`,`user_id`,`user_name`,`user_avatar`,`reply_to_id`,`reply_to_name`,`content`) VALUES
  (1,0,2,'猫咪老师','https://picsum.photos/seed/nyanko-sensei/100/100',0,NULL,'那只小妖怪的蘑菇看起来就不好吃。'),
  (1,1,1,'夏目贵志','https://picsum.photos/seed/natsume-admin/100/100',2,'猫咪老师','你只是想自己吃独食吧 😏'),
  (2,0,1,'夏目贵志','https://picsum.photos/seed/natsume-admin/100/100',0,NULL,'三碗…肚子不会疼吗？');

INSERT INTO `t_moment_like` (`moment_id`,`user_id`,`user_name`) VALUES
  (1,2,'猫咪老师'),(2,1,'夏目贵志');
