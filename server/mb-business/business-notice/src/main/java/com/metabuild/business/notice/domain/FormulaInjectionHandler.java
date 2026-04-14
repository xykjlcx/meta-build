package com.metabuild.business.notice.domain;

import cn.idev.excel.write.handler.CellWriteHandler;
import cn.idev.excel.write.handler.context.CellWriteHandlerContext;
import org.apache.poi.ss.usermodel.CellType;

/**
 * CSV Formula 注入防护。
 * <p>
 * 对以 = + - @ \t \r 开头的字符串值前缀 '（单引号转义），
 * 防止恶意公式在 Excel/CSV 中被执行。
 */
public class FormulaInjectionHandler implements CellWriteHandler {

    /** 危险前缀字符集：Excel 会将以这些字符开头的单元格视为公式或特殊值 */
    private static final String DANGEROUS_PREFIXES = "=+-@\t\r";

    @Override
    public void afterCellDispose(CellWriteHandlerContext context) {
        var cell = context.getCell();
        if (cell != null && cell.getCellType() == CellType.STRING) {
            String value = cell.getStringCellValue();
            if (value != null && !value.isEmpty()
                && DANGEROUS_PREFIXES.indexOf(value.charAt(0)) >= 0) {
                // 前缀单引号，告知 Excel 将其视为纯文本
                cell.setCellValue("'" + value);
            }
        }
    }
}
