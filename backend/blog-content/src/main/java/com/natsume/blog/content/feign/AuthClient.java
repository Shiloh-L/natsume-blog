package com.natsume.blog.content.feign;

import com.natsume.blog.common.dto.UserBrief;
import com.natsume.blog.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "blog-auth")
public interface AuthClient {

    @GetMapping("/api/users/batch")
    Result<List<UserBrief>> batch(@RequestParam("ids") List<Long> ids);
}
