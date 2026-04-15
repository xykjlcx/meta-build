package com.metabuild.business.notice.domain;

import com.metabuild.business.notice.api.vo.AttachmentVo;
import com.metabuild.common.id.SnowflakeIdGenerator;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.metabuild.schema.tables.BizNoticeAttachment.BIZ_NOTICE_ATTACHMENT;
import static com.metabuild.schema.tables.MbFileMetadata.MB_FILE_METADATA;

/**
 * 公告附件关联数据访问层。
 * <p>
 * 负责 biz_notice_attachment 的增删查，JOIN mb_file_metadata 获取文件元数据。
 */
@Repository
@RequiredArgsConstructor
public class NoticeAttachmentRepository {

    private final DSLContext dsl;
    private final SnowflakeIdGenerator idGenerator;

    /**
     * 批量插入附件关联记录，sortOrder 按 fileIds 列表顺序递增。
     *
     * @param noticeId  公告 ID
     * @param fileIds   文件 ID 列表（顺序即排序）
     * @param createdBy 创建人 ID
     * @param tenantId  租户 ID
     */
    public void batchInsert(Long noticeId, List<Long> fileIds, Long createdBy, Long tenantId) {
        if (fileIds == null || fileIds.isEmpty()) {
            return;
        }
        for (int i = 0; i < fileIds.size(); i++) {
            dsl.insertInto(BIZ_NOTICE_ATTACHMENT)
                .set(BIZ_NOTICE_ATTACHMENT.ID, idGenerator.nextId())
                .set(BIZ_NOTICE_ATTACHMENT.NOTICE_ID, noticeId)
                .set(BIZ_NOTICE_ATTACHMENT.FILE_ID, fileIds.get(i))
                .set(BIZ_NOTICE_ATTACHMENT.SORT_ORDER, i + 1)
                .set(BIZ_NOTICE_ATTACHMENT.TENANT_ID, tenantId)
                .set(BIZ_NOTICE_ATTACHMENT.CREATED_BY, createdBy)
                .execute();
        }
    }

    /**
     * 删除公告的全部附件关联记录。
     *
     * @param noticeId 公告 ID
     */
    public void deleteByNoticeId(Long noticeId) {
        dsl.deleteFrom(BIZ_NOTICE_ATTACHMENT)
            .where(BIZ_NOTICE_ATTACHMENT.NOTICE_ID.eq(noticeId))
            .execute();
    }

    /**
     * 查询公告附件列表，JOIN mb_file_metadata 获取文件名/大小/路径。
     * <p>
     * 结果按 sort_order 升序返回。
     *
     * @param noticeId 公告 ID
     * @return 附件视图列表
     */
    public List<AttachmentVo> findByNoticeId(Long noticeId) {
        return dsl.select(
                BIZ_NOTICE_ATTACHMENT.FILE_ID,
                MB_FILE_METADATA.ORIGINAL_NAME,
                MB_FILE_METADATA.FILE_SIZE,
                MB_FILE_METADATA.FILE_PATH,
                BIZ_NOTICE_ATTACHMENT.SORT_ORDER
            )
            .from(BIZ_NOTICE_ATTACHMENT)
            .leftJoin(MB_FILE_METADATA)
                .on(BIZ_NOTICE_ATTACHMENT.FILE_ID.eq(MB_FILE_METADATA.ID))
            .where(BIZ_NOTICE_ATTACHMENT.NOTICE_ID.eq(noticeId))
            .orderBy(BIZ_NOTICE_ATTACHMENT.SORT_ORDER.asc())
            .fetch()
            .map(r -> new AttachmentVo(
                r.get(BIZ_NOTICE_ATTACHMENT.FILE_ID),
                r.get(MB_FILE_METADATA.ORIGINAL_NAME),
                r.get(MB_FILE_METADATA.FILE_SIZE),
                r.get(MB_FILE_METADATA.FILE_PATH),
                r.get(BIZ_NOTICE_ATTACHMENT.SORT_ORDER)
            ));
    }
}
