-- ShedLock standard schema (required by shedlock-provider-jdbc-template)
CREATE TABLE shedlock (
    name        VARCHAR(64)     NOT NULL,
    lock_until  TIMESTAMP       NOT NULL,
    locked_at   TIMESTAMP       NOT NULL,
    locked_by   VARCHAR(255)    NOT NULL,
    PRIMARY KEY (name)
);
COMMENT ON TABLE shedlock IS 'ShedLock 分布式锁表（标准 schema）';
