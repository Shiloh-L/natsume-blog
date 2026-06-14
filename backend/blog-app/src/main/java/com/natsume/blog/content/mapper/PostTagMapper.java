package com.natsume.blog.content.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface PostTagMapper {

    @Insert("INSERT INTO t_post_tag(post_id, tag_id) VALUES(#{postId}, #{tagId})")
    int insert(@Param("postId") Long postId, @Param("tagId") Long tagId);

    @Delete("DELETE FROM t_post_tag WHERE post_id = #{postId}")
    int deleteByPostId(@Param("postId") Long postId);

    @Select("SELECT tag_id FROM t_post_tag WHERE post_id = #{postId}")
    List<Long> selectTagIds(@Param("postId") Long postId);

    /** 批量查询多篇文章的 (post_id, tag_id) 关系，用于列表场景避免 N+1 */
    @Select("""
            <script>
            SELECT post_id AS postId, tag_id AS tagId FROM t_post_tag
            WHERE post_id IN
            <foreach collection="postIds" item="id" open="(" separator="," close=")">#{id}</foreach>
            </script>
            """)
    List<Map<String, Object>> selectPairs(@Param("postIds") List<Long> postIds);
}
