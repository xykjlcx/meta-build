package com.metabuild.platform.iam.domain.user;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.iam.api.UserApi;
import com.metabuild.platform.iam.api.dto.ChangePasswordCommand;
import com.metabuild.platform.iam.api.dto.UserCreateCommand;
import com.metabuild.platform.iam.api.dto.UserView;
import com.metabuild.platform.iam.api.dto.UserUpdateCommand;
import com.metabuild.platform.iam.domain.auth.PasswordPolicy;
import com.metabuild.schema.tables.records.MbIamPasswordHistoryRecord;
import com.metabuild.schema.tables.records.MbIamUserRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 用户领域服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService implements UserApi {

    private final UserRepository userRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final CurrentUser currentUser;
    private final Clock clock;
    private final SnowflakeIdGenerator idGenerator;

    @Override
    public UserView getById(Long id) {
        return userRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound", id));
    }

    @Override
    public PageResult<UserView> list(PageQuery query) {
        PageResult<MbIamUserRecord> page = userRepository.findPage(query);
        List<UserView> content = page.content().stream().map(this::toResponse).toList();
        return new PageResult<>(content, page.totalElements(), page.totalPages(), page.page(), page.size());
    }

    @Transactional
    public Long createUser(UserCreateCommand request) {
        // 验证密码策略
        passwordPolicy.validate(request.password());

        // 检查用户名唯一性
        if (userRepository.existsByUsername(request.username())) {
            throw new ConflictException("iam.user.usernameExists", request.username());
        }

        var record = new MbIamUserRecord();
        record.setId(idGenerator.nextId());
        record.setUsername(request.username());
        record.setPasswordHash(passwordEncoder.encode(request.password()));
        record.setEmail(request.email());
        record.setPhone(request.phone());
        record.setNickname(request.nickname());
        record.setDeptId(request.deptId());
        record.setOwnerDeptId(request.deptId() != null ? request.deptId() : 0L);
        record.setStatus((short) 1);
        record.setMustChangePassword(false);
        record.setPasswordUpdatedAt(OffsetDateTime.now(clock));
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setVersion(0);

        Long userId = userRepository.insert(record);
        log.info("创建用户: userId={}, username={}", userId, request.username());
        return userId;
    }

    @Transactional
    public UserView updateUser(Long id, UserUpdateCommand request) {
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

        int updated = userRepository.update(record, currentUser.userIdOrSystem());
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
    public void changePassword(Long userId, ChangePasswordCommand request) {
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
        record.setPasswordUpdatedAt(OffsetDateTime.now(clock));
        record.setMustChangePassword(false);
        userRepository.update(record, userId);
        log.info("用户修改密码: userId={}", userId);
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        var record = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound", userId));

        passwordPolicy.validate(newPassword);

        record.setPasswordHash(passwordEncoder.encode(newPassword));
        record.setPasswordUpdatedAt(OffsetDateTime.now(clock));
        record.setMustChangePassword(true);
        userRepository.update(record, currentUser.userIdOrSystem());
        log.info("重置用户密码: userId={}", userId);
    }

    /** 检查密码历史，防止重用最近 N 条密码 */
    private void checkPasswordHistory(Long userId, String newPassword) {
        List<String> recentHashes = passwordHistoryRepository.findRecentHashes(userId, passwordPolicy.historyCount());

        boolean isReused = recentHashes.stream()
            .anyMatch(hash -> passwordEncoder.matches(newPassword, hash));

        if (isReused) {
            throw new BusinessException("iam.auth.passwordReused", 400, passwordPolicy.historyCount());
        }
    }

    /** 保存密码历史 */
    private void savePasswordHistory(Long userId, String passwordHash) {
        var histRecord = new MbIamPasswordHistoryRecord();
        histRecord.setId(idGenerator.nextId());
        histRecord.setUserId(userId);
        histRecord.setPasswordHash(passwordHash);
        histRecord.setCreatedAt(OffsetDateTime.now(clock));
        passwordHistoryRepository.insert(histRecord);
    }

    private UserView toResponse(MbIamUserRecord r) {
        return new UserView(
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
