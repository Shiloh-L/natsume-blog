package com.natsume.blog.content.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.natsume.blog.content.entity.Moment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface MomentMapper extends BaseMapper<Moment> {

    @Update("UPDATE t_moment SET like_count = like_count + #{delta} WHERE id = #{id}")
    int incrLike(Long id, int delta);

    @Update("UPDATE t_moment SET comment_count = comment_count + #{delta} WHERE id = #{id}")
    int incrComment(Long id, int delta);
}
