package com.metabuild.platform.file.domain;

import com.metabuild.schema.tables.records.MbFileMetadataRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import static com.metabuild.schema.tables.MbFileMetadata.MB_FILE_METADATA;

/**
 * 文件元数据访问层（仅 jOOQ）。
 */
@Repository
@RequiredArgsConstructor
public class FileRepository {

    private final DSLContext dsl;

    public Optional<MbFileMetadataRecord> findById(Long id) {
        return dsl.selectFrom(MB_FILE_METADATA)
            .where(MB_FILE_METADATA.ID.eq(id))
            .fetchOptional();
    }

    public Optional<MbFileMetadataRecord> findBySha256(String sha256) {
        return dsl.selectFrom(MB_FILE_METADATA)
            .where(MB_FILE_METADATA.SHA256.eq(sha256))
            .fetchOptional();
    }

    public Long insert(MbFileMetadataRecord record) {
        dsl.insertInto(MB_FILE_METADATA).set(record).execute();
        return record.getId();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_FILE_METADATA).where(MB_FILE_METADATA.ID.eq(id)).execute();
    }
}
