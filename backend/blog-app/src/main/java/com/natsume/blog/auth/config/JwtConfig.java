package com.natsume.blog.auth.config;

import com.natsume.blog.common.utils.JwtUtil;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {

    /** 至少 32 字节，HS256 */
    private String secret = "natsume-book-of-friends-secret-key-2024";
    /** 过期秒数，默认 7 天 */
    private long expire = 604800;

    @Bean
    public JwtUtil jwtUtil() {
        return new JwtUtil(secret, expire);
    }
}
