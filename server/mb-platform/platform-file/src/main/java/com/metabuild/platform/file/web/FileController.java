package com.metabuild.platform.file.web;

import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.file.api.dto.FileUploadResponse;
import com.metabuild.platform.file.domain.FileService;
import com.metabuild.schema.tables.records.MbFileMetadataRecord;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 文件管理 Controller（上传/下载/删除）。
 */
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * 上传文件（multipart/form-data）。
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("file:file:upload")
    public FileUploadResponse upload(@RequestParam("file") MultipartFile file) {
        return fileService.upload(file);
    }

    /**
     * 下载文件（流式传输）。
     */
    @GetMapping("/{id}/download")
    @RequirePermission("file:file:download")
    public void download(@PathVariable Long id, HttpServletResponse response) throws IOException {
        MbFileMetadataRecord metadata = fileService.getMetadata(id);
        String encodedName = URLEncoder.encode(metadata.getOriginalName(), StandardCharsets.UTF_8)
            .replace("+", "%20");

        response.setContentType(metadata.getContentType() != null
            ? metadata.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename*=UTF-8''" + encodedName);
        response.setContentLengthLong(metadata.getFileSize());

        try (InputStream in = fileService.download(id)) {
            StreamUtils.copy(in, response.getOutputStream());
        }
    }

    /**
     * 删除文件。
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("file:file:delete")
    public void delete(@PathVariable Long id) {
        fileService.delete(id);
    }
}
