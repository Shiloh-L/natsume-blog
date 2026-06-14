package com.natsume.blog.content.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.natsume.blog.content.entity.Tag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TagMapper extends BaseMapper<Tag> {

    @Select("""
            SELECT t.* FROM t_tag t
            JOIN t_post_tag pt ON pt.tag_id = t.id
            WHERE pt.post_id = #{postId}
            """)
    List<Tag> selectByPostId(@Param("postId") Long postId);
}
