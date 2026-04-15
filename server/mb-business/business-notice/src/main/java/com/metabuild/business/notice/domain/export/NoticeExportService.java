package com.metabuild.business.notice.domain.export;

import cn.idev.excel.ExcelWriter;
import cn.idev.excel.FastExcel;
import cn.idev.excel.write.metadata.WriteSheet;
import com.metabuild.business.notice.api.qry.NoticeQry;
import com.metabuild.business.notice.domain.notice.FormulaInjectionHandler;
import com.metabuild.business.notice.domain.notice.NoticeRepository;
import com.metabuild.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 公告 Excel 导出服务。
 * <p>
 * 流式分批写入（每批 1000 行），最多导出 10 万行，超出时在末尾追加提示行。
 * 使用 {@link FormulaInjectionHandler} 防止 CSV 公式注入。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeExportService {

    /** 单批查询行数 */
    private static final int BATCH_SIZE = 1000;

    /** 导出行数上限 */
    private static final int MAX_ROWS = 100_000;

    /** 超出上限时末尾提示文字 */
    private static final String OVERFLOW_MESSAGE = "数据量过大，请缩小筛选范围";

    /** 状态码 → 中文名映射 */
    private static final Map<Short, String> STATUS_LABEL = Map.of(
        (short) 0, "草稿",
        (short) 1, "已发布",
        (short) 2, "已撤回"
    );

    private static final DateTimeFormatter DT_FORMAT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final NoticeRepository noticeRepository;
    private final CurrentUser currentUser;

    /**
     * 将符合查询条件的公告导出为 Excel，写入 {@code out}。
     *
     * @param query 查询条件（与列表接口相同）
     * @param out   响应输出流
     */
    public void export(NoticeQry query, OutputStream out) {
        try (ExcelWriter excelWriter = FastExcel.write(out)
            .registerWriteHandler(new FormulaInjectionHandler())
            .build()) {

            WriteSheet sheet = FastExcel.writerSheet("公告列表")
                .head(buildHeaders())
                .build();

            int offset = 0;
            int totalWritten = 0;
            boolean truncated = false;

            while (true) {
                // 本批最多取 BATCH_SIZE 行，但不超过剩余允许行数
                int remaining = MAX_ROWS - totalWritten;
                if (remaining <= 0) {
                    truncated = true;
                    break;
                }
                int fetchSize = Math.min(BATCH_SIZE, remaining);

                var records = noticeRepository.findForExport(query, fetchSize, offset);

                if (records.isEmpty()) {
                    break;
                }

                List<List<Object>> rows = new ArrayList<>(records.size());
                for (var r : records) {
                    String statusLabel = STATUS_LABEL.getOrDefault(r.status(), "未知");
                    String pinnedLabel = Boolean.TRUE.equals(r.pinned()) ? "是" : "否";

                    // 计算已读率
                    String readRate = r.recipientCount() == 0
                        ? "0%"
                        : String.format("%.1f%%", (double) r.readCount() / r.recipientCount() * 100);

                    rows.add(List.of(
                        r.title(),
                        statusLabel,
                        pinnedLabel,
                        formatDateTime(r.startTime()),
                        formatDateTime(r.endTime()),
                        r.createdByName() != null ? r.createdByName() : "",
                        formatDateTime(r.createdAt()),
                        readRate
                    ));
                }

                excelWriter.write(rows, sheet);
                totalWritten += records.size();
                offset += records.size();

                // 如果本批不满则说明已到末尾
                if (records.size() < fetchSize) {
                    break;
                }
            }

            // 超出限制时追加提示行
            if (truncated) {
                List<List<Object>> overflow = List.of(
                    List.of(OVERFLOW_MESSAGE, "", "", "", "", "", "", "")
                );
                excelWriter.write(overflow, sheet);
                log.warn("公告导出超出上限 {} 行，已截断，操作人 userId={}",
                    MAX_ROWS, currentUser.userId());
            }
        }
    }

    // ------ 私有方法 ------

    /**
     * 构建表头（二维列表，FastExcel 多行表头格式）。
     */
    private List<List<String>> buildHeaders() {
        return List.of(
            List.of("标题"),
            List.of("状态"),
            List.of("置顶"),
            List.of("生效时间"),
            List.of("失效时间"),
            List.of("创建人"),
            List.of("创建时间"),
            List.of("已读率")
        );
    }

    /**
     * 格式化日期时间，null 返回空字符串。
     */
    private String formatDateTime(OffsetDateTime dt) {
        return dt == null ? "" : dt.format(DT_FORMAT);
    }
}
