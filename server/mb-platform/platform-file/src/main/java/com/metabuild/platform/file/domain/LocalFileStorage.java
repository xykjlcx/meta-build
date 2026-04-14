package com.metabuild.platform.file.domain;

import com.metabuild.platform.file.api.FileStorage;
import com.metabuild.platform.file.config.MbFileProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * 本地文件存储实现。
 * 存储路径格式：{storagePath}/{sha256前2位}/{sha256第3-4位}/{完整sha256}
 * 例：/data/files/ab/cd/abcd1234...
 */
@Slf4j
@RequiredArgsConstructor
public class LocalFileStorage implements FileStorage {

    private final MbFileProperties properties;

    @Override
    public String store(MultipartFile file, String sha256) {
        // SHA-256 分级目录结构
        String level1 = sha256.substring(0, 2);
        String level2 = sha256.substring(2, 4);
        String relativePath = level1 + "/" + level2 + "/" + sha256;

        Path targetPath = Paths.get(properties.storagePath(), relativePath);
        try {
            Files.createDirectories(targetPath.getParent());
            // 若文件已存在（完全相同的 SHA-256），跳过写入（去重）
            if (!Files.exists(targetPath)) {
                try (InputStream in = file.getInputStream()) {
                    Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("文件存储失败: " + sha256, e);
        }
        return relativePath;
    }

    @Override
    public InputStream read(String filePath) {
        Path path = Paths.get(properties.storagePath(), filePath);
        try {
            return Files.newInputStream(path);
        } catch (IOException e) {
            throw new RuntimeException("文件读取失败: " + filePath, e);
        }
    }

    @Override
    public void delete(String filePath) {
        Path path = Paths.get(properties.storagePath(), filePath);
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("文件删除失败（忽略）: {}", filePath, e);
        }
    }
}
