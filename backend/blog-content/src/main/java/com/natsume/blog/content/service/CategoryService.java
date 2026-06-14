package com.natsume.blog.content.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.content.entity.Category;
import com.natsume.blog.content.mapper.CategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryMapper categoryMapper;

    public List<Category> list() {
        return categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                .orderByAsc(Category::getSort));
    }

    public Category getById(Long id) {
        return categoryMapper.selectById(id);
    }

    /** 创建分类：按名去重，已存在则返回现有 id；自动追加排序 */
    public Long create(Category category) {
        String name = category.getName() == null ? "" : category.getName().trim();
        if (name.isEmpty()) {
            throw new BusinessException("分类名不能为空");
        }
        if (name.length() > 20) {
            throw new BusinessException("分类名不能超过 20 字");
        }
        Category existing = categoryMapper.selectOne(
                new LambdaQueryWrapper<Category>().eq(Category::getName, name).last("LIMIT 1"));
        if (existing != null) {
            return existing.getId();
        }
        Category fresh = new Category();
        fresh.setName(name);
        fresh.setDescription(category.getDescription());
        fresh.setCover(category.getCover());
        Integer maxSort = categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                        .orderByDesc(Category::getSort).last("LIMIT 1"))
                .stream().map(Category::getSort).findFirst().orElse(0);
        fresh.setSort((maxSort == null ? 0 : maxSort) + 1);
        categoryMapper.insert(fresh);
        return fresh.getId();
    }

    public void update(Category category) {
        categoryMapper.updateById(category);
    }

    public void delete(Long id) {
        categoryMapper.deleteById(id);
    }
}
