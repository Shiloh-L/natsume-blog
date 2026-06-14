package com.natsume.blog.content.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.natsume.blog.content.entity.MomentLike;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MomentLikeMapper extends BaseMapper<MomentLike> {
}
