package com.metabuild.platform.iam.domain.user;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.iam.api.UserApi;
import com.metabuild.platform.iam.api.dto.ChangePasswordRequest;
import com.metabuild.platform.iam.api.dto.UserCreateRequest;
import com.metabuild.platform.iam.api.dto.UserResponse;
import com.metabuild.platform.iam.api.dto.UserUpdateRequest;
import com.metabuild.platform.iam.domain.auth.PasswordPolicy;
import com.metabuild.schema.tables.records.MbIamPasswordHistoryRecord;
import com.metabuild.schema.tables.records.MbIamUserRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

import static com.metabuild.schema.tables.MbIamPasswordHistory.MB_IAM_PASSWORD_HISTORY;

/**
 * 用户领域服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService implements UserApi {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final CurrentUser currentUser;
    private final DSLContext dsl;

    @Override
    public UserResponse getById(Long id) {
        return userRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound", id));
    }

    @Override
    public PageResult<UserResponse> list(PageQuery query) {
        PageResult<MbIamUserRecord> page = userRepository.findPage(query);
        List<UserResponse> content = page.content().stream().map(this::toResponse).toList();
        return new PageResult<>(content, page.totalElements(), page.totalPages(), page.page(), page.size());
    }

    @Transactional
    public Long createUser(UserCreateRequest request) {
        // 验证密码策略
        passwordPolicy.validate(request.password());

        // 检查用户名唯一性
        if (userRepository.existsByUsername(request.username())) {
            throw new ConflictException("iam.user.usernameExists", request.username());
        }

        var record = new MbIamUserRecord();
        record.setUsername(request.username());
        record.setPasswordHash(passwordEncoder.encode(request.password()));
        record.setEmail(request.email());
        record.setPhone(request.phone());
        record.setNickname(request.nickname());
        record.setDeptId(request.deptId());
        record.setOwnerDeptId(request.deptId() != null ? request.deptId() : 0L);
        record.setStatus((short) 1);
        record.setMustChangePassword(false);
        record.setPasswordUpdatedAt(OffsetDateTime.now());
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setVersion(0);

        Long userId = userRepository.insert(record);
        log.info("创建用户: userId={}, username={}", userId, request.username());
        return userId;
    }

    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        var record = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound", id));

        if (request.email() != null) record.setEmail(request.email());
        if (request.phone() != null) record.setPhone(request.phone());
        if (request.nickname() != null) record.setNickname(request.nickname());
        if (request.avatar() != null) record.setAvatar(request.avatar());
        if (request.deptId() != null) {
            record.setDeptId(request.deptId());
            record.setOwnerDeptId(request.deptId());
        }
        if (request.status() != null) record.setStatus(request.status());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setVersion(record.getVersion() + 1);

        int updated = userRepository.update(record);
        if (updated == 0) {
            throw new BusinessException("common.concurrentModification", 409);
        }
        return toResponse(record);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound", id));
        userRepository.deleteById(id);
        log.info("删除用户: userId={}", id);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        var record = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound", userId));

        // 验证旧密码
        if (!passwordEncoder.matches(request.oldPassword(), record.getPasswordHash())) {
            throw new BusinessException("iam.auth.wrongPassword", 400);
        }

        // 验证密码策略
        passwordPolicy.validate(request.newPassword());

        // 检查密码历史（防重用）
        checkPasswordHistory(userId, request.newPassword());

        // 保存密码历史
        savePasswordHistory(userId, record.getPasswordHash());

        // 更新密码
        record.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        record.setPasswordUpdatedAt(OffsetDateTime.now());
        record.setMustChangePassword(false);
        record.setUpdatedBy(userId);
        record.setVersion(record.getVersion() + 1);
        userRepository.update(record);
        log.info("用户修改密码: userId={}", userId);
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        var record = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound", userId));

        passwordPolicy.validate(newPassword);

        record.setPasswordHash(passwordEncoder.encode(newPassword));
        record.setPasswordUpdatedAt(OffsetDateTime.now());
        record.setMustChangePassword(true);
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setVersion(record.getVersion() + 1);
        userRepository.update(record);
        log.info("重置用户密码: userId={}", userId);
    }

    /** 检查密码历史，防止重用最近 N 条密码 */
    private void checkPasswordHistory(Long userId, String newPassword) {
        List<String> recentHashes = dsl.select(MB_IAM_PASSWORD_HISTORY.PASSWORD_HASH)
            .from(MB_IAM_PASSWORD_HISTORY)
            .where(MB_IAM_PASSWORD_HISTORY.USER_ID.eq(userId))
            .orderBy(MB_IAM_PASSWORD_HISTORY.CREATED_AT.desc())
            .limit(passwordPolicy.historyCount())
            .fetchInto(String.class);

        boolean isReused = recentHashes.stream()
            .anyMatch(hash -> passwordEncoder.matches(newPassword, hash));

        if (isReused) {
            throw new BusinessException("iam.auth.passwordReused", 400, passwordPolicy.historyCount());
        }
    }

    /** 保存密码历史 */
    private void savePasswordHistory(Long userId, String passwordHash) {
        var histRecord = new MbIamPasswordHistoryRecord();
        histRecord.setUserId(userId);
        histRecord.setPasswordHash(passwordHash);
        histRecord.setCreatedAt(OffsetDateTime.now());
        dsl.insertInto(MB_IAM_PASSWORD_HISTORY).set(histRecord).execute();
    }

    private UserResponse toResponse(MbIamUserRecord r) {
        return new UserResponse(
            r.getId(),
            r.getUsername(),
            r.getEmail(),
            r.getPhone(),
            r.getNickname(),
            r.getAvatar(),
            r.getDeptId(),
            r.getStatus(),
            Boolean.TRUE.equals(r.getMustChangePassword()),
            r.getPasswordUpdatedAt(),
            r.getCreatedAt(),
            r.getUpdatedAt()
        );
    }
}
