package com.metabuild.infra.captcha;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.Base64;
import java.security.SecureRandom;
import java.util.UUID;

/**
 * 验证码服务
 * <p>
 * 生成 4 位数字文字验证码，使用 BufferedImage + Graphics2D 渲染为 PNG 图片，
 * 通过 Base64 编码返回给前端。验证码 token 和 code 存储在 Redis，验证后立即删除（一次性）。
 * <p>
 * v1 简化实现：文字验证码（非滑块），满足登录场景的基本防机器人需求。
 */
@Slf4j
@RequiredArgsConstructor
public class CaptchaService {

    private static final String CAPTCHA_KEY_PREFIX = "mb:captcha:";
    private static final String CHARS = "0123456789";
    private static final int CODE_LENGTH = 4;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final MbCaptchaProperties props;

    /**
     * 验证码生成结果
     *
     * @param token       验证码唯一 token（前端提交验证时携带）
     * @param imageBase64 Base64 编码的 PNG 图片（含 data:image/png;base64, 前缀）
     */
    public record CaptchaResult(String token, String imageBase64) {
    }

    /**
     * 生成验证码
     * <p>
     * 流程：生成随机 4 位数字 → 渲染为图片 → 存入 Redis（TTL = expireSeconds）→ 返回 token + base64 图片
     *
     * @return 验证码结果
     */
    public CaptchaResult generate() {
        String code = generateCode();
        String token = UUID.randomUUID().toString().replace("-", "");

        // 存入 Redis，有效期由配置决定
        String redisKey = CAPTCHA_KEY_PREFIX + token;
        redisTemplate.opsForValue().set(redisKey, code.toLowerCase(),
                Duration.ofSeconds(props.expireSeconds()));

        // 渲染图片
        String imageBase64 = renderImage(code);

        log.debug("验证码已生成: token={}, expireSeconds={}", token, props.expireSeconds());
        return new CaptchaResult(token, imageBase64);
    }

    /**
     * 验证验证码
     * <p>
     * 验证成功或失败后立即删除 Redis 中的记录（一次性使用，防止暴力破解）。
     *
     * @param token 验证码 token
     * @param code  用户输入的验证码
     * @return true 验证通过，false 验证失败（token 不存在/已过期/code 不匹配）
     */
    public boolean verify(String token, String code) {
        if (token == null || token.isBlank() || code == null || code.isBlank()) {
            return false;
        }
        String redisKey = CAPTCHA_KEY_PREFIX + token;
        String stored = redisTemplate.opsForValue().get(redisKey);

        // 无论是否匹配，立即删除（一次性）
        redisTemplate.delete(redisKey);

        if (stored == null) {
            log.debug("验证码不存在或已过期: token={}", token);
            return false;
        }

        boolean matched = stored.equalsIgnoreCase(code.trim());
        log.debug("验证码校验结果: token={}, matched={}", token, matched);
        return matched;
    }

    /**
     * 生成 4 位随机数字验证码
     */
    private String generateCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    /**
     * 将验证码字符串渲染为 PNG 图片，返回 Base64 字符串（含 data URI 前缀）
     */
    private String renderImage(String code) {
        int width = props.width();
        int height = props.height();

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // 抗锯齿
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // 背景色（浅灰）
        g.setColor(new Color(240, 240, 240));
        g.fillRect(0, 0, width, height);

        // 干扰线
        g.setStroke(new BasicStroke(1.5f));
        for (int i = 0; i < 6; i++) {
            g.setColor(randomLightColor());
            int x1 = RANDOM.nextInt(width);
            int y1 = RANDOM.nextInt(height);
            int x2 = RANDOM.nextInt(width);
            int y2 = RANDOM.nextInt(height);
            g.drawLine(x1, y1, x2, y2);
        }

        // 干扰点
        for (int i = 0; i < 50; i++) {
            g.setColor(randomLightColor());
            int x = RANDOM.nextInt(width);
            int y = RANDOM.nextInt(height);
            g.fillOval(x, y, 2, 2);
        }

        // 验证码文字
        Font font = new Font("Arial", Font.BOLD, height / 2);
        g.setFont(font);
        int charWidth = width / (CODE_LENGTH + 1);
        for (int i = 0; i < code.length(); i++) {
            g.setColor(randomDarkColor());
            // 轻微旋转，增加识别难度
            double angle = (RANDOM.nextDouble() - 0.5) * 0.4;
            g.rotate(angle, (i + 0.5) * charWidth + charWidth / 2.0, height / 2.0);
            g.drawString(String.valueOf(code.charAt(i)),
                    (i + 0.5f) * charWidth,
                    height * 0.65f);
            g.rotate(-angle, (i + 0.5) * charWidth + charWidth / 2.0, height / 2.0);
        }

        g.dispose();

        // 编码为 Base64
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "PNG", baos);
            String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (IOException e) {
            throw new IllegalStateException("验证码图片生成失败", e);
        }
    }

    private Color randomLightColor() {
        return new Color(180 + RANDOM.nextInt(60), 180 + RANDOM.nextInt(60), 180 + RANDOM.nextInt(60));
    }

    private Color randomDarkColor() {
        return new Color(RANDOM.nextInt(100), RANDOM.nextInt(100), RANDOM.nextInt(100));
    }
}
