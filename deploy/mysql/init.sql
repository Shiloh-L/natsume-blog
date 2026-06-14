-- ============================================================
--  夏目博客 (Natsume Blog) — 数据库初始化脚本
--  执行用户: root (docker-entrypoint-initdb.d)
-- ============================================================
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ------------------------------------------------------------
--  授权: blog 用户可访问 blog 与 blog_auth 库
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `blog`       DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `blog_auth`  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `blog`.*      TO 'blog'@'%';
GRANT ALL PRIVILEGES ON `blog_auth`.* TO 'blog'@'%';
FLUSH PRIVILEGES;

-- ============================================================
--  认证库  blog_auth
-- ============================================================
USE `blog_auth`;

CREATE TABLE IF NOT EXISTS `sys_user` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username`    VARCHAR(50)  NOT NULL COMMENT '登录名',
  `password`    VARCHAR(100) NOT NULL COMMENT 'BCrypt 密码',
  `nickname`    VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
  `email`       VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `avatar`      VARCHAR(255) DEFAULT NULL COMMENT '头像',
  `bio`         VARCHAR(255) DEFAULT NULL COMMENT '个性签名',
  `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态 0禁用 1正常',
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS `sys_role` (
  `id`        BIGINT      NOT NULL AUTO_INCREMENT,
  `code`      VARCHAR(50) NOT NULL COMMENT '角色编码',
  `name`      VARCHAR(50) NOT NULL COMMENT '角色名称',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

CREATE TABLE IF NOT EXISTS `sys_user_role` (
  `user_id` BIGINT NOT NULL,
  `role_id` BIGINT NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联';

INSERT INTO `sys_role` (`id`, `code`, `name`) VALUES
  (1, 'ROLE_ADMIN', '管理员'),
  (2, 'ROLE_USER',  '普通用户');

-- 密码: admin -> admin123 ; natsume -> natsume123
INSERT INTO `sys_user` (`id`, `username`, `password`, `nickname`, `email`, `avatar`, `bio`, `status`) VALUES
  (1, 'admin',   '$2b$10$X9xPhGpHWYiJnChOMq.rq.Ti5/uA2hgRTuKwSthUAJeuBfYwbLm5.', '夏目贵志', 'admin@natsume.blog',   'https://picsum.photos/seed/natsume-admin/200/200', '我能看见你们看不见的东西。', 1),
  (2, 'natsume', '$2b$10$WiiUgb4jX4WbWFFA7ImE8.f7m.ISQn3GmKA2n0Z3Sz0lNYRgi91Ce', '猫咪老师', 'nyanko@natsume.blog',   'https://picsum.photos/seed/nyanko-sensei/200/200', '把友人帐给我，我就当你的保镖。', 1);

INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES (1, 1), (2, 2);

-- ============================================================
--  内容库  blog
-- ============================================================
USE `blog`;

CREATE TABLE IF NOT EXISTS `t_category` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(50)  NOT NULL COMMENT '分类名',
  `description` VARCHAR(255) DEFAULT NULL,
  `cover`       VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  `sort`        INT          NOT NULL DEFAULT 0,
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

CREATE TABLE IF NOT EXISTS `t_tag` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(50) NOT NULL,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表';

CREATE TABLE IF NOT EXISTS `t_post` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `title`         VARCHAR(150) NOT NULL COMMENT '标题',
  `summary`       VARCHAR(500) DEFAULT NULL COMMENT '摘要',
  `content`       LONGTEXT     NOT NULL COMMENT '正文 Markdown',
  `cover`         VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  `category_id`   BIGINT       DEFAULT NULL,
  `author_id`     BIGINT       NOT NULL,
  `author_name`   VARCHAR(50)  DEFAULT NULL,
  `status`        TINYINT      NOT NULL DEFAULT 1 COMMENT '0草稿 1发布',
  `is_top`        TINYINT      NOT NULL DEFAULT 0 COMMENT '是否置顶',
  `view_count`    BIGINT       NOT NULL DEFAULT 0,
  `like_count`    BIGINT       NOT NULL DEFAULT 0,
  `comment_count` BIGINT       NOT NULL DEFAULT 0,
  `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status_time` (`status`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章表';

CREATE TABLE IF NOT EXISTS `t_post_tag` (
  `post_id` BIGINT NOT NULL,
  `tag_id`  BIGINT NOT NULL,
  PRIMARY KEY (`post_id`, `tag_id`),
  KEY `idx_tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章标签关联';

CREATE TABLE IF NOT EXISTS `t_comment` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `post_id`     BIGINT       NOT NULL,
  `parent_id`   BIGINT       NOT NULL DEFAULT 0 COMMENT '父评论 0为顶级',
  `user_id`     BIGINT       NOT NULL,
  `user_name`   VARCHAR(50)  DEFAULT NULL,
  `user_avatar` VARCHAR(255) DEFAULT NULL,
  `content`     VARCHAR(1000) NOT NULL,
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- ---------------------- 种子数据 ----------------------
INSERT INTO `t_category` (`id`, `name`, `description`, `cover`, `sort`) VALUES
  (1, '妖怪图鉴', '记录那些只有我能看见的朋友们', '', 1),
  (2, '乡间日常', '八原町的四季与温柔时光',     '', 2),
  (3, '技术随笔', '关于代码与架构的思考',         '', 3),
  (4, '友人帐',   '归还名字的旅程',               '', 4);

INSERT INTO `t_tag` (`id`, `name`) VALUES
  (1,'妖怪'),(2,'治愈'),(3,'夏天'),(4,'回忆'),(5,'猫咪老师'),
  (6,'SpringCloud'),(7,'React'),(8,'微服务'),(9,'温柔'),(10,'旅行');

INSERT INTO `t_post` (`id`,`title`,`summary`,`content`,`cover`,`category_id`,`author_id`,`author_name`,`status`,`is_top`,`view_count`,`like_count`,`comment_count`) VALUES
  (1,'把名字还给你', '在斑的陪伴下，我开始归还友人帐里的名字。每一个名字背后，都是一段温柔的相遇。',
   '# 把名字还给你\n\n夏夜的风穿过稻田，萤火虫在水边轻轻浮动。\n\n外婆**玲子**留下的友人帐，记录着她曾经打败并夺走名字的妖怪们。如今，我要把这些名字一个一个地还回去。\n\n> "名字一旦被夺走，就再也无法违抗持有者的命令。"\n\n斑——也就是猫咪老师，懒洋洋地趴在我的肩头：「快点还完，然后把友人帐给我。」\n\n## 今天遇见的妖怪\n\n- 住在古井旁的**露神**\n- 喜欢恶作剧的小狐狸\n- 等待了五十年的**萤**\n\n每一次归还，都像是替外婆完成了一个未尽的约定。',
   '',1,1,'夏目贵志',1,1,1280,342,2),
  (2,'猫咪老师的中元节', '招财猫造型的斑，最爱的不是供品，而是热闹本身。',
   '# 猫咪老师的中元节\n\n镇上的祭典开始了，红色的灯笼一路延伸到神社。\n\n斑变回了招财猫的模样，混在人群里偷吃团子。「人类的祭典，果然还是吃的最棒。」\n\n我笑着跟在后面，妖怪与人类的界限，在这一刻变得模糊而温柔。\n\n## 祭典小食\n- 章鱼烧\n- 苹果糖\n- 刨冰（斑吃了三碗）',
   '',2,1,'夏目贵志',1,0,860,210,1),
  (3,'用 Spring Cloud 搭建一座桥', '把单体应用拆成微服务，就像把名字一个个归还——各司其职，又彼此相连。',
   '# 用 Spring Cloud 搭建一座桥\n\n这个博客本身就是一个微服务系统。\n\n## 架构\n\n- **Nacos** 负责服务注册与配置\n- **Gateway** 是所有请求的入口\n- **Sentinel** 守护着流量的边界\n- **RabbitMQ** 传递着异步的消息\n- **Qdrant** 让文字可以被向量语义检索\n- **Redis** 记住了热门的瞬间\n\n```java\n@FeignClient("blog-auth")\npublic interface AuthClient {\n    @GetMapping("/api/user/{id}")\n    Result<UserVO> getUser(@PathVariable Long id);\n}\n```\n\n架构如同妖怪的世界，看不见，却真实地支撑着一切。',
   '',3,1,'夏目贵志',1,0,2030,540,0),
  (4,'萤火与告别', '有些妖怪，用一生等待一个夏天。',
   '# 萤火与告别\n\n她说，她只能在夏天出现。\n\n我们约定，明年的夏天，还要在这片水边相见。可是妖怪的寿命与人的时光，本就难以重叠。\n\n离别不是结束，而是把思念，轻轻折进友人帐里。',
   '',1,2,'猫咪老师',1,0,1540,401,0),
  (5,'前端的温柔：用 React 还原水彩世界', '柔和的色彩、缓慢的动画，让界面也有了呼吸感。',
   '# 前端的温柔\n\n为了还原夏目友人帐的水彩质感，我用了：\n\n- **TailwindCSS** 调出奶油色与抹茶绿\n- **Motion** 让卡片像云一样浮动\n- **TanStack Query** 默默地在后台同步数据\n\n界面应该像乡间的风，温柔地拂过，而不打扰。',
   '',3,1,'夏目贵志',1,0,990,288,0);

INSERT INTO `t_post_tag` (`post_id`,`tag_id`) VALUES
  (1,1),(1,2),(1,4),(1,5),
  (2,3),(2,5),(2,2),
  (3,6),(3,8),(3,9),
  (4,1),(4,3),(4,4),
  (5,7),(5,9),(5,2);

INSERT INTO `t_comment` (`id`,`post_id`,`parent_id`,`user_id`,`user_name`,`user_avatar`,`content`) VALUES
  (1,1,0,2,'猫咪老师','https://picsum.photos/seed/nyanko-sensei/100/100','别忘了把友人帐给我！'),
  (2,1,1,1,'夏目贵志','https://picsum.photos/seed/natsume-admin/100/100','等我还完名字就给你啦。'),
  (3,2,0,2,'猫咪老师','https://picsum.photos/seed/nyanko-sensei/100/100','刨冰再来一碗。');

-- ===== 朋友圈（动态广场） =====
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

-- ===== 消息通知 =====
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

-- ===== 关注关系 =====
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

-- ===== 文章收藏（藏书阁） =====
-- ============================================================
--  文章收藏表 — 追加到 blog 库
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
