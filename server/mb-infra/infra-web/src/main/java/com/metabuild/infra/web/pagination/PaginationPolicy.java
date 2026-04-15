package com.metabuild.infra.web.pagination;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.exception.BusinessException;

import java.util.List;

/**
 * 分页归一化策略。
 *
 * <p>统一处理默认值、上限和非法值，输出内部可信的 {@link PageQuery}。</p>
 */
public class PaginationPolicy {

    private final MbPaginationProperties props;

    public PaginationPolicy(MbPaginationProperties props) {
        this.props = props;
    }

    public PageQuery normalize(PageRequestDto request) {
        int page = request.getPage() == null ? 1 : request.getPage();
        int size = request.getSize() == null ? props.defaultSize() : request.getSize();
        List<String> sort = normalizeSort(request.getSort());

        if (page < 1) {
            throw new BusinessException("common.pagination.invalidPage");
        }
        if (size < 1 || size > props.maxSize()) {
            throw new BusinessException("common.pagination.invalidSize", (Object) props.maxSize());
        }

        return PageQuery.normalized(page, size, sort);
    }

    private List<String> normalizeSort(List<String> sort) {
        if (sort == null || sort.isEmpty()) {
            return null;
        }

        List<String> cleaned = sort.stream()
            .filter(value -> value != null && !value.isBlank())
            .toList();

        return cleaned.isEmpty() ? null : cleaned;
    }
}
