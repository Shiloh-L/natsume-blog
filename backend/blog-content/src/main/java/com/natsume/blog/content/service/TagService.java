package com.natsume.blog.content.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.content.entity.Tag;
import com.natsume.blog.content.mapper.TagMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagMapper tagMapper;

    public List<Tag> list() {
        return tagMapper.selectList(null);
    }

    public List<Tag> listByPost(Long postId) {
        return tagMapper.selectByPostId(postId);
    }

    /** 创建标签：按名去重，已存在则返回现有 id（幂等） */
    public Long create(Tag tag) {
        String name = tag.getName() == null ? "" : tag.getName().trim();
        if (name.isEmpty()) {
            throw new BusinessException("标签名不能为空");
        }
        if (name.length() > 20) {
            throw new BusinessException("标签名不能超过 20 字");
        }
        Tag existing = tagMapper.selectOne(new LambdaQueryWrapper<Tag>().eq(Tag::getName, name).last("LIMIT 1"));
        if (existing != null) {
            return existing.getId();
        }
        Tag fresh = new Tag();
        fresh.setName(name);
        tagMapper.insert(fresh);
        return fresh.getId();
    }

    public void delete(Long id) {
        tagMapper.deleteById(id);
    }
}
