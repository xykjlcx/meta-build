package com.metabuild.business.notice.domain;

/**
 * 公告状态枚举。
 */
public enum NoticeStatus {
    DRAFT(0),
    PUBLISHED(1),
    REVOKED(2);

    private final int code;

    NoticeStatus(int code) {
        this.code = code;
    }

    public int code() {
        return code;
    }

    public static NoticeStatus fromCode(int code) {
        for (NoticeStatus s : values()) {
            if (s.code == code) return s;
        }
        throw new IllegalArgumentException("未知状态码: " + code);
    }
}
