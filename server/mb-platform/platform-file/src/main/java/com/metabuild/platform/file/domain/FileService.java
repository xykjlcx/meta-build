package com.metabuild.platform.file.domain;

import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.file.api.FileStorage;
import com.metabuild.platform.file.api.dto.FileUploadResponse;
import com.metabuild.platform.file.config.MbFileProperties;
import com.metabuild.schema.tables.records.MbFileMetadataRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.NoSuchElementException;

/**
 * 文件业务服务（上传/下载/删除）。
 * 上传流程：SHA-256 计算 → 查重（相同文件复用元数据）→ 存储 → 保存元数据
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final FileStorage fileStorage;
    private final FileRepository fileRepository;
    private final MbFileProperties properties;
    private final SnowflakeIdGenerator idGenerator;
    private final CurrentUser currentUser;

    @Transactional
    public FileUploadResponse upload(MultipartFile file) {
        // 1. MIME 类型校验
        String contentType = file.getContentType();
        if (contentType == null || !properties.allowedTypes().contains(contentType)) {
            throw new IllegalArgumentException("不支持的文件类型: " + contentType);
        }

        // 2. 文件大小校验
        long maxBytes = (long) properties.maxSizeMb() * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("文件超过最大限制: " + properties.maxSizeMb() + "MB");
        }

        // 3. 计算 SHA-256
        String sha256 = computeSha256(file);

        // 4. 查重：相同 sha256 已存在则直接返回（文件去重）
        return fileRepository.findBySha256(sha256)
            .map(existing -> toResponse(existing))
            .orElseGet(() -> doUpload(file, sha256, contentType));
    }

    private FileUploadResponse doUpload(MultipartFile file, String sha256, String contentType) {
        // 5. 存储文件
        String storedPath = fileStorage.store(file, sha256);

        // 6. 获取文件扩展名
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null
            ? file.getOriginalFilename() : "unknown");
        String extension = "";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx >= 0) {
            extension = originalName.substring(dotIdx + 1);
        }

        // 7. 保存元数据
        MbFileMetadataRecord record = new MbFileMetadataRecord();
        record.setId(idGenerator.nextId());
        record.setTenantId(0L);
        record.setOriginalName(originalName);
        record.setStoredName(sha256);
        record.setFilePath(storedPath);
        record.setFileSize(file.getSize());
        record.setContentType(contentType);
        record.setFileExtension(extension);
        record.setSha256(sha256);
        record.setUploaderId(currentUser.isAuthenticated() ? currentUser.userId() : 0L);
        record.setOwnerDeptId(currentUser.isAuthenticated() && currentUser.deptId() != null
            ? currentUser.deptId() : 0L);
        record.setVersion(0);
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setCreatedAt(OffsetDateTime.now());
        record.setUpdatedAt(OffsetDateTime.now());

        fileRepository.insert(record);
        return toResponse(record);
    }

    public InputStream download(Long fileId) {
        MbFileMetadataRecord record = fileRepository.findById(fileId)
            .orElseThrow(() -> new NoSuchElementException("文件不存在: " + fileId));
        return fileStorage.read(record.getFilePath());
    }

    public MbFileMetadataRecord getMetadata(Long fileId) {
        return fileRepository.findById(fileId)
            .orElseThrow(() -> new NoSuchElementException("文件不存在: " + fileId));
    }

    @Transactional
    public void delete(Long fileId) {
        MbFileMetadataRecord record = fileRepository.findById(fileId)
            .orElseThrow(() -> new NoSuchElementException("文件不存在: " + fileId));
        fileStorage.delete(record.getFilePath());
        fileRepository.deleteById(fileId);
    }

    private String computeSha256(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream in = file.getInputStream();
                 DigestInputStream dis = new DigestInputStream(in, digest)) {
                byte[] buffer = new byte[8192];
                while (dis.read(buffer) != -1) {
                    // 边读边计算摘要
                }
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException | IOException e) {
            throw new RuntimeException("SHA-256 计算失败", e);
        }
    }

    private FileUploadResponse toResponse(MbFileMetadataRecord r) {
        return new FileUploadResponse(
            r.getId(), r.getOriginalName(), r.getFilePath(),
            r.getFileSize(), r.getContentType(), r.getSha256(), r.getCreatedAt()
        );
    }
}
