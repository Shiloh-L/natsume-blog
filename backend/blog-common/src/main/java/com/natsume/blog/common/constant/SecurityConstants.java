package com.natsume.blog.common.constant;

/**
 * 网关与服务间传递的安全相关常量
 */
public interface SecurityConstants {

    /** 请求头中的 JWT */
    String TOKEN_HEADER = "Authorization";

    /** Bearer 前缀 */
    String TOKEN_PREFIX = "Bearer ";

    /** 网关解析 JWT 后透传给下游服务的用户ID头 */
    String USER_ID_HEADER = "X-User-Id";

    /** 透传用户名 */
    String USER_NAME_HEADER = "X-User-Name";

    /** 透传角色 */
    String USER_ROLE_HEADER = "X-User-Role";

    /** Redis: 登录 token 存储前缀 */
    String LOGIN_TOKEN_PREFIX = "blog:auth:token:";

    /** Redis: 文章缓存前缀 */
    String POST_CACHE_PREFIX = "blog:post:";

    /** Redis: 文章浏览量前缀 */
    String POST_VIEW_PREFIX = "blog:post:view:";
}
