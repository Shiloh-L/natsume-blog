package com.natsume.blog.auth.service;

import com.natsume.blog.auth.dto.UpdateProfileDTO;
import com.natsume.blog.auth.dto.UserVO;
import com.natsume.blog.auth.entity.SysUser;
import com.natsume.blog.auth.mapper.SysUserMapper;
import com.natsume.blog.common.dto.UserBrief;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final SysUserMapper userMapper;

    public UserVO getById(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        return toVO(user);
    }

    /** 批量查询用户展示信息（昵称/头像），供内容服务读取时拼装作者信息 */
    public List<UserBrief> batchBrief(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        List<SysUser> users = userMapper.selectBatchIds(ids);
        return users.stream()
                .map(u -> new UserBrief(u.getId(), u.getNickname(), u.getAvatar()))
                .collect(Collectors.toList());
    }

    public UserVO updateProfile(Long userId, UpdateProfileDTO dto) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        if (StringUtils.hasText(dto.getNickname())) {
            user.setNickname(dto.getNickname().trim());
        }
        if (dto.getAvatar() != null) {
            user.setAvatar(dto.getAvatar().trim());
        }
        if (dto.getBio() != null) {
            user.setBio(dto.getBio().trim());
        }
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail().trim());
        }
        userMapper.updateById(user);
        return toVO(user);
    }

    private UserVO toVO(SysUser user) {
        UserVO vo = new UserVO();
        vo.setUserId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setEmail(user.getEmail());
        vo.setAvatar(user.getAvatar());
        vo.setBio(user.getBio());
        vo.setRole(userMapper.selectRoleCode(user.getId()));
        return vo;
    }
}

