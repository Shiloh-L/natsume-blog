package com.natsume.blog.content.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.natsume.blog.content.entity.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface PostMapper extends BaseMapper<Post> {

    @Update("UPDATE t_post SET view_count = view_count + #{delta} WHERE id = #{id}")
    int incrView(Long id, long delta);

    @Update("UPDATE t_post SET like_count = like_count + 1 WHERE id = #{id}")
    int incrLike(Long id);

    @Update("UPDATE t_post SET comment_count = comment_count + #{delta} WHERE id = #{id}")
    int incrComment(Long id, int delta);
}
