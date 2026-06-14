package com.natsume.blog.content.service;

import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.content.config.MinioConfig;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final MinioClient minioClient;
    private final MinioConfig minioConfig;

    @PostConstruct
    public void initBucket() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(minioConfig.getBucket()).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(minioConfig.getBucket()).build());
                minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                        .bucket(minioConfig.getBucket())
                        .config(publicReadPolicy(minioConfig.getBucket()))
                        .build());
                log.info("创建 MinIO bucket: {}", minioConfig.getBucket());
            }
        } catch (Exception e) {
            log.warn("初始化 MinIO bucket 失败（稍后上传时重试）: {}", e.getMessage());
        }
    }

    public String upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }
        String original = file.getOriginalFilename();
        String ext = original != null && original.contains(".")
                ? original.substring(original.lastIndexOf('.')) : "";
        String objectName = "images/" + LocalDate.now() + "/" + UUID.randomUUID().toString().replace("-", "") + ext;
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(minioConfig.getBucket())
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception e) {
            log.error("上传文件失败", e);
            throw new BusinessException("上传失败：" + e.getMessage());
        }
        return minioConfig.getPublicUrl() + "/" + minioConfig.getBucket() + "/" + objectName;
    }

    private String publicReadPolicy(String bucket) {
        return "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\","
                + "\"Action\":[\"s3:GetObject\"],\"Resource\":[\"arn:aws:s3:::" + bucket + "/*\"]}]}";
    }
}
