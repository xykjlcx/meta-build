package com.metabuild.platform.file.api;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Optional;

/**
 * 文件存储接口（业务层唯一调用点，实现类对业务层透明）。
 * v1 只有 LocalFileStorage 实现，未来可扩展到 OSS/S3。
 */
public interface FileStorage {

    /**
     * 上传文件，返回存储路径。
     *
     * @param file        MultipartFile 上传文件
     * @param sha256      文件 SHA-256 摘要（调用方预先计算）
     * @return 存储相对路径（相对于 storagePath）
     */
    String store(MultipartFile file, String sha256);

    /**
     * 读取文件流。
     *
     * @param filePath 存储路径
     * @return 文件输入流
     */
    InputStream read(String filePath);

    /**
     * 删除文件。
     *
     * @param filePath 存储路径
     */
    void delete(String filePath);
}
