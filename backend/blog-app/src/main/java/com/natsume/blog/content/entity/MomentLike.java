package com.natsume.blog.content.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_moment_like")
public class MomentLike {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long momentId;
    private Long userId;
    private String userName;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
