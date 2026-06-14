package com.natsume.blog.content.service;

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

    public Long create(Tag tag) {
        tagMapper.insert(tag);
        return tag.getId();
    }

    public void delete(Long id) {
        tagMapper.deleteById(id);
    }
}
