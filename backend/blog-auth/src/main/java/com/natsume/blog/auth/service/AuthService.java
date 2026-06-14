package com.natsume.blog.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.natsume.blog.auth.dto.LoginDTO;
import com.natsume.blog.auth.dto.LoginVO;
import com.natsume.blog.auth.dto.RegisterDTO;
import com.natsume.blog.auth.entity.SysUser;
import com.natsume.blog.auth.mapper.SysUserMapper;
import com.natsume.blog.common.constant.SecurityConstants;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.common.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;

    private static final long DEFAULT_ROLE_ID = 2L;
    private static final String DEFAULT_ROLE_CODE = "ROLE_USER";

    @Transactional(rollbackFor = Exception.class)
    public LoginVO register(RegisterDTO dto) {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, dto.getUsername()));
        if (count != null && count > 0) {
            throw new BusinessException(ResultCode.USERNAME_EXISTS);
        }
        SysUser user = new SysUser();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname() == null || dto.getNickname().isBlank()
                ? dto.getUsername() : dto.getNickname());
        user.setEmail(dto.getEmail());
        user.setAvatar("https://picsum.photos/seed/" + dto.getUsername() + "/200/200");
        user.setBio("初来乍到，请多关照。");
        user.setStatus(1);
        userMapper.insert(user);
        userMapper.insertUserRole(user.getId(), DEFAULT_ROLE_ID);
        return buildLoginVO(user, DEFAULT_ROLE_CODE);
    }

    public LoginVO login(LoginDTO dto) {
        SysUser user = userMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, dto.getUsername()));
        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR);
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        String role = userMapper.selectRoleCode(user.getId());
        return buildLoginVO(user, role == null ? DEFAULT_ROLE_CODE : role);
    }

    public void logout(Long userId) {
        if (userId != null) {
            redisTemplate.delete(SecurityConstants.LOGIN_TOKEN_PREFIX + userId);
        }
    }

    private LoginVO buildLoginVO(SysUser user, String role) {
        String token = jwtUtil.generate(user.getId(), user.getUsername(), role);
        redisTemplate.opsForValue().set(SecurityConstants.LOGIN_TOKEN_PREFIX + user.getId(),
                token, Duration.ofMillis(jwtUtil.getExpireMillis()));
        LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setUserId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setAvatar(user.getAvatar());
        vo.setRole(role);
        return vo;
    }
}
