package com.natsume.blog.content.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName(value = "t_moment", autoResultMap = true)
public class Moment {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String content;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> images;

    private String location;
    private Integer likeCount;
    private Integer commentCount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
