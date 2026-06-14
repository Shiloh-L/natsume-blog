package com.natsume.blog.content.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_follow")
public class Follow {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long followerId;
    private Long followeeId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
