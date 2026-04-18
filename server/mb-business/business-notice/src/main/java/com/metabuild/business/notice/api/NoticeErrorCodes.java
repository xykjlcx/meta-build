package com.metabuild.business.notice.api;

/**
 * 公告模块错误码。
 */
public final class NoticeErrorCodes {

    public static final String NOT_FOUND = "notice.notFound";
    public static final String ONLY_DRAFT_CAN_EDIT = "notice.onlyDraftCanEdit";
    public static final String ONLY_DRAFT_OR_REVOKED_CAN_DELETE = "notice.onlyDraftOrRevokedCanDelete";
    public static final String ONLY_DRAFT_CAN_PUBLISH = "notice.onlyDraftCanPublish";
    public static final String ONLY_PUBLISHED_CAN_REVOKE = "notice.onlyPublishedCanRevoke";
    public static final String ONLY_PUBLISHED_OR_REVOKED_CAN_DUPLICATE = "notice.onlyPublishedOrRevokedCanDuplicate";
    public static final String INTERNAL_ERROR = "notice.internalError";

    private NoticeErrorCodes() {
    }
}
