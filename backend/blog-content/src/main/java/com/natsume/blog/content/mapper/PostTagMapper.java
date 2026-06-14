package com.natsume.blog.content.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PostTagMapper {

    @Insert("INSERT INTO t_post_tag(post_id, tag_id) VALUES(#{postId}, #{tagId})")
    int insert(@Param("postId") Long postId, @Param("tagId") Long tagId);

    @Delete("DELETE FROM t_post_tag WHERE post_id = #{postId}")
    int deleteByPostId(@Param("postId") Long postId);

    @Select("SELECT tag_id FROM t_post_tag WHERE post_id = #{postId}")
    List<Long> selectTagIds(@Param("postId") Long postId);
}
