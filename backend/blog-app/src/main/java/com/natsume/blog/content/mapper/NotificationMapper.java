package com.natsume.blog.content.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.natsume.blog.content.entity.Notification;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {
}
