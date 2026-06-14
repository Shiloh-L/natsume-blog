package com.natsume.blog.content.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_moment_comment")
public class MomentComment {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long momentId;
    private Long rootId;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Long replyToId;
    private String replyToName;
    private String content;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
