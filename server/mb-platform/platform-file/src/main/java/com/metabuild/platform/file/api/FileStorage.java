package com.metabuild.platform.file.api;

import java.io.InputStream;

/**
 * 文件存储接口（业务层唯一调用点，实现类对业务层透明）。
 * v1 只有 LocalFileStorage 实现，未来可扩展到 OSS/S3。
 * <p>
 * 接口接受 InputStream 而非 MultipartFile，与 HTTP 传输层解耦。
 * Controller 负责从 MultipartFile 提取参数后调用 FileService，
 * FileService 调用本接口时传入 InputStream。
 */
public interface FileStorage {

    /**
     * 上传文件，返回存储路径。
     *
     * @param filename    原始文件名（用于确定扩展名等元信息）
     * @param input       文件输入流
     * @param contentType MIME 类型
     * @param size        文件大小（字节）
     * @param sha256      文件 SHA-256 摘要（调用方预先计算）
     * @return 存储相对路径（相对于 storagePath）
     */
    String store(String filename, InputStream input, String contentType, long size, String sha256);

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
